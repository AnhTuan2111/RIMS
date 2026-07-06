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
        } catch (requestError) {
            console.error(requestError)
            setError('Không thể tải dữ liệu Dashboard.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboard().catch((requestError) => {
            console.error(requestError)
        })
    }, [loadDashboard])

    if (isLoading) {
        return (
            <section className="page-card">
                <p>Đang tải dữ liệu Dashboard...</p>
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
                    onClick={() => {
                        loadDashboard().catch(
                            (requestError) => {
                                console.error(requestError)
                            },
                        )
                    }}
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
                        <h2>Chef Dashboard</h2>

                        <p>
                            Tổng quan trạng thái xử lý món của bếp.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                            loadDashboard().catch(
                                (requestError) => {
                                    console.error(requestError)
                                },
                            )
                        }}
                    >
                        Làm mới
                    </button>
                </div>

                <div className="stat-grid chef-dashboard-stat-grid">
                    <Link
                        className="stat-card dashboard-stat-link"
                        to="/chef/orders"
                    >
                        <strong>
                            {dashboard?.preparingCount ?? 0}
                        </strong>

                        <span>Món đang chuẩn bị</span>

                        <small>Xem danh sách →</small>
                    </Link>

                    <Link
                        className="stat-card dashboard-stat-link"
                        to="/chef/completed-orders"
                    >
                        <strong>
                            {dashboard?.completedCount ?? 0}
                        </strong>

                        <span>Món đã hoàn thành</span>

                        <small>Xem danh sách →</small>
                    </Link>

                    <Link
                        className="stat-card dashboard-stat-link"
                        to="/chef/cancelled-orders"
                    >
                        <strong>
                            {dashboard?.cancelledCount ?? 0}
                        </strong>

                        <span>Món đã hủy</span>

                        <small>Xem danh sách →</small>
                    </Link>

                    <Link
                        className="stat-card dashboard-stat-link"
                        to="/chef/dishes?status=unavailable"
                    >
                        <strong>
                            {dashboard?.unavailableDishCount ?? 0}
                        </strong>

                        <span>Món đang tạm hết</span>

                        <small>Xem danh sách →</small>
                    </Link>
                </div>
            </section>
        </div>
    )
}