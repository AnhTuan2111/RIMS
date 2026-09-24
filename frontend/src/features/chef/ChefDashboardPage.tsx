import {useCallback, useRef, useState} from 'react'
import {Link} from 'react-router-dom'

import {getChefDashboard, type ChefDashboardResponse} from '@/shared/api/chef'
import {REALTIME_CONFIG} from '@/app/config/realtime'
import {ErrorState, LoadingState} from '@/shared/components/feedback'
import {PageCard, PageHeader, StatCard} from '@/shared/components/ui'
import {usePolling} from '@/shared/hooks/usePolling'

export default function ChefDashboardPage() {
    const [dashboard, setDashboard] = useState<ChefDashboardResponse | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const hasLoadedInitialDashboardRef = useRef(false)

    const fetchDashboard = useCallback(
        async (showFullLoading: boolean, signal?: AbortSignal) => {
            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                const data = await getChefDashboard(signal)

                setDashboard(data)
                setError(null)
            } catch (requestError) {
                if (signal?.aborted) {
                    return
                }

                console.error('[CHEF_DASHBOARD_FETCH_ERROR]', requestError)

                setError('Không thể tải số liệu tổng quan bếp.')
            } finally {
                if (showFullLoading) {
                    setIsLoading(false)
                }
            }
        },
        [],
    )

    usePolling(
        async (signal) => {
            const isInitialLoad = !hasLoadedInitialDashboardRef.current

            await fetchDashboard(isInitialLoad, signal)

            hasLoadedInitialDashboardRef.current = true
        },
        {
            intervalMs: REALTIME_CONFIG.chef.dashboardIntervalMs,

            runImmediately: true,
            pauseWhenHidden: true,

            onError: (requestError) => {
                console.error('[CHEF_DASHBOARD_POLL_ERROR]', requestError)
            },
        },
    )

    if (isLoading) {
        return (
            <LoadingState
                title="Đang tải tổng quan bếp…"
                description="Hệ thống đang cập nhật số liệu bếp."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    fetchDashboard(true).catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    if (!dashboard) {
        return (
            <ErrorState
                title="Không có dữ liệu"
                message="Tổng quan bếp chưa có dữ liệu để hiển thị."
                onRetry={() => {
                    fetchDashboard(true).catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    return (
        <div className="rk-stack">
            <PageCard>
                <PageHeader
                    title="Tổng quan bếp"
                    description="Theo dõi nhanh trạng thái món ăn, hàng đợi bếp và tình trạng thực đơn."
                />
            </PageCard>

            <div className="rk-statgrid">
                <StatCard
                    label="Đang chế biến"
                    value={dashboard.preparingCount}
                    description="Món đang nằm trong hàng đợi bếp."
                    to="/chef/orders"
                />

                <StatCard
                    label="Đã hoàn thành hôm nay"
                    value={dashboard.completedCount}
                    description="Món bếp đã xác nhận xong trong ngày."
                    tone="ok"
                    to="/chef/completed-orders"
                />

                <StatCard
                    label="Đã huỷ hôm nay"
                    value={dashboard.cancelledCount}
                    description="Món bị huỷ trong ngày, Phục vụ cần báo khách."
                    tone="alert"
                    to="/chef/cancelled-orders"
                />

                <StatCard
                    label="Món đang tắt bán"
                    value={dashboard.unavailableDishCount}
                    description="Món hiện không khả dụng trên thực đơn."
                    tone="busy"
                    to="/chef/dishes"
                />
            </div>

            <PageCard>
                <div className="rk-actions">
                    <Link to="/chef/orders" className="rk-btn rk-btn--primary">
                        Xem hàng đợi bếp
                    </Link>

                    <Link to="/chef/grouped-orders" className="rk-btn rk-btn--quiet">
                        Xem món đã gom
                    </Link>

                    <Link to="/chef/dishes" className="rk-btn rk-btn--quiet">
                        Quản lý món ăn
                    </Link>
                </div>
            </PageCard>
        </div>
    )
}
