import { useEffect, useMemo, useState } from 'react'
import {
    getDishDetail,
    getKitchenOrders,
    requestCancelDish,
    updateOrderItemStatus,
    type DishDetailResponse,
    type KitchenOrderItemResponse,
} from '../../api/chef'

const ITEMS_PER_PAGE = 6

type SortOrder = 'OLDEST' | 'NEWEST'

function formatTime(value?: string) {
    if (!value) {
        return '—'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function KitchenQueuePage() {
    const [items, setItems] =
        useState<KitchenOrderItemResponse[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [searchText, setSearchText] = useState('')
    const [selectedTable, setSelectedTable] = useState('ALL')
    const [sortOrder, setSortOrder] =
        useState<SortOrder>('OLDEST')
    const [currentPage, setCurrentPage] = useState(1)

    const [selectedDish, setSelectedDish] =
        useState<DishDetailResponse | null>(null)
    const [isDetailLoading, setIsDetailLoading] =
        useState(false)
    const [detailError, setDetailError] =
        useState<string | null>(null)

    const [completingItemId, setCompletingItemId] =
        useState<number | null>(null)

    const [cancelReason, setCancelReason] = useState('')
    const [cancelError, setCancelError] =
        useState<string | null>(null)
    const [isCancelSubmitting, setIsCancelSubmitting] =
        useState(false)

    useEffect(() => {
        let isCancelled = false

        getKitchenOrders()
            .then((data) => {
                if (!isCancelled) {
                    setItems(data)
                    setError(null)
                }
            })
            .catch((requestError) => {
                console.error(requestError)

                if (!isCancelled) {
                    setError(
                        'Không thể tải danh sách món cần chế biến. Hãy kiểm tra backend hoặc đăng nhập bằng tài khoản Chef.',
                    )
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoading(false)
                }
            })

        return () => {
            isCancelled = true
        }
    }, [])

    async function loadKitchenOrders() {
        try {
            setIsLoading(true)
            setError(null)

            const data = await getKitchenOrders()
            setItems(data)
            setCurrentPage(1)
        } catch (requestError) {
            console.error(requestError)
            setError(
                'Không thể tải danh sách món cần chế biến. Hãy kiểm tra backend hoặc đăng nhập bằng tài khoản Chef.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    async function openDishDetail(orderItemId: number) {
        try {
            setIsDetailLoading(true)
            setDetailError(null)
            setSelectedDish(null)
            setCancelReason('')
            setCancelError(null)

            const data = await getDishDetail(orderItemId)
            setSelectedDish(data)
        } catch (requestError) {
            console.error(requestError)
            setDetailError('Không thể tải chi tiết món.')
        } finally {
            setIsDetailLoading(false)
        }
    }

    function closeDishDetail() {
        setSelectedDish(null)
        setDetailError(null)
        setIsDetailLoading(false)
        setCancelReason('')
        setCancelError(null)
        setIsCancelSubmitting(false)
    }

    async function handleComplete(orderItemId: number) {
        try {
            setCompletingItemId(orderItemId)

            await updateOrderItemStatus(
                orderItemId,
                'COMPLETED',
            )

            setItems((currentItems) =>
                currentItems.filter(
                    (item) =>
                        item.orderItemId !== orderItemId,
                ),
            )

            if (selectedDish?.orderItemId === orderItemId) {
                closeDishDetail()
            }
        } catch (requestError) {
            console.error(requestError)
            alert('Không thể cập nhật trạng thái món.')
        } finally {
            setCompletingItemId(null)
        }
    }

    async function handleCancelRequest() {
        if (!selectedDish) {
            return
        }

        const normalizedReason = cancelReason.trim()

        if (!normalizedReason) {
            setCancelError('Vui lòng nhập lý do hủy món.')
            return
        }

        if (normalizedReason.length > 500) {
            setCancelError(
                'Lý do hủy không được vượt quá 500 ký tự.',
            )
            return
        }

        try {
            setIsCancelSubmitting(true)
            setCancelError(null)

            await requestCancelDish(
                selectedDish.orderItemId,
                normalizedReason,
            )

            setItems((currentItems) =>
                currentItems.filter(
                    (item) =>
                        item.orderItemId !==
                        selectedDish.orderItemId,
                ),
            )

            closeDishDetail()
        } catch (requestError) {
            console.error(requestError)
            setCancelError(
                'Không thể gửi yêu cầu hủy món.',
            )
        } finally {
            setIsCancelSubmitting(false)
        }
    }

    function clearFilters() {
        setSearchText('')
        setSelectedTable('ALL')
        setSortOrder('OLDEST')
        setCurrentPage(1)
    }

    const tableNumbers = useMemo<string[]>(() => {
        return Array.from(
            new Set(items.map((item) => item.tableNumber)),
        ).sort((firstTable, secondTable) =>
            firstTable.localeCompare(
                secondTable,
                'vi',
                { numeric: true },
            ),
        )
    }, [items])

    const filteredItems = useMemo(() => {
        const keyword = searchText.trim().toLowerCase()

        return [...items]
            .filter((item) => {
                const matchesSearch =
                    keyword === '' ||
                    item.dishName
                        .toLowerCase()
                        .includes(keyword) ||
                    item.tableNumber
                        .toLowerCase()
                        .includes(keyword) ||
                    String(item.orderId).includes(keyword) ||
                    String(item.orderItemId).includes(keyword)

                const matchesTable =
                    selectedTable === 'ALL' ||
                    item.tableNumber === selectedTable

                return matchesSearch && matchesTable
            })
            .sort((firstItem, secondItem) => {
                const firstTime = firstItem.createdAt
                    ? new Date(firstItem.createdAt).getTime()
                    : 0

                const secondTime = secondItem.createdAt
                    ? new Date(secondItem.createdAt).getTime()
                    : 0

                return sortOrder === 'OLDEST'
                    ? firstTime - secondTime
                    : secondTime - firstTime
            })
    }, [items, searchText, selectedTable, sortOrder])

    const totalPages = Math.max(
        1,
        Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
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
        filteredItems.length === 0 ? 0 : startIndex + 1

    const lastVisibleItem = Math.min(
        startIndex + ITEMS_PER_PAGE,
        filteredItems.length,
    )

    if (isLoading) {
        return (
            <div className="page-card">
                Đang tải danh sách món cần chế biến...
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
                    onClick={() => void loadKitchenOrders()}
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
                        <h2>Đơn cần chế biến</h2>
                        <p>
                            Chọn món để xem chi tiết, hoàn
                            thành món hoặc gửi yêu cầu hủy.
                        </p>
                    </div>

                    <div className="chef-summary">
                        <div>
                            <strong>{items.length}</strong>
                            <span>Đang chờ làm</span>
                        </div>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                                void loadKitchenOrders()
                            }
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
                        placeholder="Tìm tên món, bàn hoặc mã đơn..."
                        onChange={(event) => {
                            setSearchText(event.target.value)
                            setCurrentPage(1)
                        }}
                    />

                    <select
                        value={selectedTable}
                        onChange={(event) => {
                            setSelectedTable(event.target.value)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="ALL">
                            Tất cả bàn
                        </option>

                        {tableNumbers.map((tableNumber) => (
                            <option
                                key={tableNumber}
                                value={tableNumber}
                            >
                                Bàn {tableNumber}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(event) => {
                            setSortOrder(
                                event.target.value as SortOrder,
                            )
                            setCurrentPage(1)
                        }}
                    >
                        <option value="OLDEST">
                            Cũ nhất trước
                        </option>

                        <option value="NEWEST">
                            Mới nhất trước
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
                    <div className="kitchen-board">
                        {paginatedItems.map((item) => (
                            <section
                                className="kitchen-order-card clickable-card"
                                key={item.orderItemId}
                                onClick={() =>
                                    void openDishDetail(
                                        item.orderItemId,
                                    )
                                }
                            >
                                <div className="kitchen-order-header">
                                    <div>
                                        <h3>
                                            Bàn {item.tableNumber}
                                        </h3>

                                        <p>
                                            Order #{item.orderId} · Item #
                                            {item.orderItemId} ·{' '}
                                            {formatTime(item.createdAt)}
                                        </p>
                                    </div>

                                    <span className="status-badge preparing">
                                        Đang làm
                                    </span>
                                </div>

                                <div className="kitchen-item-list">
                                    <div className="kitchen-item">
                                        <div>
                                            <strong>
                                                {item.dishName}
                                            </strong>

                                            <p>
                                                Số lượng: x
                                                {item.quantity}
                                            </p>

                                            <small>
                                                Chọn để xem chi tiết
                                            </small>
                                        </div>

                                        <div className="kitchen-item-actions">
                                            <button
                                                type="button"
                                                className="primary-button"
                                                disabled={
                                                    completingItemId ===
                                                    item.orderItemId
                                                }
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    void handleComplete(
                                                        item.orderItemId,
                                                    )
                                                }}
                                            >
                                                {completingItemId ===
                                                item.orderItemId
                                                    ? 'Đang cập nhật...'
                                                    : 'Xong món'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>

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
                                disabled={safeCurrentPage === 1}
                                onClick={() =>
                                    setCurrentPage(
                                        safeCurrentPage - 1,
                                    )
                                }
                            >
                                ← Trang trước
                            </button>

                            <div className="pagination-pages">
                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1,
                                ).map((pageNumber) => (
                                    <button
                                        type="button"
                                        key={pageNumber}
                                        className={
                                            pageNumber ===
                                            safeCurrentPage
                                                ? 'pagination-number active'
                                                : 'pagination-number'
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                pageNumber,
                                            )
                                        }
                                    >
                                        {pageNumber}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="pagination-button"
                                disabled={
                                    safeCurrentPage === totalPages
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        safeCurrentPage + 1,
                                    )
                                }
                            >
                                Trang sau →
                            </button>
                        </div>
                    </div>
                </>
            )}

            {(isDetailLoading || detailError || selectedDish) && (
                <div
                    className="modal-backdrop"
                    onClick={closeDishDetail}
                >
                    <div
                        className="modal-card"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="modal-header">
                            <div>
                                <h2>
                                    Chi tiết món cần chế biến
                                </h2>
                                <p>Thông tin chi tiết từ bếp.</p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeDishDetail}
                            >
                                ×
                            </button>
                        </div>

                        {isDetailLoading && (
                            <div className="modal-body">
                                <p>Đang tải chi tiết món...</p>
                            </div>
                        )}

                        {detailError && (
                            <div className="modal-body">
                                <p className="modal-error">
                                    {detailError}
                                </p>
                            </div>
                        )}

                        {selectedDish && (
                            <>
                                <div className="modal-body">
                                    <div className="detail-grid">
                                        <div>
                                            <span>Bàn</span>
                                            <strong>
                                                {selectedDish.tableNumber}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Mã item</span>
                                            <strong>
                                                #
                                                {
                                                    selectedDish.orderItemId
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Tên món</span>
                                            <strong>
                                                {selectedDish.dishName}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Số lượng</span>
                                            <strong>
                                                x
                                                {selectedDish.quantity}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Trạng thái</span>
                                            <strong>
                                                {selectedDish.status}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Thời gian</span>
                                            <strong>
                                                {formatTime(
                                                    selectedDish.createdAt,
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Mô tả món</h3>
                                        <p>
                                            {selectedDish.description ||
                                                'Không có mô tả.'}
                                        </p>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Ghi chú</h3>
                                        <p>
                                            {selectedDish.note ||
                                                'Không có ghi chú.'}
                                        </p>
                                    </div>

                                    <div className="cancel-request-box">
                                        <h3>Yêu cầu hủy món</h3>

                                        <textarea
                                            rows={4}
                                            maxLength={500}
                                            value={cancelReason}
                                            placeholder="Nhập lý do hủy món..."
                                            onChange={(event) => {
                                                setCancelReason(
                                                    event.target.value,
                                                )
                                                setCancelError(null)
                                            }}
                                        />

                                        <div className="cancel-reason-count">
                                            {cancelReason.length}/500
                                        </div>

                                        {cancelError && (
                                            <p className="modal-error">
                                                {cancelError}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={closeDishDetail}
                                    >
                                        Quay lại
                                    </button>

                                    <button
                                        type="button"
                                        className="danger-button"
                                        disabled={isCancelSubmitting}
                                        onClick={() =>
                                            void handleCancelRequest()
                                        }
                                    >
                                        {isCancelSubmitting
                                            ? 'Đang gửi...'
                                            : 'Gửi yêu cầu hủy'}
                                    </button>

                                    <button
                                        type="button"
                                        className="primary-button"
                                        disabled={
                                            completingItemId ===
                                            selectedDish.orderItemId
                                        }
                                        onClick={() =>
                                            void handleComplete(
                                                selectedDish.orderItemId,
                                            )
                                        }
                                    >
                                        {completingItemId ===
                                        selectedDish.orderItemId
                                            ? 'Đang cập nhật...'
                                            : 'Xong món'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
