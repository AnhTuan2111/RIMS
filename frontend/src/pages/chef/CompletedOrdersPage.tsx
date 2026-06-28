
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    getCompletedOrders,
    type KitchenOrderItemResponse,
} from '../../api/chef'

function formatDateTime(value?: string) {
    if (!value) {
        return 'Chưa có thời gian'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date)
}

export default function CompletedOrdersPage() {
    const [items, setItems] =
        useState<KitchenOrderItemResponse[]>([])

    const [isLoading, setIsLoading] =
        useState(true)

    const [error, setError] =
        useState<string | null>(null)

    /*
     * Hàm dùng khi người dùng bấm
     * "Làm mới" hoặc "Thử lại".
     */
    async function reloadCompletedOrders() {
        setIsLoading(true)
        setError(null)

        try {
            const data =
                await getCompletedOrders()

            setItems(data)
        } catch (requestError) {
            console.error(
                'Lỗi tải món hoàn thành:',
                requestError,
            )

            setError(
                'Không thể tải danh sách món đã hoàn thành.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    /*
     * Tự động gọi API một lần
     * khi trang vừa được mở.
     */
    useEffect(() => {
        let isCancelled = false

        getCompletedOrders()
            .then((data) => {
                if (!isCancelled) {
                    setItems(data)
                }
            })
            .catch((requestError) => {
                console.error(
                    'Lỗi tải món hoàn thành:',
                    requestError,
                )

                if (!isCancelled) {
                    setError(
                        'Không thể tải danh sách món đã hoàn thành.',
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

    if (isLoading) {
        return (
            <div className="chef-page">
                <section className="page-card">
                    <p>
                        Đang tải danh sách món đã hoàn thành...
                    </p>
                </section>
            </div>
        )
    }

    if (error) {
        return (
            <div className="chef-page">
                <section className="page-card">
                    <p className="modal-error">
                        {error}
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                            void reloadCompletedOrders()
                        }
                    >
                        Thử lại
                    </button>
                </section>
            </div>
        )
    }

    return (
        <div className="chef-page">
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>
                            Món đã hoàn thành
                        </h2>

                        <p>
                            Danh sách các món đã được bếp
                            xử lý xong.
                        </p>
                    </div>

                    <div className="completed-page-actions">
                        <Link
                            className="secondary-button"
                            to="/chef/dashboard"
                        >
                            Quay lại
                        </Link>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                                void reloadCompletedOrders()
                            }
                        >
                            Làm mới
                        </button>
                    </div>
                </div>

                <div className="completed-summary">
                    Tổng cộng:
                    <strong>{items.length}</strong>
                    món
                </div>

                {items.length === 0 ? (
                    <div className="empty-state">
                        <h3>
                            Chưa có món hoàn thành
                        </h3>

                        <p>
                            Các món được đánh dấu COMPLETED
                            sẽ xuất hiện tại đây.
                        </p>
                    </div>
                ) : (
                    <div className="completed-orders-list">
                        {items.map((item) => (
                            <article
                                key={item.orderItemId}
                                className="completed-order-card"
                            >
                                <div className="completed-order-main">
                                    <div>
                                        <span className="completed-order-id">
                                            Món #
                                            {item.orderItemId}
                                        </span>

                                        <h3>
                                            {item.dishName}
                                        </h3>
                                    </div>

                                    <span className="status-badge completed">
                                        Đã hoàn thành
                                    </span>
                                </div>

                                <div className="completed-order-info">
                                    <div>
                                        <small>Bàn</small>

                                        <strong>
                                            {item.tableNumber}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>Số lượng</small>

                                        <strong>
                                            {item.quantity}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>Mã đơn</small>

                                        <strong>
                                            #{item.orderId}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>Thời gian</small>

                                        <strong>
                                            {formatDateTime(
                                                item.createdAt,
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}