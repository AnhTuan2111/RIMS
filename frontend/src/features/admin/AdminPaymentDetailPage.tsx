import {
    useCallback,
    useRef,
    useState,
} from 'react'
import {
    useNavigate,
    useParams,
} from 'react-router-dom'

import {
    adminApi,
    type AdminPaymentDetail,
} from '@/shared/api/admin'
import {REALTIME_CONFIG} from '@/app/config/realtime'
import {
    ErrorState,
    LoadingState,
} from '@/shared/components/feedback'
import {PageCard} from '@/shared/components/ui'
import {usePolling} from '@/shared/hooks/usePolling'

function formatCurrency(value: number) {
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}

function formatDateTime(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

export default function AdminPaymentDetailPage() {
    const navigate = useNavigate()
    const {invoiceId} = useParams()

    const parsedInvoiceId = Number(invoiceId)

    const hasValidInvoiceId =
        Boolean(invoiceId)
        && Number.isFinite(parsedInvoiceId)

    const [payment, setPayment] =
        useState<AdminPaymentDetail | null>(null)

    const [isLoading, setIsLoading] =
        useState(true)

    const [error, setError] =
        useState<string | null>(null)

    const hasLoadedInitialPaymentRef =
        useRef(false)

    const loadPaymentDetail = useCallback(
        async (
            showFullLoading = true,
            signal?: AbortSignal,
        ) => {
            if (!hasValidInvoiceId) {
                setIsLoading(false)
                setError('Mã hóa đơn không hợp lệ.')
                return
            }

            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                setError(null)

                const {data} =
                    await adminApi.getPaymentDetail(
                        parsedInvoiceId,
                        signal,
                    )

                setPayment(data)
            } catch (requestError: unknown) {
                console.error(
                    '[ADMIN_PAYMENT_DETAIL_FETCH_ERROR]',
                    requestError,
                )

                setError(
                    'Không thể tải chi tiết hóa đơn.',
                )
            } finally {
                if (showFullLoading) {
                    setIsLoading(false)
                }
            }
        },
        [
            hasValidInvoiceId,
            parsedInvoiceId,
        ],
    )

    usePolling(
        async (signal) => {
            const isInitialLoad =
                !hasLoadedInitialPaymentRef.current

            await loadPaymentDetail(
                isInitialLoad,
                signal,
            )

            hasLoadedInitialPaymentRef.current = true
        },
        {
            enabled: hasValidInvoiceId,

            intervalMs:
            REALTIME_CONFIG
                .admin
                .dashboardIntervalMs,

            runImmediately: true,
            pauseWhenHidden: true,

            onError: (requestError) => {
                console.error(
                    '[ADMIN_PAYMENT_DETAIL_POLL_ERROR]',
                    requestError,
                )
            },
        },
    )

    if (!hasValidInvoiceId) {
        return (
            <PageCard className="admin-payment-detail-state">
                <h2>Không thể tải dữ liệu</h2>

                <p>Mã hóa đơn không hợp lệ.</p>
            </PageCard>
        )
    }

    if (isLoading) {
        return (
            <LoadingState
                title="Đang tải chi tiết hóa đơn..."
                description="Hệ thống đang lấy thông tin hóa đơn và danh sách món ăn."
            />
        )
    }

    if (error || !payment) {
        return (
            <ErrorState
                title="Không thể tải dữ liệu"
                message={
                    error ?? 'Không tìm thấy hóa đơn.'
                }
                onRetry={() => {
                    loadPaymentDetail(true)
                        .catch((requestError) => {
                            console.error(requestError)
                        })
                }}
            />
        )
    }

    return (
        <div className="admin-payment-detail-page">
            <PageCard className="admin-payment-detail-header">
                <button
                    aria-label="Quay lại lịch sử hóa đơn"
                    className="admin-payment-detail-back-button"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    ‹
                </button>

                <div>
                    <h2>Đơn hàng ORD-{payment.orderId}</h2>

                    <p>
                        Tạo lúc{' '}
                        {formatDateTime(payment.invoiceDate)}
                    </p>
                </div>
            </PageCard>

            <section className="admin-payment-detail-card">
                <div className="admin-payment-detail-table">
                    <div className="admin-payment-detail-table-head">
                        <span>MÓN ĂN</span>
                        <span>SL</span>
                        <span>ĐƠN GIÁ</span>
                        <span>THÀNH TIỀN</span>
                    </div>

                    {payment.items.length === 0 ? (
                        <div className="admin-payment-detail-empty">
                            Hóa đơn này chưa có món ăn.
                        </div>
                    ) : (
                        payment.items.map((item, index) => (
                            <div
                                className="admin-payment-detail-row"
                                key={`${item.dishName}-${index}`}
                            >
                                <span className="admin-payment-dish-name">
                                    {item.dishName}
                                </span>

                                <span>{item.quantity}</span>

                                <span>
                                    {formatCurrency(item.unitPrice)}
                                </span>

                                <span className="admin-payment-line-total">
                                    {formatCurrency(item.amount)}
                                </span>
                            </div>
                        ))
                    )}

                    <div className="admin-payment-detail-footer">
                        <span>Tổng cộng</span>

                        <strong>
                            {formatCurrency(payment.finalAmount)}
                        </strong>
                    </div>
                </div>
            </section>
        </div>
    )
}