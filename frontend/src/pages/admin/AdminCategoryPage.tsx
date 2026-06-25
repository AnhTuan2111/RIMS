import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- 1. INTERFACES TYPES ---
interface CategoryResponse {
    id: number;
    name: string;
    description: string;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
    dishCount?: number;
}

interface DishResponse {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    isAvailable: boolean;
    categoryName: string;
    createdAt: string;
    updatedAt: string;
}

export default function AdminCategoryPage() {
    // --- 2. STATES MANAGEMENT ---
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [dishes, setDishes] = useState<DishResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT' | 'DETAIL'>('LIST');
    const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isAvailable: true
    });

    const [deleteModal, setDeleteModal] = useState({ open: false, id: null as number | null });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // --- 3. API SYNCHRONIZATION ---
    const loadCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers = { Authorization: token ? `Bearer ${token}` : '' };

            const [catRes, dishRes] = await Promise.all([
                axios.get('http://localhost:8080/rims/admin/category/all', { headers }),
                axios.get('http://localhost:8080/rims/admin/dish/all', { headers })
            ]);

            const dishesData: any[] = dishRes.data;

            // Xử lý imageUrl giống AdminDishesPage
            const processedDishes = dishesData.map((dish: any) => ({
                ...dish,
                // Giữ nguyên imageUrl như từ API (không thay đổi)
                imageUrl: dish.imageUrl
            }));

            setDishes(processedDishes);

            const formattedData = catRes.data.map((cat: any) => ({
                ...cat,
                dishCount: processedDishes.filter((d: any) => d.categoryName === cat.name).length
            }));

            setCategories(formattedData);
            setError(null);
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

    // --- 4. CRUD HANDLERS ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (formData.name.trim().length > 50) {
            alert("Lỗi: Tên danh mục không được vượt quá 50 ký tự!");
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('accessToken');
            const headers = { Authorization: token ? `Bearer ${token}` : '' };

            if (view === 'CREATE') {
                const body = {
                    name: formData.name.trim(),
                    description: formData.description
                };
                await axios.post('http://localhost:8080/rims/admin/category/new', body, { headers });
                alert("Tạo danh mục mới thành công! 🎉");
            } else if (view === 'EDIT' && selectedCategory) {
                const body = {
                    name: formData.name.trim(),
                    description: formData.description,
                    isAvailable: formData.isAvailable
                };
                await axios.put(`http://localhost:8080/rims/admin/category/update/${selectedCategory.id}`, body, { headers });
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
            const token = localStorage.getItem('accessToken');
            const headers = { Authorization: token ? `Bearer ${token}` : '' };

            await axios.delete(`http://localhost:8080/rims/admin/category/${deleteModal.id}`, { headers });

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

    // --- 5. FILTER LOGIC ---
    const filteredCategories = categories.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `cat-${String(item.id).padStart(3, '0')}`.includes(searchTerm.toLowerCase());
        if (filterStatus === 'ACTIVE') return matchesSearch && item.isAvailable;
        if (filterStatus === 'HIDDEN') return matchesSearch && !item.isAvailable;
        return matchesSearch;
    });

    const totalDishes = categories.reduce((sum, c) => sum + (c.dishCount || 0), 0);

    // Lấy danh sách món ăn thuộc danh mục đang chọn
    const categoryDishes = selectedCategory
        ? dishes.filter(d => d.categoryName === selectedCategory.name)
        : [];

    if (loading) return <div style={statusContainerStyle}>🔄 Đang tải dữ liệu danh mục thực đơn...</div>;
    if (error) return <div style={{ ...statusContainerStyle, color: '#ef4444' }}>❌ {error}</div>;

    return (
        <div style={pageContainerStyle}>

            {/* ----------------- MÀN HÌNH DANH SÁCH ----------------- */}
            {view === 'LIST' && (
                <div>
                    {/* Header */}
                    <div style={headerStyle}>
                        <div>
                            <h2 style={pageTitleStyle}>📁 QUẢN LÝ DANH MỤC</h2>
                        </div>
                        <button
                            onClick={() => { setFormData({ name: '', description: '', isAvailable: true }); setView('CREATE'); }}
                            style={primaryBtnStyle}
                        >
                            <span>+</span> Thêm Danh Mục
                        </button>
                    </div>

                    {/* Stats & Filters Row */}
                    <div style={topGridStyle}>
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '100%' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={filterLabelStyle}>TRẠNG THÁI</span>
                                    <div style={filterGroupStyle}>
                                        <button onClick={() => setFilterStatus('ALL')} style={filterBtnStyle(filterStatus === 'ALL')}>Tất cả</button>
                                        <button onClick={() => setFilterStatus('ACTIVE')} style={filterBtnStyle(filterStatus === 'ACTIVE')}>Hoạt động</button>
                                        <button onClick={() => setFilterStatus('HIDDEN')} style={filterBtnStyle(filterStatus === 'HIDDEN')}>Đã ẩn</button>
                                    </div>
                                </div>
                                <div style={{ flex: 1.2 }}>
                                    <span style={filterLabelStyle}>TÌM KIẾM NHANH</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm tên danh mục, mã ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={searchInputStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', border: 'none' }}>
                            <div style={statsCardInnerStyle}>
                                <div>
                                    <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: '700' }}>TỔNG DANH MỤC</span>
                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '32px', fontWeight: '800', color: '#1e1b4b', letterSpacing: '-0.03em' }}>{categories.length}</h2>
                                </div>
                                <span style={badgeIconStyle('#ffffff')}>🗂️</span>
                            </div>
                        </div>

                        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', border: 'none' }}>
                            <div style={statsCardInnerStyle}>
                                <div>
                                    <span style={{ fontSize: '12px', color: '#c2410c', fontWeight: '700' }}>TỔNG MÓN ĂN</span>
                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '32px', fontWeight: '800', color: '#7c2d12', letterSpacing: '-0.03em' }}>{totalDishes}</h2>
                                </div>
                                <span style={badgeIconStyle('#ffffff')}>🍳</span>
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div style={{ ...cardStyle, padding: '0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)' }}>
                        <table style={tableStyle}>
                            <thead>
                            <tr style={tableHeaderRowStyle}>
                                <th style={{ padding: '16px', textAlign: 'center', width: '100px' }}>ID</th>
                                <th style={{ padding: '16px' }}>DANH MỤC & MÔ TẢ</th>
                                <th style={{ padding: '16px', textAlign: 'center', width: '120px' }}>SỐ MÓN</th>
                                <th style={{ padding: '16px', textAlign: 'center', width: '140px' }}>TRẠNG THÁI</th>
                                <th style={{ padding: '16px', width: '140px' }}>NGÀY TẠO</th>
                                <th style={{ padding: '16px', textAlign: 'center', width: '140px' }}>THAO TÁC</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredCategories.map((item) => (
                                <tr key={item.id} style={tableRowStyle}>
                                    <td style={tableCellIdStyle}>
                                        CAT-{String(item.id).padStart(3, '0')}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={tableIconBoxStyle}>📁</div>
                                            <div>
                                                <strong style={{ color: '#0f172a', fontSize: '14.5px', display: 'block' }}>{item.name}</strong>
                                                <span style={{ color: '#64748b', fontSize: '12.5px', display: 'block', marginTop: '3px', lineHeight: '1.4' }}>{item.description || "Không có mô tả"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={dishCountBadgeStyle}>
                                                {item.dishCount || 0} món
                                            </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={statusBadgeStyle(item.isAvailable)}>
                                                {item.isAvailable ? '● Hoạt động' : '● Đã ẩn'}
                                            </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#64748b', fontWeight: '500' }}>
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '---'}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                                            <button onClick={() => { setSelectedCategory(item); setView('DETAIL'); }} style={actionBtnStyle} title="Xem chi tiết">👁️</button>
                                            <button
                                                onClick={() => { setSelectedCategory(item); setFormData({ name: item.name, description: item.description, isAvailable: item.isAvailable }); setView('EDIT'); }}
                                                disabled={!item.isAvailable}
                                                style={editBtnStyle(item.isAvailable)}
                                                title={item.isAvailable ? "Chỉnh sửa" : "Không thể sửa danh mục đã ẩn"}
                                            >
                                                ✏️
                                            </button>
                                            <button onClick={() => setDeleteModal({ open: true, id: item.id })} style={{ ...actionBtnStyle, color: '#ef4444' }} title="Xóa">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {filteredCategories.length === 0 && (
                            <div style={emptyStateStyle}>Không tìm thấy danh mục nào phù hợp với bộ lọc tìm kiếm.</div>
                        )}
                    </div>
                </div>
            )}

            {/* ----------------- MÀN HÌNH CHI TIẾT DANH MỤC ----------------- */}
            {view === 'DETAIL' && selectedCategory && (
                <div style={{ maxWidth: '950px', margin: '40px auto' }}>
                    <div style={detailHeaderStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <button onClick={() => setView('LIST')} style={backBtnStyle}>&larr;</button>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>CHI TIẾT DANH MỤC</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {selectedCategory.isAvailable && (
                                <button onClick={() => { setFormData({ name: selectedCategory.name, description: selectedCategory.description, isAvailable: selectedCategory.isAvailable }); setView('EDIT'); }} style={secondaryBtnStyle}>✏️ Sửa danh mục</button>
                            )}
                            <button onClick={() => setDeleteModal({ open: true, id: selectedCategory.id })} style={{ ...secondaryBtnStyle, backgroundColor: '#fee2e2', color: '#ef4444', borderColor: '#fca5a5' }}>🗑️ Xóa danh mục</button>
                        </div>
                    </div>

                    {/* Thông tin chi tiết danh mục */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <div style={cardStyle}>
                            <span style={inputLabelStyle}>TÊN DANH MỤC</span>
                            <p style={{ margin: '4px 0 18px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedCategory.name}</p>

                            <span style={inputLabelStyle}>MÔ TẢ DANH MỤC</span>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#475569', lineHeight: '1.6' }}>{selectedCategory.description || 'Không có mô tả chi tiết cho danh mục này.'}</p>

                            <div style={detailDividerMetricsStyle}>
                                <div>
                                    <span style={inputLabelStyle}>TRẠNG THÁI HIỂN THỊ</span>
                                    <span style={{ display: 'block', marginTop: '6px', fontWeight: '700', fontSize: '14px', color: selectedCategory.isAvailable ? '#16a34a' : '#64748b' }}>
                                        {selectedCategory.isAvailable ? '🟢 Đang hoạt động' : '⚫ Đang tạm ẩn'}
                                    </span>
                                </div>
                                <div>
                                    <span style={inputLabelStyle}>SỐ MÓN LIÊN KẾT</span>
                                    <span style={{ display: 'block', marginTop: '6px', fontWeight: '700', fontSize: '14px', color: '#0052cc' }}>{categoryDishes.length} món ăn</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ ...cardStyle, backgroundColor: '#f8fafc' }}>
                                <span style={inputLabelStyle}>NGÀY KHỞI TẠO</span>
                                <p style={{ margin: '4px 0 0 0', fontWeight: '600', fontSize: '13.5px', color: '#334155' }}>{selectedCategory.createdAt ? new Date(selectedCategory.createdAt).toLocaleString('vi-VN') : '---'}</p>
                            </div>
                            <div style={{ ...cardStyle, backgroundColor: '#f8fafc' }}>
                                <span style={inputLabelStyle}>CẬP NHẬT CUỐI MÁY CHỦ</span>
                                <p style={{ margin: '4px 0 0 0', fontWeight: '600', fontSize: '13.5px', color: '#334155' }}>{selectedCategory.updatedAt ? new Date(selectedCategory.updatedAt).toLocaleString('vi-VN') : '---'}</p>
                            </div>
                        </div>
                    </div>

                    {/* --- DANH SÁCH MÓN ĂN TRONG DANH MỤC --- */}
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                                🍽️ DANH SÁCH MÓN TRONG DANH MỤC ({categoryDishes.length} món)
                            </h4>
                            <button
                                onClick={() => alert('Chuyển đến trang quản lý món ăn để thêm mới')}
                                style={{ ...primaryBtnStyle, padding: '6px 14px', fontSize: '12px' }}
                            >
                                + Thêm món
                            </button>
                        </div>

                        {categoryDishes.length > 0 ? (
                            <div style={dishTableWrapper}>
                                <table style={dishTableStyle}>
                                    <thead>
                                    <tr style={tableHeaderRowStyle}>
                                        <th style={{ padding: '12px', textAlign: 'left', width: '30%' }}>TÊN MÓN</th>
                                        <th style={{ padding: '12px', textAlign: 'right', width: '20%' }}>GIÁ (VND)</th>
                                        <th style={{ padding: '12px', textAlign: 'center', width: '18%' }}>TRẠNG THÁI</th>
                                        <th style={{ padding: '12px', textAlign: 'center', width: '20%' }}>NGÀY TẠO</th>
                                        <th style={{ padding: '12px', textAlign: 'center', width: '12%' }}>THAO TÁC</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {categoryDishes.map((dish) => {
                                        return (
                                            <tr key={dish.id} style={{ ...tableRowStyle, borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={dishImageContainerStyle}>
                                                            <img
                                                                src={dish.imageUrl && dish.imageUrl.startsWith('http') ? dish.imageUrl : `/image/${dish.imageUrl}`}
                                                                alt={dish.name}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    display: 'block'
                                                                }}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=🍲';
                                                                    (e.target as HTMLImageElement).onerror = null;
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{dish.name}</strong>
                                                            {dish.description && (
                                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {dish.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#0052cc' }}>
                                                    {dish.price.toLocaleString('vi-VN')}đ
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                <span style={statusBadgeStyle(dish.isAvailable)}>
                    {dish.isAvailable ? '● Đang bán' : '● Tạm dừng'}
                </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                                                    {dish.createdAt ? new Date(dish.createdAt).toLocaleDateString('vi-VN') : '---'}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                                                        <button style={smallActionBtnStyle} title="Xem chi tiết">👁️</button>
                                                        <button style={{ ...smallActionBtnStyle, color: dish.isAvailable ? '#475569' : '#cbd5e1', cursor: dish.isAvailable ? 'pointer' : 'not-allowed' }} title="Chỉnh sửa">✏️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={emptyDishStateStyle}>
                                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🍽️</span>
                                <p style={{ color: '#94a3b8', fontWeight: '600', margin: 0 }}>Chưa có món ăn nào trong danh mục này</p>
                                <button
                                    onClick={() => alert('Chuyển đến trang quản lý món ăn để thêm mới')}
                                    style={{ ...secondaryBtnStyle, marginTop: '12px', padding: '8px 20px', fontSize: '12px' }}
                                >
                                    + Thêm món ăn đầu tiên
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ----------------- MÀN HÌNH THÊM MỚI & SỬA DANH MỤC ----------------- */}
            {(view === 'CREATE' || view === 'EDIT') && (
                <div style={{ maxWidth: '550px', margin: '40px auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                        <button onClick={() => setView('LIST')} style={backBtnStyle}>&larr;</button>
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '18px', color: '#0f172a', letterSpacing: '-0.02em' }}>
                            {view === 'CREATE' ? '➕ THÊM DANH MỤC MỚI' : '✏️ CHỈNH SỬA DANH MỤC'}
                        </h3>
                    </div>

                    <form onSubmit={handleSave} style={{ ...cardStyle, padding: '28px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={inputLabelStyle}>TÊN DANH MỤC <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: Hải Sản, Món Nướng, Đồ Tráng Miệng..."
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                style={inputFormStyle}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ ...inputLabelStyle, marginBottom: 0 }}>MÔ TẢ CHI TIẾT</label>
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>{formData.description.length}/255</span>
                            </div>
                            <textarea
                                maxLength={255}
                                rows={4}
                                placeholder="Nhập tóm tắt thông tin mô tả về nhóm món ăn này..."
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                style={{ ...inputFormStyle, resize: 'none', lineHeight: '1.5' }}
                            />
                        </div>

                        {view === 'EDIT' && (
                            <div style={toggleRowStyle}>
                                <div>
                                    <strong style={{ fontSize: '13.5px', display: 'block', color: '#0f172a' }}>Kích hoạt công khai</strong>
                                    <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px', display: 'block' }}>Hiển thị danh mục này trên menu trực tuyến hệ thống công khai</small>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.isAvailable}
                                    onChange={e => setFormData({...formData, isAvailable: e.target.checked})}
                                    style={checkboxStyle}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                            <button type="button" onClick={() => setView('LIST')} style={secondaryBtnStyle}>Hủy bỏ</button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    ...primaryBtnStyle,
                                    padding: '10px 24px',
                                    backgroundColor: isSubmitting ? '#94a3b8' : '#0052cc',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSubmitting ? '⏳ Đang lưu...' : '💾 Lưu dữ liệu'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ----------------- POPUP XÁC NHẬN XÓA ----------------- */}
            {deleteModal.open && (
                <div style={backdropStyle}>
                    <div style={modalCardStyle}>
                        <div style={{ fontSize: '36px', marginBottom: '12px', textAlign: 'center' }}>⚠️</div>
                        <h4 style={modalTitleStyle}>XÓA DANH MỤC THỰC ĐƠN</h4>
                        <p style={modalTextStyle}>
                            Bạn có chắc chắn muốn xóa danh mục này? Hành động này sẽ thực hiện ẩn danh mục (xóa mềm). Hệ thống sẽ chặn nếu có các món ăn đang liên kết trực tiếp.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setDeleteModal({ open: false, id: null })} style={{ ...secondaryBtnStyle, flex: 1 }}>Hủy quay lại</button>
                            <button onClick={confirmDelete} style={modalDeleteBtnStyle}>XÁC NHẬN XÓA</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// --- 6. MODERN DESIGN INLINE CSS STYLES ---
const pageContainerStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '32px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    color: '#334155'
};

const statusContainerStyle: React.CSSProperties = {
    padding: '48px',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    fontWeight: '600',
    fontSize: '15px',
    color: '#64748b'
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px'
};

const breadcrumbStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
};

const pageTitleStyle: React.CSSProperties = {
    margin: '6px 0 0 0',
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.02em'
};

const primaryBtnStyle: React.CSSProperties = {
    backgroundColor: '#0052cc',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '13.5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 10px rgba(0, 82, 204, 0.25)',
    transition: 'all 0.2s ease'
};

const secondaryBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: '600',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
    textAlign: 'center'
};

const topGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '20px',
    marginBottom: '28px'
};

const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)',
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box'
};

const filterLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: '8px'
};

const filterGroupStyle: React.CSSProperties = {
    display: 'flex',
    background: '#f1f5f9',
    padding: '4px',
    borderRadius: '10px'
};

const filterBtnStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '7px 14px',
    border: 'none',
    borderRadius: '8px',
    background: isActive ? '#ffffff' : 'transparent',
    color: isActive ? '#0f172a' : '#64748b',
    fontWeight: isActive ? '700' : '600',
    fontSize: '12.5px',
    cursor: 'pointer',
    boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
    transition: 'all 0.15s'
});

const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease'
};

const statsCardInnerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%'
};

const badgeIconStyle = (bgColor: string): React.CSSProperties => ({
    fontSize: '22px',
    background: bgColor,
    padding: '10px',
    borderRadius: '12px',
    lineHeight: '1',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
});

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13.5px'
};

const dishTableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px'
};

const tableHeaderRowStyle: React.CSSProperties = {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontWeight: '700'
};

const tableRowStyle: React.CSSProperties = {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s ease'
};

const tableCellIdStyle: React.CSSProperties = {
    padding: '16px',
    textAlign: 'center',
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: '13px'
};

const tableIconBoxStyle: React.CSSProperties = {
    width: '42px',
    height: '42px',
    backgroundColor: '#f1f5f9',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
};

const dishCountBadgeStyle: React.CSSProperties = {
    background: '#f3e8ff',
    color: '#6b21a8',
    padding: '5px 12px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '12px'
};

const statusBadgeStyle = (isAvailable: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: isAvailable ? '#dcfce7' : '#f1f5f9',
    color: isAvailable ? '#15803d' : '#475569',
    display: 'inline-block'
});

const actionBtnStyle: React.CSSProperties = {
    background: '#f1f5f9',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    transition: 'all 0.15s ease'
};

const smallActionBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    transition: 'all 0.15s ease'
};

const editBtnStyle = (isAvailable: boolean): React.CSSProperties => ({
    ...actionBtnStyle,
    color: isAvailable ? '#475569' : '#cbd5e1',
    cursor: isAvailable ? 'pointer' : 'not-allowed',
    background: isAvailable ? '#f1f5f9' : '#f8fafc'
});

const emptyStateStyle: React.CSSProperties = {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontWeight: '600'
};

const emptyDishStateStyle: React.CSSProperties = {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8'
};

const detailHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '18px',
    marginBottom: '28px'
};

const backBtnStyle: React.CSSProperties = {
    border: '1px solid #cbd5e1',
    background: '#fff',
    borderRadius: '8px',
    width: '34px',
    height: '34px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: '#475569'
};

const inputLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: '6px',
    letterSpacing: '0.05em'
};

const detailDividerMetricsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '40px',
    borderTop: '1px solid #f1f5f9',
    marginTop: '24px',
    paddingTop: '20px'
};

const inputFormStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s ease'
};

const toggleRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '28px'
};

const checkboxStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    cursor: 'pointer'
};

const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
};

const modalCardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '16px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box'
};

const modalTitleStyle: React.CSSProperties = {
    margin: '0 0 10px 0',
    fontSize: '17px',
    fontWeight: '800',
    color: '#991b1b',
    textAlign: 'center',
    letterSpacing: '-0.01em'
};

const modalTextStyle: React.CSSProperties = {
    color: '#64748b',
    fontSize: '13.5px',
    lineHeight: '1.6',
    margin: '0 0 28px 0',
    textAlign: 'center'
};

const modalDeleteBtnStyle: React.CSSProperties = {
    flex: 1.3,
    padding: '10px 20px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13.5px',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
    textAlign: 'center'
};

const dishTableWrapper: React.CSSProperties = {
    overflowX: 'auto'
};

const dishImageContainerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
    flexShrink: 0
};