import type { TableDashboardResponse, OrderDetailResponse } from '../../types/cashier';
import {useState} from "react";
import {cashierApi} from "../../api/cashier.ts";

interface OrderPanelProps {
    selectedTable: TableDashboardResponse;
    orderDetail: OrderDetailResponse | null;
    loading: boolean;
    onClose: () => void;
    onCheckout: () => void;
}

export default function OrderPanel({ selectedTable, orderDetail, loading, onClose, onCheckout }: OrderPanelProps) {
    const itemsList = orderDetail?.orderItems || [];
    const totalAmount = orderDetail?.finalAmount || 0;
    const [isLocking, setIsLocking] = useState(false);

    const handleCheckoutClick = async () => {
        setIsLocking(true);
        try {
            // Gọi API khóa đơn hàng (ông cần thêm hàm này vào file cashierApi nhé)
            const res = await cashierApi.processPaymentLock(orderDetail!.orderId, { paymentMethod: 'CASH', amountPaid: 0 });
            if (res.data.success) {
                onCheckout(); // Bật PaymentModal lên
            } else {
                alert(res.data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Không thể khóa đơn hàng để thanh toán!');
        } finally {
            setIsLocking(false);
        }
    };

    // Fix: Dùng trạng thái của bàn thay vì của order
    const displayStatus = selectedTable.status === 'SERVING' ? 'Đang Phục Vụ' : 'Bàn Trống';

    return (
        <div className="page-card" style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={onClose}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}
            >
                ✖
            </button>

            <h2>Chi tiết đơn hàng</h2>
            <div style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                <strong>Vị trí: {selectedTable.tableNumber}</strong>
                <span style={{ marginLeft: '10px', float: 'right', background: '#ffedd5', color: '#ea580c', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {displayStatus}
                </span>
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
                                itemsList.map((item, index) => (
                                    <div key={`${item.dishName}-${index}`} className="simple-table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr', display: 'grid', padding: '6px 0', borderBottom: '1px dashed #f1f5f9' }}>
                                        <span>{item.dishName}</span>
                                        <span>x{item.quantity}</span>
                                        <span style={{ textAlign: 'right' }}>{item.subTotal.toLocaleString()} đ</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', color: '#475569', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Tạm tính trước thuế:</span>
                                <span>{(orderDetail.totalAmountBeforeVat || 0).toLocaleString()} đ</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Thuế VAT (10%):</span>
                                <span>{(orderDetail.vatAmount || 0).toLocaleString()} đ</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
                            <span>Tổng thanh toán:</span><strong style={{ color: '#b91c1c' }}>{totalAmount.toLocaleString()} đ</strong>
                        </div>

                        {selectedTable.status === 'SERVING' && (
                            <button
                                type="button"
                                className="primary-button"
                                style={{ /*... css cũ ...*/ opacity: isLocking ? 0.7 : 1 }}
                                onClick={() => void handleCheckoutClick()}
                                disabled={isLocking}
                            >
                                {isLocking ? 'Đang khóa đơn...' : 'CheckOut'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}