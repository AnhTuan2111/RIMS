import type { TableDashboardResponse, OrderDetailResponse } from '../../types/cashier';

// 1. Interface cập nhật chuẩn 100% theo JSON thực tế từ Backend
interface FallbackOrderItem {
    dishName?: string;
    quantity?: number;
    subTotal?: number;
}

interface FallbackOrderDetail {
    status?: string;
    tableName?: string;
    orderItems?: FallbackOrderItem[];
    totalAmountBeforeVat?: number;
    vatAmount?: number;
    finalAmount?: number;
}

interface OrderPanelProps {
    selectedTable: TableDashboardResponse;
    orderDetail: OrderDetailResponse | null;
    loading: boolean;
    onClose: () => void;
    onCheckout: () => void;
}

export default function OrderPanel({ selectedTable, orderDetail, loading, onClose, onCheckout }: OrderPanelProps) {
    // Ép kiểu an toàn để đọc cấu trúc mới
    const fallbackDetail = orderDetail as unknown as FallbackOrderDetail | null;

    // 2. Lấy danh sách món từ "orderItems"
    const itemsList = fallbackDetail?.orderItems || [];

    // 3. Lấy đúng tên các trường Tiền mà Backend trả về
    const rawTotalAmount = fallbackDetail?.totalAmountBeforeVat ?? 0;
    const vatAmount = fallbackDetail?.vatAmount ?? 0;
    const finalTotalAmount = fallbackDetail?.finalAmount ?? 0;

    const displayStatus = fallbackDetail?.status || 'SERVING';

    return (
        <div className="page-card" style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={onClose}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}
            >✖</button>

            <h2>View Order detail</h2>
            <div style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                <strong>Vị trí: {fallbackDetail?.tableName || selectedTable.tableNumber}</strong>
                {orderDetail && (
                    <span style={{ marginLeft: '10px', float: 'right', background: '#ffedd5', color: '#ea580c', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        Trạng thái: {displayStatus}
                    </span>
                )}
            </div>

            {loading ? (
                <p>Đang tải thông tin đơn hàng...</p>
            ) : !orderDetail ? (
                <p style={{ color: '#64748b' }}>Chưa có thông tin đơn hàng cho bàn này.</p>
            ) : (
                <div>
                    <div className="simple-table" style={{ display: 'block' }}>
                        <div className="simple-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr', display: 'grid', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                            <span>Món ăn</span><span>SL</span><span style={{ textAlign: 'right' }}>Thành tiền</span>
                        </div>
                        <div style={{ maxHeight: '220px', overflowY: 'auto', margin: '0.5rem 0' }}>

                            {itemsList.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', margin: '1rem 0' }}>Bàn này chưa gọi món nào.</p>
                            ) : (
                                itemsList.map((item: FallbackOrderItem, index: number) => {
                                    const dishName = item.dishName || 'Món ăn';
                                    const quantity = item.quantity || 0;
                                    const subTotal = item.subTotal ?? 0;

                                    return (
                                        <div key={`${dishName}-${index}`} className="simple-table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr', display: 'grid', padding: '6px 0', borderBottom: '1px dashed #f1f5f9' }}>
                                            <span>{dishName}</span>
                                            <span>x{quantity}</span>
                                            <span style={{ textAlign: 'right' }}>{subTotal.toLocaleString()} đ</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* VẼ LẠI KHU VỰC TIỀN TỪ BACKEND */}
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#475569', marginBottom: '0.4rem' }}>
                            <span>Tiền thực tế (trước thuế):</span><span>{rawTotalAmount.toLocaleString()} đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#475569', marginBottom: '0.6rem' }}>
                            <span>Thuế VAT (10%):</span><span>{vatAmount.toLocaleString()} đ</span>
                        </div>
                        <div style={{ borderTop: '1px dashed #cbd5e1', margin: '0.5rem 0' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            <span>Tổng tiền cuối cùng:</span><strong style={{ color: '#b91c1c' }}>{finalTotalAmount.toLocaleString()} đ</strong>
                        </div>

                        {displayStatus !== 'COMPLETED' && (
                            <button
                                type="button" className="primary-button"
                                style={{ width: '100%', marginTop: '1.2rem', padding: '0.85rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
                                onClick={onCheckout}
                            >
                                CheckOut
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}