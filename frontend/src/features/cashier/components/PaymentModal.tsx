import {Globe, User} from 'lucide-react'

import {useEffect, useState, type CSSProperties} from 'react'

import * as cashierApi from '@/shared/api/cashier'
import type {
    OrderDetailResponse,
    PaymentMethodType,
    PaymentResponse,
} from '@/shared/types/cashier'
import type {CustomerInfo} from './OrderPanel'
import {isRequestCanceled} from '@/shared/utils/error'
import {formatCurrency} from '@/shared/utils/format'
import {useToast} from '@/app/providers/useToast'
import {Modal} from '@/shared/components/ui'

interface PaymentModalProps {
    orderId: number
    orderDetail: OrderDetailResponse
    customer: CustomerInfo | null
    pointsUsed: number
    onClose: () => void
    onSuccess: (result: PaymentResponse) => void
}

function methodDisplay(method: string) {
    if (method === 'CASH') return {icon: '', label: 'Tiền mặt'}
    if (method === 'QRCODE') return {icon: '', label: 'Thẻ / VNPay'}
    return {icon: '', label: method}
}

// Mau thuong hieu cua VNPay. Day la nhan dien cua ben thu ba nen khong
// di qua bo token cua app.
const VNPAY_BRAND = '#005baa'

export default function PaymentModal({
    orderId,
    orderDetail,
    customer,
    pointsUsed,
    onClose,
    onSuccess,
}: PaymentModalProps) {
    const {notify} = useToast()

    const [method, setMethod] = useState<PaymentMethodType | null>(null)

    const [amountReceived, setAmountReceived] = useState<number>(0)

    const [processing, setProcessing] = useState<boolean>(false)

    const [paymentMethods, setPaymentMethods] = useState<string[]>([])

    const [loadingMethods, setLoadingMethods] = useState<boolean>(true)

    const originalFinalAmount = orderDetail.finalAmount

    const discountAmount = pointsUsed * 1000

    const finalAmount = Math.max(0, originalFinalAmount - discountAmount)

    const changeReturned =
        amountReceived >= finalAmount ? amountReceived - finalAmount : 0

    useEffect(() => {
        let active = true
        const controller = new AbortController()

        cashierApi
            .getPaymentMethods(controller.signal)
            .then((response) => {
                if (active) setPaymentMethods(response.data)
            })
            .catch((requestError: unknown) => {
                if (!isRequestCanceled(requestError)) {
                    console.error('[CASHIER_PAYMENT_METHODS_ERROR]', requestError)
                    if (active) setPaymentMethods(['CASH', 'QRCODE'])
                }
            })
            .finally(() => {
                if (active) setLoadingMethods(false)
            })

        return () => {
            active = false
            controller.abort()
        }
    }, [])

    async function handleCloseModal() {
        try {
            await cashierApi.unlockOrder(orderId)
        } catch (requestError: unknown) {
            if (!isRequestCanceled(requestError)) {
                console.error('[CASHIER_UNLOCK_ORDER_ERROR]', requestError)
            }
        } finally {
            onClose()
        }
    }

    async function handleConfirmCash() {
        if (amountReceived < finalAmount) {
            notify('Tiền khách đưa chưa đủ!', {tone: 'alert'})
            return
        }

        setProcessing(true)

        try {
            const request = {
                paymentMethod: 'CASH' as PaymentMethodType,
                amountPaid: amountReceived,
                customerId: customer?.id ?? null,
                pointsUsed,
            }

            const response = await cashierApi.completeCashPayment(orderId, request)

            if (response?.data?.success) {
                onSuccess(response.data)
                return
            }

            notify(response?.data?.message ?? 'Có lỗi xảy ra từ server!', {tone: 'alert'})
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[CASHIER_CASH_PAYMENT_ERROR]', requestError)

            notify('Lỗi thanh toán: Kiểm tra lại mạng hoặc đơn hàng!', {tone: 'alert'})
        } finally {
            setProcessing(false)
        }
    }

    async function handleRedirectToVNPay() {
        setProcessing(true)

        try {
            const response = await cashierApi.getVNPayQrCode(
                orderId,
                customer?.id,
                pointsUsed,
            )

            if (response?.data?.success && response.data.paymentUrl) {
                window.location.href = response.data.paymentUrl

                return
            }

            notify(response?.data?.message ?? 'Không thể khởi tạo cổng VNPay.', {
                tone: 'alert',
            })

            setProcessing(false)
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[CASHIER_VNPAY_CREATE_ERROR]', requestError)

            notify('Lỗi tạo cổng VNPay! Kiểm tra lại mạng hoặc tải lại trang.', {
                tone: 'alert',
            })

            setMethod(null)
            setProcessing(false)
        }
    }

    return (
        <Modal
            open
            title="Thanh toán"
            description={`Bàn ${orderDetail.tableNumber} — đơn #${orderDetail.orderId}`}
            onClose={() => void handleCloseModal()}
        >
            <div>
                {customer && (
                    <div style={customerSummaryStyle}>
                        <User className="rk-icon" aria-hidden="true" /> Khách:{' '}
                        <strong>{customer.fullName}</strong>
                        {pointsUsed > 0 && (
                            <span
                                style={{
                                    color: 'var(--rims-ok)',
                                }}
                            >
                                {' '}
                                — Đã dùng {pointsUsed} điểm giảm giá
                            </span>
                        )}
                    </div>
                )}

                <div style={amountSummaryStyle}>
                    <span>Cần thu:</span>
                    <strong
                        style={{
                            color: 'var(--rims-alert)',
                        }}
                    >
                        {formatCurrency(finalAmount)}
                    </strong>
                </div>

                {method === null &&
                    (loadingMethods ? (
                        <p style={{textAlign: 'center', color: 'var(--rims-ink-3)'}}>
                            Đang tải phương thức thanh toán...
                        </p>
                    ) : (
                        <div style={methodGridStyle}>
                            {paymentMethods.map((m) => {
                                const {icon, label} = methodDisplay(m)
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        className="rk-btn rk-btn--quiet"
                                        style={methodButtonStyle}
                                        onClick={() => setMethod(m as PaymentMethodType)}
                                    >
                                        {icon} {label}
                                    </button>
                                )
                            })}
                        </div>
                    ))}

                {method === 'CASH' && (
                    <div style={cashFormStyle}>
                        <label style={fieldLabelStyle}>
                            Khách đưa (VND):
                            <input
                                type="number"
                                min={0}
                                style={numberInputStyle}
                                value={amountReceived || ''}
                                onChange={(event) =>
                                    setAmountReceived(
                                        Math.max(0, Number(event.target.value)),
                                    )
                                }
                            />
                        </label>

                        <div style={changeBoxStyle}>
                            <span
                                style={{
                                    color: 'var(--rims-ink-2)',
                                }}
                            >
                                Tiền thừa trả khách:{' '}
                            </span>

                            <strong style={changeAmountStyle}>
                                {formatCurrency(changeReturned)}
                            </strong>
                        </div>

                        <div style={actionRowStyle}>
                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet"
                                style={{
                                    flex: 1,
                                }}
                                disabled={processing}
                                onClick={() => setMethod(null)}
                            >
                                Quay lại
                            </button>

                            <button
                                type="button"
                                style={confirmCashButtonStyle}
                                disabled={amountReceived < finalAmount || processing}
                                onClick={() => void handleConfirmCash()}
                            >
                                {processing ? 'Đang xử lý…' : 'Xác nhận và in hoá đơn'}
                            </button>
                        </div>
                    </div>
                )}

                {method === 'QRCODE' && (
                    <div
                        style={{
                            textAlign: 'center',
                        }}
                    >
                        <div style={vnpayBoxStyle}>
                            <div style={vnpayIconStyle}>
                                <Globe className="rk-icon" aria-hidden="true" />
                            </div>

                            <h3 style={vnpayTitleStyle}>Cổng thanh toán VNPay</h3>

                            <p style={vnpayDescriptionStyle}>
                                Hệ thống sẽ chuyển hướng sang VNPay để nhập thông tin thẻ.
                                Hóa đơn sẽ được in sau khi thanh toán thành công.
                            </p>
                        </div>

                        <div style={actionRowStyle}>
                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet"
                                style={{
                                    flex: 1,
                                }}
                                disabled={processing}
                                onClick={() => setMethod(null)}
                            >
                                Hủy bỏ
                            </button>

                            <button
                                type="button"
                                style={vnpayButtonStyle}
                                disabled={processing}
                                onClick={() => void handleRedirectToVNPay()}
                            >
                                {processing ? 'Đang kết nối…' : 'Chuyển hướng ngay'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}

const customerSummaryStyle: CSSProperties = {
    background: 'var(--rims-ok-soft)',
    border: '1px solid var(--rims-ok-line)',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
}

const amountSummaryStyle: CSSProperties = {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
}

const methodGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
}

const methodButtonStyle: CSSProperties = {
    height: '70px',
    fontSize: '1.05rem',
    cursor: 'pointer',
}

const cashFormStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
}

const fieldLabelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
}

const numberInputStyle: CSSProperties = {
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid var(--rims-line-strong)',
}

const changeBoxStyle: CSSProperties = {
    padding: '0.85rem',
    background: 'var(--rims-surface-2)',
    borderRadius: '8px',
}

const changeAmountStyle: CSSProperties = {
    fontSize: '1.15rem',
    color: 'var(--rims-ok)',
}

const actionRowStyle: CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
}

const confirmCashButtonStyle: CSSProperties = {
    flex: 2,
    background: 'var(--rims-ok)',
    color: 'var(--rims-ink-on-brand)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
}

const vnpayBoxStyle: CSSProperties = {
    background: 'var(--rims-surface-2)',
    padding: '2rem',
    borderRadius: '8px',
    border: '1px solid var(--rims-line-strong)',
    marginBottom: '1rem',
}

const vnpayIconStyle: CSSProperties = {
    fontSize: '3rem',
    marginBottom: '1rem',
}

const vnpayTitleStyle: CSSProperties = {
    margin: '0 0 10px 0',
    color: 'var(--rims-ink)',
}

const vnpayDescriptionStyle: CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--rims-ink-3)',
}

const vnpayButtonStyle: CSSProperties = {
    flex: 2,
    background: VNPAY_BRAND,
    color: 'var(--rims-ink-on-brand)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
}
