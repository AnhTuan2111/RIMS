import type {OrderDetailResponse, TableDashboardResponse} from '../../types/cashier';
import {useState} from "react";
import {cashierApi} from "../../api/cashier.ts";

// ĐÃ THÊM: Type thông tin khách hàng, export để CashierPaymentsPage và PaymentModal dùng chung
export interface CustomerInfo {
    id: number;
    fullName: string;
    phone: string;
    rewardPoints: number;
}

interface OrderPanelProps {
    selectedTable: TableDashboardResponse;
    orderDetail: OrderDetailResponse | null;
    loading: boolean;
    onClose: () => void;
    onCheckout: () => void;
    // ĐÃ THÊM: props nhận/điều khiển state khách hàng + điểm từ component cha
    customer: CustomerInfo | null;
    pointsUsed: number;
    onCustomerChange: (customer: CustomerInfo | null) => void;
    onPointsUsedChange: (points: number) => void;
}

export default function OrderPanel({
                                       selectedTable, orderDetail, loading, onClose, onCheckout,
                                       customer, pointsUsed, onCustomerChange, onPointsUsedChange
                                   }: OrderPanelProps) {
    const itemsList = orderDetail?.orderItems || [];
    const totalAmount = orderDetail?.finalAmount || 0;
    const [isLocking, setIsLocking] = useState(false);

    // ĐÃ THÊM: State cho khối tìm kiếm/tạo khách hàng (chuyển từ PaymentModal sang đây)
    const [phoneSearch, setPhoneSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newCusName, setNewCusName] = useState('');
    const [newCusEmail, setNewCusEmail] = useState('');
    const [processingCreate, setProcessingCreate] = useState(false);

    // Tính điểm tối đa được dùng (tối đa 50% hóa đơn, và không vượt điểm khách đang có)
    const maxPointsAllowed = Math.floor(totalAmount * 0.5 / 1000);
    const maxPointsCanUse = customer ? Math.min(customer.rewardPoints, maxPointsAllowed) : 0;

    const handleSearchCustomer = async () => {
        if (!phoneSearch.trim()) return;
        setIsSearching(true);
        setShowCreate(false);
        onCustomerChange(null);
        onPointsUsedChange(0);
        try {
            const res = await cashierApi.searchCustomer(phoneSearch);
            if (res?.data) {
                onCustomerChange(res.data as CustomerInfo);
            }
        } catch (err) {
            const error = err as { response?: { status?: number } };
            if (error?.response?.status === 404) {
                setShowCreate(true);
            } else {
                console.error(err);
                alert("Lỗi tìm kiếm khách hàng!");
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateCustomer = async () => {
        if (!newCusName.trim()) {
            alert("Vui lòng nhập tên khách hàng!");
            return;
        }
        if (!phoneSearch.trim() || !/^0[0-9]{9}$/.test(phoneSearch.trim())) {
            alert("Số điện thoại không hợp lệ! Phải bắt đầu bằng 0 và đủ 10 số.");
            return;
        }
        if (!newCusEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCusEmail.trim())) {
            alert("Vui lòng nhập email hợp lệ!");
            return;
        }
        setProcessingCreate(true);
        try {
            const res = await cashierApi.createCustomerFast({
                fullName: newCusName,
                phone: phoneSearch,
                email: newCusEmail
            });
            if (res?.data) {
                onCustomerChange(res.data as CustomerInfo);
                setShowCreate(false);
                alert("Đăng ký thành viên thành công!");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi tạo khách hàng (Có thể SĐT đã tồn tại)!");
        } finally {
            setProcessingCreate(false);
        }
    };

    const handlePointsInputChange = (raw: number) => {
        const safeValue = Math.max(0, Math.min(raw, maxPointsCanUse));
        onPointsUsedChange(safeValue);
    };

    const handleCheckoutClick = async () => {
        setIsLocking(true);
        try {
            // Gọi API khóa đơn hàng
            const res = await cashierApi.processPaymentLock(orderDetail!.orderId, {
                paymentMethod: 'CASH',
                amountPaid: 0
            });
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

    const displayStatus = selectedTable.status === 'SERVING' ? 'Đang Phục Vụ' : 'Bàn Trống';

    return (
        <div className="page-card" style={{position: 'relative'}}>
            <button
                type="button"
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.4rem',
                    cursor: 'pointer',
                    color: '#64748b',
                    fontWeight: 'bold'
                }}
            >
                ✖
            </button>

            <h2>Chi tiết đơn hàng</h2>
            <div style={{
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid #e2e8f0',
                marginTop: '0.5rem'
            }}>
                <strong>Vị trí: {selectedTable.tableNumber}</strong>
                <span style={{
                    marginLeft: '10px',
                    float: 'right',
                    background: '#ffedd5',
                    color: '#ea580c',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                }}>
                    {displayStatus}
                </span>
            </div>

            {/* ĐÃ THÊM: Khối tìm kiếm/tích điểm khách hàng — đặt ngay trong panel chi tiết đơn hàng,
                hiện ra ngay khi chọn bàn, KHÔNG cần đợi bấm CheckOut */}
            {selectedTable.status === 'SERVING' && (
                <div style={{
                    background: '#f8fafc', padding: '1rem', borderRadius: '8px',
                    border: '1px solid #e2e8f0', marginBottom: '1.5rem'
                }}>
                    <h4 style={{margin: '0 0 10px 0', color: '#334155'}}>🌟 Tích Điểm Thành Viên</h4>
                    <div style={{display: 'flex', gap: '8px'}}>
                        <input
                            type="text" placeholder="Nhập SĐT khách hàng..."
                            style={{flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1'}}
                            value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)}
                            disabled={!!customer}
                        />
                        {customer ? (
                            <button type="button" onClick={() => {
                                onCustomerChange(null);
                                onPointsUsedChange(0);
                                setPhoneSearch('');
                                setShowCreate(false);
                            }}
                                    style={{
                                        padding: '8px 16px', background: '#ef4444', color: '#fff',
                                        border: 'none', borderRadius: '4px', cursor: 'pointer'
                                    }}>
                                Bỏ chọn
                            </button>
                        ) : (
                            <button type="button" onClick={() => void handleSearchCustomer()} disabled={isSearching}
                                    style={{
                                        padding: '8px 16px', background: '#3b82f6', color: '#fff',
                                        border: 'none', borderRadius: '4px', cursor: 'pointer'
                                    }}>
                                {isSearching ? '...' : 'Tìm'}
                            </button>
                        )}
                    </div>

                    {showCreate && !customer && (
                        <div style={{
                            marginTop: '10px', padding: '10px', background: '#fff',
                            border: '1px dashed #cbd5e1', borderRadius: '6px'
                        }}>
                            <p style={{margin: '0 0 8px 0', fontSize: '0.9rem', color: '#ef4444', fontWeight: 'bold'}}>
                                Chưa có tài khoản! Đăng ký nhanh (đầy đủ thông tin):
                            </p>
                            <div style={{
                                padding: '8px', marginBottom: '6px', background: '#f1f5f9',
                                borderRadius: '4px', fontSize: '0.85rem', color: '#475569'
                            }}>
                                📱 SĐT dùng để đăng ký: <strong>{phoneSearch}</strong>
                            </div>
                            <input type="text" placeholder="Tên khách hàng (*)"
                                   style={{
                                       width: '100%', boxSizing: 'border-box', padding: '6px', marginBottom: '6px',
                                       border: '1px solid #cbd5e1', borderRadius: '4px'
                                   }}
                                   value={newCusName} onChange={e => setNewCusName(e.target.value)}/>
                            <input type="email" placeholder="Email (*)"
                                   style={{
                                       width: '100%', boxSizing: 'border-box', padding: '6px', marginBottom: '8px',
                                       border: '1px solid #cbd5e1', borderRadius: '4px'
                                   }}
                                   value={newCusEmail} onChange={e => setNewCusEmail(e.target.value)}/>
                            <button type="button" onClick={() => void handleCreateCustomer()}
                                    disabled={processingCreate}
                                    style={{
                                        width: '100%', padding: '8px', background: '#10b981', color: 'white',
                                        border: 'none', borderRadius: '4px', cursor: 'pointer'
                                    }}>
                                {processingCreate ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                            </button>
                        </div>
                    )}

                    {customer && (
                        <div style={{
                            marginTop: '10px', padding: '10px', background: '#ecfdf5',
                            border: '1px solid #a7f3d0', borderRadius: '6px'
                        }}>
                            <p style={{margin: '0 0 5px 0'}}>👤 Khách: <strong>{customer.fullName}</strong></p>
                            <p style={{margin: '0 0 10px 0'}}>
                                💰 Điểm hiện có: <strong style={{color: '#059669'}}>{customer.rewardPoints.toLocaleString()}</strong>
                            </p>

                            {customer.rewardPoints > 0 && (
                                <label style={{display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem'}}>
                                    Sử dụng điểm (Tối đa {maxPointsCanUse.toLocaleString()}):
                                    <input
                                        type="number" min="0" max={maxPointsCanUse}
                                        style={{padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box'}}
                                        value={pointsUsed || ''}
                                        onChange={e => handlePointsInputChange(Number(e.target.value))}
                                    />
                                </label>
                            )}
                        </div>
                    )}
                </div>
            )}
            {/* END khối tìm kiếm khách hàng */}

            {loading ? (
                <p>Đang tải thông tin đơn hàng...</p>
            ) : !orderDetail ? (
                <p style={{color: '#64748b'}}>Chưa có thông tin đơn hàng cho bàn này.</p>
            ) : (
                <div>
                    <div className="simple-table" style={{display: 'block'}}>
                        <div className="simple-table-header" style={{
                            gridTemplateColumns: '2fr 1fr 1fr',
                            display: 'grid',
                            fontWeight: 'bold',
                            borderBottom: '1px solid #cbd5e1',
                            paddingBottom: '4px'
                        }}>
                            <span>Món ăn</span><span>SL</span><span style={{textAlign: 'right'}}>Thành tiền</span>
                        </div>
                        <div style={{maxHeight: '220px', overflowY: 'auto', margin: '0.5rem 0'}}>
                            {itemsList.length === 0 ? (
                                <p style={{textAlign: 'center', color: '#94a3b8', margin: '1rem 0'}}>Bàn này chưa gọi
                                    món nào.</p>
                            ) : (
                                itemsList.map((item, index) => (
                                    <div key={`${item.dishName}-${index}`} className="simple-table-row" style={{
                                        gridTemplateColumns: '2fr 1fr 1fr',
                                        display: 'grid',
                                        padding: '6px 0',
                                        borderBottom: '1px dashed #f1f5f9'
                                    }}>
                                        <span>{item.dishName}</span>
                                        <span>x{item.quantity}</span>
                                        <span style={{textAlign: 'right'}}>{item.subTotal.toLocaleString()} đ</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div style={{marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0'}}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            fontSize: '0.9rem',
                            color: '#475569',
                            marginBottom: '8px'
                        }}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                <span>Tạm tính trước thuế:</span>
                                <span>{(orderDetail.totalAmountBeforeVat || 0).toLocaleString()} đ</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                <span>Thuế VAT (10%):</span>
                                <span>{(orderDetail.vatAmount || 0).toLocaleString()} đ</span>
                            </div>
                            {/* ĐÃ THÊM: Hiện dòng giảm giá theo điểm nếu có chọn dùng điểm */}
                            {pointsUsed > 0 && (
                                <div style={{display: 'flex', justifyContent: 'space-between', color: '#059669'}}>
                                    <span>Giảm giá ({pointsUsed} điểm):</span>
                                    <span>-{(pointsUsed * 1000).toLocaleString()} đ</span>
                                </div>
                            )}
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '1.25rem',
                            fontWeight: 'bold'
                        }}>
                            <span>Tổng thanh toán:</span><strong
                            style={{color: '#b91c1c'}}>{(totalAmount - pointsUsed * 1000).toLocaleString()} đ</strong>
                        </div>

                        {selectedTable.status === 'SERVING' && (
                            <button
                                type="button"
                                className="primary-button"
                                style={{ /*... css cũ ...*/ opacity: isLocking ? 0.7 : 1}}
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