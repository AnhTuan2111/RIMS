import {useCallback, useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Eye, QrCode, ReceiptText, Wallet} from 'lucide-react'

import * as adminApi from '@/shared/api/admin'
import type {AdminPaymentHistoryItem, AdminPaymentMethod} from '@/shared/api/admin'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {PageCard, PageHeader, Pagination} from '@/shared/components/ui'

const PAYMENT_HISTORY_PAGE_SIZE = 10
const PAYMENT_HISTORY_FILTER_DELAY_MS = 350

function formatCurrency(value: number) {
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}

function formatPaymentDate(value: string) {
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

function formatTableName(tableNumber: string) {
    if (!tableNumber) {
        return 'Mang về'
    }

    if (tableNumber.toLowerCase().startsWith('bàn')) {
        return tableNumber
    }

    return `Bàn ${tableNumber}`
}

function PaymentMethodBadge({method}: {method: AdminPaymentMethod}) {
    const isCash = method === 'CASH'

    return (
        <span className={`rk-chip ${isCash ? 'rk-chip--ok' : 'rk-chip--brand'}`}>
            {isCash ? (
                <Wallet className="rk-icon" aria-hidden="true" />
            ) : (
                <QrCode className="rk-icon" aria-hidden="true" />
            )}

            {isCash ? 'Tiền mặt' : 'VNPay / QR'}
        </span>
    )
}

export default function AdminPaymentHistoryPage() {
    const navigate = useNavigate()
    const hasLoadedHistoryRef = useRef(false)

    const [payments, setPayments] = useState<AdminPaymentHistoryItem[]>([])

    const [page, setPage] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Danh sách bàn lấy từ máy chủ. Bản cũ sinh cứng T01..T12 bằng
    // Array.from({length: 12}) — kê thêm bàn thứ 13 thì không lọc được theo nó,
    // và bàn đã cất vẫn nằm trong danh sách.
    const [tableOptions, setTableOptions] = useState<string[]>([])

    const [tableFilter, setTableFilter] = useState('')
    const [methodFilter, setMethodFilter] = useState('ALL')
    const [keywordInput, setKeywordInput] = useState('')
    const [keywordFilter, setKeywordFilter] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        adminApi
            .getAllTables(controller.signal)
            .then((res) => {
                setTableOptions(res.data.map((table) => table.tableNumber))
            })
            .catch(() => {
                // Không lấy được danh sách bàn thì bỏ lọc theo bàn, chứ không chặn
                // cả màn: hóa đơn vẫn xem được.
            })

        return () => controller.abort()
    }, [])

    const loadPaymentHistory = useCallback(
        async (targetPage: number, showFullLoading = true, signal?: AbortSignal) => {
            const filters = {
                tableNumber: tableFilter.trim() || undefined,
                paymentMethod: methodFilter === 'ALL' ? undefined : methodFilter,
                keyword: keywordFilter.trim() || undefined,
            }

            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                let effectivePage = targetPage

                let {data} = await adminApi.getPaymentHistory(
                    effectivePage,
                    PAYMENT_HISTORY_PAGE_SIZE,
                    filters,
                    signal,
                )

                if (data.totalPages > 0 && effectivePage > data.totalPages) {
                    effectivePage = data.totalPages

                    const retryResponse = await adminApi.getPaymentHistory(
                        effectivePage,
                        PAYMENT_HISTORY_PAGE_SIZE,
                        filters,
                        signal,
                    )

                    data = retryResponse.data
                }

                setPayments(data.items)
                setTotalItems(data.totalItems)
                setTotalPages(data.totalPages)
                setError(null)
                hasLoadedHistoryRef.current = true

                if (effectivePage !== targetPage) {
                    setPage(effectivePage)
                }
            } catch (requestError: unknown) {
                console.error('[ADMIN_PAYMENT_HISTORY_FETCH_ERROR]', requestError)

                setError('Không thể tải lịch sử thanh toán.')
            } finally {
                if (showFullLoading) {
                    setIsLoading(false)
                }
            }
        },
        [tableFilter, methodFilter, keywordFilter],
    )

    useEffect(() => {
        const controller = new AbortController()
        const shouldShowFullLoading = !hasLoadedHistoryRef.current

        void loadPaymentHistory(page, shouldShowFullLoading, controller.signal)

        return () => controller.abort()
    }, [loadPaymentHistory, page])

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setKeywordFilter(keywordInput)
            setPage(1)
        }, PAYMENT_HISTORY_FILTER_DELAY_MS)

        return () => window.clearTimeout(timeoutId)
    }, [keywordInput])

    function handleFilterChange() {
        setPage(1)
    }

    function clearFilters() {
        setTableFilter('')
        setMethodFilter('ALL')
        setKeywordInput('')
        setKeywordFilter('')
        setPage(1)
    }

    function handlePageChange(nextPage: number) {
        const safeTotalPages = Math.max(totalPages, 1)

        const safeNextPage = Math.min(Math.max(nextPage, 1), safeTotalPages)

        setPage(safeNextPage)
    }

    if (isLoading) {
        return (
            <LoadingState
                title="Đang tải lịch sử thanh toán…"
                description="Hệ thống đang lấy danh sách hóa đơn đã thanh toán."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    loadPaymentHistory(page, true).catch((requestError) => {
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
                    eyebrow="Quản trị"
                    title="Lịch sử hoá đơn"
                    description={`${totalItems} hoá đơn đã thanh toán được ghi nhận`}
                    icon={<ReceiptText className="rk-icon" aria-hidden="true" />}
                />
            </PageCard>

            <PageCard>
                <div className="rk-filterbar">
                    <input
                        className="rk-input"
                        type="text"
                        value={keywordInput}
                        placeholder="Tìm theo mã hoá đơn…"
                        onChange={(event) => setKeywordInput(event.target.value)}
                    />

                    <select
                        className="rk-select"
                        value={tableFilter}
                        onChange={(event) => {
                            setTableFilter(event.target.value)
                            handleFilterChange()
                        }}
                    >
                        <option value="">Tất cả bàn</option>
                        {tableOptions.map((tableNumber) => (
                            <option key={tableNumber} value={tableNumber}>
                                Bàn {tableNumber}
                            </option>
                        ))}
                    </select>

                    <select
                        className="rk-select"
                        value={methodFilter}
                        onChange={(event) => {
                            setMethodFilter(event.target.value)
                            handleFilterChange()
                        }}
                    >
                        <option value="ALL">Tất cả phương thức</option>
                        <option value="CASH">Tiền mặt</option>
                        <option value="QRCODE">VNPay / QR</option>
                    </select>

                    <button
                        type="button"
                        className="rk-btn rk-btn--quiet"
                        onClick={clearFilters}
                    >
                        Xoá bộ lọc
                    </button>
                </div>
            </PageCard>

            <PageCard>
                {payments.length === 0 ? (
                    <EmptyState
                        title="Chưa có hoá đơn đã thanh toán"
                        description="Không có hoá đơn nào khớp bộ lọc hiện tại."
                    />
                ) : (
                    <>
                        <div className="rk-tablewrap">
                            <table className="rk-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Mã hoá đơn</th>
                                        <th scope="col">Bàn</th>
                                        <th scope="col">Phương thức</th>
                                        <th scope="col" className="rk-th--num">
                                            Số tiền
                                        </th>
                                        <th scope="col">Ngày thanh toán</th>
                                        <th scope="col">Thao tác</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment.invoiceId}>
                                            <td>
                                                <strong>INV-{payment.invoiceId}</strong>
                                            </td>

                                            <td>
                                                {formatTableName(payment.tableNumber)}
                                            </td>

                                            <td>
                                                <PaymentMethodBadge
                                                    method={payment.paymentMethod}
                                                />
                                            </td>

                                            <td className="rk-td--num">
                                                <strong>
                                                    {formatCurrency(payment.amount)}
                                                </strong>
                                            </td>

                                            <td>
                                                {formatPaymentDate(payment.paymentDate)}
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="rk-iconbtn"
                                                    title="Xem chi tiết hoá đơn"
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/invoices/${payment.invoiceId}`,
                                                        )
                                                    }
                                                >
                                                    <Eye
                                                        className="rk-icon"
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            page={page}
                            totalPages={Math.max(totalPages, 1)}
                            totalItems={totalItems}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </PageCard>
        </div>
    )
}
