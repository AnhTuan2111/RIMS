import {
    ArrowLeft,
    ChefHat,
    Eye,
    FolderOpen,
    Pencil,
    Trash2,
    UtensilsCrossed,
} from 'lucide-react'

import React, {useCallback, useEffect, useState} from 'react'
import * as adminApi from '@/shared/api/admin'
import type {CategoryResponse, DishResponse, CategoryFormData} from '@/shared/api/admin'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {
    ConfirmDialog,
    PageCard,
    PageHeader,
    Pagination,
    StatCard,
} from '@/shared/components/ui'
import {getErrorMessage} from '@/shared/utils/error'
import {useToast} from '@/app/providers/useToast'

type ViewMode = 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL'
type FilterStatus = 'ALL' | 'ACTIVE' | 'HIDDEN'

// --- Pagination Config ---
const ITEMS_PER_PAGE = 5
const DISH_ITEMS_PER_PAGE = 5 // THÊM: config cho số món hiển thị mỗi trang

export default function AdminCategoryPage() {
    const {notify} = useToast()

    // --- States ---
    const [categories, setCategories] = useState<CategoryResponse[]>([])
    const [dishes, setDishes] = useState<DishResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const [view, setView] = useState<ViewMode>('LIST')
    const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(
        null,
    )
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
    const [searchTerm, setSearchTerm] = useState<string>('')

    // --- Pagination States ---
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [dishPage, setDishPage] = useState<number>(1) // THÊM: state cho phân trang món

    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        description: '',
        isAvailable: true,
    })

    const [deleteTarget, setDeleteTarget] = useState<{
        id: number
        name: string
        dishCount: number
    } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    // --- Load Data ---
    const loadCategories = useCallback(
        async (showFullLoading = true, resetPage = true, signal?: AbortSignal) => {
            try {
                if (showFullLoading) {
                    setLoading(true)
                }

                const [categoriesData, dishesData] = await Promise.all([
                    adminApi.getAllCategories(signal),
                    adminApi.getAllDishes(signal),
                ])

                const processedDishes = dishesData.data.map((dish) => ({
                    ...dish,
                    imageUrl: dish.imageUrl,
                }))

                setDishes(processedDishes)

                // dishCount do backend trả về. Bản cũ tự đếm bằng cách lọc danh
                // sách món theo TÊN danh mục — đổi tên danh mục là đếm sai, và
                // danh sách đó không chắc chứa món đang ẩn.
                const formattedData = [...categoriesData.data].sort((a, b) => a.id - b.id)

                setCategories(formattedData)
                setError(null)

                if (resetPage) {
                    setCurrentPage(1)
                    setDishPage(1) // Reset trang món khi load lại
                }
            } catch (err: unknown) {
                console.error('Lỗi khi tải dữ liệu:', err)
                setError('Không thể tải danh sách danh mục từ máy chủ.')
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
        void loadCategories(false, true, controller.signal)

        return () => controller.abort()
    }, [loadCategories])

    // --- CRUD Handlers ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        try {
            setIsSubmitting(true)

            if (view === 'CREATE') {
                await adminApi.createCategory({
                    name: formData.name.trim(),
                    description: formData.description,
                })
            } else if (view === 'EDIT' && selectedCategory) {
                await adminApi.updateCategory(selectedCategory.id, {
                    name: formData.name.trim(),
                    description: formData.description,
                    isAvailable: formData.isAvailable,
                })
            }

            setView('LIST')
            await loadCategories(true, true)
        } catch (err: unknown) {
            console.error('Lỗi API xử lý danh mục:', err)
            const errMsg = getErrorMessage(err, 'Đã xảy ra lỗi trong quá trình xử lý.')
            notify(errMsg, {tone: 'alert'})
        } finally {
            setIsSubmitting(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteTarget) {
            return
        }

        try {
            const res = await adminApi.deleteCategory(deleteTarget.id)
            setDeleteTarget(null)
            await loadCategories(true, true)

            // Backend mới là nơi quyết định xoá hay ẩn, nên lấy câu của nó
            // thay vì tự đoán — số món có thể đã đổi từ lúc màn này tải về.
            notify(res.data.message)
        } catch (err: unknown) {
            console.error('Lỗi khi xóa danh mục:', err)
            const errMsg = getErrorMessage(err, 'Không thể thực hiện xóa danh mục!')
            notify(errMsg, {tone: 'alert'})
            setDeleteTarget(null)
        }
    }

    // --- Filter Logic ---
    const filteredCategories = categories.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `cat-${String(item.id).padStart(3, '0')}`.includes(searchTerm.toLowerCase())
        if (filterStatus === 'ACTIVE') return matchesSearch && item.isAvailable
        if (filterStatus === 'HIDDEN') return matchesSearch && !item.isAvailable
        return matchesSearch
    })

    // --- Pagination Logic for Categories ---
    const totalItems = filteredCategories.length
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const currentItems = filteredCategories.slice(startIndex, endIndex)

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    // --- Pagination Logic for Dishes in Detail ---
    const categoryDishes = selectedCategory
        ? dishes.filter((d) => d.categoryName === selectedCategory.name)
        : []

    const totalDishItems = categoryDishes.length
    const totalDishPages = Math.max(1, Math.ceil(totalDishItems / DISH_ITEMS_PER_PAGE))
    const dishStartIndex = (dishPage - 1) * DISH_ITEMS_PER_PAGE
    const dishEndIndex = dishStartIndex + DISH_ITEMS_PER_PAGE
    const currentDishItems = categoryDishes.slice(dishStartIndex, dishEndIndex)

    const totalDishes = categories.reduce((sum, c) => sum + (c.dishCount || 0), 0)

    if (loading) {
        return (
            <LoadingState
                title="Đang tải dữ liệu danh mục thực đơn…"
                description="Hệ thống đang lấy danh sách danh mục và món ăn liên quan."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    loadCategories(true, true).catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    return (
        <div className="rk-stack">
            {view === 'LIST' && (
                <div>
                    {/* Header */}
                    <PageCard>
                        <PageHeader
                            title="Quản lý danh mục"
                            description="Quản lý nhóm món ăn, trạng thái hiển thị và số món thuộc từng danh mục."
                            actions={
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({
                                            name: '',
                                            description: '',
                                            isAvailable: true,
                                        })
                                        setView('CREATE')
                                    }}
                                    className="rk-btn rk-btn--primary"
                                >
                                    Thêm danh mục
                                </button>
                            }
                        />
                    </PageCard>

                    {/* Stats & Filters */}
                    <div className="rk-filterrow">
                        <PageCard>
                            <div className="rk-filterbar">
                                <div className="rk-field">
                                    <span className="rk-field__label">Trạng thái</span>
                                    <div className="rk-segment">
                                        <button
                                            onClick={() => {
                                                setFilterStatus('ALL')
                                                setCurrentPage(1)
                                            }}
                                            className={`rk-segment__btn${filterStatus === 'ALL' ? ' is-active' : ''}`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterStatus('ACTIVE')
                                                setCurrentPage(1)
                                            }}
                                            className={`rk-segment__btn${filterStatus === 'ACTIVE' ? ' is-active' : ''}`}
                                        >
                                            Hoạt động
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterStatus('HIDDEN')
                                                setCurrentPage(1)
                                            }}
                                            className={`rk-segment__btn${filterStatus === 'HIDDEN' ? ' is-active' : ''}`}
                                        >
                                            Đã ẩn
                                        </button>
                                    </div>
                                </div>
                                <div className="rk-field">
                                    <span className="rk-field__label">
                                        Tìm kiếm nhanh
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tên danh mục hoặc mã danh mục…"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="rk-input"
                                    />
                                </div>
                            </div>
                        </PageCard>

                        <StatCard
                            label="Tổng danh mục"
                            value={categories.length}
                            tone="brand"
                            icon={<FolderOpen className="rk-icon" aria-hidden="true" />}
                        />

                        <StatCard
                            label="Tổng món ăn"
                            value={totalDishes}
                            tone="busy"
                            icon={<ChefHat className="rk-icon" aria-hidden="true" />}
                        />
                    </div>

                    {/* Table */}
                    <div className="rk-tablewrap">
                        <table className="rk-table">
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Danh mục</th>
                                    <th scope="col" className="rk-th--num">
                                        Số món
                                    </th>
                                    <th scope="col">Trạng thái</th>
                                    <th scope="col">Ngày tạo</th>
                                    <th scope="col">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>{String(item.id).padStart(2, '0')}</td>
                                        <td>
                                            <div className="rk-media">
                                                <span className="rk-thumb">
                                                    <FolderOpen
                                                        className="rk-icon"
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                                <div>
                                                    <strong className="rk-rowlist__title">
                                                        {item.name}
                                                    </strong>
                                                    <div className="rk-rowlist__meta">
                                                        {item.description ||
                                                            'Không có mô tả'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="rk-tag">
                                                {item.dishCount || 0} món
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`rk-chip ${item.isAvailable ? 'rk-chip--ok' : 'rk-chip--idle'}`}
                                            >
                                                {item.isAvailable ? 'Hoạt động' : 'Đã ẩn'}
                                            </span>
                                        </td>
                                        <td>
                                            {item.createdAt
                                                ? new Date(
                                                      item.createdAt,
                                                  ).toLocaleDateString('vi-VN')
                                                : '---'}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(item)
                                                    setDishPage(1) // Reset dish page khi mở detail
                                                    setView('DETAIL')
                                                }}
                                                className="rk-iconbtn"
                                                title="Xem chi tiết"
                                            >
                                                <Eye
                                                    className="rk-icon"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(item)
                                                    setFormData({
                                                        name: item.name,
                                                        description: item.description,
                                                        isAvailable: item.isAvailable,
                                                    })
                                                    setView('EDIT')
                                                }}
                                                className="rk-iconbtn rk-iconbtn--brand"
                                                title="Chỉnh sửa"
                                            >
                                                <Pencil
                                                    className="rk-icon"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setDeleteTarget({
                                                        id: item.id,
                                                        name: item.name,
                                                        dishCount: item.dishCount || 0,
                                                    })
                                                }
                                                className="rk-iconbtn rk-iconbtn--danger"
                                                title="Xóa"
                                            >
                                                <Trash2
                                                    className="rk-icon"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredCategories.length === 0 && (
                            <EmptyState
                                title="Không tìm thấy danh mục phù hợp"
                                description="Hãy thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."
                                action={
                                    <button
                                        type="button"
                                        className="rk-btn rk-btn--quiet"
                                        onClick={() => {
                                            setSearchTerm('')
                                            setFilterStatus('ALL')
                                            setCurrentPage(1)
                                        }}
                                    >
                                        Xóa bộ lọc
                                    </button>
                                }
                            />
                        )}

                        {/* Pagination for Categories */}
                        {filteredCategories.length > 0 && (
                            <Pagination
                                page={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                pageSize={ITEMS_PER_PAGE}
                                onPageChange={goToPage}
                            />
                        )}
                    </div>
                </div>
            )}

            {view === 'DETAIL' && selectedCategory && (
                <div className="rk-stack">
                    <div className="rk-card__head-inline">
                        <div className="rk-media">
                            <button
                                type="button"
                                className="rk-iconbtn"
                                title="Quay lại danh sách"
                                onClick={() => setView('LIST')}
                            >
                                <ArrowLeft className="rk-icon" aria-hidden="true" />
                            </button>
                            <h3 className="rk-sectiontitle">Chi tiết danh mục</h3>
                        </div>
                        <div className="rk-actions">
                            <button
                                onClick={() => {
                                    setFormData({
                                        name: selectedCategory.name,
                                        description: selectedCategory.description,
                                        isAvailable: selectedCategory.isAvailable,
                                    })
                                    setView('EDIT')
                                }}
                                className="rk-btn rk-btn--quiet"
                            >
                                <Pencil className="rk-icon" aria-hidden="true" /> Sửa danh
                                mục
                            </button>
                            <button
                                onClick={() =>
                                    setDeleteTarget({
                                        id: selectedCategory.id,
                                        name: selectedCategory.name,
                                        dishCount: selectedCategory.dishCount || 0,
                                    })
                                }
                                className="rk-btn rk-btn--danger"
                            >
                                <Trash2 className="rk-icon" aria-hidden="true" /> Xóa danh
                                mục
                            </button>
                        </div>
                    </div>

                    <PageCard>
                        <dl className="rk-details">
                            <div className="rk-detailrow">
                                <dt className="rk-detailrow__label">Tên danh mục</dt>
                                <dd className="rk-detailrow__value">
                                    {selectedCategory.name}
                                </dd>
                            </div>

                            <div className="rk-detailrow">
                                <dt className="rk-detailrow__label">Mô tả</dt>
                                <dd className="rk-detailrow__value">
                                    {selectedCategory.description ||
                                        'Không có mô tả chi tiết cho danh mục này.'}
                                </dd>
                            </div>

                            <div className="rk-detailrow">
                                <dt className="rk-detailrow__label">Trạng thái</dt>
                                <dd className="rk-detailrow__value">
                                    <span
                                        className={`rk-chip ${selectedCategory.isAvailable ? 'rk-chip--ok' : 'rk-chip--idle'}`}
                                    >
                                        {selectedCategory.isAvailable
                                            ? 'Đang hoạt động'
                                            : 'Đang tạm ẩn'}
                                    </span>
                                </dd>
                            </div>

                            <div className="rk-detailrow">
                                <dt className="rk-detailrow__label">Số món liên kết</dt>
                                <dd className="rk-detailrow__value rk-num">
                                    {categoryDishes.length} món
                                </dd>
                            </div>

                            <div className="rk-detailrow">
                                <dt className="rk-detailrow__label">Ngày khởi tạo</dt>
                                <dd className="rk-detailrow__value">
                                    {selectedCategory.createdAt
                                        ? new Date(
                                              selectedCategory.createdAt,
                                          ).toLocaleString('vi-VN')
                                        : '—'}
                                </dd>
                            </div>

                            <div className="rk-detailrow">
                                <dt className="rk-detailrow__label">Cập nhật cuối</dt>
                                <dd className="rk-detailrow__value">
                                    {selectedCategory.updatedAt
                                        ? new Date(
                                              selectedCategory.updatedAt,
                                          ).toLocaleString('vi-VN')
                                        : '—'}
                                </dd>
                            </div>
                        </dl>
                    </PageCard>

                    <PageCard>
                        <div className="rk-card__head-inline">
                            <h4 className="rk-sectiontitle">
                                <UtensilsCrossed className="rk-icon" aria-hidden="true" />{' '}
                                Món trong danh mục ({categoryDishes.length})
                            </h4>
                        </div>

                        {categoryDishes.length > 0 ? (
                            <>
                                <div className="rk-tablewrap">
                                    <table className="rk-table rk-table--compact">
                                        <thead>
                                            <tr>
                                                <th scope="col">Tên món</th>
                                                <th scope="col" className="rk-th--num">
                                                    Giá
                                                </th>
                                                <th scope="col">Trạng thái</th>
                                                <th scope="col">Ngày tạo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentDishItems.map((dish) => (
                                                <tr key={dish.id}>
                                                    <td>
                                                        <div className="rk-media">
                                                            <span className="rk-thumb">
                                                                <img
                                                                    src={
                                                                        dish.imageUrl &&
                                                                        dish.imageUrl.startsWith(
                                                                            'http',
                                                                        )
                                                                            ? dish.imageUrl
                                                                            : `/image/${dish.imageUrl}`
                                                                    }
                                                                    alt={dish.name}
                                                                    onError={(e) => {
                                                                        ;(
                                                                            e.target as HTMLImageElement
                                                                        ).src =
                                                                            'https://placehold.co/40x40?text='
                                                                        ;(
                                                                            e.target as HTMLImageElement
                                                                        ).onerror = null
                                                                    }}
                                                                />
                                                            </span>
                                                            <div>
                                                                <strong className="rk-rowlist__title">
                                                                    {dish.name}
                                                                </strong>
                                                                {dish.description && (
                                                                    <div className="rk-rowlist__meta">
                                                                        {dish.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="rk-td--num">
                                                        {dish.price.toLocaleString(
                                                            'vi-VN',
                                                        )}
                                                        đ
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`rk-chip ${dish.isAvailable ? 'rk-chip--ok' : 'rk-chip--idle'}`}
                                                        >
                                                            {dish.isAvailable
                                                                ? 'Đang bán'
                                                                : 'Tạm dừng'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {dish.createdAt
                                                            ? new Date(
                                                                  dish.createdAt,
                                                              ).toLocaleDateString(
                                                                  'vi-VN',
                                                              )
                                                            : '---'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* THÊM: Pagination for Dishes */}
                                <Pagination
                                    page={dishPage}
                                    totalPages={totalDishPages}
                                    totalItems={totalDishItems}
                                    onPageChange={setDishPage}
                                />
                            </>
                        ) : (
                            <EmptyState
                                title="Chưa có món ăn nào trong danh mục này"
                                description="Danh mục hiện chưa liên kết với món ăn nào."
                            />
                        )}
                    </PageCard>
                </div>
            )}

            {(view === 'CREATE' || view === 'EDIT') && (
                <PageCard>
                    <div className="rk-card__head-inline">
                        <div className="rk-media">
                            <button
                                type="button"
                                className="rk-iconbtn"
                                title="Quay lại danh sách"
                                onClick={() => setView('LIST')}
                            >
                                <ArrowLeft className="rk-icon" aria-hidden="true" />
                            </button>

                            <h3 className="rk-sectiontitle">
                                {view === 'CREATE'
                                    ? 'Thêm danh mục mới'
                                    : 'Chỉnh sửa danh mục'}
                            </h3>
                        </div>
                    </div>

                    <form className="rk-fieldgroup" onSubmit={handleSave}>
                        <div className="rk-field">
                            <label className="rk-field__label">
                                Tên danh mục <span className="rk-field__required">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: Hải Sản, Món Nướng, Đồ Tráng Miệng…"
                                maxLength={50}
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({...formData, name: e.target.value})
                                }
                                className="rk-input"
                            />
                        </div>

                        <div className="rk-field">
                            <div className="rk-barrow__head">
                                <label className="rk-field__label">Mô tả chi tiết</label>
                                <span className="rk-field__hint">
                                    {formData.description.length}/100
                                </span>
                            </div>
                            <textarea
                                maxLength={100}
                                rows={4}
                                placeholder="Nhập tóm tắt thông tin mô tả về nhóm món ăn này…"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                className="rk-textarea"
                            />
                        </div>

                        {view === 'EDIT' && (
                            <div className="rk-switchrow">
                                <div>
                                    <strong className="rk-switchrow__label">
                                        Kích hoạt công khai
                                    </strong>
                                    <small className="rk-switchrow__desc">
                                        Hiển thị danh mục này trên menu trực tuyến hệ
                                        thống công khai
                                    </small>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.isAvailable}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            isAvailable: e.target.checked,
                                        })
                                    }
                                />
                            </div>
                        )}

                        <div className="rk-actions rk-actions--end">
                            <button
                                type="button"
                                onClick={() => setView('LIST')}
                                className="rk-btn rk-btn--quiet"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rk-btn rk-btn--primary"
                            >
                                {isSubmitting ? ' Đang lưu…' : 'Lưu dữ liệu'}
                            </button>
                        </div>
                    </form>
                </PageCard>
            )}

            {/*
                Danh mục rỗng thì xoá hẳn, còn món thì chỉ ẩn — món đã bán còn
                nằm trong hoá đơn và báo cáo doanh thu. Hộp thoại phải nói đúng
                việc nào sắp xảy ra, vì cùng một nút bấm cho hai kết quả.
            */}
            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title={deleteTarget?.dishCount ? 'Ẩn danh mục này?' : 'Xoá danh mục này?'}
                description={
                    deleteTarget
                        ? deleteTarget.dishCount
                            ? `Danh mục “${deleteTarget.name}” và ${deleteTarget.dishCount} món thuộc nó sẽ không còn hiện trong thực đơn. Dữ liệu vẫn giữ nguyên để báo cáo doanh thu không bị thiếu, và bật lại được bất cứ lúc nào.`
                            : `Danh mục “${deleteTarget.name}” chưa có món nào nên sẽ bị xoá khỏi hệ thống. Việc này không hoàn tác được.`
                        : undefined
                }
                confirmLabel={deleteTarget?.dishCount ? 'Ẩn danh mục' : 'Xoá vĩnh viễn'}
                destructive={!deleteTarget?.dishCount}
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
