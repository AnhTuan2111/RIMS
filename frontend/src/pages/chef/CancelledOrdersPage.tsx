import { useEffect, useMemo, useState } from 'react'
import {
    getCancelledOrders,
    type CancelledOrderResponse,
} from '../../api/chef'

const ITEMS_PER_PAGE = 6

type SortOrder = 'OLDEST' | 'NEWEST'

function formatDateTime(value?: string) {
    if (!value) {
        return '—'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export default function CancelledOrdersPage() {
    const [items, setItems] =
        useState<CancelledOrderResponse[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] =
        useState<string | null>(null)

    const [searchText, setSearchText] = useState('')

    const [selectedTable, setSelectedTable] =
        useState('ALL')

    const [sortOrder, setSortOrder] =
        useState<SortOrder>('NEWEST')

    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        loadCancelledOrders().catch((requestError) => {
            console.error(requestError)
        })
    }, [])

    async function loadCancelledOrders() {
        try {
            setIsLoading(true)
            setError(null)

            const data = await getCancelledOrders()

            setItems(data)
            setCurrentPage(1)
        } catch (requestError) {
            console.error(requestError)

            setError(
                'Không thể tải danh sách món đã hủy.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    function clearFilters() {
        setSearchText('')
        setSelectedTable('ALL')
        setSortOrder('NEWEST')
        setCurrentPage(1)
    }

    const tableNumbers = useMemo<string[]>(() => {
        return Array.from(
            new Set(
                items.map((item) => item.tableNumber),
            ),
        ).sort((firstTable, secondTable) =>
            firstTable.localeCompare(
                secondTable,
                'vi',
                {
                    numeric: true,
                },
            ),
        )
    }, [items])

    const filteredItems = useMemo(() => {
        const keyword =
            searchText.trim().toLowerCase()

        return [...items]
            .filter((item) => {
                const matchesSearch =
                    keyword === ''
                    || item.dishName
                        .toLowerCase()
                        .includes(keyword)
                    || item.tableNumber
                        .toLowerCase()
                        .includes(keyword)
                    || String(item.orderId)
                        .includes(keyword)
                    || String(item.orderItemId)
                        .includes(keyword)
                    || (item.cancelReason ?? '')
                        .toLowerCase()
                        .includes(keyword)

                const matchesTable =
                    selectedTable === 'ALL'
                    || item.tableNumber === selectedTable

                return matchesSearch && matchesTable
            })
            .sort((firstItem, secondItem) => {
                const firstTime =
                    firstItem.cancelledAt
                        ? new Date(
                            firstItem.cancelledAt,
                        ).getTime()
                        : 0

                const secondTime =
                    secondItem.cancelledAt
                        ? new Date(
                            secondItem.cancelledAt,
                        ).getTime()
                        : 0

                return sortOrder === 'OLDEST'
                    ? firstTime - secondTime
                    : secondTime - firstTime
            })
    }, [
        items,
        searchText,
        selectedTable,
        sortOrder,
    ])

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredItems.length / ITEMS_PER_PAGE,
        ),
    )

    const safeCurrentPage = Math.min(
        currentPage,
        totalPages,
    )

    const startIndex =
        (safeCurrentPage - 1) * ITEMS_PER_PAGE

    const paginatedItems = filteredItems.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE,
    )

    const firstVisibleItem =
        filteredItems.length === 0
            ? 0
            : startIndex + 1

    const lastVisibleItem = Math.min(
        startIndex + ITEMS_PER_PAGE,
        filteredItems.length,
    )

    if (isLoading) {
        return (
            <div className="page-card">
                Đang tải danh sách món đã hủy...
            </div>
        )
    }

    if (error) {
        return (
            <div className="page-card">
                <h2>Lỗi tải dữ liệu</h2>

                <p>{error}</p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                        loadCancelledOrders().catch(
                            (requestError) => {
                                console.error(requestError)
                            },
                        )
                    }}
                >
                    Thử lại
                </button>
            </div>
        )
    }

    return (
        <div className="chef-page">
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Món đã hủy</h2>

                        <p>
                            Tìm theo món, bàn, mã đơn hoặc
                            lý do hủy.
                        </p>
                    </div>

                    <div className="chef-summary">
                        <div>
                            <strong>{items.length}</strong>
                            <span>Đã hủy</span>
                        </div>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                                loadCancelledOrders().catch(
                                    (requestError) => {
                                        console.error(
                                            requestError,
                                        )
                                    },
                                )
                            }}
                        >
                            Làm mới
                        </button>
                    </div>
                </div>
            </section>

            <section className="page-card">
                <div className="chef-filter-bar">
                    <input
                        type="search"
                        value={searchText}
                        placeholder="Tìm món, bàn, mã đơn hoặc lý do hủy..."
                        onChange={(event) => {
                            setSearchText(
                                event.target.value,
                            )
                            setCurrentPage(1)
                        }}
                    />

                    <select
                        value={selectedTable}
                        onChange={(event) => {
                            setSelectedTable(
                                event.target.value,
                            )
                            setCurrentPage(1)
                        }}
                    >
                        <option value="ALL">
                            Tất cả bàn
                        </option>

                        {tableNumbers.map(
                            (tableNumber) => (
                                <option
                                    key={tableNumber}
                                    value={tableNumber}
                                >
                                    Bàn {tableNumber}
                                </option>
                            ),
                        )}
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(event) => {
                            setSortOrder(
                                event.target
                                    .value as SortOrder,
                            )
                            setCurrentPage(1)
                        }}
                    >
                        <option value="NEWEST">
                            Hủy mới nhất trước
                        </option>

                        <option value="OLDEST">
                            Hủy cũ nhất trước
                        </option>
                    </select>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={clearFilters}
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </section>

            {filteredItems.length === 0 ? (
                <section className="page-card">
                    <h2>Không tìm thấy món phù hợp</h2>

                    <p>
                        Hãy thay đổi từ khóa hoặc xóa bộ lọc.
                    </p>
                </section>
            ) : (
                <>
                    <section className="page-card">
                        <div className="completed-orders-list">
                            {paginatedItems.map((item) => (
                                <article
                                    className="completed-order-card"
                                    key={item.orderItemId}
                                >
                                    <div className="completed-order-main">
                                        <div>
                                            <span className="completed-order-id">
                                                Order #{item.orderId}
                                                {' · '}
                                                Item #
                                                {item.orderItemId}
                                            </span>

                                            <h3>
                                                {item.dishName}
                                            </h3>
                                        </div>

                                        <span className="status-badge danger">
                                            Đã hủy
                                        </span>
                                    </div>

                                    <div className="completed-order-info">
                                        <div>
                                            <small>BÀN</small>

                                            <strong>
                                                {item.tableNumber}
                                            </strong>
                                        </div>

                                        <div>
                                            <small>
                                                SỐ LƯỢNG
                                            </small>

                                            <strong>
                                                x{item.quantity}
                                            </strong>
                                        </div>

                                        <div>
                                            <small>
                                                THỜI GIAN HỦY
                                            </small>

                                            <strong>
                                                {formatDateTime(
                                                    item.cancelledAt,
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <small>
                                                LÝ DO HỦY
                                            </small>

                                            <strong>
                                                {item.cancelReason
                                                    || 'Không có lý do'}
                                            </strong>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <div className="chef-pagination">
                        <div className="pagination-result-info">
                            Hiển thị {firstVisibleItem}–
                            {lastVisibleItem} trong{' '}
                            {filteredItems.length} món
                        </div>

                        <div className="pagination-controls">
                            <button
                                type="button"
                                className="pagination-button"
                                disabled={
                                    safeCurrentPage === 1
                                }
                                onClick={() => {
                                    setCurrentPage(
                                        safeCurrentPage - 1,
                                    )
                                }}
                            >
                                ← Trang trước
                            </button>

                            <div className="pagination-pages">
                                {Array.from(
                                    {
                                        length: totalPages,
                                    },
                                    (_, index) =>
                                        index + 1,
                                ).map((pageNumber) => (
                                    <button
                                        type="button"
                                        key={pageNumber}
                                        className={
                                            pageNumber
                                            === safeCurrentPage
                                                ? 'pagination-number active'
                                                : 'pagination-number'
                                        }
                                        onClick={() => {
                                            setCurrentPage(
                                                pageNumber,
                                            )
                                        }}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="pagination-button"
                                disabled={
                                    safeCurrentPage
                                    === totalPages
                                }
                                onClick={() => {
                                    setCurrentPage(
                                        safeCurrentPage + 1,
                                    )
                                }}
                            >
                                Trang sau →
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}