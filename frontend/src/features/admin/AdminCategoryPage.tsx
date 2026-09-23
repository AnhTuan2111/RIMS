import {ChefHat, Eye, FolderOpen, Pencil, Trash2, UtensilsCrossed} from 'lucide-react'

import React, {useCallback, useEffect, useState} from 'react'
import * as adminApi from '@/shared/api/admin'
import type {CategoryResponse, DishResponse, CategoryFormData} from '@/shared/api/admin'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {ConfirmDialog, PageCard, PageHeader, Pagination} from '@/shared/components/ui'
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

                const formattedData = categoriesData.data
                    .map((cat) => ({
                        ...cat,
                        dishCount: processedDishes.filter(
                            (d) => d.categoryName === cat.name,
                        ).length,
                    }))
                    .sort((a, b) => a.id - b.id)

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
            await adminApi.deleteCategory(deleteTarget.id)
            setDeleteTarget(null)
            await loadCategories(true, true)
            notify(`Đã ẩn danh mục ${deleteTarget.name}.`)
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

    const goToDishPage = (page: number) => {
        if (page >= 1 && page <= totalDishPages) {
            setDishPage(page)
        }
    }

    const goToPreviousDishPage = () => goToDishPage(dishPage - 1)
    const goToNextDishPage = () => goToDishPage(dishPage + 1)

    const getDishPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisible = 5

        if (totalDishPages <= maxVisible) {
            for (let i = 1; i <= totalDishPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)

            if (dishPage > 3) {
                pages.push('...')
            }

            const start = Math.max(2, dishPage - 1)
            const end = Math.min(totalDishPages - 1, dishPage + 1)

            for (let i = start; i <= end; i++) {
                pages.push(i)
            }

            if (dishPage < totalDishPages - 2) {
                pages.push('...')
            }

            pages.push(totalDishPages)
        }

        return pages
    }

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
        <div className="admin-category-page">
            {view === 'LIST' && (
                <div>
                    {/* Header */}
                    <PageCard className="admin-category-header-card">
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
                                    <span>+</span> Thêm Danh Mục
                                </button>
                            }
                        />
                    </PageCard>

                    {/* Stats & Filters */}
                    <div className="admin-category-top-grid">
                        <div className="admin-category-card">
                            <div className="admin-category-filter-container">
                                <div className="admin-category-filter-section">
                                    <span className="admin-category-filter-label">
                                        Trạng thái
                                    </span>
                                    <div className="admin-category-filter-group">
                                        <button
                                            onClick={() => {
                                                setFilterStatus('ALL')
                                                setCurrentPage(1)
                                            }}
                                            className={`admin-category-filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterStatus('ACTIVE')
                                                setCurrentPage(1)
                                            }}
                                            className={`admin-category-filter-btn ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
                                        >
                                            Hoạt động
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFilterStatus('HIDDEN')
                                                setCurrentPage(1)
                                            }}
                                            className={`admin-category-filter-btn ${filterStatus === 'HIDDEN' ? 'active' : ''}`}
                                        >
                                            Đã ẩn
                                        </button>
                                    </div>
                                </div>
                                <div className="admin-category-search-section">
                                    <span className="admin-category-filter-label">
                                        TÌM KIẾM NHANH
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tên danh mục hoặc mã danh mục…"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                        className="admin-category-search-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="admin-category-card admin-category-stats-card admin-category-stats-categories">
                            <div className="admin-category-stats-inner">
                                <div>
                                    <span className="admin-category-stats-label">
                                        Tổng Danh mục
                                    </span>
                                    <h2 className="admin-category-stats-number">
                                        {categories.length}
                                    </h2>
                                </div>
                                <span className="admin-category-stats-icon">
                                    <FolderOpen className="rk-icon" aria-hidden="true" />
                                </span>
                            </div>
                        </div>

                        <div className="admin-category-card admin-category-stats-card admin-category-stats-dishes">
                            <div className="admin-category-stats-inner">
                                <div>
                                    <span className="admin-category-stats-label">
                                        Tổng Món ăn
                                    </span>
                                    <h2 className="admin-category-stats-number">
                                        {totalDishes}
                                    </h2>
                                </div>
                                <span className="admin-category-stats-icon">
                                    <ChefHat className="rk-icon" aria-hidden="true" />
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="admin-category-card admin-category-table-card">
                        <table className="admin-category-table">
                            <thead>
                                <tr className="admin-category-table-header">
                                    <th className="admin-category-col-id">ID</th>
                                    <th className="admin-category-col-name">
                                        Danh mục & MÔ TẢ
                                    </th>
                                    <th className="admin-category-col-count">SỐ MÓN</th>
                                    <th className="admin-category-col-status">
                                        Trạng thái
                                    </th>
                                    <th className="admin-category-col-date">Ngày tạo</th>
                                    <th className="admin-category-col-actions">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="admin-category-table-row"
                                    >
                                        <td className="admin-category-cell-id">
                                            {String(item.id).padStart(2, '0')}
                                        </td>
                                        <td className="admin-category-cell-name">
                                            <div className="admin-category-info">
                                                <div className="admin-category-icon">
                                                    <FolderOpen
                                                        className="rk-icon"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                                <div>
                                                    <strong className="admin-category-name">
                                                        {item.name}
                                                    </strong>
                                                    <div className="admin-category-description">
                                                        {item.description ||
                                                            'Không có mô tả'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="admin-category-cell-count">
                                            <span className="rk-tag">
                                                <span className="admin-category-count-number">
                                                    {item.dishCount || 0}
                                                </span>
                                                <span className="admin-category-count-label">
                                                    món
                                                </span>
                                            </span>
                                        </td>
                                        <td className="admin-category-cell-status">
                                            <span
                                                className={`rk-chip ${item.isAvailable ? 'rk-chip--ok' : 'rk-chip--idle'}`}
                                            >
                                                {item.isAvailable ? 'Hoạt động' : 'Đã ẩn'}
                                            </span>
                                        </td>
                                        <td className="admin-category-cell-date">
                                            {item.createdAt
                                                ? new Date(
                                                      item.createdAt,
                                                  ).toLocaleDateString('vi-VN')
                                                : '---'}
                                        </td>
                                        <td className="admin-category-cell-actions">
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(item)
                                                    setDishPage(1) // Reset dish page khi mở detail
                                                    setView('DETAIL')
                                                }}
                                                className="admin-category-action-btn"
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
                                                className="admin-category-action-btn admin-category-edit-btn"
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
                                                    })
                                                }
                                                className="admin-category-action-btn admin-category-delete-btn"
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
                <div className="admin-category-detail-view">
                    <div className="admin-category-detail-header">
                        <div className="admin-category-detail-header-left">
                            <button
                                onClick={() => setView('LIST')}
                                className="admin-category-back-btn"
                            >
                                &larr;
                            </button>
                            <h3 className="admin-category-detail-title">
                                CHI TIẾT Danh mục
                            </h3>
                        </div>
                        <div className="admin-category-detail-header-right">
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
                                    })
                                }
                                className="rk-btn rk-btn--danger"
                            >
                                <Trash2 className="rk-icon" aria-hidden="true" /> Xóa danh
                                mục
                            </button>
                        </div>
                    </div>

                    <div className="admin-category-detail-grid">
                        <div className="admin-category-card">
                            <span className="admin-category-input-label">
                                TÊN Danh mục
                            </span>
                            <p className="admin-category-detail-name">
                                {selectedCategory.name}
                            </p>

                            <span className="admin-category-input-label">
                                MÔ TẢ Danh mục
                            </span>
                            <p className="admin-category-detail-description">
                                {selectedCategory.description ||
                                    'Không có mô tả chi tiết cho danh mục này.'}
                            </p>

                            <div className="admin-category-detail-metrics">
                                <div>
                                    <span className="admin-category-input-label">
                                        Trạng thái HIỂN THỊ
                                    </span>
                                    <span
                                        className={`admin-category-detail-status ${selectedCategory.isAvailable ? 'active' : 'hidden'}`}
                                    >
                                        {selectedCategory.isAvailable
                                            ? 'Đang hoạt động'
                                            : 'Đang tạm ẩn'}
                                    </span>
                                </div>
                                <div>
                                    <span className="admin-category-input-label">
                                        SỐ MÓN LIÊN KẾT
                                    </span>
                                    <span className="admin-category-detail-dish-count">
                                        {categoryDishes.length} món ăn
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="admin-category-detail-meta">
                            <div className="admin-category-card admin-category-meta-card">
                                <span className="admin-category-input-label">
                                    NGÀY KHỞI TẠO
                                </span>
                                <p className="admin-category-meta-value">
                                    {selectedCategory.createdAt
                                        ? new Date(
                                              selectedCategory.createdAt,
                                          ).toLocaleString('vi-VN')
                                        : '---'}
                                </p>
                            </div>
                            <div className="admin-category-card admin-category-meta-card">
                                <span className="admin-category-input-label">
                                    Cập nhật cuối
                                </span>
                                <p className="admin-category-meta-value">
                                    {selectedCategory.updatedAt
                                        ? new Date(
                                              selectedCategory.updatedAt,
                                          ).toLocaleString('vi-VN')
                                        : '---'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="admin-category-card">
                        <div className="admin-category-dish-list-header">
                            <h4 className="admin-category-dish-list-title">
                                <UtensilsCrossed className="rk-icon" aria-hidden="true" />{' '}
                                DANH SÁCH MÓN TRONG Danh mục ({categoryDishes.length} món)
                            </h4>
                        </div>

                        {categoryDishes.length > 0 ? (
                            <>
                                <div className="admin-category-dish-table-wrapper">
                                    <table className="admin-category-dish-table">
                                        <thead>
                                            <tr className="admin-category-table-header">
                                                <th className="admin-category-dish-col-name">
                                                    Tên món
                                                </th>
                                                <th className="admin-category-dish-col-price">
                                                    Giá (VNĐ)
                                                </th>
                                                <th className="admin-category-dish-col-status">
                                                    Trạng thái
                                                </th>
                                                <th className="admin-category-dish-col-date">
                                                    Ngày tạo
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentDishItems.map((dish) => (
                                                <tr
                                                    key={dish.id}
                                                    className="admin-category-table-row admin-category-dish-row"
                                                >
                                                    <td className="admin-category-dish-cell-name">
                                                        <div className="admin-category-dish-info">
                                                            <div className="admin-category-dish-image">
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
                                                            </div>
                                                            <div>
                                                                <strong className="admin-category-dish-name">
                                                                    {dish.name}
                                                                </strong>
                                                                {dish.description && (
                                                                    <div className="admin-category-dish-description-short">
                                                                        {dish.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="admin-category-dish-cell-price">
                                                        {dish.price.toLocaleString(
                                                            'vi-VN',
                                                        )}
                                                        đ
                                                    </td>
                                                    <td className="admin-category-dish-cell-status">
                                                        <span
                                                            className={`rk-chip ${dish.isAvailable ? 'rk-chip--ok' : 'rk-chip--idle'}`}
                                                        >
                                                            {dish.isAvailable
                                                                ? 'Đang bán'
                                                                : 'Tạm dừng'}
                                                        </span>
                                                    </td>
                                                    <td className="admin-category-dish-cell-date">
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
                                {categoryDishes.length > DISH_ITEMS_PER_PAGE && (
                                    <div className="admin-category-pagination admin-category-dish-pagination">
                                        <div className="admin-category-pagination-info">
                                            <span className="admin-category-pagination-current-page">
                                                Trang {dishPage} / {totalDishPages}
                                            </span>
                                        </div>
                                        <div className="admin-category-pagination-controls">
                                            <button
                                                onClick={goToPreviousDishPage}
                                                disabled={dishPage === 1}
                                                className="admin-category-pagination-btn"
                                            >
                                                ◀
                                            </button>
                                            {getDishPageNumbers().map((page, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() =>
                                                        typeof page === 'number' &&
                                                        goToDishPage(page)
                                                    }
                                                    className={`admin-category-pagination-btn ${dishPage === page ? 'active' : ''} ${typeof page === 'string' ? 'dots' : ''}`}
                                                    disabled={typeof page === 'string'}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={goToNextDishPage}
                                                disabled={dishPage === totalDishPages}
                                                className="admin-category-pagination-btn"
                                            >
                                                ▶
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <EmptyState
                                title="Chưa có món ăn nào trong danh mục này"
                                description="Danh mục hiện chưa liên kết với món ăn nào."
                            />
                        )}
                    </div>
                </div>
            )}

            {(view === 'CREATE' || view === 'EDIT') && (
                <div className="admin-category-form-view">
                    <div className="admin-category-form-header">
                        <button
                            onClick={() => setView('LIST')}
                            className="admin-category-back-btn"
                        >
                            &larr;
                        </button>
                        <h3 className="admin-category-form-title">
                            {view === 'CREATE'
                                ? 'THÊM Danh mục MỚI'
                                : 'CHỈNH SỬA Danh mục'}
                        </h3>
                    </div>

                    <form onSubmit={handleSave} className="admin-category-form-card">
                        <div className="admin-category-form-group">
                            <label className="admin-category-input-label">
                                TÊN Danh mục{' '}
                                <span className="admin-category-required">*</span>
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
                                className="admin-category-input-field"
                            />
                        </div>

                        <div className="admin-category-form-group">
                            <div className="admin-category-textarea-header">
                                <label className="admin-category-input-label">
                                    Mô tả chi tiết
                                </label>
                                <span className="admin-category-char-count">
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
                                className="admin-category-textarea-field"
                            />
                        </div>

                        {view === 'EDIT' && (
                            <div className="admin-category-toggle-row">
                                <div>
                                    <strong className="admin-category-toggle-label">
                                        Kích hoạt công khai
                                    </strong>
                                    <small className="admin-category-toggle-description">
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
                                    className="admin-category-toggle-checkbox"
                                />
                            </div>
                        )}

                        <div className="admin-category-form-actions">
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
                </div>
            )}

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Ẩn danh mục này?"
                description={
                    deleteTarget
                        ? `Danh mục “${deleteTarget.name}” sẽ không còn hiện trong thực đơn. Dữ liệu cũ vẫn giữ nguyên, nhưng hệ thống sẽ chặn nếu còn món ăn đang thuộc danh mục này.`
                        : undefined
                }
                confirmLabel="Ẩn danh mục"
                destructive
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
