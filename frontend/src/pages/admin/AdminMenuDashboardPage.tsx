import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi, categoryApi, dishApi } from '../../api/admin';
import type { MenuDashboardData } from '../../api/admin';

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
                // Gọi đồng thời cả 3 API: Dashboard, Toàn bộ Danh mục, và Toàn bộ Món ăn
                const [menuRes, catRes, allDishesRes] = await Promise.all([
                    menuApi.getMenuDashboard(),
                    categoryApi.getAllCategories(),
                    dishApi.getAllDishes()
                ]);

                if (isMounted) {
                    // 1. Hòa trộn danh mục gốc để tính toán dishCount real-time
                    const finalCatStats = catRes.data.map((c) => {
                        const statMatch = menuRes.data.categoryStats?.find(
                            (s) => s.categoryName.toLowerCase() === c.name.toLowerCase()
                        );
                        return {
                            categoryName: c.name,
                            status: (c.isAvailable ? 'ACTIVE' : 'HIDDEN') as 'ACTIVE' | 'HIDDEN',
                            dishCount: statMatch ? statMatch.dishCount : 0
                        };
                    });

                    const realHiddenCategoriesCount = finalCatStats.filter(c => c.status === 'HIDDEN').length;

                    // 2. Lấy toàn bộ danh sách món ăn đang bị tạm ngưng kinh doanh trên hệ thống
                    const allPausedDishes = allDishesRes.data.filter((d) => !d.isAvailable).map((d) => ({
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
                        totalPausedDishes: allPausedDishes.length,
                        categoryStats: finalCatStats,
                        allPausedDishesList: allPausedDishes
                    });
                    setLoading(false);
                }
            } catch (err) {
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

    if (loading) return <div className="admin-menu-status">🔄 Đang tải dữ liệu hệ thống dashboard...</div>;
    if (error) return <div className="admin-menu-status admin-menu-status-error">❌ {error}</div>;

    return (
        <div className="admin-menu-page">
            {/* TIÊU ĐỀ TRANG */}
            <div className="admin-menu-header">
                <h2 className="admin-menu-page-title">📋 TỔNG QUAN THỰC ĐƠN</h2>
            </div>

            {/* KHỐI 1: 4 THẺ CHỈ SỐ THỐNG KÊ TRÊN CÙNG */}
            <div className="admin-menu-stats-grid">
                <div className="admin-menu-stat-card admin-menu-stat-total">
                    <div className="admin-menu-stat-inner">
                        <div>
                            <span className="admin-menu-stat-label">TỔNG SỐ MÓN</span>
                            <h2 className="admin-menu-stat-number">{data?.totalDishes}</h2>
                        </div>
                        <span className="admin-menu-stat-icon">🍴</span>
                    </div>
                </div>

                <div className="admin-menu-stat-card admin-menu-stat-categories">
                    <div className="admin-menu-stat-inner">
                        <div>
                            <span className="admin-menu-stat-label">DANH MỤC</span>
                            <h2 className="admin-menu-stat-number">{data?.totalCategories}</h2>
                        </div>
                        <span className="admin-menu-stat-icon">🗂️</span>
                    </div>
                </div>

                <div className="admin-menu-stat-card admin-menu-stat-paused">
                    <div className="admin-menu-stat-inner">
                        <div>
                            <span className="admin-menu-stat-label">TẠM DỪNG BÁN</span>
                            <h2 className="admin-menu-stat-number">{data?.totalPausedDishes}</h2>
                        </div>
                        <span className="admin-menu-stat-icon">⏸️</span>
                    </div>
                </div>

                <div className="admin-menu-stat-card admin-menu-stat-hidden">
                    <div className="admin-menu-stat-inner">
                        <div>
                            <span className="admin-menu-stat-label">DANH MỤC ẨN</span>
                            <h2 className="admin-menu-stat-number">{data?.totalHiddenDishes}</h2>
                        </div>
                        <span className="admin-menu-stat-icon">👁️‍🗨️</span>
                    </div>
                </div>
            </div>

            {/* KHỐI 2: CHIA HAI CỘT LỚN */}
            <div className="admin-menu-two-columns">

                {/* CỘT TRÁI */}
                <div className="admin-menu-left-column">

                    {/* HÀNG TRÊN: Danh mục thực đơn */}
                    <div className="admin-menu-card admin-menu-category-list">
                        <div className="admin-menu-section-header">
                            <h3 className="admin-menu-section-title">Danh mục thực đơn</h3>
                            <span onClick={() => navigate('/admin/categories')} className="admin-menu-manage-link">
                                Quản lý danh mục &rarr;
                            </span>
                        </div>
                        <div className="admin-menu-scroll-container">
                            {data?.categoryStats.map((cat, idx) => (
                                <div key={idx} className="admin-menu-category-item">
                                    <div>
                                        <div className="admin-menu-category-name">{cat.categoryName}</div>
                                        <small className="admin-menu-category-count">{cat.dishCount} món ăn liên kết</small>
                                    </div>
                                    <span className={`admin-menu-status-badge ${cat.status === 'ACTIVE' ? 'active' : 'hidden'}`}>
                                        {cat.status === 'ACTIVE' ? '● Hoạt động' : '● Đang ẩn'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* HÀNG DƯỚI: Tỷ lệ món theo danh mục */}
                    <div className="admin-menu-card admin-menu-progress">
                        <h3 className="admin-menu-section-title">Tỷ lệ món theo danh mục</h3>
                        <div className="admin-menu-scroll-container">
                            {data?.categoryStats.map((cat, idx) => {
                                const percentage = data.totalDishes > 0 ? (cat.dishCount / data.totalDishes) * 100 : 0;
                                return (
                                    <div key={idx} className="admin-menu-progress-item">
                                        <div className="admin-menu-progress-label">
                                            <span>{cat.categoryName}</span>
                                            <span className="admin-menu-progress-percent">
                                                {cat.dishCount} ({percentage.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <div className="admin-menu-progress-track">
                                            <div className="admin-menu-progress-bar" style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI */}
                <div className="admin-menu-right-column">

                    {/* HÀNG TRÊN: Món mới thêm */}
                    <div className="admin-menu-card admin-menu-latest-dishes">
                        <div className="admin-menu-section-header">
                            <h3 className="admin-menu-section-title">Món ăn mới cập nhật</h3>
                            <span onClick={() => navigate('/admin/dishes')} className="admin-menu-manage-link">
                                Quản lý món &rarr;
                            </span>
                        </div>
                        <div className="admin-menu-table-wrapper">
                            <table className="admin-menu-table">
                                <thead>
                                <tr className="admin-menu-table-header">
                                    <th>MÓN ĂN</th>
                                    <th>DANH MỤC</th>
                                    <th>GIÁ NIÊM YẾT</th>
                                    <th className="admin-menu-text-center">TRẠNG THÁI</th>
                                </tr>
                                </thead>
                                <tbody>
                                {data?.latestDishes.map((dish) => (
                                    <tr key={dish.id} className="admin-menu-table-row">
                                        <td className="admin-menu-dish-cell">
                                            <div className="admin-menu-dish-image-wrapper">
                                                {dish.imageUrl ? (
                                                    <img
                                                        src={dish.imageUrl.startsWith('http') ? dish.imageUrl : `/image/${dish.imageUrl}`}
                                                        alt={dish.name}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).onerror = null;
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/36x36?text=🍲';
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="admin-menu-dish-emoji">🍲</span>
                                                )}
                                            </div>
                                            <span className="admin-menu-dish-name">{dish.name}</span>
                                        </td>
                                        <td>
                                            <span className="admin-menu-category-tag">{dish.categoryName}</span>
                                        </td>
                                        <td className="admin-menu-dish-price">{dish.price.toLocaleString('vi-VN')}đ</td>
                                        <td className="admin-menu-text-center">
                                                <span className={`admin-menu-dish-status ${dish.status === 'AVAILABLE' ? 'available' : 'paused'}`}>
                                                    {dish.status === 'AVAILABLE' ? 'Đang bán' : 'Tạm dừng'}
                                                </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* HÀNG DƯỚI: Cần chú ý */}
                    <div className="admin-menu-card admin-menu-warning">
                        <h3 className="admin-menu-section-title admin-menu-warning-title">
                            ⚠️ Cần chú ý (Món đang tạm dừng bán)
                        </h3>
                        <div className="admin-menu-scroll-container admin-menu-warning-scroll">
                            {!data?.allPausedDishesList || data.allPausedDishesList.length === 0 ? (
                                <div className="admin-menu-empty-warning">
                                    🎉 Tuyệt vời! Hiện tại không có món ăn nào bị gián đoạn kinh doanh.
                                </div>
                            ) : (
                                data.allPausedDishesList.map((dish) => (
                                    <div key={dish.id} className="admin-menu-warning-item">
                                        <div className="admin-menu-warning-item-left">
                                            <div className="admin-menu-dish-image-wrapper admin-menu-warning-image">
                                                {dish.imageUrl ? (
                                                    <img
                                                        src={dish.imageUrl.startsWith('http') ? dish.imageUrl : `/image/${dish.imageUrl}`}
                                                        alt={dish.name}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).onerror = null;
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/36x36?text=🍲';
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="admin-menu-dish-emoji">🍲</span>
                                                )}
                                            </div>
                                            <div>
                                                <strong className="admin-menu-warning-dish-name">{dish.name}</strong>
                                                <small className="admin-menu-warning-category">Thuộc nhóm: {dish.categoryName}</small>
                                            </div>
                                        </div>
                                        <span className="admin-menu-paused-label">TẠM NGƯNG</span>
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