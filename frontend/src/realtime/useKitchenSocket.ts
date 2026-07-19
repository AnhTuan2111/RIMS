/**
 * realtime/useKitchenSocket.ts
 *
 * React hook for CHEF role.
 * Subscribes to /topic/kitchen.
 * Backend broadcasts to this topic when kitchen order state changes.
 * Role authorization enforced by StompAuthChannelInterceptor.
 */

import {useEffect, useRef} from 'react'
import {registerTopicCallback} from './stompClient'

const KITCHEN_TOPIC = '/topic/kitchen'

/**
 * Subscribes to /topic/kitchen.
 * `onMessage` is called whenever the backend broadcasts a kitchen update.
 * Always calls the latest version of `onMessage` — no stable reference required from caller.
 */
export function useKitchenSocket(onMessage: () => void): void {
    const callbackRef = useRef(onMessage)

    useEffect(() => {
        callbackRef.current = onMessage
    })

    useEffect(() => {
        const handler = () => callbackRef.current()
        return registerTopicCallback(KITCHEN_TOPIC, handler)
    }, [])
}
