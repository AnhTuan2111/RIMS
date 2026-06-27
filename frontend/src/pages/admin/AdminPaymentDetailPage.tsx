

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    adminApi,
    type AdminPaymentDetail,
} from '../../api/admin'

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
    const { invoiceId } = useParams()
    const parsedInvoiceId = Number(invoiceId)
    const hasValidInvoiceId =
        Boolean(invoiceId) && !Number.isNaN(parsedInvoiceId)

    const [payment, setPayment] =
        useState<AdminPaymentDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function loadPaymentDetail() {
        try {
            setIsLoading(true)
            setError(null)

            const { data } = await adminApi.getPaymentDetail(
                parsedInvoiceId,
            )
            setPayment(data)
        } catch (error) {
            console.error(error)
            setError('Không thể tải chi tiết hóa đơn.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!hasValidInvoiceId) {
            return
        }

        let isActive = true

        adminApi
            .getPaymentDetail(parsedInvoiceId)
            .then(({ data }) => {
                if (!isActive) {
                    return
                }

                setPayment(data)
                setError(null)
            })
            .catch((error) => {
                if (!isActive) {
                    return
                }

                console.error(error)
                setError('Không thể tải chi tiết hóa đơn.')
            })
            .finally(() => {
                if (!isActive) {
                    return
                }

                setIsLoading(false)
            })

        return () => {
            isActive = false
        }
    }, [hasValidInvoiceId, parsedInvoiceId])

    if (!hasValidInvoiceId) {
        return (
            <section className="admin-payment-detail-state page-card">
                <h2>Không thể tải dữ liệu</h2>
                <p>Mã hóa đơn không hợp lệ.</p>
            </section>
        )
    }

    if (isLoading) {
        return (
            <section className="admin-payment-detail-state page-card">
                Đang tải chi tiết hóa đơn...
            </section>
        )
    }

    if (error || !payment) {
        return (
            <section className="admin-payment-detail-state page-card">
                <h2>Không thể tải dữ liệu</h2>
                <p>{error ?? 'Không tìm thấy hóa đơn.'}</p>

                <button
                    className="primary-button"
                    type="button"
                    onClick={() => void loadPaymentDetail()}
                >
                    Thử lại
                </button>
            </section>
        )
    }

    return (
        <div className="admin-payment-detail-page">
            <section className="admin-payment-detail-header">
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
                        Tạo lúc {formatDateTime(payment.invoiceDate)}
                    </p>
                </div>
            </section>

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
