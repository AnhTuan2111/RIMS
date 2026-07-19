import type {TableDetailResponse} from '@/shared/api/waiter';

interface WaiterTableCardProps {
    table: TableDetailResponse;
    statusLabel: string;
    nextReservationTime?: string;
    onClick: (table: TableDetailResponse) => void;
}

export function WaiterTableCard({table, statusLabel, nextReservationTime, onClick}: WaiterTableCardProps) {
    const isAvailableButReserved = table.status === 'AVAILABLE' && table.upcomingReservationTime;
    const cardClass = `waiter-table-card waiter-table-${statusLabel} ${isAvailableButReserved ? 'has-warning' : ''}`;

    return (
        <button
            onClick={() => onClick(table)}
            className={cardClass}
        >
            <div className="waiter-table-header">
                Bàn {table.tableNumber} - {table.capacity} chỗ
            </div>
            <div className="waiter-table-body">
                <p className="waiter-table-status">{statusLabel}</p>
                {statusLabel === "reserved" && nextReservationTime && (
                    <p className="waiter-table-res-time">{nextReservationTime}</p>
                )}
                {isAvailableButReserved && table.upcomingReservationTime && (
                    <span className="waiter-table-warning-badge">
                        Reserved at {table.upcomingReservationTime.split('T')[1].substring(0, 5)}
                    </span>
                )}
            </div>
        </button>
    );
}
