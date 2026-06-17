
import { useCallback, useEffect, useState } from 'react'
import {
    getCompletedOrders,
    type KitchenOrderItemResponse,
} from '../../api/chef'

export default function CompletedOrdersPage() {
    const [items, setItems] = useState<KitchenOrderItemResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadCompletedOrders = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const data = await getCompletedOrders()
            setItems(data)
        } catch (error) {
            console.error(error)
            setError('Không thể tải danh sách món đã hoàn thành.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadCompletedOrders()
    }, [loadCompletedOrders])

    if (isLoading) {
        return (
            <section className="page-card">
                <p>Đang tải danh sách món đã hoàn thành...</p>
            </section>
        )
    }

    if (error) {
        return (
            <section className="page-card">
                <p className="modal-error">{error}</p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() => void loadCompletedOrders()}
                >
                    Thử lại
                </button>
            </section>
        )
    }

    return (
        <div className="chef-page">
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Món đã hoàn thành</h2>
                        <p>Tổng số món: {items.length}</p>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => void loadCompletedOrders()}
                    >
                        Làm mới
                    </button>
                </div>

                {items.length === 0 ? (
                    <p>Chưa có món nào đã hoàn thành.</p>
                ) : (
                    <div className="simple-table">
                        <div className="simple-table-header">
                            <span>Bàn</span>
                            <span>Tên món</span>
                            <span>Số lượng</span>
                            <span>Thời gian</span>
                            <span>Trạng thái</span>
                        </div>

                        {items.map((item) => (
                            <div
                                className="simple-table-row"
                                key={item.orderItemId}
                            >
                                <span>{item.tableNumber}</span>

                                <span>{item.dishName}</span>

                                <span>{item.quantity}</span>

                                <span>{formatTime(item.createdAt)}</span>

                                <span className="status-badge completed">
                                    Đã hoàn thành
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function formatTime(value?: string): string {
    if (!value) {
        return '—'
    }

    return new Date(value).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}