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
                <div style={tableWrapperStyle}>
                    <div className="simple-table" style={{minWidth: 0}}>
                        <div className="simple-table-header" style={tableHeaderStyle}>
                            <span style={cellStyle}>Món ăn</span>
                            <span style={{...centerTextStyle, ...cellStyle}}>SL</span>
                            <span style={{...rightTextStyle, ...cellStyle}}>
                                Thành tiền
                            </span>
                        </div>

                        <div style={itemsListStyle}>
                            {itemsList.length === 0 ? (
                                <p style={emptyItemsStyle}>
                                    Không có món ăn trong hóa đơn.
                                </p>
                            ) : (
                                itemsList.map((item, index) => (
                                    <div
                                        key={`${item.dishName}-${index}`}
                                        style={tableRowStyle}
                                    >
                                        <span style={cellStyle}>{item.dishName}</span>

                                        <span style={{...rightTextStyle, ...cellStyle}}>
                                            {item.quantity}
                                        </span>

                                        <span style={{...rightTextStyle, ...cellStyle}}>
                                            {formatCurrency(item.subTotal)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

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
                                    color="#16a34a"
                                />
                            )}

                            {pointsEarned > 0 && (
                                <SummaryRow
                                    label="Điểm tích lũy thêm:"
                                    value={`+${pointsEarned} điểm`}
                                    color="#ea580c"
                                    bold
                                />
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            ...totalRowStyle,
                            paddingTop: customerName ? 0 : 12,
                            borderTop: customerName ? 'none' : '1px dashed #cbd5e1',
                        }}
                    >
                        <span>TỔNG THANH TOÁN:</span>
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
                                color="#16a34a"
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
    color = '#475569',
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
    background: '#16a34a',
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
    background: 'rgba(255,255,255,0.2)',
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

const tableWrapperStyle: CSSProperties = {
    margin: '1.5rem 0',
    minWidth: 0,
}

const tableHeaderStyle: CSSProperties = {
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)',
    display: 'grid',
    fontWeight: 'bold',
    borderBottom: '1px solid #cbd5e1',
    paddingBottom: '8px',
    minWidth: 0,
}

const itemsListStyle: CSSProperties = {
    maxHeight: '250px',
    overflowY: 'auto',
    paddingTop: '8px',
}

const tableRowStyle: CSSProperties = {
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)',
    display: 'grid',
    padding: '10px 0',
    borderBottom: '1px dashed #f1f5f9',
    minWidth: 0,
}

const centerTextStyle: CSSProperties = {
    textAlign: 'center',
}

const rightTextStyle: CSSProperties = {
    textAlign: 'right',
}

const emptyItemsStyle: CSSProperties = {
    textAlign: 'center',
    color: '#94a3b8',
    margin: '1rem 0',
}

const summaryBoxStyle: CSSProperties = {
    background: '#f8fafc',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid #e2e8f0',
}

const customerBlockStyle: CSSProperties = {
    padding: '12px 0',
    borderTop: '1px dashed #cbd5e1',
    borderBottom: '1px dashed #cbd5e1',
    marginBottom: '12px',
}

const totalRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#b91c1c',
    marginBottom: '12px',
}

const paymentMethodRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: '#16a34a',
    fontWeight: 'bold',
}

const cellStyle: CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
}
