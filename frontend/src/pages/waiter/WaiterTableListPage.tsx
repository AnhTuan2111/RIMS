import {useState, useEffect, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {waiterApi, type TableDetailResponse} from "../../api/waiter";
import {WaiterHeader, useReservationTick} from "../../components/waiter";
import {
    getActiveReservations,
    getEffectiveTableStatus,
    getNextReservationForTable,
    processAutoCancellations,
    type EffectiveTableStatus,
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

    useEffect(() => {
        loadTables();
    }, [loadTables]);

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
                            <button
                                key={table.tableId}
                                onClick={() => handleTableClick(table)}
                                className={`waiter-table-card waiter-table-${st}`}
                            >
                                <div className="waiter-table-header">
                                    Bàn {table.tableNumber} - {table.capacity} chỗ
                                </div>
                                <div className="waiter-table-body">
                                    <p className="waiter-table-status">{st}</p>
                                    {st === "reserved" && nextRes && (
                                        <p className="waiter-table-res-time">{nextRes.time}</p>
                                    )}
                                </div>
                            </button>
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
