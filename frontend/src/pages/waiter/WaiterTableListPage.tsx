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

function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function WaiterTableListPage() {
    const navigate = useNavigate();
    const [tables, setTables] = useState<TableDetailResponse[]>([]);
    const [tableModal, setTableModal] = useState<TableDetailResponse | null>(null);
    const [resTimes, setResTimes] = useState<Record<number, string>>({});
    const [modalReservations, setModalReservations] = useState<any[]>([]);

    const loadTables = useCallback(() => {
        waiterApi.getTables().then((res) => setTables(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        loadTables();

        const socket = new SockJS('http://localhost:8080/ws-rims');
        const client = Stomp.over(socket);

        client.connect({}, () => {
            console.log("Waiter đã kết nối đường dây với Bếp!");

            client.subscribe('/topic/waiter', () => {
                console.log("🔔 Có cập nhật! Đang làm mới lại bàn...");
                loadTables();
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
            setModalReservations([]);
            // Fetch all upcoming reservations for this table today
            waiterApi.getReservationsByTableAndDate(table.tableId, todayString())
                .then((res) => {
                    // Filter only future reservations (QUEUED status)
                    const upcoming = (res.data || []).filter((r: any) => {
                        if (r.status !== 'QUEUED' && r.status !== 'WAITING') return false;
                        if (!r.reservationTime) return false;
                        return new Date(r.reservationTime) > new Date();
                    });
                    setModalReservations(upcoming);
                })
                .catch(console.error);
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

                        {modalReservations.length > 0 ? (
                            <div className="waiter-warning-box">
                                <p>
                                    <strong>⚠️ Bàn này đã có {modalReservations.length} lịch đặt trong hôm nay:</strong>
                                </p>
                                <ul style={{margin: "0.5rem 0 0.75rem 1.25rem", padding: 0}}>
                                    {modalReservations.map((r: any) => {
                                        const time = r.reservationTime?.split('T')[1]?.substring(0, 5) || '';
                                        return (
                                            <li key={r.reservationId} style={{marginBottom: "0.35rem"}}>
                                                <strong>{time}</strong> — {r.customerName}
                                                {r.phone && <span style={{color: "#78350f"}}> ({r.phone})</span>}
                                                {r.note && <span style={{color: "#92400e", fontSize: "0.82rem"}}> · {r.note}</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                                <p style={{margin: 0}}>
                                    Vui lòng xác nhận với khách walk-in rằng họ có thể hoàn thành bữa ăn trước các khung giờ trên không. Nếu không, hãy <strong>chọn bàn khác</strong>.
                                </p>
                            </div>
                        ) : tableModal.upcomingReservationTime ? (
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
                                {(modalReservations.length > 0 || tableModal.upcomingReservationTime) ? 'Chọn Bàn Khác' : 'Hủy'}
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

