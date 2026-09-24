import {Check, Download} from 'lucide-react'

import {useState, type CSSProperties} from 'react'

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
            <button
                type="button"
                style={successScreenStyle}
                onClick={() => setStep('BILL')}
            >
                <div style={successIconStyle}>
                    <Check className="rk-icon" aria-hidden="true" />
                </div>

                <h1 style={successTitleStyle}>Thanh toán thành công</h1>

                <p style={successInvoiceStyle}>Mã hóa đơn: INV-{invoiceId}</p>

                {customerName && (
                    <div style={successCustomerBoxStyle}>
                        <p style={successCustomerNameStyle}>
                            Khách hàng: <strong>{customerName}</strong>
                        </p>

                        <p style={successPointsStyle}>
                            Tích lũy thêm: <strong>+{pointsEarned} điểm</strong>
                        </p>
                    </div>
                )}

                <p style={successHintStyle}>Chạm vào màn hình để xem hoá đơn</p>
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

                <div style={summaryBoxStyle}>
                    <SummaryRow label="Tạm tính:" value={formatCurrency(beforeVat)} />

                    <SummaryRow
                        label="Thuế VAT (10%):"
                        value={formatCurrency(vatAmount)}
                        marginBottom={customerName ? 12 : 0}
                    />

                    {customerName && (
                        <div style={customerBlockStyle}>
                            <SummaryRow
                                label="Khách hàng:"
                                value={customerName}
                                strongValue
                            />

                            {pointsUsed > 0 && (
                                <SummaryRow
                                    label="Điểm đã dùng:"
                                    value={`- ${formatCurrency(pointsUsed * 1000)}`}
                                    color="var(--rims-ok)"
                                />
                            )}

                            {pointsEarned > 0 && (
                                <SummaryRow
                                    label="Điểm tích lũy thêm:"
                                    value={`+${pointsEarned} điểm`}
                                    color="var(--rims-busy)"
                                    bold
                                />
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            ...totalRowStyle,
                            paddingTop: customerName ? 0 : 12,
                            borderTop: customerName
                                ? 'none'
                                : '1px dashed var(--rims-line-strong)',
                        }}
                    >
                        <span>Tổng thanh toán:</span>
                        <span>{formatCurrency(finalAmount)}</span>
                    </div>

                    <div style={paymentMethodRowStyle}>
                        <span>Phương thức thanh toán:</span>
                        <span>{paymentMethodLabel}</span>
                    </div>

                    {paymentResult.paymentMethod === 'CASH' && (
                        <>
                            <SummaryRow
                                label="Khách trả:"
                                value={formatCurrency(amountPaid)}
                            />
                            <SummaryRow
                                label="Tiền thừa:"
                                value={formatCurrency(excessAmount)}
                                color="var(--rims-ok)"
                            />
                        </>
                    )}
                </div>
            </div>
        </Modal>
    )
}

function SummaryRow({
    label,
    value,
    color = 'var(--rims-ink-2)',
    bold = false,
    strongValue = false,
    marginBottom = 6,
}: {
    label: string
    value: string
    color?: string
    bold?: boolean
    strongValue?: boolean
    marginBottom?: number
}) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.95rem',
                color,
                marginBottom,
                fontWeight: bold ? 'bold' : 'normal',
            }}
        >
            <span>{label}</span>

            {strongValue ? <strong>{value}</strong> : <span>{value}</span>}
        </div>
    )
}

const successScreenStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'var(--rims-ok)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    textAlign: 'center',
    animation: 'fadeIn 0.3s',
}

const successIconStyle: CSSProperties = {
    fontSize: '8rem',
    marginBottom: '1rem',
}

const successTitleStyle: CSSProperties = {
    fontSize: '4rem',
    fontWeight: 'bold',
}

const successInvoiceStyle: CSSProperties = {
    fontSize: '1.5rem',
    opacity: 0.9,
}

const successCustomerBoxStyle: CSSProperties = {
    marginTop: '1rem',
    padding: '10px 20px',
    background: 'rgb(var(--rims-tint-hi) / 20%)',
    borderRadius: '8px',
}

const successCustomerNameStyle: CSSProperties = {
    margin: '0 0 5px 0',
    fontSize: '1.2rem',
}

const successPointsStyle: CSSProperties = {
    margin: 0,
    fontSize: '1.1rem',
}

const successHintStyle: CSSProperties = {
    marginTop: '3rem',
    fontSize: '1.1rem',
    fontStyle: 'italic',
}

const summaryBoxStyle: CSSProperties = {
    background: 'var(--rims-surface-2)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid var(--rims-line)',
}

const customerBlockStyle: CSSProperties = {
    padding: '12px 0',
    borderTop: '1px dashed var(--rims-line-strong)',
    borderBottom: '1px dashed var(--rims-line-strong)',
    marginBottom: '12px',
}

const totalRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'var(--rims-alert)',
    marginBottom: '12px',
}

const paymentMethodRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: 'var(--rims-ok)',
    fontWeight: 'bold',
}
