import {useCallback, useEffect, useState} from 'react'
import {statusChipClass, statusLabel} from './statusChip'
import {useNavigate, useParams} from 'react-router-dom'

import * as waiterApi from '@/shared/api/waiter'
import type {OrderDetailResponse} from '@/shared/api/waiter'
import {BackArrow, fmtPrice, WaiterHeader} from './components'
import {useWaiterSocket} from '@/realtime'
import {isRequestCanceled} from '@/shared/utils/error'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'

export default function WaiterOrderDetailPage() {
    const navigate = useNavigate()
    const {tableId} = useParams()

    const tableIdNumber = Number.parseInt(tableId ?? '0', 10)

    const [servingOrders, setServingOrders] = useState<OrderDetailResponse[]>([])

    const [isLoading, setIsLoading] = useState(true)

    const [error, setError] = useState<string | null>(null)

    const loadServingOrders = useCallback(
        async (signal?: AbortSignal, showFullLoading = true) => {
            if (!tableIdNumber) {
                setServingOrders([])
                setError('Không xác định được bàn.')
                setIsLoading(false)
                return
            }

            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                setError(null)

                const response = await waiterApi.getServingOrders(tableIdNumber, signal)

                if (signal?.aborted) {
                    return
                }

                setServingOrders(response.data)

                // Đánh dấu đã xem các ghi chú nội bộ của chef chưa được ack.
                // orderItemId là optional trong response, lọc bỏ trước khi gọi API.
                const unacknowledgedItemIds = response.data
                    .flatMap((order) => order.orderItems)
                    .filter(
                        (item) =>
                            item.chefInternalNote && !item.chefInternalNoteAcknowledgedAt,
                    )
                    .map((item) => item.orderItemId)
                    .filter((itemId): itemId is number => itemId != null)

                if (unacknowledgedItemIds.length > 0 && !signal?.aborted) {
                    await Promise.all(
                        unacknowledgedItemIds.map((itemId) =>
                            waiterApi
                                .acknowledgeChefInternalNote(itemId)
                                .catch((requestError) => {
                                    console.error(
                                        '[WAITER_ACK_CHEF_NOTE_ERROR]',
                                        requestError,
                                    )
                                }),
                        ),
                    )
                }
            } catch (requestError: unknown) {
                if (signal?.aborted || isRequestCanceled(requestError)) {
                    return
                }

                console.error('[WAITER_ORDER_DETAIL_FETCH_ERROR]', requestError)

                setError('Không thể tải chi tiết đơn hàng của bàn.')
            } finally {
                if (showFullLoading && !signal?.aborted) {
                    setIsLoading(false)
                }
            }
        },
        [tableIdNumber],
    )

    // Initial load on mount
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadServingOrders()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [loadServingOrders])

    // WebSocket: refresh when backend broadcasts waiter or table updates
    useWaiterSocket(
        () => void loadServingOrders(undefined, false),
        () => void loadServingOrders(undefined, false),
    )

    const orderItems = servingOrders.flatMap((order) => order.orderItems)

    return (
        <div className="rk-stack">
            <WaiterHeader title="Chi tiết đơn hàng" />

            <div className="rk-stack">
                <div className="rk-card__head-inline">
                    <BackArrow onClick={() => navigate('/waiter/tables')} />

                    <h2 className="rk-sectiontitle">Bàn: {tableIdNumber || '—'}</h2>

                    <button
                        type="button"
                        className="rk-btn rk-btn--primary"
                        disabled={!tableIdNumber}
                        onClick={() =>
                            navigate(`/waiter/tables/${tableIdNumber}/order/edit`)
                        }
                    >
                        Cập nhật đơn hàng
                    </button>
                </div>

                <div className="rk-card rk-card--pad">
                    <h3 className="rk-sectiontitle">Danh sách món</h3>

                    <div className="rk-stack">
                        {isLoading ? (
                            <LoadingState
                                title="Đang tải chi tiết đơn hàng"
                                description=""
                                size="sm"
                            />
                        ) : error ? (
                            <ErrorState
                                message={error}
                                onRetry={() => void loadServingOrders(undefined, true)}
                            />
                        ) : orderItems.length === 0 ? (
                            <EmptyState
                                title="Chưa có món đang phục vụ"
                                description="Bàn này chưa gọi món nào, hoặc các món đã phục vụ xong."
                            />
                        ) : (
                            <table className="rk-table rk-table--compact">
                                <thead>
                                    <tr>
                                        <th>Món</th>
                                        <th>SL</th>
                                        <th>Đơn giá</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orderItems.map((item) => (
                                        <tr key={item.orderItemId}>
                                            <td>
                                                {item.dishName}

                                                {item.note && (
                                                    <div className="rk-subnote">
                                                        {item.note}
                                                    </div>
                                                )}

                                                {item.status === 'CANCELLED' &&
                                                    item.cancelReason && (
                                                        <div className="rk-subnote rk-subnote--alert">
                                                            Lý do hủy: {item.cancelReason}
                                                        </div>
                                                    )}

                                                {item.chefInternalNote && (
                                                    <div className="rk-subnote rk-subnote--busy">
                                                        Chef: {item.chefInternalNote}
                                                    </div>
                                                )}
                                            </td>

                                            <td>{item.quantity}</td>

                                            <td>{fmtPrice(item.unitPrice)}</td>

                                            <td>
                                                <span
                                                    className={`rk-chip ${statusChipClass(item.status)}`}
                                                >
                                                    {statusLabel(item.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
