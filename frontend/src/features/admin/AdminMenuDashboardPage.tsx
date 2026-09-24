import {
    ArrowRight,
    BookOpen,
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

/**
 * Ảnh thu nhỏ của món.
 *
 * <p>Đoạn này trước đây được chép lại ba lần trong cùng một file, mỗi bản
 * một tên class khác nhau nhưng cùng một việc.
 */
function DishThumb({imageUrl, name}: {imageUrl?: string | null; name: string}) {
    if (!imageUrl) {
        return (
            <span className="rk-thumb">
                <Soup className="rk-icon" aria-hidden="true" />
            </span>
        )
    }

    return (
        <span className="rk-thumb">
            <img
                src={imageUrl.startsWith('http') ? imageUrl : `/image/${imageUrl}`}
                alt={name}
                onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = 'https://placehold.co/46x46?text='
                }}
            />
        </span>
    )
}

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
        <div className="rk-stack">
            <PageCard>
                <PageHeader
                    eyebrow="Quản trị"
                    title="Tổng quan thực đơn"
                    description="Theo dõi nhanh danh mục, món ăn mới cập nhật và các món đang tạm dừng bán."
                    icon={<BookOpen className="rk-icon" aria-hidden="true" />}
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

            <div className="rk-two">
                <div className="rk-stack">
                    <PageCard>
                        <div className="rk-card__head-inline">
                            <h3 className="rk-sectiontitle">Danh mục thực đơn</h3>

                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet"
                                onClick={() => navigate('/admin/categories')}
                            >
                                Quản lý danh mục
                                <ArrowRight className="rk-icon" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="rk-rowlist rk-scrollbox">
                            {data.categoryStats.map((category, index) => (
                                <div
                                    className="rk-rowlist__item"
                                    key={`${category.categoryName}-${index}`}
                                >
                                    <div className="rk-rowlist__main">
                                        <div className="rk-rowlist__title">
                                            {category.categoryName}
                                        </div>

                                        <p className="rk-rowlist__meta">
                                            {category.dishCount} món ăn liên kết
                                        </p>
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
                    </PageCard>

                    <PageCard>
                        <h3 className="rk-sectiontitle">Tỷ lệ món theo danh mục</h3>

                        <div className="rk-stack rk-scrollbox">
                            {data.categoryStats.map((category, index) => {
                                const percentage =
                                    data.totalDishes > 0
                                        ? (category.dishCount / data.totalDishes) * 100
                                        : 0

                                return (
                                    <div
                                        className="rk-barrow"
                                        key={`${category.categoryName}-${index}`}
                                    >
                                        <div className="rk-barrow__head">
                                            <span className="rk-barrow__label">
                                                {category.categoryName}
                                            </span>

                                            <span className="rk-barrow__value">
                                                {category.dishCount} ·{' '}
                                                {percentage.toFixed(0)}%
                                            </span>
                                        </div>

                                        <div className="rk-bar">
                                            <div
                                                className="rk-bar__fill"
                                                style={{width: `${percentage}%`}}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </PageCard>
                </div>

                <div className="rk-stack">
                    <PageCard>
                        <div className="rk-card__head-inline">
                            <h3 className="rk-sectiontitle">Món ăn mới cập nhật</h3>

                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet"
                                onClick={() => navigate('/admin/dishes')}
                            >
                                Quản lý món
                                <ArrowRight className="rk-icon" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="rk-tablewrap">
                            <table className="rk-table rk-table--compact">
                                <thead>
                                    <tr>
                                        <th scope="col">Món ăn</th>
                                        <th scope="col">Danh mục</th>
                                        <th scope="col" className="rk-th--num">
                                            Giá niêm yết
                                        </th>
                                        <th scope="col">Trạng thái</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.latestDishes.map((dish) => (
                                        <tr key={dish.id}>
                                            <td>
                                                <div className="rk-media">
                                                    <DishThumb
                                                        imageUrl={dish.imageUrl}
                                                        name={dish.name}
                                                    />

                                                    <span>{dish.name}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="rk-tag">
                                                    {dish.categoryName}
                                                </span>
                                            </td>

                                            <td className="rk-td--num">
                                                {dish.price.toLocaleString('vi-VN')}đ
                                            </td>

                                            <td>
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
                    </PageCard>

                    <PageCard>
                        <h3 className="rk-sectiontitle">Món đang tạm dừng bán</h3>

                        {allPausedDishesList.length === 0 ? (
                            <p className="rk-note rk-note--ok">
                                Không có món nào đang bị gián đoạn kinh doanh.
                            </p>
                        ) : (
                            <div className="rk-rowlist rk-scrollbox">
                                {allPausedDishesList.map((dish) => (
                                    <div className="rk-rowlist__item" key={dish.id}>
                                        <div className="rk-media">
                                            <DishThumb
                                                imageUrl={dish.imageUrl}
                                                name={dish.name}
                                            />

                                            <div className="rk-rowlist__main">
                                                <div className="rk-rowlist__title">
                                                    {dish.name}
                                                </div>

                                                <p className="rk-rowlist__meta">
                                                    Thuộc nhóm: {dish.categoryName}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="rk-chip rk-chip--busy">
                                            Tạm ngưng
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PageCard>
                </div>
            </div>
        </div>
    )
}
