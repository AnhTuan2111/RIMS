import {ArrowLeft} from 'lucide-react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {Link, useSearchParams} from 'react-router-dom'

import {getChefDishes, updateMenuStatus, type DishListResponse} from '@/shared/api/chef'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {PageCard, PageHeader, Pagination} from '@/shared/components/ui'
import {useKitchenSocket} from '@/realtime'
import {useToast} from '@/app/providers/useToast'
import {ConfirmDialog} from '@/shared/components/ui'

const ITEMS_PER_PAGE = 8

type StatusFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'

type SortOrder = 'NAME_ASC' | 'NAME_DESC' | 'PRICE_ASC' | 'PRICE_DESC'

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value)
}

export default function DishListPage() {
    const {notify} = useToast()

    const [searchParams] = useSearchParams()

    const routeStatus = searchParams.get('status')

    const initialStatus: StatusFilter =
        routeStatus === 'unavailable' ? 'UNAVAILABLE' : 'ALL'

    const [dishes, setDishes] = useState<DishListResponse[]>([])

    const [isLoading, setIsLoading] = useState(true)

    const [error, setError] = useState<string | null>(null)

    const [searchText, setSearchText] = useState('')

    const [selectedCategory, setSelectedCategory] = useState('ALL')

    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(initialStatus)

    const [sortOrder, setSortOrder] = useState<SortOrder>('NAME_ASC')

    const [currentPage, setCurrentPage] = useState(1)

    const [updatingDishId, setUpdatingDishId] = useState<number | null>(null)

    // Món đang chờ xác nhận đặt tạm hết.
    const [pendingUnavailable, setPendingUnavailable] = useState<DishListResponse | null>(
        null,
    )

    const loadDishes = useCallback(
        async (showFullLoading: boolean, resetPage: boolean, signal?: AbortSignal) => {
            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                const data = await getChefDishes(signal)

                setDishes(data)
                setError(null)

                if (resetPage) {
                    setCurrentPage(1)
                }
            } catch (requestError) {
                if (signal?.aborted) {
                    return
                }

                console.error('[CHEF_DISH_LIST_FETCH_ERROR]', requestError)

                setError('Không thể tải danh sách món ăn.')
            } finally {
                if (showFullLoading) {
                    setIsLoading(false)
                }
            }
        },
        [],
    )

    // Initial load on mount
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadDishes(true, false)
        }, 0)

        return () => window.clearTimeout(timer)
    }, [loadDishes])

    // WebSocket: refresh when backend broadcasts a kitchen update
    useKitchenSocket(() => void loadDishes(false, false))

    async function handleToggleDish(dish: DishListResponse) {
        // Đặt món thành tạm hết sẽ HUỶ các món đang chờ trong bếp — việc phá
        // huỷ và không hoàn tác được, nên vẫn hỏi lại. Bật lại bán thì không
        // ảnh hưởng gì nên làm thẳng.
        if (dish.available) {
            setPendingUnavailable(dish)
            return
        }

        await applyToggle(dish, true)
    }

    async function applyToggle(dish: DishListResponse, nextAvailable: boolean) {
        try {
            setUpdatingDishId(dish.dishId)

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
        } catch (requestError) {
            console.error(requestError)

            notify('Không thể cập nhật trạng thái món.', {tone: 'alert'})
        } finally {
            setUpdatingDishId(null)
        }
    }

    function clearFilters() {
        setSearchText('')
        setSelectedCategory('ALL')
        setSelectedStatus('ALL')
        setSortOrder('NAME_ASC')
        setCurrentPage(1)
    }

    const availableCount = useMemo(() => {
        return dishes.filter((dishItem) => dishItem.available).length
    }, [dishes])

    const unavailableCount = useMemo(() => {
        return dishes.filter((dishItem) => !dishItem.available).length
    }, [dishes])

    const categories = useMemo(() => {
        return Array.from(
            new Set(dishes.map((dishItem) => dishItem.category).filter(Boolean)),
        ).sort((firstCategory, secondCategory) =>
            firstCategory.localeCompare(secondCategory, 'vi'),
        )
    }, [dishes])

    const filteredDishes = useMemo(() => {
        const keyword = searchText.trim().toLowerCase()

        return [...dishes]
            .filter((dishItem) => {
                const matchesSearch =
                    keyword === '' ||
                    dishItem.dishName.toLowerCase().includes(keyword) ||
                    dishItem.category.toLowerCase().includes(keyword) ||
                    String(dishItem.dishId).includes(keyword)

                const matchesCategory =
                    selectedCategory === 'ALL' || dishItem.category === selectedCategory

                const matchesStatus =
                    selectedStatus === 'ALL' ||
                    (selectedStatus === 'AVAILABLE' && dishItem.available) ||
                    (selectedStatus === 'UNAVAILABLE' && !dishItem.available)

                return matchesSearch && matchesCategory && matchesStatus
            })
            .sort((firstDish, secondDish) => {
                switch (sortOrder) {
                    case 'NAME_DESC':
                        return secondDish.dishName.localeCompare(firstDish.dishName, 'vi')

                    case 'PRICE_ASC':
                        return firstDish.price - secondDish.price

                    case 'PRICE_DESC':
                        return secondDish.price - firstDish.price

                    case 'NAME_ASC':
                    default:
                        return firstDish.dishName.localeCompare(secondDish.dishName, 'vi')
                }
            })
    }, [dishes, searchText, selectedCategory, selectedStatus, sortOrder])

    const totalPages = Math.max(1, Math.ceil(filteredDishes.length / ITEMS_PER_PAGE))

    const safeCurrentPage = Math.min(currentPage, totalPages)

    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE

    const paginatedDishes = filteredDishes.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    const showUnavailableOnly = selectedStatus === 'UNAVAILABLE'

    if (isLoading) {
        return (
            <LoadingState
                title="Đang tải danh sách món ăn…"
                description="Hệ thống đang lấy dữ liệu thực đơn mới nhất."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    loadDishes(true, true).catch((requestError) => {
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
                    title={showUnavailableOnly ? 'Món đang tạm hết' : 'Quản lý món ăn'}
                    description="Tìm kiếm, lọc và thay đổi trạng thái phục vụ của thực đơn."
                    actions={
                        <div className="rk-statrow">
                            <div>
                                <strong>{availableCount}</strong>

                                <span>Đang bán</span>
                            </div>

                            <div>
                                <strong>{unavailableCount}</strong>

                                <span>Tạm hết</span>
                            </div>

                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet"
                                onClick={() => {
                                    loadDishes(true, true).catch((requestError) => {
                                        console.error(requestError)
                                    })
                                }}
                            >
                                Làm mới
                            </button>
                        </div>
                    }
                />

                {routeStatus === 'unavailable' && (
                    <Link className="rk-btn rk-btn--quiet" to="/chef/dishes">
                        <ArrowLeft className="rk-icon" aria-hidden="true" /> Xem tất cả
                        món
                    </Link>
                )}
            </PageCard>

            <PageCard>
                <div className="rk-filterbar">
                    <input
                        type="search"
                        value={searchText}
                        placeholder="Tìm theo tên món, danh mục hoặc mã món…"
                        onChange={(event) => {
                            setSearchText(event.target.value)
                            setCurrentPage(1)
                        }}
                    />

                    <select
                        value={selectedCategory}
                        onChange={(event) => {
                            setSelectedCategory(event.target.value)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="ALL">Tất cả danh mục</option>

                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(event) => {
                            setSelectedStatus(event.target.value as StatusFilter)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="ALL">Tất cả trạng thái</option>

                        <option value="AVAILABLE">Đang bán</option>

                        <option value="UNAVAILABLE">Tạm hết</option>
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(event) => {
                            setSortOrder(event.target.value as SortOrder)
                            setCurrentPage(1)
                        }}
                    >
                        <option value="NAME_ASC">Tên A → Z</option>

                        <option value="NAME_DESC">Tên Z → A</option>

                        <option value="PRICE_ASC">Giá thấp → cao</option>

                        <option value="PRICE_DESC">Giá cao → thấp</option>
                    </select>

                    <button
                        type="button"
                        className="rk-btn rk-btn--quiet"
                        onClick={clearFilters}
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </PageCard>

            {filteredDishes.length === 0 ? (
                <EmptyState
                    title="Không tìm thấy món phù hợp"
                    description="Hãy thay đổi điều kiện lọc hoặc xóa bộ lọc."
                    action={
                        <button
                            type="button"
                            className="rk-btn rk-btn--quiet"
                            onClick={clearFilters}
                        >
                            Xóa bộ lọc
                        </button>
                    }
                />
            ) : (
                <>
                    <PageCard>
                        <div className="rk-tablewrap">
                            <table className="rk-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Tên món</th>
                                        <th scope="col">Danh mục</th>
                                        <th scope="col" className="rk-th--num">
                                            Giá bán
                                        </th>
                                        <th scope="col">Trạng thái</th>
                                        <th scope="col">Thao tác</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedDishes.map((dishItem) => (
                                        <tr key={dishItem.dishId}>
                                            <td>
                                                <strong>{dishItem.dishName}</strong>
                                            </td>

                                            <td>
                                                <span className="rk-tag">
                                                    {dishItem.category}
                                                </span>
                                            </td>

                                            <td className="rk-td--num">
                                                {formatCurrency(dishItem.price)}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        dishItem.available
                                                            ? 'rk-chip rk-chip--ok'
                                                            : 'rk-chip rk-chip--alert'
                                                    }
                                                >
                                                    {dishItem.available
                                                        ? 'Đang bán'
                                                        : 'Tạm hết'}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        updatingDishId === dishItem.dishId
                                                    }
                                                    className={
                                                        dishItem.available
                                                            ? 'rk-btn rk-btn--quiet'
                                                            : 'rk-btn rk-btn--primary'
                                                    }
                                                    onClick={() => {
                                                        handleToggleDish(dishItem).catch(
                                                            (requestError) => {
                                                                console.error(
                                                                    requestError,
                                                                )
                                                            },
                                                        )
                                                    }}
                                                >
                                                    {updatingDishId === dishItem.dishId
                                                        ? 'Đang cập nhật…'
                                                        : dishItem.available
                                                          ? 'Tạm hết'
                                                          : 'Mở bán'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </PageCard>

                    <Pagination
                        page={safeCurrentPage}
                        totalPages={totalPages}
                        totalItems={filteredDishes.length}
                        pageSize={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}

            <ConfirmDialog
                open={pendingUnavailable !== null}
                title={`Đặt "${pendingUnavailable?.dishName ?? ''}" thành tạm hết?`}
                description="Các món này đang chờ trong bếp sẽ bị huỷ. Không hoàn tác được."
                confirmLabel="Đặt tạm hết"
                destructive
                busy={updatingDishId !== null}
                onConfirm={() => {
                    const dish = pendingUnavailable
                    setPendingUnavailable(null)
                    if (dish) {
                        void applyToggle(dish, false)
                    }
                }}
                onCancel={() => setPendingUnavailable(null)}
            />
        </div>
    )
}
