import {Icon} from '@/shared/components/ui/Icon'
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
    ViewToggle,
} from '@/shared/components/ui'
import {useViewMode} from '@/shared/hooks/useViewMode'
import {useWaiterSocket} from '@/realtime'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'
import {useToast} from '@/app/providers/useToast'
import {dungAnhThayThe, duongDanAnh} from '@/shared/utils/image'
import {formatCurrency, formatCurrencyShort} from '@/shared/utils/format'

type ModalType = 'NONE' | 'CREATE' | 'VIEW' | 'EDIT' | 'DELETE'

// --- Pagination Config ---
/* Bội của 4 — số cột lớn nhất của lưới thẻ. Cỡ 5 cho ra một hàng bốn
   cộng một món lẻ, và 43 món thành chín trang. */
const ITEMS_PER_PAGE = 12

export default function AdminDishesPage() {
    const {notify} = useToast()

    // --- States ---
    const [dishes, setDishes] = useState<DishResponse[]>([])
    const [categories, setCategories] = useState<CategoryResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [viewMode, setViewMode] = useViewMode('admin-dishes')
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
                // Rời màn giữa chừng thì request đang bay bị huỷ — không phải lỗi.
                if (isRequestCanceled(requestError)) {
                    return
                }

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
            notify('Chưa chọn danh mục. Mỗi món phải thuộc đúng một danh mục.', {
                tone: 'alert',
            })
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
            notify('Đường dẫn ảnh quá dài, tối đa 500 ký tự.', {tone: 'alert'})
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
            const errMsg = getErrorMessage(
                err,
                'Không thêm được món. Dữ liệu vừa nhập vẫn được giữ.',
            )
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
            notify('Chưa chọn danh mục. Mỗi món phải thuộc đúng một danh mục.', {
                tone: 'alert',
            })
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
            notify('Đường dẫn ảnh quá dài, tối đa 500 ký tự.', {tone: 'alert'})
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
            const errMsg = getErrorMessage(
                err,
                'Không cập nhật được món. Thay đổi chưa được lưu.',
            )
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
            const errMsg = getErrorMessage(
                err,
                'Không xoá được món. Món vẫn còn trong thực đơn.',
            )
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
                title="Đang tải danh sách món ăn hệ thống..."
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
                            Thêm món ăn
                        </button>
                    }
                />
            </PageCard>

            {/* Filters */}
            <div className="rk-filterrow">
                <PageCard>
                    <div className="rk-filterbar">
                        {/* Nút đổi khung đứng CUỐI hàng lọc, vì nó không phải
                            bộ lọc: nó đổi cách nhìn, không đổi cái được nhìn. */}
                        <input
                            aria-label="Tìm theo tên món hoặc mã món"
                            type="text"
                            placeholder="Tìm theo tên món hoặc mã món..."
                            value={searchKeyword}
                            onChange={(e) => {
                                setSearchKeyword(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="rk-input"
                        />
                        <select
                            aria-label="Lọc theo danh mục"
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
                            aria-label="Lọc theo trạng thái"
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

                        <ViewToggle value={viewMode} onChange={setViewMode} />
                    </div>
                </PageCard>

                <StatCard
                    label="Món tìm thấy"
                    value={filteredDishes.length}
                    icon={<Icon name="kitchen" className="rk-icon" />}
                />
            </div>

            {viewMode === 'cards' ? (
                <div className="rk-dishgrid">
                    {currentItems.map((dish) => {
                        const isParentCategoryHidden =
                            categories.find((c) => c.name === dish.categoryName)
                                ?.isAvailable === false

                        return (
                            <article className="rk-dishcard" key={dish.id}>
                                <div className="rk-dishcard__figure">
                                    <img
                                        src={duongDanAnh(dish.imageUrl)}
                                        alt={dish.name}
                                        onError={dungAnhThayThe}
                                    />
                                    <span
                                        className={`rk-chip rk-dishcard__flag ${
                                            dish.isHidden
                                                ? 'rk-chip--idle'
                                                : 'rk-chip--ok'
                                        }`}
                                    >
                                        {dish.isHidden
                                            ? 'Đã ẩn khỏi thực đơn'
                                            : 'Đang hiển thị'}
                                    </span>
                                </div>

                                <div className="rk-dishcard__body">
                                    <h3 className="rk-dishcard__name">{dish.name}</h3>

                                    <div className="rk-dishcard__meta">
                                        <span
                                            className={`rk-tag${isParentCategoryHidden ? ' rk-tag--muted' : ''}`}
                                        >
                                            {dish.categoryName}{' '}
                                            {isParentCategoryHidden ? '(Ẩn)' : ''}
                                        </span>

                                        <span className="rk-dishcard__price">
                                            {formatCurrencyShort(dish.price)}
                                        </span>
                                    </div>
                                </div>

                                <div className="rk-dishcard__actions">
                                    <button
                                        onClick={() => openFormWithDish(dish, 'VIEW')}
                                        className="rk-iconbtn"
                                        title="Xem chi tiết"
                                    >
                                        <Icon name="eye" className="rk-icon" />
                                    </button>
                                    <button
                                        onClick={() => openFormWithDish(dish, 'EDIT')}
                                        className="rk-iconbtn rk-iconbtn--brand"
                                        title="Chỉnh sửa"
                                    >
                                        <Icon name="pen" className="rk-icon" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedDish(dish)
                                            setActiveModal('DELETE')
                                        }}
                                        className="rk-iconbtn rk-iconbtn--danger"
                                        title="Xoá món"
                                    >
                                        <Icon name="trash" className="rk-icon" />
                                    </button>
                                </div>
                            </article>
                        )
                    })}
                </div>
            ) : (
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
                                                    src={duongDanAnh(dish.imageUrl)}
                                                    alt={dish.name}
                                                    onError={dungAnhThayThe}
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
                                            {formatCurrency(dish.price)}
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
                                                onClick={() =>
                                                    openFormWithDish(dish, 'VIEW')
                                                }
                                                className="rk-iconbtn"
                                                title="Xem chi tiết"
                                            >
                                                <Icon name="eye" className="rk-icon" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    openFormWithDish(dish, 'EDIT')
                                                }
                                                className="rk-iconbtn rk-iconbtn--brand"
                                                title="Chỉnh sửa"
                                            >
                                                <Icon name="pen" className="rk-icon" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedDish(dish)
                                                    setActiveModal('DELETE')
                                                }}
                                                className="rk-iconbtn rk-iconbtn--danger"
                                                title="Xoá món"
                                            >
                                                <Icon name="trash" className="rk-icon" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredDishes.length === 0 && (
                <EmptyState
                    title="Không tìm thấy món ăn phù hợp"
                    description="Hãy thay đổi từ khoá, danh mục hoặc trạng thái để tìm món ăn."
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
                            Xoá bộ lọc
                        </button>
                    }
                />
            )}

            {filteredDishes.length > 0 && (
                <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={ITEMS_PER_PAGE}
                    onPageChange={goToPage}
                />
            )}

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
                                    <label
                                        className="rk-field__label"
                                        htmlFor="admindishespage-ten-mon-an"
                                    >
                                        Tên món ăn *
                                    </label>
                                    <input
                                        id="admindishespage-ten-mon-an"
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
                                        <label
                                            className="rk-field__label"
                                            htmlFor="admindishespage-danh-muc-thuc-don"
                                        >
                                            Danh mục thực đơn
                                        </label>
                                        <select
                                            id="admindishespage-danh-muc-thuc-don"
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
                                        <label
                                            className="rk-field__label"
                                            htmlFor="admindishespage-gia-ban-vnd"
                                        >
                                            Giá bán (VNĐ) *
                                        </label>
                                        <input
                                            id="admindishespage-gia-ban-vnd"
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
                                    <label
                                        className="rk-field__label"
                                        htmlFor="admindishespage-mo-ta-mon-an"
                                    >
                                        Mô tả món ăn
                                    </label>
                                    <textarea
                                        id="admindishespage-mo-ta-mon-an"
                                        rows={4}
                                        placeholder="Mô tả tóm tắt hương vị, các thành phần nguyên liệu đặc biệt..."
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
                                <span className="rk-field__label">Hình ảnh minh hoạ</span>
                                <div className="rk-thumb rk-thumb--lg">
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="Preview" />
                                    ) : (
                                        <div className="rk-thumb rk-thumb--lg">
                                            <span></span>
                                            <small>Chưa có hình ảnh</small>
                                        </div>
                                    )}
                                </div>
                                <input
                                    aria-label="Đường dẫn ảnh món"
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
                                    {isSubmitting ? ' Đang thêm...' : 'Thêm món ăn'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveModal('NONE')}
                                    className="rk-btn rk-btn--quiet"
                                >
                                    Huỷ bỏ
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
                                <Icon name="trash" className="rk-icon" /> Xoá món
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
                                    src={duongDanAnh(selectedDish.imageUrl)}
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
                                    {formatCurrency(selectedDish.price)}
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
                                        <label
                                            className="rk-field__label"
                                            htmlFor="admindishespage-ten-mon-an-2"
                                        >
                                            Tên món ăn
                                        </label>
                                        <input
                                            id="admindishespage-ten-mon-an-2"
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
                                        <label
                                            className="rk-field__label"
                                            htmlFor="admindishespage-danh-muc"
                                        >
                                            Danh mục
                                        </label>
                                        <select
                                            id="admindishespage-danh-muc"
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
                                        <label
                                            className="rk-field__label"
                                            htmlFor="admindishespage-gia-ban-vnd-2"
                                        >
                                            Giá bán (VNĐ)
                                        </label>
                                        <input
                                            id="admindishespage-gia-ban-vnd-2"
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
                                        <span className="rk-field__label">
                                            Trạng thái HIỂN THỊ
                                        </span>
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
                                    <label
                                        className="rk-field__label"
                                        htmlFor="admindishespage-mo-ta-chi-tiet"
                                    >
                                        Mô tả chi tiết
                                    </label>
                                    <textarea
                                        id="admindishespage-mo-ta-chi-tiet"
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
                                    <span className="rk-field__label">
                                        ĐƯỜNG DẪN HÌNH ANH (URL)
                                    </span>
                                    <div className="rk-actions">
                                        <input
                                            aria-label="Đường dẫn ảnh món"
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
                                    HUỶ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rk-btn rk-btn--primary rk-btn--block"
                                >
                                    {isSubmitting ? ' Đang lưu...' : 'Cập nhật'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <div>
                                <div className="rk-sectiontitle">
                                    Xem trước trên thực đơn
                                </div>
                                <div className="rk-media">
                                    <div className="rk-thumb rk-thumb--lg">
                                        <img
                                            src={duongDanAnh(formData.imageUrl)}
                                            alt="Preview"
                                            onError={dungAnhThayThe}
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
                                    XOÁ Món ăn KHỎI MENU
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
