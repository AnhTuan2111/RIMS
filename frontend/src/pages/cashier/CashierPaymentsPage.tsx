import {useCallback, useEffect, useState} from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import {cashierApi} from '../../api/cashier';
import { getAccessToken } from '../../utils/tokenStorage';
import type {OrderDetailResponse, TableDashboardResponse, PaymentResponse} from '../../types/cashier';
import OrderPanel, {type CustomerInfo} from './OrderPanel';
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
    const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);

    // ĐÃ THÊM: State khách hàng/điểm được "nâng" lên đây để dùng chung
    // giữa OrderPanel (nơi tìm kiếm khách) và PaymentModal (nơi tính tiền/thanh toán)
    const [customer, setCustomer] = useState<CustomerInfo | null>(null);
    const [pointsUsed, setPointsUsed] = useState<number>(0);

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

    useEffect(() => {
        const fetchData = async () => {
            await loadTables(false);
        };
        void fetchData();
    }, [loadTables]);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws-rims');
        const client = Stomp.over(socket);

        client.connect({ Authorization: `Bearer ${getAccessToken()}` }, () => {
            console.log("Cashier đã kết nối WebSocket!");
            client.subscribe('/topic/tables', () => {
                console.log("🔔 Trạng thái bàn thay đổi! Đang làm mới lại...");
                void loadTables(false);
            });
        }, (error) => {
            console.error("Lỗi kết nối WebSocket: ", error);
        });

        // Polling fallback 10s, phòng khi WS mất kết nối
        const pollInterval = setInterval(() => {
            void loadTables(false);
        }, 10000);

        return () => {
            clearInterval(pollInterval);
            if (client !== null && client.connected) {
                client.disconnect(() => {
                    console.log("Đã ngắt kết nối an toàn.");
                });
            }
        };
    }, [loadTables]);

    const handleSelectTable = async (table: TableDashboardResponse) => {
        if (table.status !== 'SERVING') {
            setSelectedTable(null);
            setOrderDetail(null);
            return;
        }

        setSelectedTable(table);
        setOrderDetail(null);
        // ĐÃ THÊM: Reset khách hàng/điểm khi chuyển sang bàn khác
        setCustomer(null);
        setPointsUsed(0);

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
            const blob = new Blob([res.data], {type: 'application/pdf'});
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
        ? {display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem'}
        : {display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem'};

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
                <p style={{color: '#64748b', marginBottom: '1.5rem'}}>Danh sách bàn ăn tại nhà hàng</p>

                <div className="table-grid"
                     style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem'}}>
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
                                <strong style={{fontSize: '1.2rem'}}>{table.tableNumber}</strong>
                                <span style={{fontSize: '0.85rem', color: '#64748b', marginBottom: '8px'}}>
                                    ID Đơn: {isServing ? (table.orderId || 'Đang quét...') : 'null'}
                                </span>
                                <small style={{
                                    color: isServing ? '#ea580c' : '#16a34a',
                                    marginTop: 'auto',
                                    fontWeight: 'bold'
                                }}>
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
                    onClose={() => {
                        setSelectedTable(null);
                        setOrderDetail(null);
                        setCustomer(null);
                        setPointsUsed(0);
                    }}
                    onCheckout={() => setShowPaymentModal(true)}
                    customer={customer}
                    pointsUsed={pointsUsed}
                    onCustomerChange={setCustomer}
                    onPointsUsedChange={setPointsUsed}
                />
            )}

            {showPaymentModal && selectedTable && orderDetail && (
                <PaymentModal
                    orderId={orderDetail.orderId}
                    orderDetail={orderDetail}
                    customer={customer}
                    pointsUsed={pointsUsed}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={(result: PaymentResponse) => {
                        setShowPaymentModal(false);
                        setPaymentResult(result);
                    }}
                />
            )}

            {paymentResult && orderDetail && (
                <PaymentResultManager
                    paymentResult={paymentResult}
                    orderDetail={orderDetail}
                    onDownload={(id) => void handleDownloadPdf(id)}
                    onClose={() => {
                        setPaymentResult(null);
                        setSelectedTable(null);
                        setOrderDetail(null);
                        setCustomer(null);
                        setPointsUsed(0);
                        void loadTables(true);
                    }}
                />
            )}

        </div>
    );
}