import {
    AlertTriangle,
    ArrowRight,
    EyeOff,
    FolderOpen,
    PauseCircle,
    Soup,
    Utensils,
} from 'lucide-react'

import {useCallback, useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'

import * as adminApi from '@/shared/api/admin'
import type {MenuDashboardData} from '@/shared/api/admin'
import {ErrorState, LoadingState} from '@/shared/components/feedback'
import {PageCard, PageHeader, StatCard} from '@/shared/components/ui'

export default function AdminMenuDashboardPage() {
    const [data, setData] = useState<MenuDashboardData | null>(null)

    const [loading, setLoading] = useState<boolean>(true)

    const [error, setError] = useState<string | null>(null)

    const navigate = useNavigate()

    const loadDashboardData = useCallback(
        async (
            signal: AbortSignal | undefined,
            showFullLoading: boolean,
            resetError: boolean,
        ) => {
            try {
                if (showFullLoading) {
                    setLoading(true)
                }

                if (resetError) {
                    setError(null)
                }

                const [menuRes, catRes, allDishesRes] = await Promise.all([
                    adminApi.getMenuDashboard(signal),
                    adminApi.getAllCategories(signal),
                    adminApi.getAllDishes(signal),
                ])

                const finalCatStats = catRes.data.map((category) => {
                    const statMatch = menuRes.data.categoryStats?.find(
                        (stat) =>
                            stat.categoryName.toLowerCase() ===
                            category.name.toLowerCase(),
                    )

                    return {
                        categoryName: category.name,
                        status: (category.isAvailable ? 'ACTIVE' : 'HIDDEN') as
                            'ACTIVE' | 'HIDDEN',
                        dishCount: statMatch ? statMatch.dishCount : 0,
                    }
                })

                const realHiddenCategoriesCount = finalCatStats.filter(
                    (category) => category.status === 'HIDDEN',
                ).length

                const allPausedDishes = allDishesRes.data
                    .filter((dish) => dish.isHidden)
                    .map((dish) => ({
                        id: dish.id,
                        name: dish.name,
                        categoryName: dish.categoryName,
                        price: dish.price,
                        imageUrl: dish.imageUrl,
                        status: 'HIDDEN' as const,
                    }))

                setData({
                    ...menuRes.data,
                    totalCategories: catRes.data.length,
                    totalHiddenDishes: realHiddenCategoriesCount,
                    totalPausedDishes: allPausedDishes.length,
                    categoryStats: finalCatStats,
                    allPausedDishesList: allPausedDishes,
                })

                setError(null)
            } catch (requestError) {
                console.error('[ADMIN_MENU_DASHBOARD_FETCH_ERROR]', requestError)

                setError('Không thể tải dữ liệu thống kê từ hệ thống.')
            } finally {
                // setLoading(false) phải chạy trong MỌI trường hợp. Trước đây nó nằm
                // trong if (showFullLoading), nên khi gọi với showFullLoading=false thì
                // loading khởi tạo là true không bao giờ được tắt -> trang kẹt ở màn
                // hình "đang tải" vĩnh viễn. Cờ này chỉ quyết định có BẬT spinner hay
                // không, chứ không quyết định có TẮT hay không.
                setLoading(false)
            }
        },
        [],
    )

    useEffect(() => {
        const controller = new AbortController()

        // showFullLoading=false vì loading đã khởi tạo là true -> bớt một lượt render.
        // Rule không đọc được nhánh if (showFullLoading) bên trong loader nên vẫn cảnh báo.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- xem ghi chú trên
        void loadDashboardData(controller.signal, false, true)

        return () => controller.abort()
    }, [loadDashboardData])

    if (loading) {
        return (
            <LoadingState
                title="Đang tải tổng quan thực đơn…"
                description="Hệ thống đang cập nhật danh mục, món ăn và trạng thái kinh doanh."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    loadDashboardData(undefined, true, true).catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    if (!data) {
        return (
            <ErrorState
                title="Không có dữ liệu"
                message="Tổng quan thực đơn chưa có dữ liệu để hiển thị."
                onRetry={() => {
                    loadDashboardData(undefined, true, true).catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    const allPausedDishesList = data.allPausedDishesList ?? []

    return (
        <div className="admin-menu-page">
            <PageCard className="admin-menu-header-card">
                <PageHeader
                    title="Tổng quan thực đơn"
                    description="Theo dõi nhanh danh mục, món ăn mới cập nhật và các món đang tạm dừng bán."
                />
            </PageCard>

            <div className="rk-statgrid">
                <StatCard
                    label="Tổng số món"
                    value={data.totalDishes}
                    icon={<Utensils className="rk-icon" aria-hidden="true" />}
                />

                <StatCard
                    label="Danh mục"
                    value={data.totalCategories}
                    icon={<FolderOpen className="rk-icon" aria-hidden="true" />}
                />

                <StatCard
                    label="Tạm dừng bán"
                    value={data.totalPausedDishes}
                    tone="busy"
                    icon={<PauseCircle className="rk-icon" aria-hidden="true" />}
                />

                <StatCard
                    label="Danh mục ẩn"
                    value={data.totalHiddenDishes}
                    tone="alert"
                    icon={<EyeOff className="rk-icon" aria-hidden="true" />}
                />
            </div>

            <div className="admin-menu-two-columns">
                <div className="admin-menu-left-column">
                    <div className="admin-menu-card admin-menu-category-list">
                        <div className="admin-menu-section-header">
                            <h3 className="admin-menu-section-title">
                                Danh mục thực đơn
                            </h3>

                            <button
                                type="button"
                                onClick={() => navigate('/admin/categories')}
                                className="admin-menu-manage-link"
                            >
                                Quản lý danh mục{' '}
                                <ArrowRight className="rk-icon" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="admin-menu-scroll-container">
                            {data.categoryStats.map((category, index) => (
                                <div
                                    key={`${category.categoryName}-${index}`}
                                    className="admin-menu-category-item"
                                >
                                    <div>
                                        <div className="admin-menu-category-name">
                                            {category.categoryName}
                                        </div>

                                        <small className="admin-menu-category-count">
                                            {category.dishCount} món ăn liên kết
                                        </small>
                                    </div>

                                    <span
                                        className={`rk-chip ${
                                            category.status === 'ACTIVE'
                                                ? 'rk-chip--ok'
                                                : 'rk-chip--idle'
                                        }`}
                                    >
                                        {category.status === 'ACTIVE'
                                            ? 'Hoạt động'
                                            : 'Đang ẩn'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="admin-menu-card admin-menu-progress">
                        <h3 className="admin-menu-section-title">
                            Tỷ lệ món theo danh mục
                        </h3>

                        <div className="admin-menu-scroll-container">
                            {data.categoryStats.map((category, index) => {
                                const percentage =
                                    data.totalDishes > 0
                                        ? (category.dishCount / data.totalDishes) * 100
                                        : 0

                                return (
                                    <div
                                        key={`${category.categoryName}-${index}`}
                                        className="admin-menu-progress-item"
                                    >
                                        <div className="admin-menu-progress-label">
                                            <span>{category.categoryName}</span>

                                            <span className="admin-menu-progress-percent">
                                                {category.dishCount} (
                                                {percentage.toFixed(0)}%)
                                            </span>
                                        </div>

                                        <div className="admin-menu-progress-track">
                                            <div
                                                className="admin-menu-progress-bar"
                                                style={{width: `${percentage}%`}}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="admin-menu-right-column">
                    <div className="admin-menu-card admin-menu-latest-dishes">
                        <div className="admin-menu-section-header">
                            <h3 className="admin-menu-section-title">
                                Món ăn mới cập nhật
                            </h3>

                            <button
                                type="button"
                                onClick={() => navigate('/admin/dishes')}
                                className="admin-menu-manage-link"
                            >
                                Quản lý món{' '}
                                <ArrowRight className="rk-icon" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="admin-menu-table-wrapper">
                            <table className="rk-table rk-table--compact">
                                <thead>
                                    <tr>
                                        <th>Món ăn</th>
                                        <th>Danh mục</th>
                                        <th>Giá niêm yết</th>
                                        <th className="admin-menu-text-center">
                                            Trạng thái
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.latestDishes.map((dish) => (
                                        <tr key={dish.id}>
                                            <td className="admin-menu-dish-cell">
                                                <div className="admin-menu-dish-image-wrapper">
                                                    {dish.imageUrl ? (
                                                        <img
                                                            src={
                                                                dish.imageUrl.startsWith(
                                                                    'http',
                                                                )
                                                                    ? dish.imageUrl
                                                                    : `/image/${dish.imageUrl}`
                                                            }
                                                            alt={dish.name}
                                                            onError={(event) => {
                                                                event.currentTarget.onerror =
                                                                    null
                                                                event.currentTarget.src =
                                                                    'https://placehold.co/36x36?text='
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="admin-menu-dish-emoji">
                                                            <Soup
                                                                className="rk-icon"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="admin-menu-dish-name">
                                                    {dish.name}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="rk-tag">
                                                    {dish.categoryName}
                                                </span>
                                            </td>

                                            <td className="admin-menu-dish-price">
                                                {dish.price.toLocaleString('vi-VN')}đ
                                            </td>

                                            <td className="admin-menu-text-center">
                                                <span
                                                    className={`rk-chip ${
                                                        dish.status === 'AVAILABLE'
                                                            ? 'rk-chip--ok'
                                                            : 'rk-chip--idle'
                                                    }`}
                                                >
                                                    {dish.status === 'AVAILABLE'
                                                        ? 'Đang bán'
                                                        : 'Tạm dừng'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="admin-menu-card admin-menu-warning">
                        <h3 className="admin-menu-section-title admin-menu-warning-title">
                            <AlertTriangle className="rk-icon" aria-hidden="true" /> Cần
                            chú ý (Món đang tạm dừng bán)
                        </h3>

                        <div className="admin-menu-scroll-container admin-menu-warning-scroll">
                            {allPausedDishesList.length === 0 ? (
                                <div className="admin-menu-empty-warning">
                                    Tuyệt vời! Hiện tại không có món ăn nào bị gián đoạn
                                    kinh doanh.
                                </div>
                            ) : (
                                allPausedDishesList.map((dish) => (
                                    <div
                                        key={dish.id}
                                        className="admin-menu-warning-item"
                                    >
                                        <div className="admin-menu-warning-item-left">
                                            <div className="admin-menu-dish-image-wrapper admin-menu-warning-image">
                                                {dish.imageUrl ? (
                                                    <img
                                                        src={
                                                            dish.imageUrl.startsWith(
                                                                'http',
                                                            )
                                                                ? dish.imageUrl
                                                                : `/image/${dish.imageUrl}`
                                                        }
                                                        alt={dish.name}
                                                        onError={(event) => {
                                                            event.currentTarget.onerror =
                                                                null
                                                            event.currentTarget.src =
                                                                'https://placehold.co/36x36?text='
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="admin-menu-dish-emoji">
                                                        <Soup
                                                            className="rk-icon"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <strong className="admin-menu-warning-dish-name">
                                                    {dish.name}
                                                </strong>

                                                <small className="admin-menu-warning-category">
                                                    Thuộc nhóm: {dish.categoryName}
                                                </small>
                                            </div>
                                        </div>

                                        <span className="admin-menu-paused-label">
                                            Tạm ngưng
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
