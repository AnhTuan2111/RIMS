
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

    // Search & Filter
    const [searchText, setSearchText] = useState('')
    const [selectedTable, setSelectedTable] = useState('ALL')
    const [sortOrder, setSortOrder] =
        useState<SortOrder>('OLDEST')

    // Modal chi tiết món
    const [selectedDish, setSelectedDish] =
        useState<DishDetailResponse | null>(null)

    const [isDetailLoading, setIsDetailLoading] =
        useState(false)

    const [detailError, setDetailError] =
        useState<string | null>(null)

    // Cancel Request
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

            alert('Đã gửi yêu cầu hủy món thành công.')
        } catch (error) {
            console.error(error)

            setCancelError(
                'Không thể gửi yêu cầu hủy món. Vui lòng thử lại.',
            )
        } finally {
            setIsCancelling(false)
        }
    }

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
                    onClick={() =>
                        void loadKitchenOrders()
                    }
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
                            Click vào món để xem chi tiết.
                            Bấm “Xong món” để cập nhật hoàn
                            thành.
                        </p>
                    </div>

                    <div className="chef-summary">
                        <div>
                            <strong>{items.length}</strong>
                            <span>Đang chờ làm</span>
                        </div>

                        <div>
                            <strong>
                                {filteredItems.length}
                            </strong>
                            <span>Kết quả hiển thị</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="page-card">
                <div className="chef-filter-bar">
                    <input
                        type="text"
                        value={searchText}
                        onChange={(event) =>
                            setSearchText(
                                event.target.value,
                            )
                        }
                        placeholder="Tìm theo tên món, bàn, mã order..."
                    />

                    <select
                        value={selectedTable}
                        onChange={(event) =>
                            setSelectedTable(
                                event.target.value,
                            )
                        }
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
                        onChange={(event) =>
                            setSortOrder(
                                event.target
                                    .value as SortOrder,
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
                </div>
            </section>

            {items.length === 0 ? (
                <section className="page-card">
                    <h2>Không có món đang chờ</h2>

                    <p>
                        Tất cả món hiện tại đã được xử lý.
                    </p>
                </section>
            ) : filteredItems.length === 0 ? (
                <section className="page-card">
                    <h2>Không tìm thấy món</h2>

                    <p>
                        Không có món nào phù hợp với bộ lọc
                        hiện tại.
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
                <div className="kitchen-board">
                    {filteredItems.map((item) => (
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
                                        Order #{item.orderId} ·
                                        Item #
                                        {item.orderItemId} ·{' '}
                                        {formatTime(
                                            item.createdAt,
                                        )}
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
                                            Click để xem chi
                                            tiết
                                        </small>
                                    </div>

                                    <div className="kitchen-item-actions">
                                        <button
                                            type="button"
                                            className="primary-button"
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
                                </div>
                            </div>
                        </section>
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

                                <p>
                                    Thông tin chi tiết từ bếp.
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
                                <p>
                                    Đang tải chi tiết món...
                                </p>
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
                                            <span>
                                                Trạng thái
                                            </span>
                                            <strong>
                                                {
                                                    selectedDish.status
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Thời gian tạo
                                            </span>
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
                                        <h3>
                                            Ghi chú từ phục vụ
                                        </h3>

                                        <p>
                                            {selectedDish.note ||
                                                'Không có ghi chú.'}
                                        </p>
                                    </div>

                                    {showCancelForm && (
                                        <div className="cancel-request-box">
                                            <h3>
                                                Yêu cầu hủy món
                                            </h3>

                                            <p>
                                                Nhập lý do không
                                                thể tiếp tục chế
                                                biến món này.
                                            </p>

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
                                                placeholder="Ví dụ: Hết nguyên liệu để chế biến món..."
                                                maxLength={500}
                                                rows={4}
                                            />

                                            <small>
                                                {
                                                    cancelReason.length
                                                }
                                                /500 ký tự
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
                                                onClick={() => {
                                                    setShowCancelForm(
                                                        true,
                                                    )
                                                    setCancelError(
                                                        null,
                                                    )
                                                }}
                                            >
                                                Yêu cầu hủy món
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