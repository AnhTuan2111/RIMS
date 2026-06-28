import {useNavigate, useSearchParams} from 'react-router-dom';
import {cashierApi} from '../../api/cashier';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const invoiceId = searchParams.get('invoiceId');

    const handleDownloadPdf = async () => {
        if (!invoiceId) return;
        try {
            const res = await cashierApi.downloadInvoicePdf(Number(invoiceId));
            const blob = new Blob([res.data as BlobPart], {type: 'application/pdf'});

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Không thể tải PDF! Vui lòng thử lại.");
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0fdf4'
        }}>
            <div className="page-card" style={{
                textAlign: 'center',
                padding: '3rem',
                maxWidth: '500px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}>
                <div style={{fontSize: '5rem', color: '#16a34a', marginBottom: '1rem'}}>✔</div>
                <h1 style={{color: '#16a34a', marginBottom: '1rem'}}>Thanh Toán Thành Công!</h1>
                <p style={{color: '#475569', marginBottom: '2rem'}}>
                    Giao dịch qua VNPay đã hoàn tất. Hóa đơn của quý khách đã được lưu lại hệ thống.
                </p>
                {invoiceId && (
                    <div style={{background: '#e2e8f0', padding: '1rem', borderRadius: '8px', marginBottom: '2rem'}}>
                        <strong>Mã hóa đơn: INV-{invoiceId}</strong>
                    </div>
                )}
                <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                    <button type="button" onClick={() => void handleDownloadPdf()} style={{
                        padding: '0.8rem 1.5rem',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        📥 Tải PDF Hóa Đơn
                    </button>
                    <button type="button" onClick={() => navigate('/cashier/payments')} style={{
                        padding: '0.8rem 1.5rem',
                        background: '#cbd5e1',
                        color: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        Về màn hình Thu Ngân
                    </button>
                </div>
            </div>
        </div>
    );
}