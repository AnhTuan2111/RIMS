import { useState } from 'react';
import { cashierApi } from '../../api/cashier';
import type { OrderDetailResponse, PaymentMethodType } from '../../types/cashier';

interface PaymentModalProps {
    orderId: number;
    orderDetail: OrderDetailResponse;
    onClose: () => void;
    onSuccess: (invoiceId: number) => void;
}

export default function PaymentModal({ orderId, orderDetail, onClose, onSuccess }: PaymentModalProps) {
    const [method, setMethod] = useState<PaymentMethodType | null>(null);
    const [amountReceived, setAmountReceived] = useState<number>(0);
    const [processing, setProcessing] = useState<boolean>(false);

    const finalAmount = orderDetail.finalAmount;
    const changeReturned = amountReceived >= finalAmount ? amountReceived - finalAmount : 0;


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
            const reqData = { paymentMethod: 'CASH' as PaymentMethodType, amountPaid: amountReceived };


            const res = await cashierApi.completeCashPayment(orderId, reqData);
            if (res && res.data && res.data.success) {
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
                // Chuyển hướng thẳng sang trang VNPay
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
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="modal-card" style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '480px' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0 }}>Thanh Toán</h2>
                    <button type="button" onClick={() => void handleCloseModal()} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div className="modal-body" style={{ marginTop: '1.5rem' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Cần thu: <strong style={{ color: '#b91c1c' }}>{finalAmount.toLocaleString()} đ</strong></p>

                    {method === null && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button type="button" className="secondary-button" style={{ height: '70px', fontSize: '1.05rem', cursor: 'pointer' }} onClick={() => setMethod('CASH')}>💵 Tiền mặt</button>
                            <button type="button" className="secondary-button" style={{ height: '70px', fontSize: '1.05rem', cursor: 'pointer' }} onClick={() => setMethod('QRCODE')}>💳 Thẻ / VNPay</button>
                        </div>
                    )}

                    {method === 'CASH' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                Khách đưa (VND):
                                <input type="number" style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={amountReceived || ''} onChange={(e) => setAmountReceived(Number(e.target.value))} />
                            </label>
                            <div style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: '8px' }}>
                                <span style={{ color: '#475569' }}>Tiền thừa trả khách: </span>
                                <strong style={{ fontSize: '1.15rem', color: '#16a34a' }}>{changeReturned.toLocaleString()} đ</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" className="secondary-button" style={{ flex: 1 }} onClick={() => setMethod(null)}>Quay lại</button>
                                <button type="button" style={{ flex: 2, background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }} disabled={amountReceived < finalAmount || processing} onClick={() => void handleConfirmCash()}>
                                    {processing ? 'Đang xử lý...' : 'Xác nhận & In Hóa Đơn'}
                                </button>
                            </div>
                        </div>
                    )}

                    {method === 'QRCODE' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌐</div>
                                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Cổng thanh toán VNPay</h3>
                                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Hệ thống sẽ chuyển hướng sang VNPay để nhập thông tin thẻ. Hóa đơn sẽ được in sau khi thanh toán thành công.</p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" className="secondary-button" style={{ flex: 1 }} onClick={() => setMethod(null)} disabled={processing}>Hủy bỏ</button>
                                <button type="button" style={{ flex: 2, background: '#005baa', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => void handleRedirectToVNPay()} disabled={processing}>
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