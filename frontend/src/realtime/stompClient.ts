/**
 * realtime/stompClient.ts
 *
 * Singleton STOMP client for the RIMS WebSocket layer.
 * - Connects to /ws-rims via SockJS.
 * - Sends Authorization: Bearer <token> on every STOMP CONNECT (including reconnects).
 * - Fans out incoming messages to per-topic callback registries.
 * - Auto-reconnects on disconnect after a fixed delay.
 * - Only one underlying connection is ever opened.
 *
 * Never import stompjs or SockJS anywhere else in the frontend.
 */

import Stomp from 'stompjs'
import SockJS from 'sockjs-client'
import {getAccessToken} from '@/shared/utils/tokenStorage'

type MessageCallback = () => void

/** Per-topic registry: topic -> set of callbacks to notify on any message */
const registry = new Map<string, Set<MessageCallback>>()

/** Active STOMP-level subscriptions: topic -> stomp subscription object */
const stompSubs = new Map<string, {unsubscribe(): void}>()

let stompClient: ReturnType<typeof Stomp.over> | null = null
let isConnecting = false
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

const RECONNECT_DELAY_MS = 5_000
const WS_ENDPOINT = '/ws-rims'

// ── Private helpers ──────────────────────────────────────────────────────────

function clearReconnectTimer() {
    if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
    }
}

function subscribeRegisteredTopics() {
    if (!stompClient) return

    for (const [topic, callbacks] of registry) {
        if (callbacks.size === 0 || stompSubs.has(topic)) {
            continue
        }

        const sub = stompClient.subscribe(topic, () => {
            for (const cb of registry.get(topic) ?? []) {
                cb()
            }
        })

        stompSubs.set(topic, sub)
    }
}

function onConnected() {
    isConnecting = false
    clearReconnectTimer()
    subscribeRegisteredTopics()
}

function onDisconnected() {
    isConnecting = false
    stompClient = null
    stompSubs.clear()
    clearReconnectTimer()

    const hasActiveSubscribers = Array.from(registry.values()).some(
        (set) => set.size > 0,
    )

    if (hasActiveSubscribers) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
    }
}

function connect() {
    if (isConnecting || stompClient?.connected) {
        return
    }

    isConnecting = true

    const socket = new SockJS(WS_ENDPOINT)
    const client = Stomp.over(socket)

    // Suppress stompjs console output in production
    client.debug = () => {}

    stompClient = client

    const token = getAccessToken()
    const connectHeaders: Record<string, string> = token
        ? {Authorization: `Bearer ${token}`}
        : {}

    client.connect(connectHeaders, onConnected, onDisconnected)
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Register a callback to be called whenever any message arrives on `topic`.
 * Returns a cleanup function that unregisters the callback.
 *
 * Usage inside useEffect:
 *   useEffect(() => registerTopicCallback('/topic/kitchen', refresh), [refresh])
 */
export function registerTopicCallback(
    topic: string,
    callback: MessageCallback,
): () => void {
    if (!registry.has(topic)) {
        registry.set(topic, new Set())
    }

    registry.get(topic)!.add(callback)

    if (!stompClient?.connected) {
        connect()
    } else if (!stompSubs.has(topic)) {
        // Already connected but topic not yet subscribed (late registration)
        const sub = stompClient.subscribe(topic, () => {
            for (const cb of registry.get(topic) ?? []) {
                cb()
            }
        })

        stompSubs.set(topic, sub)
    }

    return () => {
        registry.get(topic)?.delete(callback)

        if (registry.get(topic)?.size === 0) {
            stompSubs.get(topic)?.unsubscribe()
            stompSubs.delete(topic)
        }

        const hasAny = Array.from(registry.values()).some(
            (set) => set.size > 0,
        )

        if (!hasAny) {
            clearReconnectTimer()

            if (stompClient?.connected) {
                stompClient.disconnect(() => {})
            }

            stompClient = null
        }
    }
}
