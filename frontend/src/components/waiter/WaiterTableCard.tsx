import type {TableDetailResponse} from "../../api/waiter";

interface WaiterTableCardProps {
    table: TableDetailResponse;
    statusLabel: string;
    nextReservationTime?: string;
    onClick: (table: TableDetailResponse) => void;
}

export function WaiterTableCard({table, statusLabel, nextReservationTime, onClick}: WaiterTableCardProps) {
    return (
        <button
            onClick={() => onClick(table)}
            className={`waiter-table-card waiter-table-${statusLabel}`}
        >
            <div className="waiter-table-header">
                Bàn {table.tableNumber} - {table.capacity} chỗ
            </div>
            <div className="waiter-table-body">
                <p className="waiter-table-status">{statusLabel}</p>
                {statusLabel === "reserved" && nextReservationTime && (
                    <p className="waiter-table-res-time">{nextReservationTime}</p>
                )}
            </div>
        </button>
    );
}
