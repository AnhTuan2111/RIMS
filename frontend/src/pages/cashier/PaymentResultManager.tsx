import { useState } from 'react';
import type { OrderDetailResponse } from '../../types/cashier';

interface Props {
    invoiceId: number;
    orderDetail: OrderDetailResponse;
    onClose: () => void;
    onDownload: (id: number) => void;
}

export default function PaymentResultManager({ invoiceId, orderDetail, onClose, onDownload }: Props) {
    const [step, setStep] = useState<'SUCCESS' | 'BILL'>('SUCCESS');

    const itemsList = orderDetail.orderItems || [];

    // Lấy đúng 3 trường tiền tệ từ Java DTO
    const beforeVat = orderDetail.totalAmountBeforeVat || 0;
    const vatAmount = orderDetail.vatAmount || 0;
    const finalAmount = orderDetail.finalAmount || 0;

    if (step === 'SUCCESS') {
        return (
            <div
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: '#16a34a', zIndex: 9999, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: 'white', cursor: 'pointer', textAlign: 'center', animation: 'fadeIn 0.3s'
                }}
                onClick={() => setStep('BILL')}
            >
                <div style={{ fontSize: '8rem', marginBottom: '1rem' }}>✔</div>
                <h1 style={{ fontSize: '4rem', fontWeight: 'bold' }}>THANH TOÁN THÀNH CÔNG</h1>
                <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>Mã hóa đơn: INV-{invoiceId}</p>
                <p style={{ marginTop: '3rem', fontSize: '1.1rem', fontStyle: 'italic' }}>— Chạm vào màn hình để xem hóa đơn —</p>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: '#f8fafc', zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div className="page-card" style={{ width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h2 style={{ textAlign: 'center', color: '#1e293b', borderBottom: '2px dashed #e2e8f0', paddingBottom: '1rem' }}>
                    HÓA ĐƠN THANH TOÁN
                    <div style={{ fontSize: '1rem', color: '#64748b', marginTop: '4px', fontWeight: 'normal' }}>
                        Mã: INV-{invoiceId}
                    </div>
                </h2>

                <div style={{ margin: '1.5rem 0' }}>
                    <div className="simple-table">
                        <div className="simple-table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr', display: 'grid', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
                            <span>Món ăn</span><span style={{ textAlign: 'center' }}>SL</span><span style={{ textAlign: 'right' }}>Thành tiền</span>
                        </div>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', paddingTop: '8px' }}>
                            {itemsList.map((item, idx) => (
                                <div key={idx} style={{ gridTemplateColumns: '2fr 1fr 1fr', display: 'grid', padding: '10px 0', borderBottom: '1px dashed #f1f5f9' }}>
                                    <span>{item.dishName}</span>
                                    <span style={{ textAlign: 'center' }}>{item.quantity}</span>
                                    <span style={{ textAlign: 'right' }}>{item.subTotal.toLocaleString()} đ</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KHU VỰC HIỂN THỊ TIỀN VAT VÀ PHƯƠNG THỨC THANH TOÁN */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#475569', marginBottom: '6px' }}>
                        <span>Tạm tính:</span>
                        <span>{beforeVat.toLocaleString()} đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#475569', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #cbd5e1' }}>
                        <span>Thuế VAT (10%):</span>
                        <span>{vatAmount.toLocaleString()} đ</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: '#b91c1c', marginBottom: '12px' }}>
                        <span>TỔNG THANH TOÁN:</span>
                        <span>{finalAmount.toLocaleString()} đ</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#16a34a', fontWeight: 'bold' }}>
                        <span>Phương thức thanh toán:</span>
                        <span>Tiền mặt</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => void onDownload(invoiceId)}
                        style={{ padding: '1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        📥 Tải PDF
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ padding: '1rem', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Đóng & Tiếp tục
                    </button>
                </div>
            </div>
        </div>
    );
}