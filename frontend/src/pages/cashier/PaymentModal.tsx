import {useState} from 'react';
import {cashierApi} from '../../api/cashier';
import type {OrderDetailResponse, PaymentMethodType} from '../../types/cashier';

interface PaymentModalProps {
    orderId: number;
    orderDetail: OrderDetailResponse;
    onClose: () => void;
    onSuccess: (invoiceId: number) => void;
}

export default function PaymentModal({orderId, orderDetail, onClose, onSuccess}: PaymentModalProps) {
    const [method, setMethod] = useState<PaymentMethodType | null>(null);
    const [amountReceived, setAmountReceived] = useState<number>(0);
    const [processing, setProcessing] = useState<boolean>(false);

    // --- State Tích Điểm ---
    const [phoneSearch, setPhoneSearch] = useState('');
    const [customer, setCustomer] = useState<{id: number, fullName: string, phone: string, rewardPoints: number} | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [pointsUsed, setPointsUsed] = useState(0);

    const [showCreate, setShowCreate] = useState(false);
    const [newCusName, setNewCusName] = useState('');
    const [newCusEmail, setNewCusEmail] = useState('');

    // Tính toán tiền
    const originalFinalAmount = orderDetail.finalAmount;
    const maxPointsAllowed = Math.floor(originalFinalAmount * 0.5 / 1000);
    const maxPointsCanUse = customer ? Math.min(customer.rewardPoints, maxPointsAllowed) : 0;

    const safePointsUsed = Math.min(pointsUsed, maxPointsCanUse);
    const finalAmount = originalFinalAmount - safePointsUsed * 1000;
    const changeReturned = amountReceived >= finalAmount ? amountReceived - finalAmount : 0;

    const handleSearchCustomer = async () => {
        if (!phoneSearch.trim()) return;
        setIsSearching(true);
        setShowCreate(false);
        setCustomer(null);
        setPointsUsed(0);
        try {
            const res = await cashierApi.searchCustomer(phoneSearch);
            if (res?.data) {
                setCustomer(res.data);
            }
        } catch (err) {
            // Ép kiểu an toàn để lấy status 404 mà không dùng "any"
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
        setProcessing(true);
        try {
            const res = await cashierApi.createCustomerFast({
                fullName: newCusName,
                phone: phoneSearch,
                email: newCusEmail
            });
            if (res?.data) {
                setCustomer(res.data);
                setShowCreate(false);
                alert("Đăng ký thành viên thành công!");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi tạo khách hàng (Có thể SĐT đã tồn tại)!");
        } finally {
            setProcessing(false);
        }
    };

    const handleCloseModal = async () => {
        try {
            await cashierApi.unlockOrder(orderId);
        } catch (err) {
            console.error("Lỗi mở khóa đơn hàng", err);
        } finally {
            onClose();
        }
    };

    const handleConfirmCash = async () => {
        if (amountReceived < finalAmount) {
            alert('Tiền khách đưa chưa đủ!');
            return;
        }
        setProcessing(true);
        try {
            const reqData = {
                paymentMethod: 'CASH' as PaymentMethodType,
                amountPaid: amountReceived,
                customerId: customer?.id || null,
                pointsUsed: safePointsUsed
            };

            const res = await cashierApi.completeCashPayment(orderId, reqData);
            if (res?.data?.success) {
                onSuccess(res.data.invoiceId);
            } else {
                alert('Có lỗi xảy ra từ Server!');
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi thanh toán: Kiểm tra lại mạng hoặc đơn hàng!');
        } finally {
            setProcessing(false);
        }
    };

    const handleRedirectToVNPay = async () => {
        setProcessing(true);
        try {
            const res = await cashierApi.getVNPayQrCode(orderId);

            if (res?.data?.success && res?.data?.paymentUrl) {
                window.location.href = res.data.paymentUrl;
            } else {
                alert(res?.data?.message || 'Không thể khởi tạo cổng VNPay.');
                setProcessing(false);
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi tạo cổng VNPay! (Kiểm tra lại mạng hoặc F5 tải lại trang)');
            setMethod(null);
            setProcessing(false);
        }
    };

    return (
        <div className="modal-backdrop" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999
        }}>
            <div className="modal-card"
                 style={{background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '480px'}}>
                <div className="modal-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '0.5rem'
                }}>
                    <h2 style={{margin: 0}}>Thanh Toán</h2>
                    <button type="button" onClick={() => void handleCloseModal()}
                            style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}>×
                    </button>
                </div>

                <div className="modal-body" style={{marginTop: '1.5rem'}}>

                    {/* KHU VỰC TÍCH ĐIỂM (Được nhét ngay phía trên Cần thu) */}
                    <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem'}}>
                        <h4 style={{margin: '0 0 10px 0', color: '#334155'}}>🌟 Tích Điểm Thành Viên</h4>
                        <div style={{display: 'flex', gap: '8px'}}>
                            <input
                                type="text" placeholder="Nhập SĐT khách hàng..."
                                style={{flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1'}}
                                value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)}
                            />
                            <button type="button" onClick={() => void handleSearchCustomer()} disabled={isSearching}
                                    style={{padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                                {isSearching ? '...' : 'Tìm'}
                            </button>
                        </div>

                        {showCreate && !customer && (
                            <div style={{marginTop: '10px', padding: '10px', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '6px'}}>
                                <p style={{margin: '0 0 8px 0', fontSize: '0.9rem', color: '#ef4444', fontWeight: 'bold'}}>Chưa có tài khoản! Đăng ký nhanh:</p>
                                <input type="text" placeholder="Tên khách hàng (*)"
                                       style={{width: '100%', boxSizing: 'border-box', padding: '6px', marginBottom: '6px', border: '1px solid #cbd5e1', borderRadius: '4px'}}
                                       value={newCusName} onChange={e => setNewCusName(e.target.value)} />
                                <input type="email" placeholder="Email (Không bắt buộc)"
                                       style={{width: '100%', boxSizing: 'border-box', padding: '6px', marginBottom: '8px', border: '1px solid #cbd5e1', borderRadius: '4px'}}
                                       value={newCusEmail} onChange={e => setNewCusEmail(e.target.value)} />
                                <button type="button" onClick={() => void handleCreateCustomer()} disabled={processing}
                                        style={{width: '100%', padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                                    Tạo Tài Khoản
                                </button>
                            </div>
                        )}

                        {customer && (
                            <div style={{marginTop: '10px', padding: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px'}}>
                                <p style={{margin: '0 0 5px 0'}}>👤 Khách: <strong>{customer.fullName}</strong></p>
                                <p style={{margin: '0 0 10px 0'}}>💰 Điểm hiện có: <strong style={{color: '#059669'}}>{customer.rewardPoints.toLocaleString()}</strong></p>

                                {customer.rewardPoints > 0 && (
                                    <label style={{display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem'}}>
                                        Sử dụng điểm (Tối đa {maxPointsCanUse.toLocaleString()}):
                                        <input
                                            type="number" min="0" max={maxPointsCanUse}
                                            style={{padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box'}}
                                            value={pointsUsed || ''}
                                            onChange={e => setPointsUsed(Number(e.target.value))}
                                        />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                    {/* END KHU VỰC TÍCH ĐIỂM */}

                    <p style={{fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between'}}>
                        Cần thu: <strong style={{color: '#b91c1c'}}>{finalAmount.toLocaleString()} đ</strong>
                    </p>

                    {method === null && (
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                            <button type="button" className="secondary-button"
                                    style={{height: '70px', fontSize: '1.05rem', cursor: 'pointer'}}
                                    onClick={() => setMethod('CASH')}>💵 Tiền mặt
                            </button>
                            <button type="button" className="secondary-button"
                                    style={{height: '70px', fontSize: '1.05rem', cursor: 'pointer'}}
                                    onClick={() => setMethod('QRCODE')}>💳 Thẻ / VNPay
                            </button>
                        </div>
                    )}

                    {method === 'CASH' && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                            <label style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                Khách đưa (VND):
                                <input type="number"
                                       style={{padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1'}}
                                       value={amountReceived || ''}
                                       onChange={(e) => setAmountReceived(Number(e.target.value))}/>
                            </label>
                            <div style={{padding: '0.85rem', background: '#f8fafc', borderRadius: '8px'}}>
                                <span style={{color: '#475569'}}>Tiền thừa trả khách: </span>
                                <strong style={{
                                    fontSize: '1.15rem',
                                    color: '#16a34a'
                                }}>{changeReturned.toLocaleString()} đ</strong>
                            </div>
                            <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                                <button type="button" className="secondary-button" style={{flex: 1}}
                                        onClick={() => setMethod(null)}>Quay lại
                                </button>
                                <button type="button" style={{
                                    flex: 2,
                                    background: '#16a34a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }} disabled={amountReceived < finalAmount || processing}
                                        onClick={() => void handleConfirmCash()}>
                                    {processing ? 'Đang xử lý...' : 'Xác nhận & In Hóa Đơn'}
                                </button>
                            </div>
                        </div>
                    )}

                    {method === 'QRCODE' && (
                        <div style={{textAlign: 'center'}}>
                            <div style={{
                                background: '#f8fafc',
                                padding: '2rem',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                marginBottom: '1rem'
                            }}>
                                <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🌐</div>
                                <h3 style={{margin: '0 0 10px 0', color: '#1e293b'}}>Cổng thanh toán VNPay</h3>
                                <p style={{fontSize: '0.9rem', color: '#64748b'}}>Hệ thống sẽ chuyển hướng sang VNPay để
                                    nhập thông tin thẻ. Hóa đơn sẽ được in sau khi thanh toán thành công.</p>
                            </div>

                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                <button type="button" className="secondary-button" style={{flex: 1}}
                                        onClick={() => setMethod(null)} disabled={processing}>Hủy bỏ
                                </button>
                                <button type="button" style={{
                                    flex: 2,
                                    background: '#005baa',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }} onClick={() => void handleRedirectToVNPay()} disabled={processing}>
                                    {processing ? 'Đang kết nối...' : 'Chuyển hướng ngay'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}