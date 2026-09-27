import {useCallback, useEffect, useState} from 'react'
import {statusChipClass, statusLabel} from './statusChip'
import {useNavigate, useParams} from 'react-router-dom'

import * as waiterApi from '@/shared/api/waiter'
import type {OrderDetailResponse} from '@/shared/api/waiter'
import {BackArrow, fmtPrice} from './components'
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

    // Tạm tính = cộng thành tiền các món CHƯA HUỶ.
    //
    // Không lấy tổng của backend: với đơn đang mở, totalAmountBeforeVat,
    // vatAmount và finalAmount đều là null — backend chỉ tính chúng lúc thu
    // ngân chốt đơn. Bản đầu dùng ba trường đó và hiện "Tổng 0 ₫" cho một bàn
    // vừa gọi món. VAT cũng vì vậy mà không hiện ở đây: số đó thuộc về lúc
    // thanh toán, và hiện nó sớm là đoán.
    const subtotal = orderItems
        .filter((item) => item.status !== 'CANCELLED')
        .reduce((sum, item) => sum + (item.subTotal ?? 0), 0)

    return (
        <div className="rk-stack">
            <div className="rk-stack">
                <div className="rk-card__head-inline">
                    <BackArrow onClick={() => navigate('/waiter/tables')} />

                    {/* SỐ BÀN, không phải khoá chính. `tableIdNumber` là id
                        trong CSDL; ngoài đời không có cái bàn nào mang số đó. */}
                    <h2 className="rk-sectiontitle">
                        Bàn {servingOrders[0]?.tableNumber ?? tableIdNumber ?? '—'}
                    </h2>

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
                            <>
                                {/* Danh sách DÒNG MÓN thay cho bảng bốn cột.
                                    Bảng ở 375px bị cắt ngang ngay cột giá, và
                                    phục vụ phải cuộn ngang trong một cái bảng
                                    để biết món nào đang nấu. Mỗi dòng ở đây
                                    đọc trọn ở mọi khổ màn. */}
                                <ul className="rk-lines" aria-label="Các món của bàn">
                                    {orderItems.map((item) => {
                                        const cancelled = item.status === 'CANCELLED'

                                        return (
                                            <li
                                                key={item.orderItemId}
                                                className={`rk-lines__item${
                                                    cancelled ? ' is-cancelled' : ''
                                                }`}
                                            >
                                                <span className="rk-lines__qty">
                                                    {item.quantity}×
                                                </span>

                                                <div className="rk-lines__main">
                                                    <span className="rk-lines__name">
                                                        {item.dishName}
                                                    </span>

                                                    <span className="rk-lines__unit">
                                                        {fmtPrice(item.unitPrice)} / phần
                                                    </span>

                                                    {item.note && (
                                                        <div className="rk-subnote">
                                                            {item.note}
                                                        </div>
                                                    )}

                                                    {cancelled && item.cancelReason && (
                                                        <div className="rk-subnote rk-subnote--alert">
                                                            Lý do huỷ: {item.cancelReason}
                                                        </div>
                                                    )}

                                                    {item.chefInternalNote && (
                                                        <div className="rk-subnote rk-subnote--busy">
                                                            Bếp: {item.chefInternalNote}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="rk-lines__side">
                                                    {/* Món huỷ: số tiền gạch ngang
                                                        và KHÔNG cộng vào tổng. */}
                                                    {cancelled ? (
                                                        <s className="rk-lines__sum">
                                                            {fmtPrice(item.subTotal)}
                                                        </s>
                                                    ) : (
                                                        <span className="rk-lines__sum">
                                                            {fmtPrice(item.subTotal)}
                                                        </span>
                                                    )}

                                                    <span
                                                        className={`rk-chip ${statusChipClass(item.status)}`}
                                                    >
                                                        {statusLabel(item.status)}
                                                    </span>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>

                                {/* Tổng tiền của bàn. Trước đây màn này không
                                    có con số nào — khách hỏi "bàn tôi hết bao
                                    nhiêu rồi" thì phục vụ phải chạy ra quầy. */}
                                <div className="rk-summary">
                                    <div className="rk-summary__row rk-summary__row--total">
                                        <span className="rk-summary__label">
                                            Tạm tính
                                        </span>
                                        <span className="rk-summary__value">
                                            {fmtPrice(subtotal)}
                                        </span>
                                    </div>

                                    <p className="rk-field__hint">
                                        Chưa gồm VAT — thu ngân tính khi thanh toán. Món
                                        đã huỷ không tính tiền.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
