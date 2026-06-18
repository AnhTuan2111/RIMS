
import { useEffect, useMemo, useState } from 'react'
import {
    getDishDetail,
    getKitchenOrders,
    requestCancelDish,
    updateOrderItemStatus,
    type DishDetailResponse,
    type KitchenOrderItemResponse,
} from '../../api/chef'

type SortOrder = 'OLDEST' | 'NEWEST'

function formatTime(value?: string) {
    if (!value) {
        return '—'
    }

    return new Date(value).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function KitchenQueuePage() {
    const [items, setItems] = useState<KitchenOrderItemResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [searchText, setSearchText] = useState('')
    const [selectedTable, setSelectedTable] = useState('ALL')
    const [sortOrder, setSortOrder] =
        useState<SortOrder>('OLDEST')

    const [selectedDish, setSelectedDish] =
        useState<DishDetailResponse | null>(null)

    const [isDetailLoading, setIsDetailLoading] =
        useState(false)

    const [detailError, setDetailError] =
        useState<string | null>(null)

    const [showCancelForm, setShowCancelForm] =
        useState(false)

    const [cancelReason, setCancelReason] = useState('')

    const [cancelError, setCancelError] =
        useState<string | null>(null)

    const [isCancelling, setIsCancelling] =
        useState(false)

    useEffect(() => {
        void loadKitchenOrders()
    }, [])

    const tableNumbers = useMemo(() => {
        return Array.from(
            new Set(items.map((item) => item.tableNumber)),
        ).sort()
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

    async function loadKitchenOrders() {
        try {
            setIsLoading(true)
            setError(null)

            const data = await getKitchenOrders()
            setItems(data)
        } catch (error) {
            console.error(error)

            setError(
                'Không thể tải danh sách món cần chế biến.',
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
            resetCancelForm()

            const data = await getDishDetail(orderItemId)
            setSelectedDish(data)
        } catch (error) {
            console.error(error)
            setDetailError('Không thể tải chi tiết món.')
        } finally {
            setIsDetailLoading(false)
        }
    }

    function resetCancelForm() {
        setShowCancelForm(false)
        setCancelReason('')
        setCancelError(null)
    }

    function closeDishDetail() {
        if (isCancelling) {
            return
        }

        setSelectedDish(null)
        setDetailError(null)
        setIsDetailLoading(false)
        resetCancelForm()
    }

    function clearFilters() {
        setSearchText('')
        setSelectedTable('ALL')
        setSortOrder('OLDEST')
    }

    async function handleComplete(orderItemId: number) {
        try {
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

            if (
                selectedDish?.orderItemId ===
                orderItemId
            ) {
                closeDishDetail()
            }
        } catch (error) {
            console.error(error)
            alert('Không thể cập nhật trạng thái món.')
        }
    }

    async function handleCancelRequest(
        orderItemId: number,
    ) {
        const reason = cancelReason.trim()

        if (!reason) {
            setCancelError(
                'Vui lòng nhập lý do yêu cầu hủy món.',
            )
            return
        }

        try {
            setIsCancelling(true)
            setCancelError(null)

            await requestCancelDish(orderItemId, reason)

            setItems((currentItems) =>
                currentItems.filter(
                    (item) =>
                        item.orderItemId !== orderItemId,
                ),
            )

            setSelectedDish(null)
            resetCancelForm()

            alert('Đã gửi yêu cầu hủy món.')
        } catch (error) {
            console.error(error)

            setCancelError(
                'Không thể gửi yêu cầu hủy món.',
            )
        } finally {
            setIsCancelling(false)
        }
    }

    if (isLoading) {
        return (
            <section className="page-card kitchen-loading-state">
                Đang tải danh sách món cần chế biến...
            </section>
        )
    }

    if (error) {
        return (
            <section className="page-card kitchen-error-state">
                <h2>Không thể tải dữ liệu</h2>
                <p>{error}</p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                        void loadKitchenOrders()
                    }
                >
                    Thử lại
                </button>
            </section>
        )
    }

    return (
        <div className="chef-page">
            <section className="kitchen-page-header">
                <div>
                    <h2>Hàng đợi bếp</h2>

                    <p>
                        Theo dõi và xử lý các món đang chờ chế biến.
                    </p>
                </div>

                <div className="kitchen-header-actions">
                    <div className="kitchen-count-box">
                        <span>Đang chờ</span>
                        <strong>{items.length}</strong>
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
            </section>

            <section className="page-card kitchen-filter-panel">
                <input
                    type="text"
                    value={searchText}
                    onChange={(event) =>
                        setSearchText(event.target.value)
                    }
                    placeholder="Tìm tên món, số bàn hoặc mã order"
                />

                <select
                    value={selectedTable}
                    onChange={(event) =>
                        setSelectedTable(event.target.value)
                    }
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
                    onChange={(event) =>
                        setSortOrder(
                            event.target.value as SortOrder,
                        )
                    }
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
            </section>

            {items.length === 0 ? (
                <section className="page-card kitchen-empty-state">
                    <h3>Không có món đang chờ</h3>
                    <p>Tất cả món hiện tại đã được xử lý.</p>
                </section>
            ) : filteredItems.length === 0 ? (
                <section className="page-card kitchen-empty-state">
                    <h3>Không tìm thấy món</h3>

                    <p>
                        Không có món nào phù hợp với bộ lọc.
                    </p>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={clearFilters}
                    >
                        Xóa bộ lọc
                    </button>
                </section>
            ) : (
                <div className="kitchen-simple-grid">
                    {filteredItems.map((item) => (
                        <article
                            className="kitchen-simple-card"
                            key={item.orderItemId}
                            onClick={() =>
                                void openDishDetail(
                                    item.orderItemId,
                                )
                            }
                        >
                            <div className="kitchen-card-top">
                                <div>
                                    <span className="kitchen-table-label">
                                        Bàn {item.tableNumber}
                                    </span>

                                    <small>
                                        Order #{item.orderId} ·{' '}
                                        {formatTime(
                                            item.createdAt,
                                        )}
                                    </small>
                                </div>

                                <span className="kitchen-status">
                                    Đang làm
                                </span>
                            </div>

                            <div className="kitchen-card-body">
                                <div>
                                    <h3>{item.dishName}</h3>

                                    <p>
                                        Số lượng: x{item.quantity}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="kitchen-complete-button"
                                    onClick={(event) => {
                                        event.stopPropagation()

                                        void handleComplete(
                                            item.orderItemId,
                                        )
                                    }}
                                >
                                    Xong món
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {(isDetailLoading ||
                detailError ||
                selectedDish) && (
                <div
                    className="modal-backdrop"
                    onClick={closeDishDetail}
                >
                    <div
                        className="modal-card kitchen-detail-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="modal-header">
                            <div>
                                <h2>Chi tiết món</h2>
                                <p>
                                    Thông tin món cần chế biến.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                disabled={isCancelling}
                                onClick={closeDishDetail}
                            >
                                ×
                            </button>
                        </div>

                        {isDetailLoading && (
                            <div className="modal-body">
                                Đang tải chi tiết món...
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
                                    <div className="kitchen-detail-grid">
                                        <div>
                                            <span>Bàn</span>
                                            <strong>
                                                {
                                                    selectedDish.tableNumber
                                                }
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
                                                {
                                                    selectedDish.dishName
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Số lượng</span>
                                            <strong>
                                                x
                                                {
                                                    selectedDish.quantity
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Trạng thái</span>
                                            <strong>
                                                {
                                                    selectedDish.status
                                                }
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

                                    <div className="kitchen-detail-section">
                                        <h3>Mô tả món</h3>

                                        <p>
                                            {selectedDish.description ||
                                                'Không có mô tả.'}
                                        </p>
                                    </div>

                                    <div className="kitchen-detail-section">
                                        <h3>Ghi chú</h3>

                                        <p>
                                            {selectedDish.note ||
                                                'Không có ghi chú.'}
                                        </p>
                                    </div>

                                    {showCancelForm && (
                                        <div className="kitchen-cancel-form">
                                            <h3>Yêu cầu hủy món</h3>

                                            <textarea
                                                value={
                                                    cancelReason
                                                }
                                                onChange={(
                                                    event,
                                                ) => {
                                                    setCancelReason(
                                                        event
                                                            .target
                                                            .value,
                                                    )

                                                    setCancelError(
                                                        null,
                                                    )
                                                }}
                                                placeholder="Nhập lý do yêu cầu hủy món"
                                                maxLength={500}
                                                rows={4}
                                            />

                                            <small>
                                                {
                                                    cancelReason.length
                                                }
                                                /500
                                            </small>

                                            {cancelError && (
                                                <p className="modal-error">
                                                    {
                                                        cancelError
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    {showCancelForm ? (
                                        <>
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                disabled={
                                                    isCancelling
                                                }
                                                onClick={
                                                    resetCancelForm
                                                }
                                            >
                                                Quay lại
                                            </button>

                                            <button
                                                type="button"
                                                className="danger-button"
                                                disabled={
                                                    isCancelling
                                                }
                                                onClick={() =>
                                                    void handleCancelRequest(
                                                        selectedDish.orderItemId,
                                                    )
                                                }
                                            >
                                                {isCancelling
                                                    ? 'Đang gửi...'
                                                    : 'Gửi yêu cầu hủy'}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={
                                                    closeDishDetail
                                                }
                                            >
                                                Đóng
                                            </button>

                                            <button
                                                type="button"
                                                className="danger-button"
                                                onClick={() =>
                                                    setShowCancelForm(
                                                        true,
                                                    )
                                                }
                                            >
                                                Yêu cầu hủy
                                            </button>

                                            <button
                                                type="button"
                                                className="primary-button"
                                                onClick={() =>
                                                    void handleComplete(
                                                        selectedDish.orderItemId,
                                                    )
                                                }
                                            >
                                                Xong món
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}