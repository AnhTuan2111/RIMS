import {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import {type ChefDashboardResponse, getChefDashboard,} from '../../api/chef'

export default function ChefDashboardPage() {
    const [dashboard, setDashboard] =
        useState<ChefDashboardResponse | null>(null)

    const [isLoading, setIsLoading] = useState(true)

    const [error, setError] =
        useState<string | null>(null)

    /*
     * Hàm này được sử dụng khi người dùng:
     * - Bấm nút "Làm mới"
     * - Bấm nút "Thử lại"
     */
    async function loadDashboard() {
        setIsLoading(true)
        setError(null)

        try {
            const data = await getChefDashboard()

            setDashboard(data)
        } catch (requestError) {
            console.error(
                'Lỗi tải Chef Dashboard:',
                requestError,
            )

            setError(
                'Không thể tải dữ liệu Dashboard.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    /*
     * Tự động tải dữ liệu một lần
     * khi ChefDashboardPage được mở.
     */
    useEffect(() => {
        let isCancelled = false

        async function fetchInitialDashboard() {
            try {
                const data =
                    await getChefDashboard()

                if (!isCancelled) {
                    setDashboard(data)
                    setError(null)
                }
            } catch (requestError) {
                console.error(
                    'Lỗi tải Chef Dashboard:',
                    requestError,
                )

                if (!isCancelled) {
                    setError(
                        'Không thể tải dữ liệu Dashboard.',
                    )
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false)
                }
            }
        }

        void fetchInitialDashboard()

        return () => {
            isCancelled = true
        }
    }, [])

    /*
     * Giao diện trong lúc đang gọi API.
     */
    if (isLoading) {
        return (
            <div className="chef-page">
                <section className="page-card">
                    <p>
                        Đang tải dữ liệu Dashboard...
                    </p>
                </section>
            </div>
        )
    }

    /*
     * Giao diện khi gọi API bị lỗi.
     */
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
                            void loadDashboard()
                        }
                    >
                        Thử lại
                    </button>
                </section>
            </div>
        )
    }

    /*
     * Giao diện Dashboard khi API thành công.
     */
    return (
        <div className="chef-page">
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Chef Dashboard</h2>

                        <p>
                            Tổng quan hoạt động của khu vực
                            bếp.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                            void loadDashboard()
                        }
                    >
                        Làm mới
                    </button>
                </div>

                <div className="stat-grid">
                    <Link
                        className="
                            stat-card
                            dashboard-stat-link
                        "
                        to="/chef/orders"
                    >
                        <strong>
                            {dashboard
                                ?.preparingCount ?? 0}
                        </strong>

                        <span>
                            Món đang chuẩn bị
                        </span>

                        <small>
                            Xem danh sách →
                        </small>
                    </Link>

                    <Link
                        className="
                            stat-card
                            dashboard-stat-link
                        "
                        to="/chef/completed-orders"
                    >
                        <strong>
                            {dashboard
                                ?.completedCount ?? 0}
                        </strong>

                        <span>
                            Món đã hoàn thành
                        </span>

                        <small>
                            Xem danh sách →
                        </small>
                    </Link>

                    <Link
                        className="
                            stat-card
                            dashboard-stat-link
                        "
                        to="/chef/dishes?status=unavailable"
                    >
                        <strong>
                            {dashboard
                                ?.unavailableDishCount ?? 0}
                        </strong>

                        <span>
                            Món đang tạm hết
                        </span>

                        <small>
                            Xem danh sách →
                        </small>
                    </Link>
                </div>
            </section>
        </div>
    )
}