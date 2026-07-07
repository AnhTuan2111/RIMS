import {useCallback, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import {type TableDetailResponse, waiterApi} from "../../api/waiter";
import {WaiterHeader, WaiterTableCard} from "../../components/waiter";

const STATUS_LABEL: Record<string, string> = {
    AVAILABLE: "available",
    SERVING: "serving",
    RESERVED: "reserved",
};

export default function WaiterTableListPage() {
    const navigate = useNavigate();
    const [tables, setTables] = useState<TableDetailResponse[]>([]);
    const [tableModal, setTableModal] = useState<TableDetailResponse | null>(null);
    const [resTimes, setResTimes] = useState<Record<number, string>>({});

    const loadTables = useCallback(() => {
        waiterApi.getTables().then((res) => setTables(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        loadTables();

        const socket = new SockJS('http://localhost:8080/ws-rims');
        const client = Stomp.over(socket);

        client.connect({}, () => {
            console.log("Waiter đã kết nối đường dây với Bếp!");

            client.subscribe('/topic/waiter', (message) => {
                if (message.body === 'DISH_READY') {
                    console.log("🔔 Có món đã nấu xong! Đang cập nhật lại bàn...");
                    loadTables();
                }
            });
        }, (error) => {
            console.error("Lỗi mất kết nối với Bếp: ", error);
        });

        return () => {
            if (client !== null && client.connected) {
                client.disconnect(() => {
                    console.log("Đã ngắt kết nối an toàn.");
                });
            }
        };
    }, [loadTables]);

    useEffect(() => {
        tables.forEach((t) => {
            if (t.status === 'RESERVED' && !resTimes[t.tableId]) {
                waiterApi.getCurrentReservationByTable(t.tableId)
                    .then((res) => {
                        if (res.data?.reservationTime) {
                            const time = res.data.reservationTime.split('T')[1]?.substring(0, 5) || '';
                            setResTimes(prev => ({ ...prev, [t.tableId]: time }));
                        }
                    })
                    .catch(console.error);
            }
        });
    }, [tables, resTimes]);

    function handleTableClick(table: TableDetailResponse) {
        if (table.status === "AVAILABLE") {
            setTableModal(table);
        } else if (table.status === "SERVING") {
            navigate(`/waiter/tables/${table.tableId}/order/detail`);
        } else if (table.status === "RESERVED") {
            navigate(`/waiter/tables/${table.tableId}/reservation`);
        }
    }

    const displayTables = tables.slice(0, 12);

    return (
        <div className="waiter-container">
            <WaiterHeader/>
            <main className="waiter-main">
                <div className="waiter-legend">
                    <span className="waiter-legend-item">
                        <span className="waiter-legend-dot waiter-dot-available"/> Available
                    </span>
                    <span className="waiter-legend-item">
                        <span className="waiter-legend-dot waiter-dot-serving"/> Serving
                    </span>
                    <span className="waiter-legend-item">
                        <span className="waiter-legend-dot waiter-dot-reserved"/> Reserved
                    </span>
                </div>
                <div className="waiter-table-grid">
                    {displayTables.map((table) => {
                        const st = STATUS_LABEL[table.status] || "available";
                        const nextResTime = resTimes[table.tableId];
                        return (
                            <WaiterTableCard
                                key={table.tableId}
                                table={table}
                                statusLabel={st}
                                nextReservationTime={nextResTime}
                                onClick={handleTableClick}
                            />
                        );
                    })}
                </div>
            </main>

            {tableModal && (
                <div className="waiter-modal-overlay" onClick={() => setTableModal(null)}>
                    <div className="waiter-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Bàn {tableModal.tableNumber}</h3>
                        
                        {tableModal.status === "AVAILABLE" && tableModal.upcomingReservationTime ? (
                            <div className="waiter-warning-box">
                                <p>
                                    <strong>⚠️ Cảnh báo:</strong> Bàn này đã được đặt trước bởi <b>{tableModal.upcomingCustomerName || "Khách"}</b> vào lúc <b>{tableModal.upcomingReservationTime.split('T')[1].substring(0, 5)}</b>.
                                </p>
                                <p>Vui lòng xác nhận với khách walk-in rằng họ có thể hoàn thành bữa ăn trước thời gian này không. Nếu không, hãy chọn bàn khác.</p>
                            </div>
                        ) : (
                            <p>Bàn đang trống. Bạn muốn làm gì?</p>
                        )}
                        
                        <div className="waiter-modal-actions">
                            <button onClick={() => setTableModal(null)} className="waiter-btn-outline">
                                {tableModal.upcomingReservationTime ? 'Chọn Bàn Khác' : 'Hủy'}
                            </button>
                            <button
                                onClick={() => navigate(`/waiter/reservations?tableId=${tableModal.tableId}`)}
                                className="waiter-btn-outline"
                            >
                                Tạo Đặt Bàn
                            </button>
                            <button
                                onClick={() => navigate(`/waiter/tables/${tableModal.tableId}/order/new`)}
                                className="waiter-btn-primary"
                            >
                                Tạo Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}