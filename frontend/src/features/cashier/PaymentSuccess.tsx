import {Check, Download} from 'lucide-react'

import {type CSSProperties} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'

import * as cashierApi from '@/shared/api/cashier'
import {isRequestCanceled} from '@/shared/utils/error'
import {useToast} from '@/app/providers/useToast'

export default function PaymentSuccess() {
    const {notify} = useToast()

    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const invoiceId = searchParams.get('invoiceId')

    async function handleDownloadPdf() {
        if (!invoiceId) {
            return
        }

        try {
            const response = await cashierApi.downloadInvoicePdf(Number(invoiceId))

            const blob = new Blob([response.data as BlobPart], {
                type: 'application/pdf',
            })

            const url = window.URL.createObjectURL(blob)

            const link = document.createElement('a')

            link.href = url
            link.setAttribute('download', `Invoice-${invoiceId}.pdf`)

            document.body.appendChild(link)
            link.click()
            link.remove()

            window.URL.revokeObjectURL(url)
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[PAYMENT_SUCCESS_DOWNLOAD_PDF_ERROR]', requestError)

            notify('Không thể tải PDF! Vui lòng thử lại.', {tone: 'alert'})
        }
    }

    return (
        <div style={pageStyle}>
            <div className="page-card" style={cardStyle}>
                <div style={iconStyle}>
                    <Check className="rk-icon" aria-hidden="true" />
                </div>

                <h1 style={titleStyle}>Thanh Toán Thành Công!</h1>

                <p style={descriptionStyle}>
                    Giao dịch qua VNPay đã hoàn tất. Hóa đơn của quý khách đã được lưu lại
                    hệ thống.
                </p>

                {invoiceId && (
                    <div style={invoiceBoxStyle}>
                        <strong>Mã hóa đơn: INV-{invoiceId}</strong>
                    </div>
                )}

                <div style={actionRowStyle}>
                    <button
                        type="button"
                        style={downloadButtonStyle}
                        disabled={!invoiceId}
                        onClick={() => void handleDownloadPdf()}
                    >
                        <Download className="rk-icon" aria-hidden="true" /> Tải PDF Hóa
                        Đơn
                    </button>

                    <button
                        type="button"
                        style={backButtonStyle}
                        onClick={() => navigate('/cashier/payments')}
                    >
                        Về màn hình Thu Ngân
                    </button>
                </div>
            </div>
        </div>
    )
}

const pageStyle: CSSProperties = {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--rims-ok-soft)',
}

const cardStyle: CSSProperties = {
    textAlign: 'center',
    padding: '3rem',
    maxWidth: '500px',
    boxShadow: '0 10px 15px -3px rgb(var(--rims-tint-ink) / 10%)',
}

const iconStyle: CSSProperties = {
    fontSize: '5rem',
    color: 'var(--rims-ok)',
    marginBottom: '1rem',
}

const titleStyle: CSSProperties = {
    color: 'var(--rims-ok)',
    marginBottom: '1rem',
}

const descriptionStyle: CSSProperties = {
    color: 'var(--rims-ink-2)',
    marginBottom: '2rem',
}

const invoiceBoxStyle: CSSProperties = {
    background: 'var(--rims-surface-3)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
}

const actionRowStyle: CSSProperties = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
}

const downloadButtonStyle: CSSProperties = {
    padding: '0.8rem 1.5rem',
    background: 'var(--rims-brand)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
}

const backButtonStyle: CSSProperties = {
    padding: '0.8rem 1.5rem',
    background: 'var(--rims-surface-3)',
    color: 'var(--rims-ink)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
}
