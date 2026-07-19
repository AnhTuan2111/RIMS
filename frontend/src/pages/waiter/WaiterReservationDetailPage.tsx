import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {BackArrow, WaiterHeader, WaiterToast} from "../../components/waiter";
import {waiterApi} from "../../api/waiter";

export default function WaiterReservationDetailPage() {
    const navigate = useNavigate();
    const {tableId} = useParams();
    const tid = parseInt(tableId || "0");
    const [reservation, setReservation] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

    useEffect(() => {
        if (tid) {
            waiterApi.getCurrentReservationByTable(tid)
                .then((res) => {
                    setReservation(res.data || null);
                })
                .catch((err) => {
                    console.error("Error fetching reservation detail:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [tid]);

    function showToast(msg: string, type = "success") {
        setToast({msg, type});
        setTimeout(() => setToast(null), 3000);
    }

    async function handleCancelReservation() {
        if (!reservation) return;
        const confirmed = window.confirm(
            `Xác nhận hủy đặt bàn của khách "${reservation.customerName}"? Bàn sẽ được giải phóng ngay.`
        );
        if (!confirmed) return;

        setCancelling(true);
        try {
            await waiterApi.cancelReservation(reservation.reservationId);
            showToast("Đã hủy đặt bàn");
            setTimeout(() => navigate("/waiter/tables"), 800);
        } catch (err: unknown) {
            const responseData = (err as { response?: { data?: unknown } })?.response?.data;
            const msg =
                typeof responseData === "string"
                    ? responseData
                    : (responseData as { message?: string })?.message
                    ?? "Hủy đặt bàn thất bại. Vui lòng thử lại.";
            showToast(msg, "error");
        } finally {
            setCancelling(false);
        }
    }

    if (loading) {
        return (
            <div className="waiter-container">
                <WaiterHeader/>
                <main className="waiter-main">
                    <p style={{color: "#64748b"}}>Đang tải thông tin đặt bàn...</p>
                </main>
            </div>
        );
    }

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
                                Không có đặt bàn đang hoạt động cho bàn này. Bàn có thể đã hết thời gian chờ hoặc đã
                                được phục vụ.
                            </p>
                            <button onClick={() => navigate("/waiter/tables")} className="waiter-btn-primary"
                                    style={{marginTop: "1rem"}}>
                                Về danh sách bàn
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const dateStr = reservation.reservationTime ? reservation.reservationTime.split("T")[0] : "";
    const timeStr = reservation.reservationTime ? reservation.reservationTime.split("T")[1]?.substring(0, 5) : "";

    return (
        <div className="waiter-container">
            <WaiterHeader/>
            <main className="waiter-main">
                <div className="waiter-sub-header">
                    <BackArrow onClick={() => navigate("/waiter/tables")}/>
                    <h2 className="waiter-title">Chi tiết đặt bàn — Bàn {tid}</h2>
                    <div style={{display: "flex", gap: "0.75rem"}}>
                        <button
                            onClick={handleCancelReservation}
                            disabled={cancelling}
                            className="waiter-btn-outline"
                            style={{color: "#ef4444", borderColor: "#fca5a5"}}
                        >
                            {cancelling ? "Đang hủy..." : "Hủy đặt bàn"}
                        </button>
                        <button
                            onClick={() => navigate(`/waiter/tables/${tid}/order/new?reservationId=${reservation.reservationId}`)}
                            className="waiter-action-btn"
                        >
                            Bắt đầu Order
                        </button>
                    </div>
                </div>
                <div className="waiter-card" style={{maxWidth: "600px"}}>
                    <div className="waiter-card-header">Thông tin đặt bàn</div>
                    <div className="waiter-card-body">
                        <div className="waiter-detail-row">
                            <span>Mã đặt bàn</span>
                            <strong>{reservation.reservationId}</strong>
                        </div>
                        <div className="waiter-detail-row">
                            <span>Thời gian</span>
                            <strong>{dateStr} — {timeStr}</strong>
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
            <WaiterToast toast={toast}/>
        </div>
    );
}