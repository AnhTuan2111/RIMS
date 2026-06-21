import {useNavigate, useParams} from "react-router-dom";
import {WaiterHeader, BackArrow, useReservationTick} from "../../components/waiter";
import {getActiveReservationForTable, processAutoCancellations} from "./mockReservations";

export default function WaiterReservationDetailPage() {
    const navigate = useNavigate();
    const {tableId} = useParams();
    const tid = parseInt(tableId || "0");
    useReservationTick(30000);

    processAutoCancellations();
    const reservation = getActiveReservationForTable(tid);

    if (!reservation) {
        return (
            <div className="waiter-container">
                <WaiterHeader/>
                <main className="waiter-main">
                    <div className="waiter-sub-header">
                        <BackArrow onClick={() => navigate("/waiter/tables")}/>
                        <h2 className="waiter-title">Chi tiết đặt bàn</h2>
                    </div>
                    <div className="waiter-card" style={{maxWidth: "600px"}}>
                        <div className="waiter-card-body">
                            <p style={{color: "#64748b"}}>
                                Không có đặt bàn đang hoạt động cho bàn này. Bàn có thể đã hết thời gian chờ hoặc đã được phục vụ.
                            </p>
                            <button onClick={() => navigate("/waiter/tables")} className="waiter-btn-primary" style={{marginTop: "1rem"}}>
                                Về danh sách bàn
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="waiter-container">
            <WaiterHeader/>
            <main className="waiter-main">
                <div className="waiter-sub-header">
                    <BackArrow onClick={() => navigate("/waiter/tables")}/>
                    <h2 className="waiter-title">Chi tiết đặt bàn — Bàn {tid}</h2>
                    <button
                        onClick={() => navigate(`/waiter/tables/${tid}/order/new`)}
                        className="waiter-action-btn"
                    >
                        Bắt đầu Order
                    </button>
                </div>
                <div className="waiter-card" style={{maxWidth: "600px"}}>
                    <div className="waiter-card-header">Thông tin đặt bàn</div>
                    <div className="waiter-card-body">
                        <div className="waiter-detail-row">
                            <span>Mã đặt bàn</span>
                            <strong>{reservation.id}</strong>
                        </div>
                        <div className="waiter-detail-row">
                            <span>Thời gian</span>
                            <strong>{reservation.date} — {reservation.time}</strong>
                        </div>
                        <div className="waiter-detail-row">
                            <span>Khách hàng</span>
                            <strong>{reservation.customerName}</strong>
                        </div>
                        <div className="waiter-detail-row">
                            <span>Số điện thoại</span>
                            <strong>{reservation.phone}</strong>
                        </div>
                        {reservation.note && (
                            <div className="waiter-detail-row">
                                <span>Ghi chú</span>
                                <strong>{reservation.note}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
