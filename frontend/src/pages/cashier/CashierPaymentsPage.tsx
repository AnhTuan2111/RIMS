import { useEffect, useState, useCallback } from 'react';
import { cashierApi } from '../../api/cashier';
import type { TableDashboardResponse, OrderDetailResponse } from '../../types/cashier';
import OrderPanel from './OrderPanel';
import PaymentModal from './PaymentModal';
import PaymentResultManager from './PaymentResultManager';

// 1. Khai báo interface để lách luật "any" an toàn
interface ApiResponseWrapper {
    result?: unknown;
    data?: unknown;
}

interface ExtendedTableResponse extends TableDashboardResponse {
    orderId?: number | null;
    order_id?: number | null;
}

export default function CashierPaymentsPage() {
    const [tables, setTables] = useState<TableDashboardResponse[]>([]);
    const [selectedTable, setSelectedTable] = useState<TableDashboardResponse | null>(null);
    const [orderDetail, setOrderDetail] = useState<OrderDetailResponse | null>(null);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    // Quản lý trạng thái màn hình thành công
    const [finalInvoiceId, setFinalInvoiceId] = useState<number | null>(null);

    const loadTables = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchTablesData = async () => {
            try {
                const res = await cashierApi.getTables();
                if (isMounted) {
                    const rawData = res.data as unknown as ApiResponseWrapper;
                    const actualTables = Array.isArray(res.data)
                        ? res.data
                        : (rawData?.result || rawData?.data || []);

                    setTables(actualTables as TableDashboardResponse[]);
                }
            } catch (err) {
                console.error("Lỗi tải danh mục bàn ăn:", err);
            }
        };
        void fetchTablesData();
        return () => { isMounted = false; };
    }, [refreshTrigger]);

    const handleSelectTable = async (table: TableDashboardResponse) => {
        if (table.status !== 'SERVING') {
            setSelectedTable(null);
            setOrderDetail(null);
            return;
        }

        setSelectedTable(table);
        setOrderDetail(null);

        const extendedTable = table as unknown as ExtendedTableResponse;
        const targetOrderId = extendedTable.currentOrderId || extendedTable.orderId || extendedTable.order_id;

        if (targetOrderId) {
            setLoadingDetails(true);
            try {
                const res = await cashierApi.getOrderDetail(targetOrderId);
                const rawData = res.data as unknown as ApiResponseWrapper;
                const actualDetail = (Array.isArray(res.data) ? res.data[0] : (rawData?.result || rawData?.data || res.data)) as OrderDetailResponse;

                setOrderDetail(actualDetail);
            } catch (err) {
                console.error("Lỗi khi lấy thông tin chi tiết hóa đơn:", err);
                alert("Không thể lấy thông tin chi tiết cho đơn hàng này!");
            } finally {
                setLoadingDetails(false);
            }
        }
    };

    const handleClosePanel = () => {
        setSelectedTable(null);
        setOrderDetail(null);
    };

    // 2. DIỆT LỖI TẢI PDF: Ép kiểu res.data thành BlobPart để né lỗi no-explicit-any
    const handleDownloadPdf = async (invoiceId: number) => {
        try {
            const res = await cashierApi.downloadInvoicePdf(invoiceId);
            const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
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

    return (
        <div className="dashboard-page" style={gridLayoutLayout}>
            <div className="page-card">
                <h2>Sơ Đồ Quầy Thu Ngân</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Danh sách bàn ăn tại nhà hàng</p>

                <div className="table-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
                    {tables.map((table) => {
                        const isSelected = selectedTable?.tableId === table.tableId;
                        const isServing = table.status === 'SERVING';
                        const extendedTable = table as unknown as ExtendedTableResponse;
                        const displayOrderId = extendedTable.currentOrderId || extendedTable.orderId || extendedTable.order_id;

                        return (
                            <button
                                key={table.tableId}
                                type="button"
                                className="table-card clickable-card"
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
                                    ID Đơn: {isServing ? (displayOrderId || 'Đang quét...') : 'null'}
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
                    onClose={handleClosePanel}
                    onCheckout={() => setShowPaymentModal(true)}
                />
            )}

            {/* MODAL NHẬP TIỀN */}
            {showPaymentModal && selectedTable && orderDetail && (
                <PaymentModal
                    orderId={orderDetail?.orderId || 0}
                    orderDetail={orderDetail}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={(invoiceId: number) => {
                        setShowPaymentModal(false);
                        setFinalInvoiceId(invoiceId);
                    }}
                />
            )}

            {/* MÀN HÌNH THÀNH CÔNG TOÀN MÀN HÌNH */}
            {finalInvoiceId && orderDetail && (
                <PaymentResultManager
                    invoiceId={finalInvoiceId}
                    orderDetail={orderDetail}
                    onDownload={handleDownloadPdf}
                    onClose={() => {
                        setFinalInvoiceId(null);
                        setSelectedTable(null);
                        setOrderDetail(null);
                        loadTables();
                    }}
                />
            )}
        </div>
    );
}