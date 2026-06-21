import { useNavigate } from 'react-router-dom';

export default function PaymentFailed() {
    const navigate = useNavigate();

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2' }}>
            <div className="page-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '5rem', color: '#dc2626', marginBottom: '1rem' }}>✖</div>
                <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>Giao Dịch Thất Bại</h1>
                <p style={{ color: '#475569', marginBottom: '2rem' }}>
                    Khách hàng đã hủy giao dịch hoặc có lỗi xảy ra từ ngân hàng. Đơn hàng vẫn được giữ nguyên trạng thái chưa thanh toán.
                </p>
                <button type="button" onClick={() => navigate('/cashier/payments')} style={{ padding: '0.8rem 1.5rem', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Quay lại màn hình Thu Ngân
                </button>
            </div>
        </div>
    );
}