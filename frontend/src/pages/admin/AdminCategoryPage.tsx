import React, { useEffect, useState } from 'react';
import { categoryApi } from '../../api/admin';
import type { CategoryResponse, DishResponse, CategoryFormData } from '../../api/admin';

type ViewMode = 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL';
type FilterStatus = 'ALL' | 'ACTIVE' | 'HIDDEN';

// --- Pagination Config ---
const ITEMS_PER_PAGE = 5;

export default function AdminCategoryPage() {
    // --- States ---
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [dishes, setDishes] = useState<DishResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [view, setView] = useState<ViewMode>('LIST');
    const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // --- Pagination States ---
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        description: '',
        isAvailable: true
    });

    const [deleteModal, setDeleteModal] = useState({ open: false, id: null as number | null });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // --- Load Data ---
    const loadCategories = async () => {
        try {
            setLoading(true);
            const [categoriesData, dishesData] = await Promise.all([
                categoryApi.getAllCategories(),
                categoryApi.getAllDishes()
            ]);

            const processedDishes = dishesData.data.map((dish) => ({
                ...dish,
                imageUrl: dish.imageUrl
            }));

            setDishes(processedDishes);

            const formattedData = categoriesData.data.map((cat) => ({
                ...cat,
                dishCount: processedDishes.filter((d) => d.categoryName === cat.name).length
            })).sort((a, b) => a.id - b.id);

            setCategories(formattedData);
            setError(null);
            setCurrentPage(1);
        } catch (err: any) {
            console.error("Lỗi khi tải dữ liệu:", err);
            setError("Không thể tải danh sách danh mục từ máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchTerm]);

    // --- CRUD Handlers ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;


        try {
            setIsSubmitting(true);

            if (view === 'CREATE') {
                await categoryApi.createCategory({
                    name: formData.name.trim(),
                    description: formData.description
                });
                alert("Tạo danh mục mới thành công! 🎉");
            } else if (view === 'EDIT' && selectedCategory) {
                await categoryApi.updateCategory(selectedCategory.id, {
                    name: formData.name.trim(),
                    description: formData.description,
                    isAvailable: formData.isAvailable
                });
                alert("Cập nhật danh mục thành công!");
            }

            setView('LIST');
            loadCategories();
        } catch (err: any) {
            console.error("Lỗi API xử lý danh mục:", err);
            const errMsg = err.response?.data?.message || "Đã xảy ra lỗi trong quá trình xử lý.";
            alert(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (deleteModal.id === null) return;
        try {
            await categoryApi.deleteCategory(deleteModal.id);
            alert("Xóa danh mục thành công! 🎉");
            setDeleteModal({ open: false, id: null });
            loadCategories();
        } catch (err: any) {
            console.error("Lỗi khi xóa danh mục:", err);
            const errMsg = err.response?.data?.message || "Không thể thực hiện xóa danh mục!";
            alert(errMsg);
            setDeleteModal({ open: false, id: null });
        }
    };

    // --- Filter Logic ---
    const filteredCategories = categories.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `cat-${String(item.id).padStart(3, '0')}`.includes(searchTerm.toLowerCase());
        if (filterStatus === 'ACTIVE') return matchesSearch && item.isAvailable;
        if (filterStatus === 'HIDDEN') return matchesSearch && !item.isAvailable;
        return matchesSearch;
    });

    // --- Pagination Logic ---
    const totalItems = filteredCategories.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = filteredCategories.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const goToPreviousPage = () => goToPage(currentPage - 1);
    const goToNextPage = () => goToPage(currentPage + 1);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            pages.push(totalPages);
        }

        return pages;
    };

    const totalDishes = categories.reduce((sum, c) => sum + (c.dishCount || 0), 0);
    const categoryDishes = selectedCategory
        ? dishes.filter(d => d.categoryName === selectedCategory.name)
        : [];

    if (loading) return <div className="admin-category-status">🔄 Đang tải dữ liệu danh mục thực đơn...</div>;
    if (error) return <div className="admin-category-status admin-category-status-error">❌ {error}</div>;

    return (
        <div className="admin-category-page">
            {view === 'LIST' && (
                <div>
                    {/* Header */}
                    <div className="admin-category-header">
                        <div>
                            <h2 className="admin-category-page-title">📁 QUẢN LÝ DANH MỤC</h2>
                        </div>
                        <button
                            onClick={() => {
                                setFormData({ name: '', description: '', isAvailable: true });
                                setView('CREATE');
                            }}
                            className="admin-category-btn-primary"
                        >
                            <span>+</span> Thêm Danh Mục
                        </button>
                    </div>

                    {/* Stats & Filters */}
                    <div className="admin-category-top-grid">
                        <div className="admin-category-card">
                            <div className="admin-category-filter-container">
                                <div className="admin-category-filter-section">
                                    <span className="admin-category-filter-label">TRẠNG THÁI</span>
                                    <div className="admin-category-filter-group">
                                        <button
                                            onClick={() => setFilterStatus('ALL')}
                                            className={`admin-category-filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
                                        >
                                            Tất cả
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus('ACTIVE')}
                                            className={`admin-category-filter-btn ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
                                        >
                                            Hoạt động
                                        </button>
                                        <button
                                            onClick={() => setFilterStatus('HIDDEN')}
                                            className={`admin-category-filter-btn ${filterStatus === 'HIDDEN' ? 'active' : ''}`}
                                        >
                                            Đã ẩn
                                        </button>
                                    </div>
                                </div>
                                <div className="admin-category-search-section">
                                    <span className="admin-category-filter-label">TÌM KIẾM NHANH</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm tên danh mục, mã ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="admin-category-search-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="admin-category-card admin-category-stats-card admin-category-stats-categories">
                            <div className="admin-category-stats-inner">
                                <div>
                                    <span className="admin-category-stats-label">TỔNG DANH MỤC</span>
                                    <h2 className="admin-category-stats-number">{categories.length}</h2>
                                </div>
                                <span className="admin-category-stats-icon">🗂️</span>
                            </div>
                        </div>

                        <div className="admin-category-card admin-category-stats-card admin-category-stats-dishes">
                            <div className="admin-category-stats-inner">
                                <div>
                                    <span className="admin-category-stats-label">TỔNG MÓN ĂN</span>
                                    <h2 className="admin-category-stats-number">{totalDishes}</h2>
                                </div>
                                <span className="admin-category-stats-icon">🍳</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="admin-category-card admin-category-table-card">
                        <table className="admin-category-table">
                            <thead>
                            <tr className="admin-category-table-header">
                                <th className="admin-category-col-id">ID</th>
                                <th className="admin-category-col-name">DANH MỤC & MÔ TẢ</th>
                                <th className="admin-category-col-count">SỐ MÓN</th>
                                <th className="admin-category-col-status">TRẠNG THÁI</th>
                                <th className="admin-category-col-date">NGÀY TẠO</th>
                                <th className="admin-category-col-actions">THAO TÁC</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentItems.map((item) => (
                                <tr key={item.id} className="admin-category-table-row">
                                    <td className="admin-category-cell-id">{String(item.id).padStart(2, '0')}</td>
                                    <td className="admin-category-cell-name">
                                        <div className="admin-category-info">
                                            <div className="admin-category-icon">📁</div>
                                            <div>
                                                <strong className="admin-category-name">{item.name}</strong>
                                                <div className="admin-category-description">
                                                    {item.description || "Không có mô tả"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="admin-category-cell-count">
                                            <span className="admin-category-dish-count-badge">
                                                <span className="admin-category-count-number">{item.dishCount || 0}</span>
                                                <span className="admin-category-count-label">món</span>
                                            </span>
                                    </td>
                                    <td className="admin-category-cell-status">
                                            <span className={`admin-category-status-badge ${item.isAvailable ? 'active' : 'hidden'}`}>
                                                {item.isAvailable ? '● Hoạt động' : '● Đã ẩn'}
                                            </span>
                                    </td>
                                    <td className="admin-category-cell-date">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '---'}
                                    </td>
                                    <td className="admin-category-cell-actions">
                                        <button
                                            onClick={() => {
                                                setSelectedCategory(item);
                                                setView('DETAIL');
                                            }}
                                            className="admin-category-action-btn"
                                            title="Xem chi tiết"
                                        >
                                            👁️
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedCategory(item);
                                                setFormData({
                                                    name: item.name,
                                                    description: item.description,
                                                    isAvailable: item.isAvailable
                                                });
                                                setView('EDIT');
                                            }}
                                            className="admin-category-action-btn admin-category-edit-btn"
                                            title="Chỉnh sửa"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ open: true, id: item.id })}
                                            className="admin-category-action-btn admin-category-delete-btn"
                                            title="Xóa"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {filteredCategories.length === 0 && (
                            <div className="admin-category-empty-state">Không tìm thấy danh mục nào phù hợp với bộ lọc tìm kiếm.</div>
                        )}

                        {/* Pagination */}
                        {filteredCategories.length > 0 && (
                            <div className="admin-category-pagination">
                                <div className="admin-category-pagination-info">
                                    <span className="admin-category-pagination-current-page">
                Trang {currentPage} / {totalPages}
            </span>
                                </div>
                                <div className="admin-category-pagination-controls">
                                    <button
                                        onClick={goToPreviousPage}
                                        disabled={currentPage === 1}
                                        className="admin-category-pagination-btn"
                                    >
                                        ◀
                                    </button>
                                    {getPageNumbers().map((page, index) => (
                                        <button
                                            key={index}
                                            onClick={() => typeof page === 'number' && goToPage(page)}
                                            className={`admin-category-pagination-btn ${currentPage === page ? 'active' : ''} ${typeof page === 'string' ? 'dots' : ''}`}
                                            disabled={typeof page === 'string'}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                        className="admin-category-pagination-btn"
                                    >
                                        ▶
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'DETAIL' && selectedCategory && (
                <div className="admin-category-detail-view">
                    <div className="admin-category-detail-header">
                        <div className="admin-category-detail-header-left">
                            <button onClick={() => setView('LIST')} className="admin-category-back-btn">&larr;</button>
                            <h3 className="admin-category-detail-title">CHI TIẾT DANH MỤC</h3>
                        </div>
                        <div className="admin-category-detail-header-right">
                            <button
                                onClick={() => {
                                    setFormData({
                                        name: selectedCategory.name,
                                        description: selectedCategory.description,
                                        isAvailable: selectedCategory.isAvailable
                                    });
                                    setView('EDIT');
                                }}
                                className="admin-category-btn-secondary"
                            >
                                ✏️ Sửa danh mục
                            </button>
                            <button
                                onClick={() => setDeleteModal({ open: true, id: selectedCategory.id })}
                                className="admin-category-btn-secondary admin-category-btn-danger"
                            >
                                🗑️ Xóa danh mục
                            </button>
                        </div>
                    </div>

                    <div className="admin-category-detail-grid">
                        <div className="admin-category-card">
                            <span className="admin-category-input-label">TÊN DANH MỤC</span>
                            <p className="admin-category-detail-name">{selectedCategory.name}</p>

                            <span className="admin-category-input-label">MÔ TẢ DANH MỤC</span>
                            <p className="admin-category-detail-description">
                                {selectedCategory.description || 'Không có mô tả chi tiết cho danh mục này.'}
                            </p>

                            <div className="admin-category-detail-metrics">
                                <div>
                                    <span className="admin-category-input-label">TRẠNG THÁI HIỂN THỊ</span>
                                    <span className={`admin-category-detail-status ${selectedCategory.isAvailable ? 'active' : 'hidden'}`}>
                                        {selectedCategory.isAvailable ? '🟢 Đang hoạt động' : '⚫ Đang tạm ẩn'}
                                    </span>
                                </div>
                                <div>
                                    <span className="admin-category-input-label">SỐ MÓN LIÊN KẾT</span>
                                    <span className="admin-category-detail-dish-count">{categoryDishes.length} món ăn</span>
                                </div>
                            </div>
                        </div>

                        <div className="admin-category-detail-meta">
                            <div className="admin-category-card admin-category-meta-card">
                                <span className="admin-category-input-label">NGÀY KHỞI TẠO</span>
                                <p className="admin-category-meta-value">
                                    {selectedCategory.createdAt ? new Date(selectedCategory.createdAt).toLocaleString('vi-VN') : '---'}
                                </p>
                            </div>
                            <div className="admin-category-card admin-category-meta-card">
                                <span className="admin-category-input-label">CẬP NHẬT CUỐI MÁY CHỦ</span>
                                <p className="admin-category-meta-value">
                                    {selectedCategory.updatedAt ? new Date(selectedCategory.updatedAt).toLocaleString('vi-VN') : '---'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="admin-category-card">
                        <div className="admin-category-dish-list-header">
                            <h4 className="admin-category-dish-list-title">
                                🍽️ DANH SÁCH MÓN TRONG DANH MỤC ({categoryDishes.length} món)
                            </h4>
                        </div>

                        {categoryDishes.length > 0 ? (
                            <div className="admin-category-dish-table-wrapper">
                                <table className="admin-category-dish-table">
                                    <thead>
                                    <tr className="admin-category-table-header">
                                        <th className="admin-category-dish-col-name">TÊN MÓN</th>
                                        <th className="admin-category-dish-col-price">GIÁ (VND)</th>
                                        <th className="admin-category-dish-col-status">TRẠNG THÁI</th>
                                        <th className="admin-category-dish-col-date">NGÀY TẠO</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {categoryDishes.map((dish) => (
                                        <tr key={dish.id} className="admin-category-table-row admin-category-dish-row">
                                            <td className="admin-category-dish-cell-name">
                                                <div className="admin-category-dish-info">
                                                    <div className="admin-category-dish-image">
                                                        <img
                                                            src={dish.imageUrl && dish.imageUrl.startsWith('http') ? dish.imageUrl : `/image/${dish.imageUrl}`}
                                                            alt={dish.name}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=🍲';
                                                                (e.target as HTMLImageElement).onerror = null;
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <strong className="admin-category-dish-name">{dish.name}</strong>
                                                        {dish.description && (
                                                            <div className="admin-category-dish-description-short">{dish.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="admin-category-dish-cell-price">{dish.price.toLocaleString('vi-VN')}đ</td>
                                            <td className="admin-category-dish-cell-status">
                                                    <span className={`admin-category-status-badge ${dish.isAvailable ? 'active' : 'hidden'}`}>
                                                        {dish.isAvailable ? '● Đang bán' : '● Tạm dừng'}
                                                    </span>
                                            </td>
                                            <td className="admin-category-dish-cell-date">
                                                {dish.createdAt ? new Date(dish.createdAt).toLocaleDateString('vi-VN') : '---'}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="admin-category-empty-dish-state">
                                <span className="admin-category-empty-icon">🍽️</span>
                                <p className="admin-category-empty-text">Chưa có món ăn nào trong danh mục này</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(view === 'CREATE' || view === 'EDIT') && (
                <div className="admin-category-form-view">
                    <div className="admin-category-form-header">
                        <button onClick={() => setView('LIST')} className="admin-category-back-btn">&larr;</button>
                        <h3 className="admin-category-form-title">
                            {view === 'CREATE' ? '➕ THÊM DANH MỤC MỚI' : '✏️ CHỈNH SỬA DANH MỤC'}
                        </h3>
                    </div>

                    <form onSubmit={handleSave} className="admin-category-form-card">
                        <div className="admin-category-form-group">
                            <label className="admin-category-input-label">
                                TÊN DANH MỤC <span className="admin-category-required">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: Hải Sản, Món Nướng, Đồ Tráng Miệng..."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="admin-category-input-field"
                            />
                        </div>

                        <div className="admin-category-form-group">
                            <div className="admin-category-textarea-header">
                                <label className="admin-category-input-label">MÔ TẢ CHI TIẾT</label>
                                <span className="admin-category-char-count">{formData.description.length}/100</span>
                            </div>
                            <textarea
                                maxLength={255}
                                rows={4}
                                placeholder="Nhập tóm tắt thông tin mô tả về nhóm món ăn này..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="admin-category-textarea-field"
                            />
                        </div>

                        {view === 'EDIT' && (
                            <div className="admin-category-toggle-row">
                                <div>
                                    <strong className="admin-category-toggle-label">Kích hoạt công khai</strong>
                                    <small className="admin-category-toggle-description">
                                        Hiển thị danh mục này trên menu trực tuyến hệ thống công khai
                                    </small>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.isAvailable}
                                    onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    className="admin-category-toggle-checkbox"
                                />
                            </div>
                        )}

                        <div className="admin-category-form-actions">
                            <button type="button" onClick={() => setView('LIST')} className="admin-category-btn-secondary">
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`admin-category-btn-primary ${isSubmitting ? 'loading' : ''}`}
                            >
                                {isSubmitting ? '⏳ Đang lưu...' : '💾 Lưu dữ liệu'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {deleteModal.open && (
                <div className="admin-category-modal-backdrop">
                    <div className="admin-category-modal-card">
                        <div className="admin-category-modal-icon">⚠️</div>
                        <h4 className="admin-category-modal-title">XÓA DANH MỤC THỰC ĐƠN</h4>
                        <p className="admin-category-modal-text">
                            Bạn có chắc chắn muốn xóa danh mục này? Hành động này sẽ thực hiện ẩn danh mục (xóa mềm). Hệ
                            thống sẽ chặn nếu có các món ăn đang liên kết trực tiếp.
                        </p>
                        <div className="admin-category-modal-actions">
                            <button
                                onClick={() => setDeleteModal({ open: false, id: null })}
                                className="admin-category-btn-secondary"
                            >
                                Hủy quay lại
                            </button>
                            <button onClick={confirmDelete} className="admin-category-btn-danger-modal">
                                XÁC NHẬN XÓA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}