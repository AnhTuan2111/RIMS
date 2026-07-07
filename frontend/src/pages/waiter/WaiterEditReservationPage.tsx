import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {WaiterHeader, WaiterToast} from "../../components/waiter";
import {type CreateReservationRequest, type TableDetailResponse, waiterApi} from "../../api/waiter";

export default function WaiterEditReservationPage() {
    const navigate = useNavigate();
    const {resId} = useParams();
    const [tables, setTables] = useState<TableDetailResponse[]>([]);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const [resFormError, setResFormError] = useState("");
    const [rightReservations, setRightReservations] = useState<any[]>([]);
    const [resForm, setResForm] = useState({
        customerName: "",
        phone: "",
        date: "",
        time: "",
        tableId: 0,
        note: "",
    });

    useEffect(() => {
        waiterApi.getTables().then((res) => setTables(res.data)).catch(console.error);
        if (resId) {
            waiterApi.getReservationDetail(parseInt(resId))
                .then((res) => {
                    const data = res.data;
                    if (data) {
                        const date = data.reservationTime.split("T")[0];
                        const time = data.reservationTime.split("T")[1]?.substring(0, 5) || "";
                        setResForm({
                            customerName: data.customerName,
                            phone: data.phone,
                            date,
                            time,
                            tableId: data.tableId,
                            note: data.note || "",
                        });
                    }
                })
                .catch((err) => {
                    console.error("Error fetching reservation detail:", err);
                    navigate("/waiter/tables");
                });
        }
    }, [resId, navigate]);

    useEffect(() => {
        if (resForm.tableId && resForm.date) {
            waiterApi.getReservationsByTableAndDate(resForm.tableId, resForm.date)
                .then((res) => {
                    setRightReservations(res.data || []);
                })
                .catch(console.error);
        } else {
            setRightReservations([]);
        }
    }, [resForm.tableId, resForm.date]);

    function showToast(msg: string, type = "success") {
        setToast({msg, type});
        setTimeout(() => setToast(null), 3000);
    }

    async function submitReservation() {
        const {customerName, phone, date, time, tableId, note} = resForm;
        if (!customerName.trim() || !phone.trim() || !date || !time || !tableId) {
            setResFormError("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }

        const reservationTime = `${date}T${time}:00`;
        const payload: CreateReservationRequest = {
            customerName: customerName.trim(),
            phone: phone.trim(),
            tableId,
            reservationTime,
            note: note.trim() || undefined,
        };

        try {
            await waiterApi.updateReservation(parseInt(resId!), payload);
            showToast("Đã lưu thay đổi đặt bàn");
            setResFormError("");
            setTimeout(() => navigate("/waiter/tables"), 800);
        } catch (err: unknown) {
            const responseData = (err as { response?: { data?: unknown } })?.response?.data;
            const msg =
                typeof responseData === "string"
                    ? responseData
                    : (responseData as { message?: string })?.message
                    ?? "Cập nhật đặt bàn thất bại.";
            setResFormError(msg);
        }
    }

    async function handleCancelReservation() {
        try {
            await waiterApi.cancelReservation(parseInt(resId!));
            showToast("Đã hủy đặt bàn");
            setTimeout(() => navigate("/waiter/tables"), 800);
        } catch {
            showToast("Hủy đặt bàn thất bại.", "error");
        }
    }

    return (
        <div className="waiter-container">
            <WaiterHeader/>
            <main className="waiter-main">
                <div className="waiter-sub-header">
                    <h2 className="waiter-title">Sửa Đặt Bàn</h2>
                </div>
                <div className="waiter-res-layout">
                    <div className="waiter-card">
                        <div className="waiter-card-header">Thông tin đặt bàn — {resId}</div>
                        <div className="waiter-card-body">
                            {resFormError && <div className="waiter-form-error">{resFormError}</div>}
                            <div className="waiter-form-group">
                                <label>Tên khách hàng</label>
                                <input
                                    value={resForm.customerName}
                                    onChange={(e) => setResForm({...resForm, customerName: e.target.value})}
                                    className="waiter-form-input"
                                />
                            </div>
                            <div className="waiter-form-group">
                                <label>Số điện thoại</label>
                                <input
                                    value={resForm.phone}
                                    onChange={(e) => setResForm({...resForm, phone: e.target.value})}
                                    className="waiter-form-input"
                                />
                            </div>
                            <div style={{display: "flex", gap: "1.25rem"}}>
                                <div className="waiter-form-group" style={{flex: 1}}>
                                    <label>Ngày đặt</label>
                                    <input
                                        type="date"
                                        value={resForm.date}
                                        onChange={(e) => setResForm({...resForm, date: e.target.value})}
                                        className="waiter-form-input"
                                    />
                                </div>
                                <div className="waiter-form-group" style={{flex: 1}}>
                                    <label>Giờ đặt</label>
                                    <input
                                        type="time"
                                        value={resForm.time}
                                        onChange={(e) => setResForm({...resForm, time: e.target.value})}
                                        className="waiter-form-input"
                                    />
                                </div>
                            </div>
                            <div className="waiter-form-group">
                                <label>Bàn</label>
                                <select
                                    value={resForm.tableId}
                                    onChange={(e) => setResForm({...resForm, tableId: parseInt(e.target.value)})}
                                    className="waiter-form-input"
                                >
                                    <option value={0}>Chọn bàn</option>
                                    {tables.map((t) => (
                                        <option key={t.tableId} value={t.tableId}>
                                            Bàn {t.tableNumber} ({t.capacity} chỗ)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="waiter-form-group">
                                <label>Ghi chú</label>
                                <textarea
                                    value={resForm.note}
                                    onChange={(e) => setResForm({...resForm, note: e.target.value})}
                                    className="waiter-form-input"
                                    rows={3}
                                />
                            </div>
                            <div style={{display: "flex", gap: "1rem", marginTop: "1.75rem", flexWrap: "wrap"}}>
                                <button onClick={submitReservation} className="waiter-btn-primary" style={{flex: 1}}>
                                    Lưu thay đổi
                                </button>
                                <button
                                    onClick={handleCancelReservation}
                                    className="waiter-btn-outline"
                                    style={{color: "#ef4444", borderColor: "#fca5a5"}}
                                >
                                    Hủy đặt bàn
                                </button>
                                <button onClick={() => navigate("/waiter/tables")} className="waiter-btn-outline">
                                    Quay lại
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="waiter-card">
                        <div className="waiter-card-header">
                            Lịch đặt cùng ngày
                            (Bàn {tables.find((t) => t.tableId === resForm.tableId)?.tableNumber || "..."})
                        </div>
                        <div className="waiter-card-body waiter-res-list">
                            {rightReservations.length === 0 ? (
                                <p style={{color: "#94a3b8", fontWeight: 500}}>Không có lịch đặt nào.</p>
                            ) : (
                                rightReservations.map((r) => {
                                    const timeStr = r.reservationTime ? r.reservationTime.split("T")[1]?.substring(0, 5) : "";
                                    return (
                                        <div
                                            key={r.reservationId}
                                            className="waiter-res-card"
                                            style={{borderColor: r.reservationId === parseInt(resId || "0") ? "#3b82f6" : undefined}}
                                        >
                                            <div>
                                                <div className="waiter-res-time">{timeStr}</div>
                                                <div className="waiter-res-info">
                                                    <h4>{r.customerName}</h4>
                                                    <p>{r.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <WaiterToast toast={toast}/>
        </div>
    );
}
