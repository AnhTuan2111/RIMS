import {useEffect, useState} from 'react'
import {Link, useSearchParams} from 'react-router-dom'
import {type DishListResponse, getChefDishes, updateMenuStatus,} from '../../api/chef'

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value)
}

export default function DishListPage() {
    const [searchParams] = useSearchParams()

    const [dishes, setDishes] = useState<DishListResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const showUnavailableOnly =
        searchParams.get('status') === 'unavailable'

    const displayedDishes = showUnavailableOnly
        ? dishes.filter((dish) => !dish.available)
        : dishes

    const availableCount = dishes.filter(
        (dish) => dish.available,
    ).length

    const unavailableCount = dishes.filter(
        (dish) => !dish.available,
    ).length

    useEffect(() => {
        void loadDishes()
    }, [])

    async function loadDishes() {
        try {
            setIsLoading(true)
            setError(null)

            const data = await getChefDishes()
            setDishes(data)
        } catch (error) {
            console.error(error)

            setError(
                'Không thể tải danh sách món ăn. Hãy kiểm tra backend hoặc tài khoản Chef.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    async function handleToggleDish(
        dish: DishListResponse,
    ) {
        const nextAvailable = !dish.available

        try {
            await updateMenuStatus(
                dish.dishId,
                nextAvailable,
            )

            setDishes((currentDishes) =>
                currentDishes.map((item) =>
                    item.dishId === dish.dishId
                        ? {
                            ...item,
                            available: nextAvailable,
                        }
                        : item,
                ),
            )
        } catch (error) {
            console.error(error)
            alert('Không thể cập nhật trạng thái món.')
        }
    }

    if (isLoading) {
        return (
            <section className="page-card dish-loading-state">
                Đang tải danh sách món ăn...
            </section>
        )
    }

    if (error) {
        return (
            <section className="page-card dish-error-state">
                <h2>Không thể tải dữ liệu</h2>
                <p>{error}</p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={() => void loadDishes()}
                >
                    Thử lại
                </button>
            </section>
        )
    }

    return (
        <div className="chef-page">
            <section className="dish-page-header">
                <div>
                    <h2>
                        {showUnavailableOnly
                            ? 'Món đang tạm hết'
                            : 'Quản lý món ăn'}
                    </h2>

                    <p>
                        {showUnavailableOnly
                            ? 'Danh sách các món hiện đang tạm ngừng phục vụ.'
                            : 'Cập nhật trạng thái phục vụ của từng món trong thực đơn.'}
                    </p>
                </div>

                <div className="dish-page-actions">
                    {showUnavailableOnly && (
                        <Link
                            className="secondary-button"
                            to="/chef/dishes"
                        >
                            Xem tất cả món
                        </Link>
                    )}

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => void loadDishes()}
                    >
                        Làm mới
                    </button>
                </div>
            </section>

            <section className="dish-summary-simple">
                <article>
                    <span>Đang bán</span>
                    <strong>{availableCount}</strong>
                </article>

                <article>
                    <span>Tạm hết</span>
                    <strong>{unavailableCount}</strong>
                </article>

                <article>
                    <span>Tổng số món</span>
                    <strong>{dishes.length}</strong>
                </article>
            </section>

            <section className="page-card dish-table-panel">
                <div className="dish-table-heading">
                    <div>
                        <h2>Danh sách món ăn</h2>
                        <p>
                            Hiển thị {displayedDishes.length} món
                        </p>
                    </div>
                </div>

                {displayedDishes.length === 0 ? (
                    <div className="dish-empty-state">
                        <h3>Không có món nào</h3>

                        <p>
                            {showUnavailableOnly
                                ? 'Hiện tại không có món nào đang tạm hết.'
                                : 'Danh sách món ăn hiện đang trống.'}
                        </p>
                    </div>
                ) : (
                    <div className="dish-simple-table">
                        <div className="dish-simple-table-header">
                            <span>Tên món</span>
                            <span>Danh mục</span>
                            <span>Giá</span>
                            <span>Trạng thái</span>
                            <span>Thao tác</span>
                        </div>

                        {displayedDishes.map((dish) => (
                            <div
                                className="dish-simple-table-row"
                                key={dish.dishId}
                            >
                                <span className="dish-name">
                                    {dish.dishName}
                                </span>

                                <span>
                                    {dish.category}
                                </span>

                                <span className="dish-price">
                                    {formatCurrency(dish.price)}
                                </span>

                                <span>
                                    <span
                                        className={
                                            dish.available
                                                ? 'dish-status available'
                                                : 'dish-status unavailable'
                                        }
                                    >
                                        {dish.available
                                            ? 'Đang bán'
                                            : 'Tạm hết'}
                                    </span>
                                </span>

                                <span>
                                    <button
                                        type="button"
                                        className={
                                            dish.available
                                                ? 'dish-stop-button'
                                                : 'dish-open-button'
                                        }
                                        onClick={() =>
                                            void handleToggleDish(
                                                dish,
                                            )
                                        }
                                    >
                                        {dish.available
                                            ? 'Tạm ngừng'
                                            : 'Mở bán'}
                                    </button>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}