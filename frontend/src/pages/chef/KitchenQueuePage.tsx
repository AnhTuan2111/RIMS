import { useEffect, useState } from 'react'
import {
    getDishDetail,
    getKitchenOrders,
    updateOrderItemStatus,
    type DishDetailResponse,
    type KitchenOrderItemResponse,
} from '../../api/chef'

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

    const [selectedDish, setSelectedDish] = useState<DishDetailResponse | null>(null)
    const [isDetailLoading, setIsDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)

    useEffect(() => {
        void loadKitchenOrders()
    }, [])

    async function loadKitchenOrders() {
        try {
            setIsLoading(true)
            setError(null)

            const data = await getKitchenOrders()
            setItems(data)
        } catch (error) {
            console.error(error)
            setError('Không thể tải danh sách món cần chế biến. Hãy kiểm tra backend hoặc đăng nhập bằng tài khoản Chef.')
        } finally {
            setIsLoading(false)
        }
    }

    async function openDishDetail(orderItemId: number) {
        try {
            setIsDetailLoading(true)
            setDetailError(null)
            setSelectedDish(null)

            const data = await getDishDetail(orderItemId)
            setSelectedDish(data)
        } catch (error) {
            console.error(error)
            setDetailError('Không thể tải chi tiết món.')
        } finally {
            setIsDetailLoading(false)
        }
    }

    function closeDishDetail() {
        setSelectedDish(null)
        setDetailError(null)
        setIsDetailLoading(false)
    }

    async function handleComplete(orderItemId: number) {
        try {
            await updateOrderItemStatus(orderItemId, 'COMPLETED')

            setItems((currentItems) =>
                currentItems.filter((item) => item.orderItemId !== orderItemId),
            )

            if (selectedDish?.orderItemId === orderItemId) {
                closeDishDetail()
            }
        } catch (error) {
            console.error(error)
            alert('Không thể cập nhật trạng thái món.')
        }
    }

    if (isLoading) {
        return <div className="page-card">Đang tải danh sách món cần chế biến...</div>
    }

    if (error) {
        return (
            <div className="page-card">
                <h2>Lỗi tải dữ liệu</h2>
                <p>{error}</p>

                <button className="primary-button" onClick={() => void loadKitchenOrders()}>
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
                        <p>Click vào món để xem chi tiết. Bấm “Xong món” để cập nhật hoàn thành.</p>
                    </div>

                    <div className="chef-summary">
                        <div>
                            <strong>{items.length}</strong>
                            <span>Đang chờ làm</span>
                        </div>
                    </div>
                </div>
            </section>

            {items.length === 0 ? (
                <section className="page-card">
                    <h2>Không có món đang chờ</h2>
                    <p>Tất cả món hiện tại đã được xử lý.</p>
                </section>
            ) : (
                <div className="kitchen-board">
                    {items.map((item) => (
                        <section
                            className="kitchen-order-card clickable-card"
                            key={item.orderItemId}
                            onClick={() => void openDishDetail(item.orderItemId)}
                        >
                            <div className="kitchen-order-header">
                                <div>
                                    <h3>Bàn {item.tableNumber}</h3>
                                    <p>
                                        Order #{item.orderId} · Item #{item.orderItemId} ·{' '}
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
                                        <strong>{item.dishName}</strong>
                                        <p>Số lượng: x{item.quantity}</p>
                                        <small>Click để xem chi tiết</small>
                                    </div>

                                    <div className="kitchen-item-actions">
                                        <button
                                            className="primary-button"
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                void handleComplete(item.orderItemId)
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

            {(isDetailLoading || detailError || selectedDish) && (
                <div className="modal-backdrop" onClick={closeDishDetail}>
                    <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Chi tiết món cần chế biến</h2>
                                <p>Thông tin chi tiết từ bếp.</p>
                            </div>

                            <button className="modal-close" onClick={closeDishDetail}>
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
                                <p className="modal-error">{detailError}</p>
                            </div>
                        )}

                        {selectedDish && (
                            <>
                                <div className="modal-body">
                                    <div className="detail-grid">
                                        <div>
                                            <span>Bàn</span>
                                            <strong>{selectedDish.tableNumber}</strong>
                                        </div>

                                        <div>
                                            <span>Mã item</span>
                                            <strong>#{selectedDish.orderItemId}</strong>
                                        </div>

                                        <div>
                                            <span>Tên món</span>
                                            <strong>{selectedDish.dishName}</strong>
                                        </div>

                                        <div>
                                            <span>Số lượng</span>
                                            <strong>x{selectedDish.quantity}</strong>
                                        </div>

                                        <div>
                                            <span>Trạng thái</span>
                                            <strong>{selectedDish.status}</strong>
                                        </div>

                                        <div>
                                            <span>Thời gian tạo</span>
                                            <strong>{formatTime(selectedDish.createdAt)}</strong>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Mô tả món</h3>
                                        <p>{selectedDish.description || 'Không có mô tả.'}</p>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Ghi chú từ phục vụ</h3>
                                        <p>{selectedDish.note || 'Không có ghi chú.'}</p>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button className="secondary-button" onClick={closeDishDetail}>
                                        Đóng
                                    </button>

                                    <button
                                        className="primary-button"
                                        onClick={() => void handleComplete(selectedDish.orderItemId)}
                                    >
                                        Xong món
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