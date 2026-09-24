import {Eye, Image, Pencil, Trash2, Utensils} from 'lucide-react'

import {useCallback, useEffect, useState, type FormEvent} from 'react'
import * as adminApi from '@/shared/api/admin'
import type {DishResponse, CategoryResponse, DishFormData} from '@/shared/api/admin'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {
    ConfirmDialog,
    Modal,
    PageCard,
    PageHeader,
    Pagination,
    StatCard,
} from '@/shared/components/ui'
import {useWaiterSocket} from '@/realtime'
import {getErrorMessage} from '@/shared/utils/error'
import {useToast} from '@/app/providers/useToast'

type ModalType = 'NONE' | 'CREATE' | 'VIEW' | 'EDIT' | 'DELETE'

// --- Pagination Config ---
const ITEMS_PER_PAGE = 5

export default function AdminDishesPage() {
    const {notify} = useToast()

    // --- States ---
    const [dishes, setDishes] = useState<DishResponse[]>([])
    const [categories, setCategories] = useState<CategoryResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [searchKeyword, setSearchKeyword] = useState<string>('')
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

    // --- Pagination States ---
    const [currentPage, setCurrentPage] = useState<number>(1)

    // Modal states
    const [activeModal, setActiveModal] = useState<ModalType>('NONE')
    const [selectedDish, setSelectedDish] = useState<DishResponse | null>(null)

    // Form data
    const [formData, setFormData] = useState<DishFormData>({
        name: '',
        categoryId: '',
        price: 0,
        description: '',
        imageUrl: '',
        isHidden: false,
    })

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    // --- Load Data ---
    const loadAllData = useCallback(
        async (signal?: AbortSignal, showFullLoading = true, resetPage = true) => {
            try {
                if (showFullLoading) {
                    setLoading(true)
                }

                const [dishRes, catRes] = await Promise.all([
                    adminApi.getAllDishes(signal),
                    adminApi.getAllCategories(signal),
                ])

                setDishes(dishRes.data)
                setCategories(catRes.data)
                setError(null)

                if (resetPage) {
                    setCurrentPage(1)
                }
            } catch (requestError: unknown) {
                console.error('[ADMIN_DISHES_FETCH_ERROR]', requestError)
                setError('Không thể tải danh sách món ăn từ hệ thống.')
            } finally {
                if (showFullLoading) {
                    setLoading(false)
                }
            }
        },
        [],
    )

    useEffect(() => {
        const controller = new AbortController()

        queueMicrotask(() => {
            void loadAllData(controller.signal, true, true)
        })

        return () => controller.abort()
    }, [loadAllData])

    // WebSocket: silently refresh dish list when any menu-visibility
    // change is broadcast (Admin ẩn/hiện món, hoặc Chef đổi hết hàng).
    // /topic/waiter đã cho phép role ADMIN subscribe từ trước, không cần sửa backend.
    useWaiterSocket(
        () => void loadAllData(undefined, false, false),
        () => {},
    )

    // --- CRUD Handlers ---
    const handleCreateDish = async (e: FormEvent) => {
        e.preventDefault()

        const catIdParsed = parseInt(formData.categoryId)
        if (isNaN(catIdParsed) || catIdParsed <= 0) {
            notify('Lỗi: Vui lòng lựa chọn một Danh mục món ăn hợp lệ!', {tone: 'alert'})
            return
        }

        const targetCategory = categories.find((c) => c.id === catIdParsed)
        if (targetCategory && !targetCategory.isAvailable) {
            notify(
                `Lỗi: Danh mục "${targetCategory.name}" đang bị ẩn, không thể thêm món ăn mới vào đây!`,
                {tone: 'alert'},
            )
            return
        }

        if (formData.imageUrl && formData.imageUrl.length > 500) {
            notify('Lỗi: Đường dẫn hình ảnh quá dài (tối đa 500 ký tự)!', {tone: 'alert'})
            return
        }

        try {
            setIsSubmitting(true)
            await adminApi.createDish({
                name: formData.name.trim(),
                description: formData.description,
                price: formData.price,
                imageUrl: formData.imageUrl,
                categoryId: catIdParsed,
                isHidden: formData.isHidden,
            })
            setActiveModal('NONE')
            await loadAllData(undefined, true, true)
        } catch (err: unknown) {
            const errMsg = getErrorMessage(err, 'Lỗi khi thêm món ăn mới!')
            notify(errMsg, {tone: 'alert'})
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateDish = async (e: FormEvent) => {
        e.preventDefault()
        if (!selectedDish || isSubmitting) return

        const catIdParsed = parseInt(formData.categoryId)
        if (isNaN(catIdParsed) || catIdParsed <= 0) {
            notify('Lỗi: Vui lòng lựa chọn một Danh mục món ăn hợp lệ!', {tone: 'alert'})
            return
        }

        const targetCategory = categories.find((c) => c.id === catIdParsed)
        if (targetCategory && !targetCategory.isAvailable) {
            notify(
                `Lỗi: Danh mục "${targetCategory.name}" đang bị ẩn, không thể lưu hoặc chuyển món ăn tới danh mục này!`,
                {tone: 'alert'},
            )
            return
        }

        if (formData.imageUrl && formData.imageUrl.length > 500) {
            notify('Lỗi: Đường dẫn hình ảnh quá dài (tối đa 500 ký tự)!', {tone: 'alert'})
            return
        }
        try {
            setIsSubmitting(true)
            await adminApi.updateDish(selectedDish.id, {
                name: formData.name.trim(),
                description: formData.description,
                price: formData.price,
                imageUrl: formData.imageUrl,
                categoryId: catIdParsed,
                isAvailable: selectedDish.isAvailable, // giữ nguyên — Chef sở hữu field này
                isHidden: formData.isHidden,
            })
            setActiveModal('NONE')
            await loadAllData(undefined, true, true)
        } catch (err: unknown) {
            const errMsg = getErrorMessage(err, 'Lỗi khi cập nhật món ăn!')
            notify(errMsg, {tone: 'alert'})
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteDish = async () => {
        if (!selectedDish) return
        try {
            await adminApi.deleteDish(selectedDish.id)
            setActiveModal('NONE')
            await loadAllData(undefined, true, true)
        } catch (err: unknown) {
            const errMsg = getErrorMessage(err, 'Lỗi khi xóa món ăn!')
            notify(errMsg, {tone: 'alert'})
        }
    }

    const openFormWithDish = (dish: DishResponse, modalType: 'VIEW' | 'EDIT') => {
        setSelectedDish(dish)
        const foundCategory = categories.find((c) => c.name === dish.categoryName)

        setFormData({
            name: dish.name,
            categoryId: foundCategory ? foundCategory.id.toString() : '',
            price: dish.price,
            description: dish.description || '',
            imageUrl: dish.imageUrl || '',
            isHidden: dish.isHidden,
        })
        setActiveModal(modalType)
    }

    // --- Filter Logic ---
    const filteredDishes = dishes.filter((dish) => {
        const matchesKeyword =
            dish.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            `#ID-${String(dish.id).padStart(2, '0')}`.includes(
                searchKeyword.toLowerCase(),
            )
        const matchesCategory =
            selectedCategory === 'ALL' || dish.categoryName === selectedCategory
        const matchesStatus =
            selectedStatus === 'ALL' ||
            (selectedStatus === 'VISIBLE' && !dish.isHidden) ||
            (selectedStatus === 'HIDDEN' && dish.isHidden)

        return matchesKeyword && matchesCategory && matchesStatus
    })

    // --- Pagination Logic ---
    const totalItems = filteredDishes.length
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const currentItems = filteredDishes.slice(startIndex, endIndex)

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const activeCategories = categories.filter((c) => c.isAvailable)

    if (loading) {
        return (
            <LoadingState
                title="Đang tải danh sách món ăn hệ thống…"
                description="Hệ thống đang lấy dữ liệu món ăn và danh mục mới nhất."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    loadAllData(undefined, true, true).catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    return (
        <div className="rk-stack">
            {/* Header */}
            <PageCard>
                <PageHeader
                    title="Quản lý món ăn"
                    description="Tìm kiếm, thêm, chỉnh sửa và quản lý trạng thái món ăn trong thực đơn."
                    actions={
                        <button
                            type="button"
                            onClick={() => {
                                setFormData({
                                    name: '',
                                    categoryId: activeCategories[0]?.id.toString() || '',
                                    price: 0,
                                    description: '',
                                    imageUrl: '',
                                    isHidden: false,
                                })
                                setActiveModal('CREATE')
                            }}
                            className="rk-btn rk-btn--primary"
                        >
                            <span>+</span> Thêm Món Ăn
                        </button>
                    }
                />
            </PageCard>

            {/* Filters */}
            <div className="rk-filterrow">
                <PageCard>
                    <div className="rk-filterbar">
                        <input
                            type="text"
                            placeholder="Tìm theo tên món hoặc mã món…"
                            value={searchKeyword}
                            onChange={(e) => {
                                setSearchKeyword(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="rk-input"
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="rk-select"
                        >
                            <option value="ALL">Tất cả danh mục</option>
                            {categories.map((cat) => {
                                const displayName =
                                    cat.name.length > 25
                                        ? cat.name.slice(0, 25) + '...'
                                        : cat.name
                                return (
                                    <option key={cat.id} value={cat.name}>
                                        {displayName}{' '}
                                        {!cat.isAvailable ? '(Đang ẩn)' : ''}
                                    </option>
                                )
                            })}
                        </select>
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="rk-select"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="VISIBLE">Đang hiển thị</option>
                            <option value="HIDDEN">Đã ẩn</option>
                        </select>
                    </div>
                </PageCard>

                <StatCard
                    label="Món tìm thấy"
                    value={filteredDishes.length}
                    tone="brand"
                    icon={<Utensils className="rk-icon" aria-hidden="true" />}
                />
            </div>

            {/* Table */}
            <div className="rk-tablewrap">
                <table className="rk-table">
                    <thead>
                        <tr>
                            <th scope="col">Hình ảnh</th>
                            <th scope="col">Tên món ăn</th>
                            <th scope="col">Danh mục</th>
                            <th scope="col" className="rk-th--num">
                                Giá niêm yết
                            </th>
                            <th scope="col">Trạng thái</th>
                            <th scope="col">Ngày tạo</th>
                            <th scope="col">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((dish) => {
                            const isParentCategoryHidden =
                                categories.find((c) => c.name === dish.categoryName)
                                    ?.isAvailable === false

                            return (
                                <tr key={dish.id}>
                                    <td>
                                        <span className="rk-thumb">
                                            <img
                                                src={
                                                    dish.imageUrl.startsWith('http')
                                                        ? dish.imageUrl
                                                        : `/image/${dish.imageUrl}`
                                                }
                                                alt={dish.name}
                                                onError={(e) => {
                                                    ;(e.target as HTMLImageElement).src =
                                                        'https://placehold.co/48x48?text='
                                                }}
                                            />
                                        </span>
                                    </td>
                                    <td>
                                        <div className="rk-rowlist__title">
                                            {dish.name}
                                        </div>
                                        <small className="rk-rowlist__meta">
                                            ID-{String(dish.id).padStart(2, '0')}
                                        </small>
                                    </td>
                                    <td>
                                        <span
                                            className={`rk-tag${isParentCategoryHidden ? ' rk-tag--muted' : ''}`}
                                        >
                                            {dish.categoryName}{' '}
                                            {isParentCategoryHidden ? '(Ẩn)' : ''}
                                        </span>
                                    </td>
                                    <td className="rk-td--num">
                                        {dish.price.toLocaleString('vi-VN')}đ
                                    </td>
                                    <td>
                                        <span
                                            className={`rk-chip ${dish.isHidden ? 'rk-chip--idle' : 'rk-chip--ok'}`}
                                        >
                                            {dish.isHidden
                                                ? 'Đã ẩn khỏi thực đơn'
                                                : 'Đang hiển thị'}
                                        </span>
                                    </td>
                                    <td>
                                        {new Date(dish.createdAt).toLocaleDateString(
                                            'vi-VN',
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => openFormWithDish(dish, 'VIEW')}
                                            className="rk-iconbtn"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="rk-icon" aria-hidden="true" />
                                        </button>
                                        <button
                                            onClick={() => openFormWithDish(dish, 'EDIT')}
                                            className="rk-iconbtn rk-iconbtn--brand"
                                            title="Chỉnh sửa"
                                        >
                                            <Pencil
                                                className="rk-icon"
                                                aria-hidden="true"
                                            />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedDish(dish)
                                                setActiveModal('DELETE')
                                            }}
                                            className="rk-iconbtn rk-iconbtn--danger"
                                            title="Xóa món"
                                        >
                                            <Trash2
                                                className="rk-icon"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {filteredDishes.length === 0 && (
                    <EmptyState
                        title="Không tìm thấy món ăn phù hợp"
                        description="Hãy thay đổi từ khóa, danh mục hoặc trạng thái để tìm món ăn."
                        action={
                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet"
                                onClick={() => {
                                    setSearchKeyword('')
                                    setSelectedCategory('ALL')
                                    setSelectedStatus('ALL')
                                    setCurrentPage(1)
                                }}
                            >
                                Xóa bộ lọc
                            </button>
                        }
                    />
                )}

                {/* Pagination */}
                {filteredDishes.length > 0 && (
                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={ITEMS_PER_PAGE}
                        onPageChange={goToPage}
                    />
                )}
            </div>

            {/* ========================================================= */}
            {/* CREATE MODAL */}
            {/* ========================================================= */}
            {activeModal === 'CREATE' && (
                <Modal
                    open
                    title="Thêm món ăn mới"
                    size="lg"
                    onClose={() => setActiveModal('NONE')}
                >
                    <form onSubmit={handleCreateDish} className="rk-modal__split">
                        <div>
                            <div className="rk-fieldgroup">
                                <div>
                                    <label className="rk-field__label">
                                        Tên món ăn *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Phở Bò Tái Lăn"
                                        maxLength={50}
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="rk-input"
                                    />
                                </div>

                                <div className="rk-formgrid">
                                    <div>
                                        <label className="rk-field__label">
                                            Danh mục thực đơn
                                        </label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    categoryId: e.target.value,
                                                })
                                            }
                                            className="rk-select"
                                        >
                                            {activeCategories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        {activeCategories.length === 0 && (
                                            <small className="rk-formerror">
                                                Không có danh mục khả dụng!
                                            </small>
                                        )}
                                    </div>
                                    <div>
                                        <label className="rk-field__label">
                                            Giá bán (VNĐ) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.price || ''}
                                            placeholder="0"
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    price: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="rk-input"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="rk-field__label">
                                        Mô tả món ăn
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Mô tả tóm tắt hương vị, các thành phần nguyên liệu đặc biệt…"
                                        maxLength={100}
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

                                <div className="rk-switchrow">
                                    <div>
                                        <strong className="rk-switchrow__label">
                                            Hiển thị trên menu
                                        </strong>
                                        <small className="rk-switchrow__desc">
                                            Cho phép Bếp và Phục vụ nhìn thấy món này
                                        </small>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={!formData.isHidden}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                isHidden: !e.target.checked,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div>
                                <label className="rk-field__label">
                                    Hình ảnh minh hoạ
                                </label>
                                <div className="rk-thumb rk-thumb--lg">
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="Preview" />
                                    ) : (
                                        <div className="rk-thumb rk-thumb--lg">
                                            <span>
                                                <Image
                                                    className="rk-icon"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                            <small>Chưa có hình ảnh</small>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Dán URL hình ảnh đường dẫn công khai (https://...)"
                                    value={formData.imageUrl}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            imageUrl: e.target.value,
                                        })
                                    }
                                    className="rk-input"
                                />
                            </div>

                            <div className="rk-actions rk-actions--end">
                                <button
                                    type="submit"
                                    disabled={
                                        activeCategories.length === 0 || isSubmitting
                                    }
                                    className="rk-btn rk-btn--primary rk-btn--block"
                                >
                                    {isSubmitting ? ' Đang thêm…' : 'Thêm món ăn'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveModal('NONE')}
                                    className="rk-btn rk-btn--quiet"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ========================================================= */}
            {/* VIEW MODAL */}
            {/* ========================================================= */}
            {activeModal === 'VIEW' && selectedDish && (
                <Modal
                    open
                    title={selectedDish.name}
                    description={selectedDish.categoryName}
                    size="lg"
                    onClose={() => setActiveModal('NONE')}
                    footer={
                        <>
                            <button
                                type="button"
                                className="rk-btn rk-btn--danger"
                                onClick={() => setActiveModal('DELETE')}
                            >
                                <Trash2 className="rk-icon" aria-hidden="true" /> Xoá món
                            </button>

                            <button
                                type="button"
                                className="rk-btn rk-btn--primary"
                                onClick={() => setActiveModal('EDIT')}
                            >
                                Chỉnh sửa
                            </button>
                        </>
                    }
                >
                    <div className="rk-modal__split">
                        <div>
                            <span
                                className={`rk-chip ${
                                    selectedDish.isHidden
                                        ? 'rk-chip--idle'
                                        : 'rk-chip--ok'
                                }`}
                            >
                                {selectedDish.isHidden
                                    ? 'Đã ẩn khỏi thực đơn'
                                    : 'Đang bán'}
                            </span>
                            <div className="rk-thumb rk-thumb--lg">
                                <img
                                    src={
                                        selectedDish.imageUrl.startsWith('http')
                                            ? selectedDish.imageUrl
                                            : `/image/${selectedDish.imageUrl}`
                                    }
                                    alt={selectedDish.name}
                                />
                            </div>
                            <div className="rk-detailrow">
                                <span className="rk-detailrow__label">Mã món</span>
                                <strong>
                                    {String(selectedDish.id).padStart(2, '0')}
                                </strong>
                            </div>
                        </div>

                        <div>
                            <div>
                                <h3 className="rk-num rk-price">
                                    {selectedDish.price.toLocaleString('vi-VN')}đ
                                </h3>
                                <hr />
                                <h4 className="rk-sectiontitle">Mô tả chi tiết</h4>
                                <div className="rk-prose">
                                    {selectedDish.description ||
                                        'Không có mô tả thông tin cụ thể cho món ăn này.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ========================================================= */}
            {/* EDIT MODAL */}
            {/* ========================================================= */}
            {activeModal === 'EDIT' && selectedDish && (
                <Modal
                    open
                    title="Chỉnh sửa món ăn"
                    description={selectedDish.name}
                    size="lg"
                    onClose={() => setActiveModal('NONE')}
                >
                    <form onSubmit={handleUpdateDish} className="rk-modal__split">
                        <div>
                            <div className="rk-fieldgroup">
                                <div className="rk-formgrid">
                                    <div>
                                        <label className="rk-field__label">
                                            Tên món ăn
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={50}
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="rk-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="rk-field__label">
                                            Danh mục
                                        </label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    categoryId: e.target.value,
                                                })
                                            }
                                            className="rk-select"
                                        >
                                            <option value="">-- Chọn danh mục --</option>
                                            {activeCategories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="rk-formgrid">
                                    <div>
                                        <label className="rk-field__label">
                                            Giá bán (VNĐ)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    price: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="rk-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="rk-field__label">
                                            Trạng thái HIỂN THỊ
                                        </label>
                                        <div className="rk-radiorow">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="visibility"
                                                    checked={formData.isHidden === false}
                                                    onChange={() =>
                                                        setFormData({
                                                            ...formData,
                                                            isHidden: false,
                                                        })
                                                    }
                                                />{' '}
                                                Hiển thị
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="visibility"
                                                    checked={formData.isHidden === true}
                                                    onChange={() =>
                                                        setFormData({
                                                            ...formData,
                                                            isHidden: true,
                                                        })
                                                    }
                                                />{' '}
                                                Ẩn khỏi menu
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="rk-field__label">
                                        Mô tả chi tiết
                                    </label>
                                    <textarea
                                        rows={4}
                                        maxLength={100}
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

                                <div>
                                    <label className="rk-field__label">
                                        ĐƯỜNG DẪN HÌNH ANH (URL)
                                    </label>
                                    <div className="rk-actions">
                                        <input
                                            type="text"
                                            value={formData.imageUrl}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    imageUrl: e.target.value,
                                                })
                                            }
                                            className="rk-input"
                                        />
                                        <button type="button" className="rk-btn">
                                            Tải lên
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="rk-actions rk-actions--end">
                                <button
                                    type="button"
                                    onClick={() => setActiveModal('NONE')}
                                    className="rk-btn rk-btn--quiet"
                                >
                                    HỦY
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rk-btn rk-btn--primary rk-btn--block"
                                >
                                    {isSubmitting ? ' Đang lưu…' : 'Cập nhật'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <div>
                                <div className="rk-sectiontitle">
                                    Xem trước trên thực đơn
                                </div>
                                <div className="rk-media">
                                    {/* Thay thế phần này */}
                                    <div className="rk-thumb rk-thumb--lg">
                                        <img
                                            src={
                                                formData.imageUrl
                                                    ? formData.imageUrl.startsWith('http')
                                                        ? formData.imageUrl
                                                        : `/image/${formData.imageUrl}`
                                                    : 'https://placehold.co/300x200?text=No+Image'
                                            }
                                            alt="Preview"
                                            onError={(e) => {
                                                ;(e.target as HTMLImageElement).src =
                                                    'https://placehold.co/300x200?text=No+Image'
                                            }}
                                        />
                                    </div>
                                    <div className="rk-rowlist__main"></div>
                                </div>
                            </div>

                            <div className="rk-dangerzone">
                                <h5> Khu vực nguy hiểm</h5>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveModal('DELETE')
                                    }}
                                    className="rk-btn rk-btn--danger rk-btn--block"
                                >
                                    XÓA Món ăn KHỎI MENU
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ========================================================= */}
            {/* DELETE MODAL */}
            {/* ========================================================= */}
            <ConfirmDialog
                open={activeModal === 'DELETE' && Boolean(selectedDish)}
                title="Xoá món ăn này?"
                description={
                    selectedDish
                        ? `Món “${selectedDish.name}” sẽ bị gỡ khỏi thực đơn. Việc này không hoàn tác được — nếu chỉ muốn tạm dừng bán, hãy ẩn món thay vì xoá.`
                        : undefined
                }
                confirmLabel="Xoá món ăn"
                destructive
                onConfirm={handleDeleteDish}
                onCancel={() => setActiveModal('NONE')}
            />
        </div>
    )
}
