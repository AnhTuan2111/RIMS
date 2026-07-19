import { useEffect, useMemo, useState } from 'react'
import {
    getCancelledOrders,
    type CancelledOrderResponse,
} from '../../api/chef'

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

    const [searchText, setSearchText] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] =
        useState<string | null>(null)

    useEffect(() => {
        void loadCancelledOrders()
    }, [])

    async function loadCancelledOrders() {
        try {
            setIsLoading(true)
            setError(null)

            const data = await getCancelledOrders()
            setItems(data)
        } catch (requestError) {
            console.error(requestError)

            setError(
                'Không thể tải danh sách món đã hủy. '
                + 'Hãy kiểm tra backend hoặc tài khoản Chef.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    const filteredItems = useMemo(() => {
        const keyword =
            searchText.trim().toLowerCase()

        return items
            .filter((item) => {
                if (!keyword) {
                    return true
                }

                return (
                    item.dishName
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
                )
            })
            .sort((firstItem, secondItem) => {
                const firstTime = firstItem.cancelledAt
                    ? new Date(firstItem.cancelledAt).getTime()
                    : 0

                const secondTime = secondItem.cancelledAt
                    ? new Date(secondItem.cancelledAt).getTime()
                    : 0

                /*
                 * Món hủy sau hiển thị ở trên.
                 * Món hủy trước được đẩy xuống dưới.
                 */
                return secondTime - firstTime
            })
    }, [items, searchText])

    if (isLoading) {
        return (
            <section className="page-card">
                Đang tải danh sách món đã hủy...
            </section>
        )
    }

    if (error) {
        return (
            <section className="page-card">
                <h2>Lỗi tải dữ liệu</h2>

                <p className="modal-error">
                    {error}
                </p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                        void loadCancelledOrders()
                    }
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
                        <h2>Món đã hủy</h2>

                        <p>
                            Danh sách món Chef hủy trực tiếp
                            hoặc tự động bị hủy khi món được
                            đánh dấu tạm hết.
                        </p>
                    </div>

                    <div className="completed-page-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                                void loadCancelledOrders()
                            }
                        >
                            Làm mới
                        </button>
                    </div>
                </div>

                <div className="completed-summary">
                    Tổng cộng:
                    <strong>{items.length}</strong>
                    món đã hủy
                </div>
            </section>

            <section className="page-card">
                <div className="chef-filter-bar">
                    <input
                        type="search"
                        value={searchText}
                        placeholder={
                            'Tìm tên món, bàn, mã đơn '
                            + 'hoặc lý do hủy...'
                        }
                        onChange={(event) =>
                            setSearchText(
                                event.target.value,
                            )
                        }
                    />

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setSearchText('')}
                    >
                        Xóa tìm kiếm
                    </button>
                </div>
            </section>

            <section className="page-card">
                {filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <h3>
                            {items.length === 0
                                ? 'Chưa có món bị hủy'
                                : 'Không tìm thấy món phù hợp'}
                        </h3>

                        <p>
                            {items.length === 0
                                ? 'Các món có trạng thái CANCELLED '
                                + 'sẽ xuất hiện tại đây.'
                                : 'Hãy thử thay đổi từ khóa tìm kiếm.'}
                        </p>
                    </div>
                ) : (
                    <div className="completed-orders-list">
                        {filteredItems.map((item) => (
                            <article
                                key={item.orderItemId}
                                className="completed-order-card"
                            >
                                <div className="completed-order-main">
                                    <div>
                                        <span className="completed-order-id">
                                            Order #{item.orderId}
                                            {' · '}
                                            Item #{item.orderItemId}
                                        </span>

                                        <h3>{item.dishName}</h3>
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
                                        <small>SỐ LƯỢNG</small>
                                        <strong>
                                            x{item.quantity}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>THỜI GIAN HỦY</small>
                                        <strong>
                                            {formatDateTime(
                                                item.cancelledAt,
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <small>LÝ DO HỦY</small>
                                        <strong>
                                            {item.cancelReason
                                                || 'Không có lý do'}
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