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
}

export default function AdminMenuDashboardPage() {
    const [data, setData] = useState<MenuDashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Biến cờ hiệu kiểm soát trạng thái mounted của component
        let isMounted = true;
        const controller = new AbortController();

        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('accessToken');

                const response = await axios.get('http://localhost:8080/rims/admin/menu', {
                    signal: controller.signal, // Gắn tín hiệu để có thể hủy khi cần
                    headers: {
                        Authorization: token ? `Bearer ${token}` : ''
                    }
                });

                // Chỉ cập nhật dữ liệu nếu component vẫn đang hiển thị trên màn hình
                if (isMounted) {
                    setData(response.data);
                    setLoading(false);
                }
            } catch (err) {
                // Bỏ qua lỗi nếu request bị chủ động hủy do Strict Mode gọi lại
                if (axios.isCancel(err)) {
                    console.log("Request bị hủy do React Strict Mode double-call");
                    return;
                }

                if (isMounted) {
                    console.error("Lỗi khi fetch dữ liệu dashboard:", err);
                    setError("Không thể tải dữ liệu từ hệ thống.");
                    setLoading(false);
                }
            }
        };

        fetchDashboardData();

        // Hàm Cleanup: Sẽ chạy khi component unmount hoặc re-render
        return () => {
            isMounted = false;
            controller.abort(); // Hủy request đầu tiên nếu request thứ hai chen vào
        };
    }, []);

    if (loading) return <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>Đang tải dữ liệu hệ thống...</div>;
    if (error) return <div style={{ padding: '24px', color: 'red', fontFamily: 'sans-serif' }}>{error}</div>;

    // CHỈ TRẢ VỀ PHẦN NỘI DUNG RUỘT (Không ôm Sidebar và Header nữa)
    return (
        <div style={{ fontFamily: 'sans-serif', padding: '12px' }}>

            {/* KHỐI 1: 4 THẺ CHỈ SỐ THỐNG KÊ TRÊN CÙNG */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: '#6c757d', fontSize: '14px' }}>Tổng số món</span>
                            <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>{data?.totalDishes}</h2>
                        </div>
                        <span style={{ fontSize: '24px', background: '#eef2ff', padding: '10px', borderRadius: '8px' }}>🍴</span>
                    </div>
                </div>

                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: '#6c757d', fontSize: '14px' }}>Danh mục</span>
                            <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>{data?.totalCategories}</h2>
                        </div>
                        <span style={{ fontSize: '24px', background: '#ecfdf5', padding: '10px', borderRadius: '8px' }}>🗂️</span>
                    </div>
                </div>

                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: '#6c757d', fontSize: '14px' }}>Tạm dừng</span>
                            <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>{data?.totalPausedDishes}</h2>
                        </div>
                        <span style={{ fontSize: '24px', background: '#fffbeb', padding: '10px', borderRadius: '8px' }}>⏸️</span>
                    </div>
                </div>

                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: '#6c757d', fontSize: '14px' }}>Đang ẩn</span>
                            <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>{data?.totalHiddenDishes}</h2>
                        </div>
                        <span style={{ fontSize: '24px', background: '#fef2f2', padding: '10px', borderRadius: '8px' }}>👁️‍🗨️</span>
                    </div>
                </div>
            </div>

            {/* KHỐI 2: CHIA HAI CỘT LỚN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>

                {/* CỘT TRÁI: DANH MỤC VÀ BIỂU ĐỒ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Danh mục món ăn</h3>
                            <span onClick={() => navigate('/admin/categories')} style={{ color: '#4f46e5', fontSize: '12px', cursor: 'pointer' }}>Quản lý</span>
                        </div>
                        {data?.categoryStats.map((cat, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx !== data.categoryStats.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{cat.categoryName}</div>
                                    <small style={{ color: '#6c757d' }}>{cat.dishCount} món</small>
                                </div>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                                    backgroundColor: cat.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                                    color: cat.status === 'ACTIVE' ? '#15803d' : '#475569'
                                }}>
                                    {cat.status === 'ACTIVE' ? 'Hoạt động' : 'Đang ẩn'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold' }}>Theo danh mục</h3>
                        {data?.categoryStats.map((cat, idx) => {
                            const percentage = data.totalDishes > 0 ? (cat.dishCount / data.totalDishes) * 100 : 0;
                            return (
                                <div key={idx} style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                        <span>{cat.categoryName}</span>
                                        <span style={{ fontWeight: 'bold' }}>{cat.dishCount}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#4f46e5', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CỘT PHẢI: BẢNG MÓN VÀ CẦN CHÚ Ý */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Món mới thêm</h3>
                            <span onClick={() => navigate('/admin/dishes')} style={{ color: '#4f46e5', fontSize: '12px', cursor: 'pointer' }}>Quản lý món ăn</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#6c757d', fontSize: '12px', textAlign: 'left' }}>
                                <th style={{ paddingBottom: '12px' }}>MÓN ĂN</th>
                                <th style={{ paddingBottom: '12px' }}>DANH MỤC</th>
                                <th style={{ paddingBottom: '12px' }}>GIÁ</th>
                                <th style={{ paddingBottom: '12px' }}>TRẠNG THÁI</th>
                            </tr>
                            </thead>
                            <tbody style={{ fontSize: '14px' }}>
                            {data?.latestDishes.map((dish) => (
                                <tr key={dish.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    {/* CỘT MÓN ĂN: Thêm ảnh thumbnail nhỏ */}
                                    <td style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '6px',
                                            backgroundColor: '#f1f5f9',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            {dish.imageUrl ? (

                                                <img
                                                    src={`/image/${dish.imageUrl}`} // Thêm "image/" ở đây để đi vào đúng thư mục đóng gói
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
                                        <span style={{ fontWeight: '500' }}>{dish.name}</span>
                                    </td>

                                    {/* Các cột danh mục, giá, trạng thái bên dưới giữ nguyên */}
                                    <td style={{ color: '#475569' }}>{dish.categoryName}</td>
                                    <td>{dish.price.toLocaleString()} VND</td>
                                    <td>
            <span style={{
                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                backgroundColor: dish.status === 'AVAILABLE' ? '#dcfce7' : '#fef3c7',
                color: dish.status === 'AVAILABLE' ? '#15803d' : '#d97706'
            }}>
                {dish.status === 'AVAILABLE' ? 'Đang bán' : 'Tạm dừng'}
            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#b91c1c' }}>
                            Cần chú ý (Món đang tạm dừng)
                        </h3>
                        {data?.latestDishes.filter(d => d.status === 'PAUSED').length === 0 ? (
                            <p style={{ color: '#6c757d', fontSize: '14px', margin: 0 }}>Không có món nào đang bị tạm dừng.</p>
                        ) : (
                            data?.latestDishes
                                .filter(d => d.status === 'PAUSED')
                                .map((dish) => (
                                    <div key={dish.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '6px', marginBottom: '8px' }}>

                                        {/* BỔ SUNG KHỐI HIỂN THỊ ẢNH VÀ TÊN MÓN ĂN Ở ĐÂY */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '6px',
                                                backgroundColor: '#f1f5f9',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #fed7aa' // Đổi border nhẹ sang màu cam cho hợp tông cảnh báo
                                            }}>
                                                {dish.imageUrl ? (
                                                    <img
                                                        src={`/image/${dish.imageUrl}`}
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

                                            {/* Tên món và danh mục nhóm lại bên cạnh ảnh */}
                                            <div>
                                                <strong style={{ fontSize: '14px', color: '#92400e', display: 'block' }}>{dish.name}</strong>
                                                <small style={{ color: '#b45309' }}>{dish.categoryName}</small>
                                            </div>
                                        </div>

                                        {/* Nhãn trạng thái bên phải giữ nguyên */}
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#b91c1c', backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>
                        • TẠM DỪNG
                    </span>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    boxSizing: 'border-box'
};