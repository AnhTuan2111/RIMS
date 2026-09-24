import {Check, Download} from 'lucide-react'

import {useState} from 'react'

import type {OrderDetailResponse, PaymentResponse} from '@/shared/types/cashier'
import {formatCurrency} from '@/shared/utils/format'
import {Modal} from '@/shared/components/ui'

interface Props {
    paymentResult: PaymentResponse
    orderDetail: OrderDetailResponse
    onClose: () => void
    onDownload: (id: number) => void
}

type ResultStep = 'SUCCESS' | 'BILL'

function getPaymentMethodLabel(method: string | null | undefined) {
    if (method === 'CASH') {
        return 'Tiền mặt'
    }

    if (method === 'QRCODE') {
        return 'Chuyển khoản/QR'
    }

    return '—'
}

export default function PaymentResultManager({
    paymentResult,
    orderDetail,
    onClose,
    onDownload,
}: Props) {
    const [step, setStep] = useState<ResultStep>('SUCCESS')

    const itemsList = orderDetail.orderItems ?? []

    const beforeVat = orderDetail.totalAmountBeforeVat ?? 0

    const vatAmount = orderDetail.vatAmount ?? 0

    const invoiceId = paymentResult.invoiceId

    const finalAmount = paymentResult.finalAmount

    const customerName = paymentResult.customerName

    const pointsUsed = paymentResult.pointsUsed ?? 0

    const pointsEarned = paymentResult.pointsEarned ?? 0

    const amountPaid = paymentResult.amountPaid ?? 0

    const excessAmount = paymentResult.excessAmount ?? 0

    const paymentMethodLabel = getPaymentMethodLabel(paymentResult.paymentMethod)

    if (step === 'SUCCESS') {
        return (
            <button type="button" className="rk-paid" onClick={() => setStep('BILL')}>
                <div className="rk-paid__icon">
                    <Check className="rk-icon" aria-hidden="true" />
                </div>

                <h1 className="rk-paid__title">Thanh toán thành công</h1>

                <p className="rk-paid__code">Mã hóa đơn: INV-{invoiceId}</p>

                {customerName && (
                    <div className="rk-paid__customer">
                        <p>
                            Khách hàng: <strong>{customerName}</strong>
                        </p>

                        <p>
                            Tích lũy thêm: <strong>+{pointsEarned} điểm</strong>
                        </p>
                    </div>
                )}

                <p className="rk-paid__hint">Chạm vào màn hình để xem hoá đơn</p>
            </button>
        )
    }

    return (
        <Modal
            open
            title="Hoá đơn thanh toán"
            description={`Mã hoá đơn INV-${invoiceId}`}
            onClose={onClose}
            footer={
                <>
                    <button
                        type="button"
                        className="rk-btn rk-btn--quiet"
                        onClick={() => void onDownload(invoiceId)}
                    >
                        <Download className="rk-icon" aria-hidden="true" /> Tải PDF
                    </button>

                    <button
                        type="button"
                        className="rk-btn rk-btn--primary"
                        onClick={onClose}
                    >
                        Đóng và tiếp tục
                    </button>
                </>
            }
        >
            <div>
                {itemsList.length === 0 ? (
                    <p className="rk-note">Không có món ăn trong hóa đơn.</p>
                ) : (
                    <div className="rk-tablewrap rk-tablewrap--scroll">
                        <table className="rk-table rk-table--compact">
                            <thead>
                                <tr>
                                    <th scope="col">Món ăn</th>
                                    <th scope="col" className="rk-th--num">
                                        SL
                                    </th>
                                    <th scope="col" className="rk-th--num">
                                        Thành tiền
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {itemsList.map((item, index) => (
                                    <tr key={`${item.dishName}-${index}`}>
                                        <td>{item.dishName}</td>
                                        <td className="rk-td--num">{item.quantity}</td>
                                        <td className="rk-td--num">
                                            {formatCurrency(item.subTotal)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="rk-summary rk-panel">
                    <SummaryRow label="Tạm tính:" value={formatCurrency(beforeVat)} />

                    <SummaryRow
                        label="Thuế VAT (10%):"
                        value={formatCurrency(vatAmount)}
                    />

                    {customerName && (
                        <div className="rk-summary">
                            <SummaryRow label="Khách hàng:" value={customerName} />

                            {pointsUsed > 0 && (
                                <SummaryRow
                                    label="Điểm đã dùng:"
                                    value={`- ${formatCurrency(pointsUsed * 1000)}`}
                                    tone="ok"
                                />
                            )}

                            {pointsEarned > 0 && (
                                <SummaryRow
                                    label="Điểm tích lũy thêm:"
                                    value={`+${pointsEarned} điểm`}
                                    tone="busy"
                                    bold
                                />
                            )}
                        </div>
                    )}

                    <SummaryRow
                        bold
                        label="Tổng thanh toán:"
                        value={formatCurrency(finalAmount)}
                    />

                    <SummaryRow
                        label="Phương thức thanh toán:"
                        value={paymentMethodLabel}
                    />

                    {paymentResult.paymentMethod === 'CASH' && (
                        <>
                            <SummaryRow
                                label="Khách trả:"
                                value={formatCurrency(amountPaid)}
                            />
                            <SummaryRow
                                label="Tiền thừa:"
                                value={formatCurrency(excessAmount)}
                                tone="ok"
                            />
                        </>
                    )}
                </div>
            </div>
        </Modal>
    )
}

/**
 * Một dòng trong bảng tổng kết.
 *
 * <p>Tham số trước đây là `color` nhận chuỗi màu bất kỳ và `marginBottom`
 * nhận số pixel. Hai thứ đó khiến mỗi nơi gọi tự quyết định khoảng cách, nên
 * các dòng trong cùng một bảng không thẳng nhau.
 */
function SummaryRow({
    label,
    value,
    bold,
    tone,
}: {
    label: string
    value: string
    bold?: boolean
    tone?: 'ok' | 'busy'
}) {
    return (
        <div
            className={`rk-summary__row${bold ? ' rk-summary__row--total' : ''}${
                tone ? ` rk-summary__row--${tone}` : ''
            }`}
        >
            <span className="rk-summary__label">{label}</span>
            <span className="rk-summary__value">{value}</span>
        </div>
    )
}
