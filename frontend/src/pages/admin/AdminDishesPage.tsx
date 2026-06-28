import React, {useEffect, useState} from 'react';
import axios from 'axios';

// --- 1. INTERFACES TYPES ---
interface CategoryResponse {
    id: number;
    name: string;
    description: string;
    isAvailable: boolean;
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

export default function AdminDishesPage() {
    // --- 2. STATES QUẢN LÝ DỮ LIỆU ---
    const [dishes, setDishes] = useState<DishResponse[]>([]);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Bộ lọc
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    // --- STATES QUẢN LÝ ĐÓNG/MỞ MODAL ---
    const [activeModal, setActiveModal] = useState<'NONE' | 'CREATE' | 'VIEW' | 'EDIT' | 'DELETE'>('NONE');
    const [selectedDish, setSelectedDish] = useState<DishResponse | null>(null);

    // Form dữ liệu phục vụ Thêm / Sửa
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        price: 0,
        description: '',
        imageUrl: '',
        isAvailable: true
    });

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // --- 3. HÀM FETCH DỮ LIỆU TỪ BACKEND ---
    const loadAllData = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = {Authorization: token ? `Bearer ${token}` : ''};

            const [dishRes, catRes] = await Promise.all([
                axios.get('http://localhost:8080/rims/admin/dish/all', {headers}),
                axios.get('http://localhost:8080/rims/admin/category/all', {headers})
            ]);

            setDishes(dishRes.data);
            setCategories(catRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Lỗi tải dữ liệu món ăn:", err);
            setError("Không thể tải danh sách món ăn từ hệ thống.");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // --- 4. CÁC HÀM XỬ LÝ NGHIỆP VỤ API (CRUD) ---
    const handleCreateDish = async (e: React.FormEvent) => {
        e.preventDefault();

        const catIdParsed = parseInt(formData.categoryId);
        if (isNaN(catIdParsed) || catIdParsed <= 0) {
            alert("Lỗi: Vui lòng lựa chọn một Danh mục món ăn hợp lệ!");
            return;
        }

        const targetCategory = categories.find(c => c.id === catIdParsed);
        if (targetCategory && !targetCategory.isAvailable) {
            alert(`Lỗi: Danh mục "${targetCategory.name}" đang bị ẩn, không thể thêm món ăn mới vào đây!`);
            return;
        }

        if (formData.imageUrl && formData.imageUrl.length > 500) {
            alert("Lỗi: Đường dẫn hình ảnh quá dài (tối đa 500 ký tự)!");
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const body = {
                name: formData.name.trim(),
                description: formData.description,
                price: formData.price,
                imageUrl: formData.imageUrl,
                categoryId: catIdParsed,
                isAvailable: formData.isAvailable
            };

            await axios.post('http://localhost:8080/rims/admin/dish/new', body, {
                headers: {Authorization: token ? `Bearer ${token}` : ''}
            });
            setActiveModal('NONE');
            loadAllData();
        } catch (err) {
            alert("Lỗi khi thêm món ăn mới!");
        }
    };

    const handleUpdateDish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDish || isSubmitting) return;

        const catIdParsed = parseInt(formData.categoryId);
        if (isNaN(catIdParsed) || catIdParsed <= 0) {
            alert("Lỗi: Vui lòng lựa chọn một Danh mục món ăn hợp lệ!");
            return;
        }

        const targetCategory = categories.find(c => c.id === catIdParsed);
        if (targetCategory && !targetCategory.isAvailable) {
            alert(`Lỗi: Danh mục "${targetCategory.name}" đang bị ẩn, không thể lưu hoặc chuyển món ăn tới danh mục này!`);
            return;
        }

        if (formData.imageUrl && formData.imageUrl.length > 500) {
            alert("Lỗi: Đường dẫn hình ảnh quá dài (tối đa 500 ký tự)!");
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('accessToken');
            const body = {
                name: formData.name.trim(),
                description: formData.description,
                price: formData.price,
                imageUrl: formData.imageUrl,
                categoryId: catIdParsed,
                isAvailable: formData.isAvailable
            };

            await axios.put(`http://localhost:8080/rims/admin/dish/update/${selectedDish.id}`, body, {
                headers: {Authorization: token ? `Bearer ${token}` : ''}
            });
            setActiveModal('NONE');
            loadAllData();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || "Lỗi khi cập nhật món ăn!";
            alert(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDish = async () => {
        if (!selectedDish) return;
        try {
            const token = localStorage.getItem('accessToken');
            await axios.delete(`http://localhost:8080/rims/admin/dish/delete/${selectedDish.id}`, {
                headers: {Authorization: token ? `Bearer ${token}` : ''}
            });
            setActiveModal('NONE');
            loadAllData();
        } catch (err) {
            alert("Lỗi khi xóa món ăn!");
        }
    };

    const openFormWithDish = (dish: DishResponse, modalType: 'VIEW' | 'EDIT') => {
        setSelectedDish(dish);
        const foundCategory = categories.find(c => c.name === dish.categoryName);

        setFormData({
            name: dish.name,
            categoryId: foundCategory ? foundCategory.id.toString() : '',
            price: dish.price,
            description: dish.description || '',
            imageUrl: dish.imageUrl || '',
            isAvailable: dish.isAvailable
        });
        setActiveModal(modalType);
    };

    // --- 5. LOGIC BỘ LỌC FRONTEND ---
    const filteredDishes = dishes.filter(dish => {
        const matchesKeyword = dish.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            `#sku-${String(dish.id).padStart(5, '0')}`.includes(searchKeyword.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || dish.categoryName === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' ||
            (selectedStatus === 'AVAILABLE' && dish.isAvailable) ||
            (selectedStatus === 'PAUSED' && !dish.isAvailable);

        return matchesKeyword && matchesCategory && matchesStatus;
    });

    const activeCategories = categories.filter(c => c.isAvailable);

    if (loading) return <div style={statusContainerStyle}>🔄 Đang tải danh sách món ăn hệ thống...</div>;
    if (error) return <div style={{...statusContainerStyle, color: '#ef4444'}}>❌ {error}</div>;

    return (
        <div style={pageContainerStyle}>

            {/* TIÊU ĐỀ TRANG & NÚT MỞ FORM THÊM MÓN MỚI */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px'}}>
                <div>
                    <h2 style={pageTitleStyle}>🍳 QUẢN LÝ MÓN ĂN</h2>
                </div>
                <button
                    onClick={() => {
                        setFormData({
                            name: '',
                            categoryId: activeCategories[0]?.id.toString() || '',
                            price: 0,
                            description: '',
                            imageUrl: '',
                            isAvailable: true
                        });
                        setActiveModal('CREATE');
                    }}
                    style={primaryBtnStyle}
                >
                    <span>+</span> Thêm Món Ăn
                </button>
            </div>

            {/* THANH BỘ LỌC TÌM KIẾM & THẺ THỐNG KÊ */}
            <div style={{display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px', marginBottom: '28px'}}>
                <div style={cardStyle}>
                    <div style={{display: 'flex', gap: '14px', alignItems: 'center', height: '100%'}}>
                        <input
                            type="text"
                            placeholder="Tìm theo tên món ăn hoặc mã SKU..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            style={searchInputStyle}
                        />
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                                style={selectStyle}>
                            <option value="ALL">Tất cả danh mục</option>
                            {categories.map(cat => {
                                const displayName = cat.name.length > 25
                                    ? cat.name.slice(0, 25) + '...'
                                    : cat.name;
                                return (
                                    <option key={cat.id} value={cat.name}>
                                        {displayName} {!cat.isAvailable ? '(Đang ẩn)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                                style={selectStyle}>
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="AVAILABLE">Đang bán</option>
                            <option value="PAUSED">Tạm dừng</option>
                        </select>
                    </div>
                </div>
                <div style={{
                    ...cardStyle,
                    background: 'linear-gradient(135deg, #0052cc 0%, #0747a6 100%)',
                    border: 'none',
                    color: '#fff'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '100%'
                    }}>
                        <div>
                            <span style={{fontSize: '11px', opacity: 0.8, fontWeight: '700', letterSpacing: '0.05em'}}>MÓN TÌM THẤY</span>
                            <h2 style={{
                                margin: '2px 0 0 0',
                                fontSize: '28px',
                                fontWeight: '800',
                                letterSpacing: '-0.02em'
                            }}>{filteredDishes.length}</h2>
                        </div>
                        <span style={{
                            fontSize: '22px',
                            background: 'rgba(255,255,255,0.18)',
                            padding: '8px 12px',
                            borderRadius: '12px',
                            lineHeight: '1'
                        }}>🍴</span>
                    </div>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU CHÍNH */}
            <div style={{...cardStyle, padding: '0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'}}>
                <table style={tableStyle}>
                    <thead>
                    <tr style={tableHeaderRowStyle}>
                        <th style={{padding: '16px', width: '90px'}}>HÌNH ẢNH</th>
                        <th style={{padding: '16px'}}>TÊN MÓN ĂN</th>
                        <th style={{padding: '16px'}}>DANH MỤC</th>
                        <th style={{padding: '16px'}}>GIÁ NIÊM YẾT</th>
                        <th style={{padding: '16px', textAlign: 'center', width: '130px'}}>TRẠNG THÁI</th>
                        <th style={{padding: '16px', width: '130px'}}>NGÀY TẠO</th>
                        <th style={{padding: '16px', textAlign: 'center', width: '140px'}}>THAO TÁC</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredDishes.map((dish) => {
                        const isParentCategoryHidden = categories.find(c => c.name === dish.categoryName)?.isAvailable === false;

                        return (
                            <tr key={dish.id} style={tableRowStyle}>
                                <td style={{padding: '16px'}}>
                                    <div style={dishImageContainerStyle}>
                                        <img
                                            src={dish.imageUrl.startsWith('http') ? dish.imageUrl : `/image/${dish.imageUrl}`}
                                            alt={dish.name}
                                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=🍲'
                                            }}
                                        />
                                    </div>
                                </td>
                                <td style={{padding: '16px'}}>
                                    <div style={{
                                        fontWeight: '700',
                                        color: '#0f172a',
                                        fontSize: '14.5px'
                                    }}>{dish.name}</div>
                                    <small style={{
                                        color: '#94a3b8',
                                        fontSize: '11.5px',
                                        fontFamily: 'monospace',
                                        display: 'block',
                                        marginTop: '2px'
                                    }}>SKU-{String(dish.id).padStart(5, '0')}</small>
                                </td>
                                <td style={{padding: '16px'}}>
                                        <span style={categoryBadgeStyle(isParentCategoryHidden)}>
                                            {dish.categoryName} {isParentCategoryHidden ? '(Ẩn)' : ''}
                                        </span>
                                </td>
                                <td style={{padding: '16px', fontWeight: '700', color: '#0052cc', fontSize: '15px'}}>
                                    {dish.price.toLocaleString('vi-VN')}đ
                                </td>
                                <td style={{padding: '16px', textAlign: 'center'}}>
                                        <span style={statusBadgeStyle(dish.isAvailable)}>
                                            {dish.isAvailable ? '● Đang bán' : '● Tạm dừng'}
                                        </span>
                                </td>
                                <td style={{padding: '16px', color: '#64748b', fontWeight: '500'}}>
                                    {new Date(dish.createdAt).toLocaleDateString('vi-VN')}
                                </td>
                                <td style={{padding: '16px', textAlign: 'center'}}>
                                    <div style={{display: 'flex', justifyContent: 'center', gap: '6px'}}>
                                        <button onClick={() => openFormWithDish(dish, 'VIEW')} style={actionBtnStyle}
                                                title="Xem chi tiết">👁️
                                        </button>
                                        <button
                                            onClick={() => openFormWithDish(dish, 'EDIT')}
                                            disabled={!dish.isAvailable || isParentCategoryHidden}
                                            style={editBtnStyle(dish.isAvailable && !isParentCategoryHidden)}
                                            title={!dish.isAvailable ? "Món ăn tạm dừng" : isParentCategoryHidden ? "Danh mục cha đã bị ẩn" : "Chỉnh sửa"}
                                        >
                                            ✏️
                                        </button>
                                        <button onClick={() => {
                                            setSelectedDish(dish);
                                            setActiveModal('DELETE');
                                        }} style={{...actionBtnStyle, color: '#ef4444'}} title="Xóa món">🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                {filteredDishes.length === 0 && (
                    <div style={{padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: '600'}}>Không tìm
                        thấy món ăn nào phù hợp với bộ lọc.</div>
                )}
            </div>

            {/* ========================================================= */}
            {/* 1. INTERFACE: MODAL THÊM MÓN ĂN MỚI */}
            {/* ========================================================= */}
            {activeModal === 'CREATE' && (
                <div style={backdropStyle}>
                    <form onSubmit={handleCreateDish} style={{
                        ...modalCardStyle,
                        width: '800px',
                        display: 'grid',
                        gridTemplateColumns: '1.7fr 1fr',
                        gap: '24px'
                    }}>
                        <div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
                                <button type="button" onClick={() => setActiveModal('NONE')}
                                        style={backBtnStyle}>&larr;</button>
                                <h3 style={{margin: 0, fontWeight: '800', fontSize: '18px', color: '#0f172a'}}>➕ THÊM
                                    MÓN ĂN MỚI</h3>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
                                <div>
                                    <label style={inputLabelStyle}>TÊN MÓN ĂN *</label>
                                    <input type="text" required placeholder="Ví dụ: Phở Bò Tái Lăn"
                                           value={formData.name}
                                           onChange={e => setFormData({...formData, name: e.target.value})}
                                           style={inputFormStyle}/>
                                </div>

                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                    <div>
                                        <label style={inputLabelStyle}>DANH MỤC THỰC ĐƠN</label>
                                        <select value={formData.categoryId}
                                                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                                                style={selectFormStyle}>
                                            {activeCategories.map(c => <option key={c.id}
                                                                               value={c.id}>{c.name}</option>)}
                                        </select>
                                        {activeCategories.length === 0 &&
                                            <small style={{color: '#ef4444', display: 'block', marginTop: '4px'}}>Không
                                                có danh mục khả dụng!</small>}
                                    </div>
                                    <div>
                                        <label style={inputLabelStyle}>GIÁ BÁN (VNĐ) *</label>
                                        <input type="number" required value={formData.price || ''} placeholder="0"
                                               onChange={e => setFormData({
                                                   ...formData,
                                                   price: parseInt(e.target.value) || 0
                                               })} style={inputFormStyle}/>
                                    </div>
                                </div>

                                <div>
                                    <label style={inputLabelStyle}>MÔ TẢ MÓN ĂN</label>
                                    <textarea rows={4}
                                              placeholder="Mô tả tóm tắt hương vị, các thành phần nguyên liệu đặc biệt..."
                                              value={formData.description}
                                              onChange={e => setFormData({...formData, description: e.target.value})}
                                              style={{...inputFormStyle, resize: 'none', lineHeight: '1.5'}}/>
                                </div>

                                <div style={toggleRowStyle}>
                                    <div>
                                        <strong style={{fontSize: '13.5px', display: 'block', color: '#0f172a'}}>Trạng
                                            thái công khai</strong>
                                        <small style={{color: '#64748b'}}>Cho phép hiển thị và đặt món trên menu trực
                                            tuyến</small>
                                    </div>
                                    <input type="checkbox" checked={formData.isAvailable}
                                           onChange={e => setFormData({...formData, isAvailable: e.target.checked})}
                                           style={{width: '18px', height: '18px', cursor: 'pointer'}}/>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            borderLeft: '1px solid #f1f5f9',
                            paddingLeft: '24px'
                        }}>
                            <div>
                                <label style={inputLabelStyle}>HÌNH ẢNH MINH HỌA</label>
                                <div style={imagePreviewWrapperStyle}>
                                    {formData.imageUrl ? <img src={formData.imageUrl} style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }} alt="Preview"/> :
                                        <div style={{textAlign: 'center', color: '#94a3b8'}}><span>🖼️</span><small
                                            style={{display: 'block', marginTop: '4px'}}>Chưa có hình ảnh</small></div>}
                                </div>
                                <input type="text" placeholder="Dán URL hình ảnh đường dẫn công khai (https://...)"
                                       value={formData.imageUrl}
                                       onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                                       style={inputFormStyle}/>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                marginTop: '20px',
                                borderTop: '1px solid #f1f5f9',
                                paddingTop: '16px'
                            }}>
                                <button type="submit" disabled={activeCategories.length === 0} style={{
                                    ...primaryBtnStyle,
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '12px',
                                    backgroundColor: activeCategories.length === 0 ? '#94a3b8' : '#0052cc',
                                    cursor: activeCategories.length === 0 ? 'not-allowed' : 'pointer'
                                }}>💾 Thêm món ăn
                                </button>
                                <button type="button" onClick={() => setActiveModal('NONE')}
                                        style={{...secondaryBtnStyle, width: '100%'}}>Hủy bỏ
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL XEM CHI TIẾT MÓN ĂN */}
            {activeModal === 'VIEW' && selectedDish && (
                <div style={backdropStyle}>
                    <div style={{
                        ...modalCardStyle,
                        width: '700px',
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1.5fr',
                        gap: '28px',
                        padding: '32px'
                    }}>
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '20px'
                            }}>
                                <button onClick={() => setActiveModal('NONE')} style={backBtnStyle}>&larr;</button>
                                <span style={{
                                    padding: '5px 12px',
                                    background: selectedDish.isAvailable ? '#dcfce7' : '#fef3c7',
                                    color: selectedDish.isAvailable ? '#15803d' : '#d97706',
                                    borderRadius: '20px',
                                    fontSize: '11.5px',
                                    fontWeight: '700'
                                }}>
                        {selectedDish.isAvailable ? '● Đang bán' : '● Tạm ngưng'}
                    </span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '230px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '1px solid #cbd5e1',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                            }}>
                                <img
                                    src={selectedDish.imageUrl.startsWith('http') ? selectedDish.imageUrl : `/image/${selectedDish.imageUrl}`}
                                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                    alt={selectedDish.name}/>
                            </div>
                            <div style={{
                                backgroundColor: '#f8fafc',
                                padding: '12px',
                                borderRadius: '10px',
                                marginTop: '16px',
                                textAlign: 'center',
                                fontSize: '12.5px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <span style={{color: '#94a3b8', fontWeight: '700'}}>MÃ SKU:</span> <strong style={{
                                color: '#0f172a',
                                fontFamily: 'monospace'
                            }}>#SKU-{String(selectedDish.id).padStart(5, '0')}</strong>
                            </div>
                        </div>

                        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                            <div>
                                <span style={{
                                    padding: '4px 10px',
                                    background: '#e0e7ff',
                                    color: '#4338ca',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                }}>{selectedDish.categoryName.toUpperCase()}</span>
                                <h2 style={{
                                    margin: '10px 0 6px 0',
                                    fontSize: '24px',
                                    fontWeight: '800',
                                    color: '#0f172a',
                                    letterSpacing: '-0.02em'
                                }}>{selectedDish.name}</h2>
                                <h3 style={{
                                    margin: '0 0 16px 0',
                                    color: '#0052cc',
                                    fontSize: '22px',
                                    fontWeight: '800'
                                }}>{selectedDish.price.toLocaleString('vi-VN')}đ</h3>
                                <hr style={{border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0'}}/>
                                <h4 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '11px',
                                    color: '#94a3b8',
                                    fontWeight: '800',
                                    letterSpacing: '0.05em'
                                }}>MÔ TẢ CHI TIẾT</h4>
                                <div style={{
                                    fontSize: '13.5px',
                                    color: '#475569',
                                    lineHeight: '1.6',
                                    maxHeight: '140px',
                                    overflowY: 'auto',
                                    paddingRight: '8px',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {selectedDish.description || "Không có mô tả thông tin cụ thể cho món ăn này."}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '24px',
                                borderTop: '1px solid #f1f5f9',
                                paddingTop: '16px'
                            }}>
                                {selectedDish.isAvailable && (categories.find(c => c.name === selectedDish.categoryName)?.isAvailable !== false) ? (
                                    <button
                                        onClick={() => setActiveModal('EDIT')}
                                        style={{...primaryBtnStyle, flex: 1, justifyContent: 'center'}}
                                    >
                                        📝 Chỉnh sửa
                                    </button>
                                ) : (
                                    <div style={{
                                        flex: 1,
                                        color: '#ef4444',
                                        fontSize: '12.5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#fef2f2',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        border: '1px solid #fca5a5',
                                        padding: '8px'
                                    }}>
                                        🔒 Ngưng bán / Mục cha ẩn
                                    </div>
                                )}
                                <button onClick={() => setActiveModal('DELETE')} style={{
                                    ...secondaryBtnStyle,
                                    backgroundColor: '#fee2e2',
                                    color: '#ef4444',
                                    borderColor: '#fca5a5'
                                }}>🗑️ Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 3. INTERFACE: MODAL CHỈNH SỬA MÓN ĂN */}
            {/* ========================================================= */}
            {activeModal === 'EDIT' && selectedDish && (
                <div style={backdropStyle}>
                    <form onSubmit={handleUpdateDish} style={{
                        ...modalCardStyle,
                        width: '850px',
                        display: 'grid',
                        gridTemplateColumns: '1.6fr 1fr',
                        gap: '28px'
                    }}>
                        <div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
                                <button type="button" onClick={() => setActiveModal('NONE')}
                                        style={backBtnStyle}>&larr;</button>
                                <h3 style={{margin: 0, fontWeight: '800', fontSize: '18px', color: '#0f172a'}}>✏️ CHỈNH
                                    SỬA MÓN ĂN</h3>
                            </div>

                            <div style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
                                <div style={{display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px'}}>
                                    <div>
                                        <label style={inputLabelStyle}>TÊN MÓN ĂN</label>
                                        <input type="text" value={formData.name}
                                               onChange={e => setFormData({...formData, name: e.target.value})}
                                               style={inputFormStyle}/>
                                    </div>
                                    <div>
                                        <label style={inputLabelStyle}>DANH MỤC</label>
                                        <select value={formData.categoryId}
                                                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                                                style={selectFormStyle}>
                                            <option value="">-- Chọn danh mục --</option>
                                            {activeCategories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px'}}>
                                    <div>
                                        <label style={inputLabelStyle}>GIÁ BÁN (VNĐ)</label>
                                        <input type="number" value={formData.price} onChange={e => setFormData({
                                            ...formData,
                                            price: parseInt(e.target.value) || 0
                                        })} style={inputFormStyle}/>
                                    </div>
                                    <div>
                                        <label style={inputLabelStyle}>TRẠNG THÁI KINH DOANH</label>
                                        <div style={{display: 'flex', gap: '16px', marginTop: '10px'}}>
                                            <label style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '13.5px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                color: '#334155'
                                            }}>
                                                <input type="radio" name="availability"
                                                       checked={formData.isAvailable === true}
                                                       onChange={() => setFormData({
                                                           ...formData,
                                                           isAvailable: true
                                                       })}/> 🟢 Có sẵn
                                            </label>
                                            <label style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '13.5px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                color: '#334155'
                                            }}>
                                                <input type="radio" name="availability"
                                                       checked={formData.isAvailable === false}
                                                       onChange={() => setFormData({
                                                           ...formData,
                                                           isAvailable: false
                                                       })}/> 🔴 Tạm dừng
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={inputLabelStyle}>MÔ TẢ CHI TIẾT</label>
                                    <textarea rows={4} value={formData.description}
                                              onChange={e => setFormData({...formData, description: e.target.value})}
                                              style={{...inputFormStyle, resize: 'none', lineHeight: '1.5'}}/>
                                </div>

                                <div>
                                    <label style={inputLabelStyle}>ĐƯỜNG DẪN HÌNH ANH (URL)</label>
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <input type="text" value={formData.imageUrl}
                                               onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                                               style={{...inputFormStyle, margin: 0}}/>
                                        <button type="button" style={{
                                            padding: '0 16px',
                                            background: '#e2e8f0',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            color: '#475569'
                                        }}>Tải lên
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '32px',
                                justifyContent: 'flex-end',
                                borderTop: '1px solid #f1f5f9',
                                paddingTop: '20px'
                            }}>
                                <button type="button" onClick={() => setActiveModal('NONE')}
                                        style={secondaryBtnStyle}>HỦY
                                </button>
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
                                    {isSubmitting ? '⏳ ĐANG LƯU...' : '💾 CẬP NHẬT'}
                                </button>
                            </div>
                        </div>

                        {/* Cột phải xem trước hình ảnh */}
                        <div style={{
                            borderLeft: '1px solid #f1f5f9',
                            paddingLeft: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{
                                    background: '#f1f5f9',
                                    padding: '10px 14px',
                                    borderRadius: '8px 8px 0 0',
                                    fontWeight: '700',
                                    fontSize: '11.5px',
                                    color: '#475569',
                                    letterSpacing: '0.03em'
                                }}>XEM TRƯỚC HIỂN THỊ CHUẨN
                                </div>
                                <div style={{
                                    border: '1px solid #cbd5e1',
                                    borderTop: 'none',
                                    borderRadius: '0 0 12px 12px',
                                    background: '#fff',
                                    padding: '16px',
                                    boxSizing: 'border-box'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        height: '180px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        marginBottom: '14px',
                                        boxShadow: 'inset 0 0 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <img src={formData.imageUrl || 'https://placehold.co/300x200?text=No+Image'}
                                             style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="Preview"/>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{
                                            fontSize: '11px',
                                            background: '#ef4444',
                                            color: '#fff',
                                            padding: '3px 8px',
                                            borderRadius: '20px',
                                            fontWeight: '700'
                                        }}>BÁN CHẠY</span>
                                        <strong style={{
                                            color: '#0f172a',
                                            fontSize: '16px',
                                            fontWeight: '800'
                                        }}>{formData.price.toLocaleString()}đ</strong>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '24px',
                                padding: '16px',
                                background: '#fef2f2',
                                border: '1px solid #fca5a5',
                                borderRadius: '12px'
                            }}>
                                <h5 style={{
                                    margin: '0 0 6px 0',
                                    color: '#991b1b',
                                    fontWeight: '800',
                                    fontSize: '13.5px'
                                }}>🚨 KHU VỰC NGUY HIỂM</h5>
                                <p style={{
                                    fontSize: '12px',
                                    color: '#7f1d1d',
                                    margin: '0 0 14px 0',
                                    lineHeight: '1.5'
                                }}>Thực hiện xóa sẽ gỡ bỏ hoàn toàn dữ liệu món ăn này khỏi hệ thống cơ sở dữ liệu.</p>
                                <button type="button" onClick={() => setActiveModal('DELETE')} style={{
                                    width: '100%',
                                    backgroundColor: '#dc2626',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    boxShadow: '0 4px 10px rgba(220,38,38,0.15)'
                                }}>XÓA MÓN ĂN KHỎI MENU
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* ========================================================= */}
            {/* 4. INTERFACE: MODAL ALERT XÁC NHẬN XÓA MÓN */}
            {/* ========================================================= */}
            {activeModal === 'DELETE' && selectedDish && (
                <div style={backdropStyle}>
                    <div style={{...modalCardStyle, width: '400px', textAlign: 'center', padding: '32px'}}>
                        <div style={{fontSize: '36px', marginBottom: '12px'}}>⚠️</div>
                        <h3 style={{margin: '0 0 10px 0', fontWeight: '800', color: '#991b1b', fontSize: '17px'}}>XÓA
                            MÓN ĂN</h3>
                        <p style={{color: '#64748b', fontSize: '13.5px', lineHeight: '1.6', marginBottom: '28px'}}>
                            Bạn có chắc chắn muốn xóa món ăn <strong
                            style={{color: '#0f172a'}}>“{selectedDish.name}”</strong>? Hành động gỡ bỏ này không thể
                            hoàn tác.
                        </p>
                        <div style={{display: 'flex', gap: '12px'}}>
                            <button onClick={handleDeleteDish} style={modalDeleteBtnStyle}>Xác nhận xóa</button>
                            <button onClick={() => setActiveModal('NONE')} style={{...secondaryBtnStyle, flex: 1}}>Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// --- 6. MODERN LOOK UI INLINE CSS STYLES ---
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

const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)',
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box'
};

const searchInputStyle: React.CSSProperties = {
    flex: 1.5,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box'
};

const selectStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: '13.5px',
    color: '#475569',
    outline: 'none',
    maxWidth: '220px',      // ← thêm
    overflow: 'hidden',     // ← thêm
    textOverflow: 'ellipsis' // ← thêm
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
    boxShadow: '0 4px 10px rgba(0, 82, 204, 0.25)'
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
    textAlign: 'center',
    boxSizing: 'border-box'
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13.5px'
};

const tableHeaderRowStyle: React.CSSProperties = {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontWeight: '700'
};

const tableRowStyle: React.CSSProperties = {
    borderBottom: '1px solid #f1f5f9'
};

const dishImageContainerStyle: React.CSSProperties = {
    width: '46px',
    height: '46px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0'
};

const categoryBadgeStyle = (isHidden: boolean): React.CSSProperties => ({
    background: isHidden ? '#fee2e2' : '#f1f5f9',
    color: isHidden ? '#991b1b' : '#334155',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: '600',
    display: 'inline-block'
});

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
    color: '#475569'
};

const editBtnStyle = (isActive: boolean): React.CSSProperties => ({
    ...actionBtnStyle,
    color: isActive ? '#475569' : '#cbd5e1',
    cursor: isActive ? 'pointer' : 'not-allowed',
    background: isActive ? '#f1f5f9' : '#f8fafc'
});

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
    backgroundColor: '#ffffff',
    padding: '28px',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
    border: '1px solid #e2e8f0',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxSizing: 'border-box'
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

const inputFormStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#f8fafc'
};

const selectFormStyle: React.CSSProperties = {
    ...inputFormStyle,
    cursor: 'pointer'
};

const toggleRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
};

const imagePreviewWrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '180px',
    border: '1px dashed #cbd5e1',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    marginBottom: '14px',
    overflow: 'hidden'
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
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
};