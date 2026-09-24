import {Download} from 'lucide-react'

import {useCallback, useRef, useState, type CSSProperties} from 'react'

import * as cashierApi from '@/shared/api/cashier'
import type {InvoiceDetail, InvoiceSummary} from '@/shared/types/cashier'
import {REALTIME_CONFIG} from '@/app/config/realtime'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {Modal, PageCard, PageHeader, Pagination} from '@/shared/components/ui'
import {usePolling} from '@/shared/hooks/usePolling'
import {isRequestCanceled} from '@/shared/utils/error'
import {formatCurrency} from '@/shared/utils/format'
import {useToast} from '@/app/providers/useToast'

const PAGE_SIZE = 10

type InvoiceFilterParams = {
    page: number
    tableNumber: string
    keyword: string
    paymentMethod: string
    invoiceCode: string
}

function formatTime(iso: string) {
    const date = new Date(iso)

    if (Number.isNaN(date.getTime())) {
        return iso
    }

    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

function methodLabel(method: string | null) {
    if (method === 'CASH') {
        return 'Tiền mặt'
    }

    if (method === 'QRCODE') {
        return 'VNPay/QR'
    }

    return '—'
}

export default function CashierInvoicesPage() {
    const {notify} = useToast()

    const [invoices, setInvoices] = useState<InvoiceSummary[]>([])

    const [totalPages, setTotalPages] = useState(0)

    const [totalElements, setTotalElements] = useState(0)

    const [page, setPage] = useState(0)

    const [isLoading, setIsLoading] = useState(true)

    const [error, setError] = useState<string | null>(null)

    const [tableNumber, setTableNumber] = useState('')

    const [keyword, setKeyword] = useState('')

    const [paymentMethod, setPaymentMethod] = useState('')

    const [invoiceCode, setInvoiceCode] = useState('')

    const [tableOptions, setTableOptions] = useState<string[]>([])

    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null)

    const [loadingDetail, setLoadingDetail] = useState(false)

    const hasLoadedInitialInvoicesRef = useRef(false)

    const loadInvoices = useCallback(
        async (
            showFullLoading = true,
            signal?: AbortSignal,
            override?: Partial<InvoiceFilterParams>,
        ) => {
            const nextParams: InvoiceFilterParams = {
                page,
                tableNumber,
                keyword,
                paymentMethod,
                invoiceCode,
                ...override,
            }

            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                setError(null)

                const [tableResponse, invoiceResponse] = await Promise.all([
                    cashierApi.getTables(signal),
                    cashierApi.getTodayInvoices(
                        {
                            page: nextParams.page,
                            size: PAGE_SIZE,
                            tableNumber: nextParams.tableNumber || undefined,
                            keyword: nextParams.keyword || undefined,
                            paymentMethod: nextParams.paymentMethod || undefined,
                            invoiceCode: nextParams.invoiceCode || undefined,
                        },
                        signal,
                    ),
                ])

                if (signal?.aborted) {
                    return
                }

                setTableOptions(tableResponse.data.map((table) => table.tableNumber))

                setInvoices(invoiceResponse.data.content)
                setTotalPages(invoiceResponse.data.totalPages)
                setTotalElements(invoiceResponse.data.totalElements)
                setError(null)
            } catch (requestError: unknown) {
                if (signal?.aborted || isRequestCanceled(requestError)) {
                    return
                }

                console.error('[CASHIER_INVOICES_FETCH_ERROR]', requestError)

                setError('Không thể tải danh sách hóa đơn.')
            } finally {
                if (showFullLoading && !signal?.aborted) {
                    setIsLoading(false)
                }
            }
        },
        [page, tableNumber, keyword, paymentMethod, invoiceCode],
    )

    usePolling(
        async (signal) => {
            const isInitialLoad = !hasLoadedInitialInvoicesRef.current

            await loadInvoices(isInitialLoad, signal)

            hasLoadedInitialInvoicesRef.current = true
        },
        {
            intervalMs: REALTIME_CONFIG.cashier.invoicesIntervalMs,

            runImmediately: true,
            pauseWhenHidden: true,

            onError: (requestError) => {
                console.error('[CASHIER_INVOICES_POLL_ERROR]', requestError)
            },
        },
    )

    function handleTableNumberChange(value: string) {
        setTableNumber(value)
        setPage(0)

        void loadInvoices(true, undefined, {
            page: 0,
            tableNumber: value,
        })
    }

    function handleKeywordChange(value: string) {
        setKeyword(value)
        setPage(0)

        void loadInvoices(true, undefined, {
            page: 0,
            keyword: value,
        })
    }

    function handlePaymentMethodChange(value: string) {
        setPaymentMethod(value)
        setPage(0)

        void loadInvoices(true, undefined, {
            page: 0,
            paymentMethod: value,
        })
    }

    function handleInvoiceCodeChange(value: string) {
        setInvoiceCode(value)
        setPage(0)

        void loadInvoices(true, undefined, {
            page: 0,
            invoiceCode: value,
        })
    }

    function handlePageChange(nextPage: number) {
        const safeTotalPages = Math.max(totalPages, 1)

        const safeNextPage = Math.min(Math.max(nextPage, 0), safeTotalPages - 1)

        setPage(safeNextPage)

        void loadInvoices(true, undefined, {
            page: safeNextPage,
        })
    }

    async function openDetail(invoiceId: number) {
        setLoadingDetail(true)

        try {
            const response = await cashierApi.getInvoiceDetail(invoiceId)

            setSelectedInvoice(response.data)
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[CASHIER_INVOICE_DETAIL_ERROR]', requestError)

            notify('Không thể tải chi tiết hóa đơn.', {tone: 'alert'})
        } finally {
            setLoadingDetail(false)
        }
    }

    async function handleDownloadPdf(invoiceId: number) {
        try {
            const response = await cashierApi.downloadInvoicePdf(invoiceId)

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

            console.error('[CASHIER_INVOICE_PDF_ERROR]', requestError)

            notify('Không thể tải PDF!', {tone: 'alert'})
        }
    }

    return (
        <PageCard>
            <PageHeader
                title="Hóa đơn hôm nay"
                description={`Danh sách hóa đơn đã thanh toán trong ngày (${totalElements} hóa đơn)`}
            />

            <div
                style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                }}
            >
                <select
                    value={tableNumber}
                    style={filterInputStyle}
                    onChange={(event) => handleTableNumberChange(event.target.value)}
                >
                    <option value="">Tất cả bàn</option>

                    {tableOptions.map((table) => (
                        <option key={table} value={table}>
                            {table}
                        </option>
                    ))}
                </select>

                <input
                    value={keyword}
                    placeholder="Tìm theo tên hoặc số điện thoại khách…"
                    style={{
                        ...filterInputStyle,
                        flex: 1,
                        minWidth: 200,
                    }}
                    onChange={(event) => handleKeywordChange(event.target.value)}
                />

                <select
                    value={paymentMethod}
                    style={filterInputStyle}
                    onChange={(event) => handlePaymentMethodChange(event.target.value)}
                >
                    <option value="">Tất cả phương thức</option>
                    <option value="CASH">Tiền mặt</option>
                    <option value="QRCODE">VNPay/QR</option>
                </select>

                <input
                    value={invoiceCode}
                    placeholder="Mã hóa đơn…"
                    style={{
                        ...filterInputStyle,
                        width: 140,
                    }}
                    onChange={(event) => handleInvoiceCodeChange(event.target.value)}
                />
            </div>

            {error && (
                <ErrorState message={error} onRetry={() => void loadInvoices(true)} />
            )}

            {isLoading ? (
                <LoadingState
                    title="Đang tải lịch sử hóa đơn…"
                    description="Hệ thống đang lấy danh sách hóa đơn mới nhất."
                />
            ) : invoices.length === 0 ? (
                <EmptyState
                    title="Không có hóa đơn"
                    description="Không có hóa đơn nào khớp bộ lọc hiện tại."
                />
            ) : (
                <div className="rk-tablewrap">
                    <table className="rk-table">
                        <thead>
                            <tr>
                                <th scope="col">Mã HĐ</th>
                                <th scope="col">Bàn</th>
                                <th scope="col">Giờ</th>
                                <th scope="col">Khách hàng</th>
                                <th scope="col" className="rk-th--num">
                                    Tổng tiền
                                </th>
                                <th scope="col">Phương thức</th>
                                <th scope="col">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {invoices.map((invoice) => (
                                <tr key={invoice.invoiceId}>
                                    <td>
                                        <strong>INV-{invoice.invoiceId}</strong>
                                    </td>

                                    <td>{invoice.tableNumber}</td>

                                    <td>{formatTime(invoice.invoiceDate)}</td>

                                    <td>{invoice.customerName ?? '—'}</td>

                                    <td className="rk-td--num">
                                        <strong>
                                            {formatCurrency(invoice.finalAmount)}
                                        </strong>
                                    </td>

                                    <td>
                                        <span
                                            className={
                                                invoice.paymentMethod === 'CASH'
                                                    ? 'rk-chip rk-chip--ok'
                                                    : 'rk-chip rk-chip--brand'
                                            }
                                        >
                                            {methodLabel(invoice.paymentMethod)}
                                        </span>
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            className="rk-btn"
                                            onClick={() =>
                                                void openDetail(invoice.invoiceId)
                                            }
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination
                page={page + 1}
                totalPages={totalPages}
                totalItems={totalElements}
                onPageChange={(next) => handlePageChange(next - 1)}
            />

            <Modal
                open={Boolean(selectedInvoice) || loadingDetail}
                title={
                    selectedInvoice
                        ? `Hoá đơn INV-${selectedInvoice.invoiceId}`
                        : 'Đang tải hoá đơn'
                }
                description={
                    selectedInvoice
                        ? `Bàn ${selectedInvoice.tableNumber} · ${formatTime(
                              selectedInvoice.invoiceDate,
                          )}`
                        : undefined
                }
                onClose={() => setSelectedInvoice(null)}
                footer={
                    selectedInvoice ? (
                        <>
                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet"
                                onClick={() => setSelectedInvoice(null)}
                            >
                                Đóng
                            </button>

                            <button
                                type="button"
                                className="rk-btn rk-btn--primary"
                                onClick={() =>
                                    void handleDownloadPdf(selectedInvoice.invoiceId)
                                }
                            >
                                <Download className="rk-icon" aria-hidden="true" /> Tải
                                PDF
                            </button>
                        </>
                    ) : undefined
                }
            >
                {loadingDetail || !selectedInvoice ? (
                    <p className="rk-modal__loading">Đang tải chi tiết…</p>
                ) : (
                    <>
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
                                    {selectedInvoice.items.map((item, index) => (
                                        <tr key={`${item.dishName}-${index}`}>
                                            <td>{item.dishName}</td>
                                            <td className="rk-td--num">
                                                x{item.quantity}
                                            </td>
                                            <td className="rk-td--num">
                                                {formatCurrency(item.subTotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div
                            style={{
                                background: 'var(--rims-surface-2)',
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 16,
                                fontSize: 14,
                            }}
                        >
                            <Row
                                label="Tạm tính:"
                                value={`${formatCurrency(selectedInvoice.totalBeforeVat)}`}
                            />
                            <Row
                                label="VAT (10%):"
                                value={`${formatCurrency(selectedInvoice.vatAmount)}`}
                            />

                            {selectedInvoice.customerName && (
                                <>
                                    <Row
                                        label="Khách hàng:"
                                        value={selectedInvoice.customerName}
                                    />

                                    {!!selectedInvoice.pointsUsed &&
                                        selectedInvoice.pointsUsed > 0 && (
                                            <Row
                                                label="Điểm đã dùng:"
                                                value={`-${
                                                    selectedInvoice.pointsUsed * 1000
                                                }`}
                                                color="var(--rims-ok)"
                                            />
                                        )}

                                    <Row
                                        label="Điểm tích thêm:"
                                        value={`+${
                                            selectedInvoice.pointsEarned ?? 0
                                        } điểm`}
                                        color="var(--rims-ok)"
                                    />
                                </>
                            )}

                            <Row
                                bold
                                label="Thành tiền:"
                                value={`${formatCurrency(selectedInvoice.finalAmount)}`}
                                color="var(--rims-alert)"
                            />

                            <Row
                                label="Phương thức:"
                                value={methodLabel(selectedInvoice.paymentMethod)}
                            />

                            {selectedInvoice.paymentMethod === 'CASH' && (
                                <>
                                    <Row
                                        label="Khách trả:"
                                        value={`${formatCurrency(selectedInvoice.amountPaid)}`}
                                    />
                                    <Row
                                        label="Tiền thừa:"
                                        value={`${formatCurrency(selectedInvoice.excessAmount)}`}
                                    />
                                </>
                            )}
                        </div>
                    </>
                )}
            </Modal>
        </PageCard>
    )
}

const filterInputStyle: CSSProperties = {
    padding: '8px 12px',
    border: '1px solid var(--rims-line-strong)',
    borderRadius: 8,
    fontSize: 13,
}

function Row({
    label,
    value,
    bold,
    color,
}: {
    label: string
    value: string
    bold?: boolean
    color?: string
}) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: bold ? 700 : 400,
                color: color ?? 'var(--rims-ink-2)',
                fontSize: bold ? 15 : 13,
                marginBottom: 4,
            }}
        >
            <span>{label}</span>
            <span>{value}</span>
        </div>
    )
}
