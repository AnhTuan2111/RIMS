/**
 * realtime/useWaiterSocket.ts
 *
 * React hook for WAITER role.
 * Subscribes to /topic/waiter and /topic/tables.
 * Backend broadcasts to these topics when order or table state changes.
 * Role authorization enforced by StompAuthChannelInterceptor.
 *
 * /topic/waiter  -> WAITER, ADMIN
 * /topic/tables  -> WAITER, CASHIER, ADMIN
 */

import {useEffect, useRef} from 'react'
import {registerTopicCallback} from './stompClient'

const WAITER_TOPIC = '/topic/waiter'
const TABLES_TOPIC = '/topic/tables'

/**
 * Subscribes to /topic/waiter and /topic/tables.
 * Always calls the latest version of each callback — no stable reference required from caller.
 */
export function useWaiterSocket(
    onWaiterMessage: () => void,
    onTablesMessage: () => void,
): void {
    const waiterRef = useRef(onWaiterMessage)
    const tablesRef = useRef(onTablesMessage)

    useEffect(() => {
        waiterRef.current = onWaiterMessage
    })

    useEffect(() => {
        tablesRef.current = onTablesMessage
    })

    useEffect(() => {
        const handler = () => waiterRef.current()
        return registerTopicCallback(WAITER_TOPIC, handler)
    }, [])

    useEffect(() => {
        const handler = () => tablesRef.current()
        return registerTopicCallback(TABLES_TOPIC, handler)
    }, [])
}
