import { useEffect, useState } from 'react'
import {
    getChefDishes,
    updateMenuStatus,
    type DishListResponse,
} from '../../api/chef'

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value)
}

export default function DishListPage() {
    const [dishes, setDishes] = useState<DishListResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
            setError('Không thể tải danh sách món ăn. Hãy kiểm tra backend hoặc đăng nhập bằng tài khoản Chef.')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleToggleDish(dish: DishListResponse) {
        const nextAvailable = !dish.available

        try {
            await updateMenuStatus(dish.dishId, nextAvailable)

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

    const availableCount = dishes.filter((dish) => dish.available).length
    const unavailableCount = dishes.length - availableCount

    if (isLoading) {
        return <div className="page-card">Đang tải danh sách món ăn...</div>
    }

    if (error) {
        return (
            <div className="page-card">
                <h2>Lỗi tải dữ liệu</h2>
                <p>{error}</p>

                <button className="primary-button" onClick={() => void loadDishes()}>
                    Thử lại
                </button>
            </div>
        )
    }

    return (
        <div className="chef-page">
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Danh sách món ăn</h2>
                        <p>Chef có thể bật hoặc tắt trạng thái phục vụ của món.</p>
                    </div>

                    <div className="chef-summary">
                        <div>
                            <strong>{availableCount}</strong>
                            <span>Đang bán</span>
                        </div>

                        <div>
                            <strong>{unavailableCount}</strong>
                            <span>Tạm hết</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="page-card">
                <div className="simple-table chef-dish-table">
                    <div className="simple-table-header">
                        <span>Tên món</span>
                        <span>Danh mục</span>
                        <span>Giá</span>
                        <span>Trạng thái</span>
                        <span>Thao tác</span>
                    </div>

                    {dishes.map((dish) => (
                        <div className="simple-table-row" key={dish.dishId}>
                            <span>{dish.dishName}</span>
                            <span>{dish.category}</span>
                            <span>{formatCurrency(dish.price)}</span>

                            <span>
                                <span
                                    className={
                                        dish.available
                                            ? 'status-badge completed'
                                            : 'status-badge danger'
                                    }
                                >
                                    {dish.available ? 'Đang bán' : 'Tạm hết'}
                                </span>
                            </span>

                            <span>
                                <button
                                    className={
                                        dish.available
                                            ? 'secondary-button'
                                            : 'primary-button'
                                    }
                                    onClick={() => void handleToggleDish(dish)}
                                >
                                    {dish.available ? 'Tạm hết' : 'Mở bán'}
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}