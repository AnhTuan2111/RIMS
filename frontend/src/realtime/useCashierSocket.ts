/**
 * realtime/useCashierSocket.ts
 *
 * React hook for CASHIER role.
 * Subscribes to /topic/tables.
 * Backend broadcasts to this topic when table status changes.
 * Role authorization enforced by StompAuthChannelInterceptor.
 *
 * /topic/tables  -> WAITER, CASHIER, ADMIN
 */

import {useEffect, useRef} from 'react'
import {registerTopicCallback} from './stompClient'

const TABLES_TOPIC = '/topic/tables'

/**
 * Subscribes to /topic/tables.
 * Always calls the latest version of `onTablesMessage` — no stable reference required from caller.
 */
export function useCashierSocket(onTablesMessage: () => void): void {
    const callbackRef = useRef(onTablesMessage)

    useEffect(() => {
        callbackRef.current = onTablesMessage
    })

    useEffect(() => {
        const handler = () => callbackRef.current()
        return registerTopicCallback(TABLES_TOPIC, handler)
    }, [])
}
