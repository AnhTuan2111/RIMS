import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- 1. INTERFACES TYPES ---
export interface DishSummary {
    id: number;
    name: string;
    categoryName: string;
    price: number;
    imageUrl: string;
    status: 'AVAILABLE' | 'PAUSED';
}

export interface CategoryStat {
    categoryName: string;
    status: 'ACTIVE' | 'HIDDEN';
    dishCount: number;
}

export interface MenuDashboardData {
    totalDishes: number;
    totalCategories: number;
    totalPausedDishes: number;
    totalHiddenDishes: number;
    latestDishes: DishSummary[];
    categoryStats: CategoryStat[];
    allPausedDishesList?: DishSummary[];
}

export default function AdminMenuDashboardPage() {
    const [data, setData] = useState<MenuDashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const headers = { Authorization: token ? `Bearer ${token}` : '' };

                // Gọi đồng thời cả 3 API: Dashboard, Toàn bộ Danh mục, và Toàn bộ Món ăn
                const [menuRes, catRes, allDishesRes] = await Promise.all([
                    axios.get('http://localhost:8080/rims/admin/menu', { signal: controller.signal, headers }),
                    axios.get('http://localhost:8080/rims/admin/category/all', { signal: controller.signal, headers }),
                    axios.get('http://localhost:8080/rims/admin/dish/all', { signal: controller.signal, headers })
                ]);

                if (isMounted) {
                    // 1. Hòa trộn danh mục gốc để tính toán dishCount real-time
                    const finalCatStats = catRes.data.map((c: any) => {
                        const statMatch = menuRes.data.categoryStats?.find(
                            (s: any) => s.categoryName.toLowerCase() === c.name.toLowerCase()
                        );
                        return {
                            categoryName: c.name,
                            status: c.isAvailable ? 'ACTIVE' : 'HIDDEN',
                            dishCount: statMatch ? statMatch.dishCount : 0
                        };
                    });

                    const realHiddenCategoriesCount = finalCatStats.filter(c => c.status === 'HIDDEN').length;

                    // 2. Lấy toàn bộ danh sách món ăn đang bị tạm ngưng kinh doanh trên hệ thống
                    // Khớp thuộc tính isAvailable = false từ DishResponse DTO Backend
                    const allPausedDishes = allDishesRes.data.filter((d: any) => !d.isAvailable).map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        categoryName: d.categoryName,
                        price: d.price,
                        imageUrl: d.imageUrl,
                        status: 'PAUSED' as const
                    }));

                    setData({
                        ...menuRes.data,
                        totalCategories: catRes.data.length,
                        totalHiddenDishes: realHiddenCategoriesCount,
                        totalPausedDishes: allPausedDishes.length, // Cập nhật con số tổng trên thẻ thống kê top
                        categoryStats: finalCatStats,
                        // Ép mảng cần chú ý thành toàn bộ món tạm dừng thay vì chỉ lọc trong món mới
                        allPausedDishesList: allPausedDishes
                    });
                    setLoading(false);
                }
            } catch (err) {
                if (axios.isCancel(err)) return;
                if (isMounted) {
                    console.error("Lỗi khi fetch dữ liệu dashboard:", err);
                    setError("Không thể tải dữ liệu thống kê từ hệ thống.");
                    setLoading(false);
                }
            }
        };

        fetchDashboardData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    if (loading) return <div style={statusContainerStyle}>🔄 Đang tải dữ liệu hệ thống dashboard...</div>;
    if (error) return <div style={{ ...statusContainerStyle, color: '#ef4444' }}>❌ {error}</div>;

    return (
        <div style={pageContainerStyle}>

            {/* TIÊU ĐỀ TRANG */}
            <div style={{ marginBottom: '28px' }}>
                <h2 style={pageTitleStyle}>📋 TỔNG QUAN THỰC ĐƠN</h2>
            </div>

            {/* KHỐI 1: 4 THẺ CHỈ SỐ THỐNG KÊ TRÊN CÙNG (Gradient Light) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: 'none' }}>
                    <div style={statsCardInnerStyle}>
                        <div>
                            <span style={{ color: '#4338ca', fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em' }}>TỔNG SỐ MÓN</span>
                            <h2 style={statsNumberStyle}>{data?.totalDishes}</h2>
                        </div>
                        <span style={badgeIconStyle('#ffffff')}>🍴</span>
                    </div>
                </div>

                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: 'none' }}>
                    <div style={statsCardInnerStyle}>
                        <div>
                            <span style={{ color: '#065f46', fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em' }}>DANH MỤC</span>
                            <h2 style={statsNumberStyle}>{data?.totalCategories}</h2>
                        </div>
                        <span style={badgeIconStyle('#ffffff')}>🗂️</span>
                    </div>
                </div>

                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: 'none' }}>
                    <div style={statsCardInnerStyle}>
                        <div>
                            <span style={{ color: '#92400e', fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em' }}>TẠM DỪNG BÁN</span>
                            <h2 style={statsNumberStyle}>{data?.totalPausedDishes}</h2>
                        </div>
                        <span style={badgeIconStyle('#ffffff')}>⏸️</span>
                    </div>
                </div>

                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: 'none' }}>
                    <div style={statsCardInnerStyle}>
                        <div>
                            <span style={{ color: '#991b1b', fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em' }}>DANH MỤC ẨN</span>
                            <h2 style={statsNumberStyle}>{data?.totalHiddenDishes}</h2>
                        </div>
                        <span style={badgeIconStyle('#ffffff')}>👁️‍🗨️</span>
                    </div>
                </div>
            </div>

            {/* KHỐI 2: CHIA HAI CỘT LỚN CÓ SỬ DỤNG FLEX ĐỂ CĂN ĐỀU CHIỀU CAO HÀNG */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '28px' }}>

                {/* CỘT TRÁI (Danh mục món ăn & Theo danh mục) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                    {/* HÀNG TRÊN: Danh mục món ăn */}
                    <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
                        <div style={sectionHeaderStyle}>
                            <h3 style={sectionTitleStyle}>Danh mục thực đơn</h3>
                            <span onClick={() => navigate('/admin/categories')} style={manageLinkStyle}>Quản lý danh mục &rarr;</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '310px', paddingRight: '4px' }}>
                            {data?.categoryStats.map((cat, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: idx !== data.categoryStats.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                    <div>
                                        <div style={{
                                            fontWeight: '700',
                                            fontSize: '14px',
                                            color: '#0f172a',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word'
                                        }}>{cat.categoryName}</div>
                                        <small style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', display: 'block' }}>{cat.dishCount} món ăn liên kết</small>
                                    </div>
                                    <span style={statusBadgeStyle(cat.status === 'ACTIVE')}>
                                        {cat.status === 'ACTIVE' ? '● Hoạt động' : '● Đang ẩn'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* HÀNG DƯỚI: Theo tỷ lệ phần trăm món ăn */}
                    <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
                        <h3 style={{ ...sectionTitleStyle, marginBottom: '20px' }}>Tỷ lệ món theo danh mục</h3>
                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '310px', paddingRight: '4px' }}>
                            {data?.categoryStats.map((cat, idx) => {
                                const percentage = data.totalDishes > 0 ? (cat.dishCount / data.totalDishes) * 100 : 0;
                                return (
                                    <div key={idx} style={{ marginBottom: '18px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>
                                            <span>{cat.categoryName}</span>
                                            <span style={{ color: '#0052cc' }}>{cat.dishCount} ({percentage.toFixed(0)}%)</span>
                                        </div>
                                        <div style={progressTrackStyle}>
                                            <div style={progressBarStyle(percentage)} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI (Món mới thêm & Cần chú ý) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                    {/* HÀNG TRÊN: Món mới thêm */}
                    <div style={{ ...cardStyle, flex: 1.2, display: 'flex', flexDirection: 'column', padding: '24px', overflow: 'hidden' }}>
                        <div style={sectionHeaderStyle}>
                            <h3 style={sectionTitleStyle}>Món ăn mới cập nhật</h3>
                            <span onClick={() => navigate('/admin/dishes')} style={manageLinkStyle}>Quản lý món &rarr;</span>
                        </div>
                        <div style={{ flex: 1, overflowX: 'auto' }}>
                            <table style={tableStyle}>
                                <thead>
                                <tr style={tableHeaderRowStyle}>
                                    <th style={{ padding: '12px 8px' }}>MÓN ĂN</th>
                                    <th style={{ padding: '12px 8px' }}>DANH MỤC</th>
                                    <th style={{ padding: '12px 8px' }}>GIÁ NIÊM YẾT</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>TRẠNG THÁI</th>
                                </tr>
                                </thead>
                                <tbody>
                                {data?.latestDishes.map((dish) => (
                                    <tr key={dish.id} style={tableRowStyle}>
                                        <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={dishImageWrapperStyle}>
                                                {dish.imageUrl ? (
                                                    <img
                                                        src={dish.imageUrl.startsWith('http') ? dish.imageUrl : `/image/${dish.imageUrl}`} //  Sửa thành dòng này
                                                        alt={dish.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).onerror = null;
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/36x36?text=🍲';
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '18px' }}>🍲</span>
                                                )}
                                            </div>
                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '13.5px' }}>{dish.name}</span>
                                        </td>
                                        <td style={{ padding: '12px 8px', color: '#64748b', fontWeight: '500' }}>
                                                <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                    {dish.categoryName}
                                                </span>
                                        </td>
                                        <td style={{ padding: '12px 8px', fontWeight: '700', color: '#0052cc' }}>{dish.price.toLocaleString('vi-VN')}đ</td>
                                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <span style={dishStatusBadgeStyle(dish.status === 'AVAILABLE')}>
                                                    {dish.status === 'AVAILABLE' ? 'Đang bán' : 'Tạm dừng'}
                                                </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* HÀNG DƯỚI: Cần chú ý (Hiển thị toàn bộ món tạm dừng thực tế) */}
                    <div style={{ ...cardStyle, flex: 0.8, display: 'flex', flexDirection: 'column', padding: '24px' }}>
                        <h3 style={{ ...sectionTitleStyle, color: '#991b1b', marginBottom: '16px' }}>
                            ⚠️ Cần chú ý (Món đang tạm dừng bán)
                        </h3>
                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px', paddingRight: '4px' }}>
                            {/* Đổi từ latestDishes sang mảng toàn bộ món ẩn allPausedDishesList */}
                            {!data?.allPausedDishesList || data.allPausedDishesList.length === 0 ? (
                                <div style={emptyWarningStyle}>🎉 Tuyệt vời! Hiện tại không có món ăn nào bị gián đoạn kinh doanh.</div>
                            ) : (
                                data.allPausedDishesList.map((dish) => (
                                    <div key={dish.id} style={warningItemStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ ...dishImageWrapperStyle, border: '1px solid #fcd5aa' }}>
                                                {dish.imageUrl ? (
                                                    <img
                                                        // Sửa luôn logic nhận diện URL ảnh online tại đây giống trang Món Ăn
                                                        src={dish.imageUrl.startsWith('http') ? dish.imageUrl : `/image/${dish.imageUrl}`}
                                                        alt={dish.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).onerror = null;
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/36x36?text=🍲';
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '18px' }}>🍲</span>
                                                )}
                                            </div>
                                            <div>
                                                <strong style={{ fontSize: '14px', color: '#92400e', display: 'block' }}>{dish.name}</strong>
                                                <small style={{ color: '#b45309', fontWeight: '500' }}>Thuộc nhóm: {dish.categoryName}</small>
                                            </div>
                                        </div>
                                        <span style={pausedLabelTagStyle}>TẠM NGƯNG</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- 3. MODERN LOOK UI INLINE CSS STYLES ---
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

const statsCardInnerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%'
};

const statsNumberStyle: React.CSSProperties = {
    margin: '4px 0 0 0',
    fontSize: '32px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.03em'
};

const badgeIconStyle = (bgColor: string): React.CSSProperties => ({
    fontSize: '22px',
    background: bgColor,
    padding: '10px',
    borderRadius: '12px',
    lineHeight: '1',
    boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
});

const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '12px'
};

const sectionTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.01em'
};

const manageLinkStyle: React.CSSProperties = {
    color: '#4f46e5',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'color 0.15s ease'
};

const statusBadgeStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '11.5px',
    fontWeight: '700',
    backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
    color: isActive ? '#15803d' : '#475569',
    display: 'inline-block'
});

const progressTrackStyle: React.CSSProperties = {
    width: '100%',
    height: '8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '20px',
    overflow: 'hidden'
};

const progressBarStyle = (percentage: number): React.CSSProperties => ({
    width: `${percentage}%`,
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: '20px',
    transition: 'width 0.5s ease-in-out'
});

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13.5px'
};

const tableHeaderRowStyle: React.CSSProperties = {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '700',
    borderBottom: '1px solid #e2e8f0'
};

const tableRowStyle: React.CSSProperties = {
    borderBottom: '1px solid #f8fafc',
    transition: 'background-color 0.15s ease'
};

const dishImageWrapperStyle: React.CSSProperties = {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
    flexShrink: 0
};

const dishStatusBadgeStyle = (isAvailable: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    backgroundColor: isAvailable ? '#e6f4ea' : '#fef3c7',
    color: isAvailable ? '#137333' : '#d97706',
    display: 'inline-block'
});

const emptyWarningStyle: React.CSSProperties = {
    color: '#15803d',
    fontSize: '13.5px',
    fontWeight: '600',
    padding: '16px',
    backgroundColor: '#dcfce7',
    borderRadius: '10px',
    textAlign: 'center'
};

const warningItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: '#fffbeb',
    borderRadius: '10px',
    border: '1px solid #fef3c7',
    marginBottom: '10px'
};

const pausedLabelTagStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '800',
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: '4px 8px',
    borderRadius: '6px',
    letterSpacing: '0.02em'
};