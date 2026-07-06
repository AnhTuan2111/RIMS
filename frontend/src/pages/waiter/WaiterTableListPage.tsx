import {useCallback, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import SockJS from 'sockjs-client'; // THÊM IMPORT NÀY
import Stomp from 'stompjs';        // THÊM IMPORT NÀY
import {type TableDetailResponse, waiterApi} from "../../api/waiter";
import {useReservationTick, WaiterHeader, WaiterTableCard} from "../../components/waiter";
import {
    type EffectiveTableStatus,
    getActiveReservations,
    getEffectiveTableStatus,
    getNextReservationForTable,
    processAutoCancellations,
} from "./mockReservations";

const STATUS_LABEL: Record<EffectiveTableStatus, string> = {
    AVAILABLE: "available",
    SERVING: "serving",
    RESERVED: "reserved",
};

export default function WaiterTableListPage() {
    const navigate = useNavigate();
    const [tables, setTables] = useState<TableDetailResponse[]>([]);
    const [tableModal, setTableModal] = useState<TableDetailResponse | null>(null);
    useReservationTick(30000);

    const loadTables = useCallback(() => {
        processAutoCancellations();
        waiterApi.getTables().then((res) => setTables(res.data)).catch(console.error);
    }, []);

    // --- ĐÃ SỬA LẠI USEEFFECT Ở ĐÂY ---
    useEffect(() => {
        // 1. Vẫn gọi loadTables lần đầu khi mở trang (code cũ)
        loadTables();

        // 2. Bật ăng-ten lắng nghe Đầu bếp (Code mới)
        const socket = new SockJS('http://localhost:8080/ws-rims');
        const client = Stomp.over(socket);

        client.connect({}, () => {
            console.log("Waiter đã kết nối đường dây với Bếp!");

            client.subscribe('/topic/waiter', (message) => {
                if (message.body === 'DISH_READY') {
                    // Khi nhận được tín hiệu món xong, tự động gọi lại hàm loadTables
                    console.log("🔔 Có món đã nấu xong! Đang cập nhật lại bàn...");
                    // Nếu ông muốn hiện pop-up thông báo cho Bồi bàn chạy đi lấy món thì mở comment dòng dưới:
                    // alert("Có món đã nấu xong, vui lòng mang ra cho khách!");
                    loadTables();
                }
            });
        }, (error) => {
            console.error("Lỗi mất kết nối với Bếp: ", error);
        });

        // 3. Tắt ăng-ten khi bồi bàn thoát màn hình này
        return () => {
            // Phải kiểm tra xem nó đã kết nối xong chưa rồi mới được rút phích cắm
            if (client !== null && client.connected) {
                client.disconnect(() => {
                    console.log("Đã ngắt kết nối an toàn.");
                });
            }
        };
    }, [loadTables]);
    // -----------------------------------

    function handleTableClick(table: TableDetailResponse) {
        const status = getEffectiveTableStatus(table.status, table.tableId);
        if (status === "AVAILABLE") {
            setTableModal(table);
        } else if (status === "SERVING") {
            navigate(`/waiter/tables/${table.tableId}/order/detail`);
        } else {
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
                        const effective = getEffectiveTableStatus(table.status, table.tableId);
                        const st = STATUS_LABEL[effective];
                        const nextRes = effective === "RESERVED"
                            ? getNextReservationForTable(table.tableId)
                            : getActiveReservations()
                                .filter((r) => r.tableId === table.tableId)
                                .sort((a, b) => a.time.localeCompare(b.time))[0];
                        return (
                            <WaiterTableCard
                                key={table.tableId}
                                table={table}
                                statusLabel={st}
                                nextReservationTime={nextRes?.time}
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
                        <p>Bàn đang trống. Bạn muốn làm gì?</p>
                        <div className="waiter-modal-actions">
                            <button onClick={() => setTableModal(null)} className="waiter-btn-outline">Hủy</button>
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