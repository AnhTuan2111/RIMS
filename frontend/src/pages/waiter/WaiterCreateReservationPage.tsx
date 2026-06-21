import {useState, useEffect} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {WaiterHeader, WaiterToast, useReservationTick} from "../../components/waiter";
import {
    getActiveReservations,
    addReservation,
    hasTimeConflict,
    validateReservationForm,
    getEffectiveTableStatus,
} from "./mockReservations";
import {waiterApi, type TableDetailResponse} from "../../api/waiter";

function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function WaiterCreateReservationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedTable = parseInt(searchParams.get("tableId") || "0");
    const [tables, setTables] = useState<TableDetailResponse[]>([]);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const [resFormError, setResFormError] = useState("");
    const [resForm, setResForm] = useState({
        customerName: "",
        phone: "",
        date: todayString(),
        time: "18:00",
        tableId: preselectedTable,
        note: "",
    });
    useReservationTick(30000);

    useEffect(() => {
        waiterApi.getTables().then((res) => setTables(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (preselectedTable) {
            setResForm((prev) => ({...prev, tableId: preselectedTable}));
        }
    }, [preselectedTable]);

    function showToast(msg: string, type = "success") {
        setToast({msg, type});
        setTimeout(() => setToast(null), 3000);
    }

    function isTableSelectable(table: TableDetailResponse): boolean {
        if (getEffectiveTableStatus(table.status, table.tableId) !== "AVAILABLE") {
            if (table.tableId !== resForm.tableId) return false;
        }
        if (!resForm.date || !resForm.time) return table.status !== "SERVING";
        return !hasTimeConflict(getActiveReservations(), table.tableId, resForm.date, resForm.time);
    }

    function submitReservation() {
        const {customerName, phone, date, time, tableId, note} = resForm;
        if (!customerName.trim() || !phone.trim() || !date || !time || !tableId) {
            setResFormError("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }

        const list = getActiveReservations();
        const validationError = validateReservationForm(list, tableId, date, time);
        if (validationError) {
            setResFormError(validationError);
            return;
        }

        const table = tables.find((t) => t.tableId === tableId);
        if (table && getEffectiveTableStatus(table.status, table.tableId) !== "AVAILABLE") {
            setResFormError("Chỉ có thể chọn bàn đang Available.");
            return;
        }

        addReservation({tableId, customerName: customerName.trim(), phone: phone.trim(), date, time, note});
        showToast("Đã tạo đặt bàn");
        setResFormError("");
        setResForm({
            customerName: "",
            phone: "",
            date: todayString(),
            time: "18:00",
            tableId: 0,
            note: "",
        });
    }

    const availableForRes = tables.filter(isTableSelectable);
    const rightReservations = getActiveReservations()
        .filter((r) => {
            if (resForm.tableId && r.tableId !== resForm.tableId) return false;
            if (resForm.date && r.date !== resForm.date) return false;
            return true;
        })
        .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

    return (
        <div className="waiter-container">
            <WaiterHeader/>
            <main className="waiter-main">
                <div className="waiter-sub-header">
                    <h2 className="waiter-title">Đặt Bàn</h2>
                </div>
                <div className="waiter-res-layout">
                    <div className="waiter-card">
                        <div className="waiter-card-header">Thông tin đặt bàn</div>
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
                                    {availableForRes.map((t) => (
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
                            <div style={{display: "flex", gap: "1rem", marginTop: "1.75rem"}}>
                                <button onClick={submitReservation} className="waiter-btn-primary" style={{flex: 1}}>
                                    Lưu đặt bàn
                                </button>
                                <button onClick={() => navigate("/waiter/tables")} className="waiter-btn-outline">
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="waiter-card">
                        <div className="waiter-card-header">Danh sách đặt bàn</div>
                        <div className="waiter-card-body waiter-res-list">
                            {rightReservations.length === 0 ? (
                                <p style={{color: "#94a3b8", fontWeight: 500}}>Không có lịch đặt nào.</p>
                            ) : (
                                rightReservations.map((r) => {
                                    const tableNo = tables.find((t) => t.tableId === r.tableId)?.tableNumber ?? r.tableId;
                                    return (
                                        <div key={r.id} className="waiter-res-card">
                                            <div>
                                                <div className="waiter-res-time">{r.date} — {r.time}</div>
                                                <div className="waiter-res-info">
                                                    <h4>{r.customerName}</h4>
                                                    <p>{r.phone} · Bàn {tableNo}</p>
                                                    {r.note && <p style={{fontSize: "0.85rem", color: "#64748b"}}>{r.note}</p>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/waiter/reservations/${r.id}/edit`)}
                                                className="waiter-btn-outline"
                                                style={{padding: "0.35rem 0.85rem"}}
                                            >
                                                Sửa
                                            </button>
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
