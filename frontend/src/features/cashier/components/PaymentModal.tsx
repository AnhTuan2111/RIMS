import {Globe, User} from 'lucide-react'

import {useEffect, useState} from 'react'

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
                    <div className="rk-note rk-note--ok">
                        <User className="rk-icon" aria-hidden="true" /> Khách:{' '}
                        <strong>{customer.fullName}</strong>
                        {pointsUsed > 0 && (
                            <span className="rk-text--ok">
                                {' '}
                                — Đã dùng {pointsUsed} điểm giảm giá
                            </span>
                        )}
                    </div>
                )}

                <div className="rk-summary__row rk-summary__row--total">
                    <span>Cần thu:</span>
                    <strong className="rk-num">{formatCurrency(finalAmount)}</strong>
                </div>

                {method === null &&
                    (loadingMethods ? (
                        <p className="rk-panel rk-panel--center rk-text--muted">
                            Đang tải phương thức thanh toán...
                        </p>
                    ) : (
                        <div className="rk-choicegrid">
                            {paymentMethods.map((m) => {
                                const {icon, label} = methodDisplay(m)
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        className="rk-btn rk-btn--quiet"
                                        onClick={() => setMethod(m as PaymentMethodType)}
                                    >
                                        {icon} {label}
                                    </button>
                                )
                            })}
                        </div>
                    ))}

                {method === 'CASH' && (
                    <div className="rk-fieldgroup">
                        <label className="rk-field">
                            <span className="rk-field__label">Khách đưa (VND)</span>
                            <input
                                className="rk-input"
                                type="number"
                                min={0}
                                value={amountReceived || ''}
                                onChange={(event) =>
                                    setAmountReceived(
                                        Math.max(0, Number(event.target.value)),
                                    )
                                }
                            />
                        </label>

                        <div className="rk-panel">
                            <span>Tiền thừa trả khách: </span>

                            <strong className="rk-num rk-text--ok">
                                {formatCurrency(changeReturned)}
                            </strong>
                        </div>

                        <div className="rk-actions">
                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet rk-btn--grow"
                                disabled={processing}
                                onClick={() => setMethod(null)}
                            >
                                Quay lại
                            </button>

                            <button
                                type="button"
                                className="rk-btn rk-btn--go rk-btn--grow"
                                disabled={amountReceived < finalAmount || processing}
                                onClick={() => void handleConfirmCash()}
                            >
                                {processing ? 'Đang xử lý…' : 'Xác nhận và in hoá đơn'}
                            </button>
                        </div>
                    </div>
                )}

                {method === 'QRCODE' && (
                    <div>
                        <div className="rk-panel rk-panel--center">
                            <span className="rk-feedback__icon">
                                <Globe className="rk-icon" aria-hidden="true" />
                            </span>

                            <h3 className="rk-sectiontitle">Cổng thanh toán VNPay</h3>

                            <p className="rk-text--muted">
                                Hệ thống sẽ chuyển hướng sang VNPay để nhập thông tin thẻ.
                                Hóa đơn sẽ được in sau khi thanh toán thành công.
                            </p>
                        </div>

                        <div className="rk-actions">
                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet rk-btn--grow"
                                disabled={processing}
                                onClick={() => setMethod(null)}
                            >
                                Hủy bỏ
                            </button>

                            <button
                                type="button"
                                className="rk-btn rk-btn--grow rk-btn--vnpay"
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
