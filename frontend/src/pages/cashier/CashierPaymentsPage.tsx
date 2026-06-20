import { useEffect, useState, useCallback } from 'react';
import { cashierApi } from '../../api/cashier';
import type { TableDashboardResponse, OrderDetailResponse } from '../../types/cashier';
import OrderPanel from './OrderPanel';
import PaymentModal from './PaymentModal';
import PaymentResultManager from './PaymentResultManager';

export default function CashierPaymentsPage() {
    const [tables, setTables] = useState<TableDashboardResponse[]>([]);
    const [selectedTable, setSelectedTable] = useState<TableDashboardResponse | null>(null);
    const [orderDetail, setOrderDetail] = useState<OrderDetailResponse | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
    const [finalInvoiceId, setFinalInvoiceId] = useState<number | null>(null);

    const loadTables = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setIsLoading(true);
            }
            setError(null);
            const res = await cashierApi.getTables();
            setTables(res.data);
        } catch (err) {
            console.error(err);
            setError('Không thể tải danh mục bàn ăn.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Áp dụng cách viết chuẩn của ông để triệt tiêu lỗi render của useEffect
    useEffect(() => {
        const fetchData = async () => {
            await loadTables(false);
        };
        void fetchData();
    }, [loadTables]);

    const handleSelectTable = async (table: TableDashboardResponse) => {
        if (table.status !== 'SERVING') {
            setSelectedTable(null);
            setOrderDetail(null);
            return;
        }

        setSelectedTable(table);
        setOrderDetail(null);

        // Khớp chuẩn trường orderId từ Java DTO
        const targetOrderId = table.orderId;

        if (targetOrderId) {
            setLoadingDetails(true);
            try {
                const res = await cashierApi.getOrderDetail(targetOrderId);
                setOrderDetail(res.data);
            } catch (err) {
                console.error("Lỗi khi lấy thông tin chi tiết:", err);
                alert('Không thể lấy chi tiết đơn hàng.');
            } finally {
                setLoadingDetails(false);
            }
        }
    };

    const handleDownloadPdf = async (invoiceId: number) => {
        try {
            const res = await cashierApi.downloadInvoicePdf(invoiceId);
            const blob = new Blob([res.data], { type: 'application/pdf' });
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
            alert("Không thể tải PDF!");
        }
    };

    const gridLayoutLayout = selectedTable
        ? { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }
        : { display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' };

    if (isLoading) {
        return (
            <section className="page-card">
                <p>Đang tải sơ đồ quầy thu ngân...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="page-card">
                <p className="modal-error">{error}</p>
                <button type="button" className="primary-button" onClick={() => void loadTables(true)}>
                    Thử lại
                </button>
            </section>
        );
    }

    return (
        <div className="dashboard-page" style={gridLayoutLayout}>
            <div className="page-card">
                <h2>Sơ Đồ Quầy Thu Ngân</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Danh sách bàn ăn tại nhà hàng</p>

                <div className="table-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
                    {tables.map((table) => {
                        const isSelected = selectedTable?.tableId === table.tableId;
                        const isServing = table.status === 'SERVING';

                        return (
                            <button
                                key={table.tableId}
                                type="button"
                                onClick={() => void handleSelectTable(table)}
                                style={{
                                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                    background: isServing ? '#fff7ed' : '#ffffff',
                                    padding: '1.5rem', borderRadius: '12px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                    cursor: 'pointer', width: '100%', textAlign: 'left'
                                }}
                            >
                                <strong style={{ fontSize: '1.2rem' }}>{table.tableNumber}</strong>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                                    ID Đơn: {isServing ? (table.orderId || 'Đang quét...') : 'null'}
                                </span>
                                <small style={{ color: isServing ? '#ea580c' : '#16a34a', marginTop: 'auto', fontWeight: 'bold' }}>
                                    {isServing ? '● Đang Phục Vụ' : '○ Bàn Trống'}
                                </small>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedTable && (
                <OrderPanel
                    selectedTable={selectedTable}
                    orderDetail={orderDetail}
                    loading={loadingDetails}
                    onClose={() => { setSelectedTable(null); setOrderDetail(null); }}
                    onCheckout={() => setShowPaymentModal(true)}
                />
            )}

            {showPaymentModal && selectedTable && orderDetail && (
                <PaymentModal
                    orderId={orderDetail.orderId}
                    orderDetail={orderDetail}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={(invoiceId: number) => {
                        setShowPaymentModal(false);
                        setFinalInvoiceId(invoiceId);
                    }}
                />
            )}

            {finalInvoiceId && orderDetail && (
                <PaymentResultManager
                    invoiceId={finalInvoiceId}
                    orderDetail={orderDetail}
                    onDownload={(id) => void handleDownloadPdf(id)}
                    onClose={() => {
                        setFinalInvoiceId(null);
                        setSelectedTable(null);
                        setOrderDetail(null);
                        void loadTables(true);
                    }}
                />
            )}
        </div>
    );
}