import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/admin'
import type { InvoiceHistoryResponse } from '../../types/report'

function WalletIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="invoice-method-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 7.5h13.5A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17V7.5A2.5 2.5 0 0 1 5.5 5H17" />
            <path d="M16 13.5h5" />
            <circle cx="16.5" cy="13.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
    )
}

function QrCodeIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="invoice-method-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="4" y="4" width="6" height="6" rx="1" />
            <rect x="14" y="4" width="6" height="6" rx="1" />
            <rect x="4" y="14" width="6" height="6" rx="1" />
            <path d="M14 14h2.5v2.5H14z" />
            <path d="M19 14h1" />
            <path d="M14 20h6" />
            <path d="M20 17v3" />
        </svg>
    )
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

function formatPaymentDate(value: string) {
    const [datePart, timePart = ''] = value.split('T')
    const [year, month, day] = datePart.split('-')
    const [hour = '00', minute = '00'] = timePart.split(':')

    if (!year || !month || !day) {
        return value
    }

    return `${day}/${month}/${year} ${hour}:${minute}`
}

function getMethodIcon(method: string) {
    if (method === 'QRCODE') {
        return <QrCodeIcon />
    }

    return <WalletIcon />
}

export default function AdminInvoiceHistoryPage() {
    const navigate = useNavigate()
    const [invoices, setInvoices] = useState<InvoiceHistoryResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadInvoiceHistory() {
            try {
                setIsLoading(true)
                setError(null)

                const response =
                    await adminApi.getInvoiceHistory()

                setInvoices(response.data)
            } catch (error) {
                console.error(error)
                setError('Unable to load invoice history.')
            } finally {
                setIsLoading(false)
            }
        }

        void loadInvoiceHistory()
    }, [])

    return (
        <section className="invoice-history-page">
            <header className="invoice-history-header">
                <button
                    className="invoice-back-button"
                    type="button"
                    aria-label="Go back"
                    onClick={() => navigate(-1)}
                >
                    &lt;
                </button>

                <div>
                    <h2>Invoice History</h2>
                    <p>{invoices.length} total paid invoices on record</p>
                </div>
            </header>

            <div className="invoice-history-table-card">
                <div className="invoice-history-table">
                    <div className="invoice-history-row invoice-history-table-head">
                        <span>INVOICE ID</span>
                        <span>ORDER ID</span>
                        <span>TABLE</span>
                        <span>METHOD</span>
                        <span>AMOUNT</span>
                        <span>PAYMENT DATE</span>
                        <span aria-hidden="true"></span>
                    </div>

                    {isLoading && (
                        <div className="invoice-history-state">
                            Loading invoice history...
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="invoice-history-state invoice-history-error">
                            {error}
                        </div>
                    )}

                    {!isLoading && !error && invoices.length === 0 && (
                        <div className="invoice-history-state">
                            No paid invoices found.
                        </div>
                    )}

                    {!isLoading && !error && invoices.map((invoice) => (
                        <div
                            className="invoice-history-row invoice-history-table-body"
                            key={invoice.invoiceId}
                        >
                            <strong>INV-{invoice.invoiceId}</strong>
                            <span>ORD-{invoice.orderId}</span>
                            <span>Bàn {invoice.tableNumber}</span>
                            <span>
                                <span
                                    className={
                                        invoice.paymentMethod === 'QRCODE'
                                            ? 'invoice-method-badge qrcode'
                                            : 'invoice-method-badge cash'
                                    }
                                >
                                    {getMethodIcon(invoice.paymentMethod)}
                                    {invoice.paymentMethod}
                                </span>
                            </span>
                            <span className="invoice-amount">
                                {formatCurrency(invoice.amount)}
                            </span>
                            <span>
                                {formatPaymentDate(invoice.paymentDate)}
                            </span>
                            <span className="invoice-row-chevron">&gt;</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
