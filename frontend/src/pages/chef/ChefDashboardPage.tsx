
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    getChefDashboard,
    type ChefDashboardResponse,
} from '../../api/chef'

export default function ChefDashboardPage() {
    const [dashboard, setDashboard] =
        useState<ChefDashboardResponse | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadDashboard = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const data = await getChefDashboard()
            setDashboard(data)
        } catch (error) {
            console.error(error)
            setError('Không thể tải dữ liệu Dashboard.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadDashboard()
    }, [loadDashboard])

    if (isLoading) {
        return (
            <section className="page-card chef-loading-panel">
                <div className="chef-loading-spinner" />
                <p>Đang tải dữ liệu bếp...</p>
            </section>
        )
    }

    if (error) {
        return (
            <section className="page-card chef-error-panel">
                <div className="chef-error-icon">!</div>

                <h2>Không thể tải Dashboard</h2>

                <p>{error}</p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() => void loadDashboard()}
                >
                    Thử lại
                </button>
            </section>
        )
    }

    return (
        <div className="chef-page">
            <section className="chef-dashboard-hero">
                <div className="chef-dashboard-hero-content">
                    <span className="chef-dashboard-label">
                        KITCHEN CONTROL CENTER
                    </span>

                    <h2>Chào mừng trở lại, Chef!</h2>

                    <p>
                        Theo dõi hàng đợi bếp, món đã hoàn thành và
                        tình trạng phục vụ của thực đơn trong một màn
                        hình duy nhất.
                    </p>

                    <div className="chef-dashboard-hero-actions">
                        <Link
                            className="chef-dashboard-main-button"
                            to="/chef/orders"
                        >
                            Mở hàng đợi bếp
                        </Link>

                        <button
                            type="button"
                            className="chef-dashboard-refresh-button"
                            onClick={() => void loadDashboard()}
                        >
                            ↻ Làm mới dữ liệu
                        </button>
                    </div>
                </div>

                <div className="chef-dashboard-visual">
                    <div className="chef-dashboard-circle circle-one" />
                    <div className="chef-dashboard-circle circle-two" />

                    <div className="chef-dashboard-avatar">
                        👨‍🍳
                    </div>
                </div>
            </section>

            <section className="chef-dashboard-stat-grid">
                <Link
                    className="chef-dashboard-stat-card chef-stat-preparing"
                    to="/chef/orders"
                >
                    <span className="chef-dashboard-stat-icon">
                        ♨
                    </span>

                    <div>
                        <small>ĐANG CHUẨN BỊ</small>

                        <strong>
                            {dashboard?.preparingCount ?? 0}
                        </strong>

                        <p>
                            Món đang nằm trong hàng đợi bếp
                        </p>

                        <span className="chef-dashboard-stat-link">
                            Xem danh sách →
                        </span>
                    </div>
                </Link>

                <Link
                    className="chef-dashboard-stat-card chef-stat-completed"
                    to="/chef/completed-orders"
                >
                    <span className="chef-dashboard-stat-icon">
                        ✓
                    </span>

                    <div>
                        <small>ĐÃ HOÀN THÀNH</small>

                        <strong>
                            {dashboard?.completedCount ?? 0}
                        </strong>

                        <p>
                            Món đã được bếp xử lý xong
                        </p>

                        <span className="chef-dashboard-stat-link">
                            Xem danh sách →
                        </span>
                    </div>
                </Link>

                <Link
                    className="chef-dashboard-stat-card chef-stat-unavailable"
                    to="/chef/dishes?status=unavailable"
                >
                    <span className="chef-dashboard-stat-icon">
                        !
                    </span>

                    <div>
                        <small>ĐANG TẠM HẾT</small>

                        <strong>
                            {dashboard?.unavailableDishCount ?? 0}
                        </strong>

                        <p>
                            Món hiện tạm ngừng phục vụ
                        </p>

                        <span className="chef-dashboard-stat-link">
                            Kiểm tra thực đơn →
                        </span>
                    </div>
                </Link>
            </section>

            <section className="page-card chef-quick-panel">
                <div className="chef-section-heading">
                    <span>QUICK ACTIONS</span>

                    <h2>Thao tác nhanh</h2>

                    <p>
                        Đi đến các công việc Chef sử dụng thường xuyên.
                    </p>
                </div>

                <div className="chef-quick-grid">
                    <Link
                        className="chef-quick-card quick-orange"
                        to="/chef/orders"
                    >
                        <span className="chef-quick-icon">
                            ⌁
                        </span>

                        <div>
                            <strong>Hàng đợi bếp</strong>

                            <small>
                                Xem và xử lý món đang chuẩn bị
                            </small>
                        </div>

                        <span className="chef-quick-arrow">
                            →
                        </span>
                    </Link>

                    <Link
                        className="chef-quick-card quick-blue"
                        to="/chef/dishes"
                    >
                        <span className="chef-quick-icon">
                            ◉
                        </span>

                        <div>
                            <strong>Quản lý món ăn</strong>

                            <small>
                                Bật hoặc tắt trạng thái phục vụ
                            </small>
                        </div>

                        <span className="chef-quick-arrow">
                            →
                        </span>
                    </Link>

                    <Link
                        className="chef-quick-card quick-green"
                        to="/chef/completed-orders"
                    >
                        <span className="chef-quick-icon">
                            ✓
                        </span>

                        <div>
                            <strong>Món đã hoàn thành</strong>

                            <small>
                                Kiểm tra lịch sử xử lý món
                            </small>
                        </div>

                        <span className="chef-quick-arrow">
                            →
                        </span>
                    </Link>
                </div>
            </section>
        </div>
    )
}