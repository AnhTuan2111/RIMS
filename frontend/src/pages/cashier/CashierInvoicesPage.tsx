import {useCallback, useEffect, useState} from 'react';
import {cashierApi} from '../../api/cashier';
import type {InvoiceDetail, InvoiceSummary} from '../../types/cashier';

const PAGE_SIZE = 10;

export default function CashierInvoicesPage() {
    const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Bộ lọc
    const [tableNumber, setTableNumber] = useState('');
    const [keyword, setKeyword] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [invoiceCode, setInvoiceCode] = useState('');
    const [tableOptions, setTableOptions] = useState<string[]>([]);

    // Modal chi tiết
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Lấy danh sách số bàn để đổ vào dropdown lọc (dùng lại API bàn đã có)
    useEffect(() => {
        cashierApi.getTables()
            .then(res => setTableOptions(res.data.map(t => t.tableNumber)))
            .catch(() => setTableOptions([]));
    }, []);

    const loadInvoices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await cashierApi.getTodayInvoices({
                page,
                size: PAGE_SIZE,
                tableNumber: tableNumber || undefined,
                keyword: keyword || undefined,
                paymentMethod: paymentMethod || undefined,
                invoiceCode: invoiceCode || undefined,
            });
            setInvoices(res.data.content);
            setTotalPages(res.data.totalPages);
            setTotalElements(res.data.totalElements);
        } catch (err) {
            console.error(err);
            setError('Không thể tải danh sách hóa đơn.');
        } finally {
            setIsLoading(false);
        }
    }, [page, tableNumber, keyword, paymentMethod, invoiceCode]);

    useEffect(() => {
        Promise.resolve().then(() => {
            void loadInvoices();
        });
    }, [loadInvoices]);

    // Mỗi lần đổi bộ lọc thì quay về trang đầu
    const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
        setter(value);
        setPage(0);
    };

    const openDetail = async (invoiceId: number) => {
        setLoadingDetail(true);
        try {
            const res = await cashierApi.getInvoiceDetail(invoiceId);
            setSelectedInvoice(res.data);
        } catch (err) {
            console.error(err);
            alert('Không thể tải chi tiết hóa đơn.');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleDownloadPdf = async (invoiceId: number) => {
        try {
            const res = await cashierApi.downloadInvoicePdf(invoiceId);
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
            alert('Không thể tải PDF!');
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
    };

    const methodLabel = (m: string | null) => m === 'CASH' ? 'Tiền mặt' : m === 'QRCODE' ? 'VNPay/QR' : '—';

    return (
        <div className="page-card">
            <h2>Hóa đơn hôm nay</h2>
            <p style={{color: '#64748b', marginBottom: '1.5rem'}}>
                Danh sách hóa đơn đã thanh toán trong ngày ({totalElements} hóa đơn)
            </p>

            {/* ── Bộ lọc ── */}
            <div style={{display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap'}}>
                <select
                    value={tableNumber}
                    onChange={e => handleFilterChange(setTableNumber)(e.target.value)}
                    style={filterInputStyle}
                >
                    <option value="">Tất cả bàn</option>
                    {tableOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <input
                    value={keyword}
                    onChange={e => handleFilterChange(setKeyword)(e.target.value)}
                    placeholder="Tìm theo tên/SĐT khách hàng..."
                    style={{...filterInputStyle, flex: 1, minWidth: 200}}
                />

                <select
                    value={paymentMethod}
                    onChange={e => handleFilterChange(setPaymentMethod)(e.target.value)}
                    style={filterInputStyle}
                >
                    <option value="">Tất cả phương thức</option>
                    <option value="CASH">Tiền mặt</option>
                    <option value="QRCODE">VNPay/QR</option>
                </select>

                <input
                    value={invoiceCode}
                    onChange={e => handleFilterChange(setInvoiceCode)(e.target.value)}
                    placeholder="Mã hóa đơn..."
                    style={{...filterInputStyle, width: 140}}
                />
            </div>

            {error && (
                <div className="auth-error" style={{marginBottom: 16}}>{error}</div>
            )}

            {/* ── Bảng danh sách ── */}
            {isLoading ? (
                <div style={{textAlign: 'center', padding: 48, color: '#9ca3af'}}>
                    <div style={{fontSize: 28, marginBottom: 8}}>⟳</div>
                    Đang tải dữ liệu...
                </div>
            ) : (
                <div className="simple-table">
                    <div className="simple-table-header" style={gridCols}>
                        <span>Mã HĐ</span>
                        <span>Bàn</span>
                        <span>Giờ</span>
                        <span>Khách hàng</span>
                        <span>Tổng tiền</span>
                        <span>Phương thức</span>
                        <span>Thao tác</span>
                    </div>

                    {invoices.length === 0 ? (
                        <div style={{textAlign: 'center', padding: 40, color: '#9ca3af'}}>
                            Không có hóa đơn nào khớp bộ lọc.
                        </div>
                    ) : invoices.map(inv => (
                        <div className="simple-table-row" key={inv.invoiceId} style={{...gridCols, alignItems: 'center'}}>
                            <span style={{fontWeight: 600}}>INV-{inv.invoiceId}</span>
                            <span>{inv.tableNumber}</span>
                            <span>{formatTime(inv.invoiceDate)}</span>
                            <span style={{color: '#6b7280', fontSize: 13}}>{inv.customerName ?? '—'}</span>
                            <span style={{fontWeight: 600, color: '#b91c1c'}}>{inv.finalAmount.toLocaleString()} đ</span>
                            <span>
                                <span style={{
                                    background: inv.paymentMethod === 'CASH' ? '#d1fae5' : '#dbeafe',
                                    color: inv.paymentMethod === 'CASH' ? '#065f46' : '#1e40af',
                                    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600
                                }}>
                                    {methodLabel(inv.paymentMethod)}
                                </span>
                            </span>
                            <span>
                                <button onClick={() => void openDetail(inv.invoiceId)} style={btn('#f3f4f6', '#374151')}>
                                    Xem chi tiết
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Phân trang ── */}
            {totalPages > 1 && (
                <div style={{display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, alignItems: 'center'}}>
                    <button
                        disabled={page === 0}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        style={btn('#f3f4f6', '#374151')}
                    >
                        ← Trước
                    </button>
                    <span style={{fontSize: 13, color: '#6b7280'}}>
                        Trang {page + 1} / {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        style={btn('#f3f4f6', '#374151')}
                    >
                        Sau →
                    </button>
                </div>
            )}

            {/* ── Modal chi tiết hóa đơn ── */}
            {(selectedInvoice || loadingDetail) && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 14, padding: 28, width: 480, maxWidth: '92vw',
                        maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.28)'
                    }}>
                        {loadingDetail || !selectedInvoice ? (
                            <p style={{textAlign: 'center', padding: 40}}>Đang tải chi tiết...</p>
                        ) : (
                            <>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                                    <h3 style={{margin: 0}}>Hóa đơn INV-{selectedInvoice.invoiceId}</h3>
                                    <button onClick={() => setSelectedInvoice(null)}
                                            style={{background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af'}}>✕</button>
                                </div>

                                <div style={{fontSize: 13, color: '#64748b', marginBottom: 12}}>
                                    Bàn: <strong>{selectedInvoice.tableNumber}</strong> ·
                                    Giờ: <strong>{formatTime(selectedInvoice.invoiceDate)}</strong>
                                </div>

                                <div className="simple-table" style={{marginBottom: 16}}>
                                    <div className="simple-table-header" style={{
                                        gridTemplateColumns: '2fr 1fr 1fr', display: 'grid',
                                        fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', paddingBottom: 6
                                    }}>
                                        <span>Món ăn</span><span>SL</span><span style={{textAlign: 'right'}}>Thành tiền</span>
                                    </div>
                                    {selectedInvoice.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            gridTemplateColumns: '2fr 1fr 1fr', display: 'grid',
                                            padding: '6px 0', borderBottom: '1px dashed #f1f5f9'
                                        }}>
                                            <span>{item.dishName}</span>
                                            <span>x{item.quantity}</span>
                                            <span style={{textAlign: 'right'}}>{item.subTotal.toLocaleString()} đ</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14}}>
                                    <Row label="Tạm tính:" value={`${selectedInvoice.totalBeforeVat.toLocaleString()} đ`}/>
                                    <Row label="VAT (10%):" value={`${selectedInvoice.vatAmount.toLocaleString()} đ`}/>
                                    {selectedInvoice.customerName && (
                                        <>
                                            <Row label="Khách hàng:" value={selectedInvoice.customerName}/>
                                            {!!selectedInvoice.pointsUsed && selectedInvoice.pointsUsed > 0 && (
                                                <Row label="Điểm đã dùng:" value={`-${(selectedInvoice.pointsUsed * 1000).toLocaleString()} đ`} color="#059669"/>
                                            )}
                                            <Row label="Điểm tích thêm:" value={`+${selectedInvoice.pointsEarned ?? 0} điểm`} color="#059669"/>
                                        </>
                                    )}
                                    <Row label="THÀNH TIỀN:" value={`${selectedInvoice.finalAmount.toLocaleString()} đ`} bold color="#b91c1c"/>
                                    <Row label="Phương thức:" value={methodLabel(selectedInvoice.paymentMethod)}/>
                                    {selectedInvoice.paymentMethod === 'CASH' && (
                                        <>
                                            <Row label="Khách trả:" value={`${selectedInvoice.amountPaid.toLocaleString()} đ`}/>
                                            <Row label="Tiền thừa:" value={`${selectedInvoice.excessAmount.toLocaleString()} đ`}/>
                                        </>
                                    )}
                                </div>

                                <div style={{display: 'flex', gap: 8}}>
                                    <button
                                        onClick={() => void handleDownloadPdf(selectedInvoice.invoiceId)}
                                        className="primary-button" style={{flex: 1}}
                                    >
                                        📥 Tải PDF
                                    </button>
                                    <button
                                        onClick={() => setSelectedInvoice(null)}
                                        className="secondary-button" style={{flex: 1}}
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── helpers ──────────────────────────────────────────────

const gridCols: React.CSSProperties = {gridTemplateColumns: '1fr 0.7fr 0.7fr 1.3fr 1fr 1fr 1fr'};

const filterInputStyle: React.CSSProperties = {
    padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13
};

function btn(bg: string, color: string): React.CSSProperties {
    return {
        background: bg, color, border: 'none', padding: '6px 12px',
        borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500
    };
}

function Row({label, value, bold, color}: { label: string; value: string; bold?: boolean; color?: string }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontWeight: bold ? 700 : 400, color: color ?? '#334155',
            fontSize: bold ? 15 : 13, marginBottom: 4
        }}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}