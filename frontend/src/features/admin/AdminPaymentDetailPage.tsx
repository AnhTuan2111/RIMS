import {useCallback, useEffect, useRef, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'

import * as adminApi from '@/shared/api/admin'
import type {AdminPaymentDetail} from '@/shared/api/admin'
import {ArrowLeft, ReceiptText} from 'lucide-react'

import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {PageCard, PageHeader} from '@/shared/components/ui'

function formatCurrency(value: number) {
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}

function formatTime(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

function formatDate(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date)
}

function formatTableName(tableNumber: string) {
    if (!tableNumber) {
        return 'Mang về'
    }

    if (tableNumber.toLowerCase().startsWith('bàn')) {
        return tableNumber
    }

    return tableNumber
}

function formatPaymentMethod(method: string) {
    switch (method) {
        case 'CASH':
            return 'Tiền mặt'
        case 'QRCODE':
            return 'VNPay / QR Code'
        default:
            return method
    }
}

export default function AdminPaymentDetailPage() {
    const navigate = useNavigate()
    const {invoiceId} = useParams()

    const parsedInvoiceId = Number(invoiceId)

    const hasValidInvoiceId = Boolean(invoiceId) && Number.isFinite(parsedInvoiceId)

    const [payment, setPayment] = useState<AdminPaymentDetail | null>(null)

    const [isLoading, setIsLoading] = useState(true)

    const [error, setError] = useState<string | null>(null)

    const requestIdRef = useRef(0)

    const loadPaymentDetail = useCallback(
        async (showFullLoading = true) => {
            if (!hasValidInvoiceId) {
                setIsLoading(false)
                setError('Mã hóa đơn không hợp lệ.')
                return
            }

            const requestId = ++requestIdRef.current

            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                setError(null)

                const {data} = await adminApi.getPaymentDetail(parsedInvoiceId)

                if (requestId !== requestIdRef.current) {
                    return
                }

                setPayment(data)
            } catch (requestError: unknown) {
                if (requestId !== requestIdRef.current) {
                    return
                }

                console.error('[ADMIN_PAYMENT_DETAIL_FETCH_ERROR]', requestError)

                setError('Không thể tải chi tiết hóa đơn.')
            } finally {
                if (requestId === requestIdRef.current && showFullLoading) {
                    setIsLoading(false)
                }
            }
        },
        [hasValidInvoiceId, parsedInvoiceId],
    )

    useEffect(() => {
        if (!hasValidInvoiceId) {
            return
        }

        const frameId = window.requestAnimationFrame(() => {
            void loadPaymentDetail(true)
        })

        return () => {
            window.cancelAnimationFrame(frameId)
        }
    }, [hasValidInvoiceId, loadPaymentDetail])

    if (!hasValidInvoiceId) {
        return (
            <ErrorState
                title="Không thể tải dữ liệu"
                message="Mã hóa đơn không hợp lệ."
            />
        )
    }

    if (isLoading) {
        return (
            <LoadingState
                title="Đang tải chi tiết hóa đơn…"
                description="Hệ thống đang lấy thông tin hóa đơn và danh sách món ăn."
            />
        )
    }

    if (error || !payment) {
        return (
            <ErrorState
                title="Không thể tải dữ liệu"
                message={error ?? 'Không tìm thấy hóa đơn.'}
                onRetry={() => {
                    loadPaymentDetail(true).catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    return (
        <div className="rk-stack">
            <PageCard>
                <PageHeader
                    eyebrow="Lịch sử hoá đơn"
                    title={`Hoá đơn ORD-${payment.orderId}`}
                    description={`Bàn ${formatTableName(payment.tableNumber)} · ${formatTime(
                        payment.invoiceDate,
                    )} ${formatDate(payment.invoiceDate)}`}
                    icon={<ReceiptText className="rk-icon" aria-hidden="true" />}
                    actions={
                        <button
                            type="button"
                            className="rk-btn"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="rk-icon" aria-hidden="true" />
                            Quay lại
                        </button>
                    }
                />
            </PageCard>

            <div className="rk-two rk-two--wideleft">
                <PageCard>
                    {payment.items.length === 0 ? (
                        <EmptyState
                            title="Hoá đơn này chưa có món ăn"
                            description="Không có dòng món nào được ghi cho đơn hàng."
                        />
                    ) : (
                        <div className="rk-tablewrap">
                            <table className="rk-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Món ăn</th>
                                        <th scope="col" className="rk-th--num">
                                            SL
                                        </th>
                                        <th scope="col" className="rk-th--num">
                                            Đơn giá
                                        </th>
                                        <th scope="col" className="rk-th--num">
                                            Thành tiền
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {payment.items.map((item, index) => (
                                        <tr key={`${item.dishName}-${index}`}>
                                            <td>{item.dishName}</td>
                                            <td className="rk-td--num">
                                                {item.quantity}
                                            </td>
                                            <td className="rk-td--num">
                                                {formatCurrency(item.unitPrice)}
                                            </td>
                                            <td className="rk-td--num">
                                                <strong>
                                                    {formatCurrency(item.amount)}
                                                </strong>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </PageCard>

                <PageCard>
                    <h3 className="rk-sectiontitle">Tổng kết</h3>

                    <div className="rk-summary">
                        <div className="rk-summary__row">
                            <span className="rk-summary__label">Tạm tính</span>
                            <span className="rk-summary__value">
                                {formatCurrency(payment.totalBeforeVat)}
                            </span>
                        </div>

                        <div className="rk-summary__row">
                            <span className="rk-summary__label">VAT (10%)</span>
                            <span className="rk-summary__value">
                                {formatCurrency(payment.vatAmount)}
                            </span>
                        </div>

                        <div className="rk-summary__row rk-summary__row--total">
                            <span className="rk-summary__label">Thành tiền</span>
                            <span className="rk-summary__value">
                                {formatCurrency(payment.finalAmount)}
                            </span>
                        </div>

                        <div className="rk-summary__row">
                            <span className="rk-summary__label">Phương thức</span>
                            <span className="rk-summary__value">
                                {formatPaymentMethod(payment.paymentMethod)}
                            </span>
                        </div>

                        <div className="rk-summary__row">
                            <span className="rk-summary__label">Khách trả</span>
                            <span className="rk-summary__value">
                                {formatCurrency(payment.amountPaid)}
                            </span>
                        </div>

                        <div className="rk-summary__row">
                            <span className="rk-summary__label">Tiền thừa</span>
                            <span className="rk-summary__value">
                                {formatCurrency(payment.excessAmount)}
                            </span>
                        </div>
                    </div>
                </PageCard>
            </div>
        </div>
    )
}
