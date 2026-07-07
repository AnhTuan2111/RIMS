import {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {type MenuItemResponse, type OrderItemRequest, waiterApi} from "../../api/waiter";
import {BackArrow, ConfirmModal, fmtPrice, WaiterHeader, WaiterToast} from "../../components/waiter";

export default function WaiterCreateOrderPage() {
    const navigate = useNavigate();
    const {tableId} = useParams();
    const tid = parseInt(tableId || "0");
    const [searchParams] = useSearchParams();
    const reservationIdParam = searchParams.get("reservationId");
    const reservationId = reservationIdParam ? parseInt(reservationIdParam) : null;
    const [menu, setMenu] = useState<MenuItemResponse[]>([]);
    const [orderDraft, setOrderDraft] = useState<Record<number, { qty: number; note: string }>>({});
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        waiterApi.getMenu().then((res) => setMenu(res.data)).catch(console.error);
    }, []);

    function showToast(msg: string, type = "success") {
        setToast({msg, type});
        setTimeout(() => setToast(null), 3000);
    }

    const selectedItems = useMemo(() => {
        return menu
            .map((dish) => {
                const d = orderDraft[dish.dishId] || {qty: 0, note: ""};
                if (d.qty <= 0) return null;
                return {...dish, qty: d.qty, note: d.note};
            })
            .filter(Boolean) as (MenuItemResponse & { qty: number; note: string })[];
    }, [menu, orderDraft]);

    const orderTotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    function openConfirm() {
        if (!selectedItems.length) {
            showToast("Vui lòng chọn ít nhất 1 món", "error");
            return;
        }
        setShowConfirm(true);
    }

    const [successData, setSuccessData] = useState<{ message: string; itemSummary: string } | null>(null);

    async function submitCreateOrder() {
        const items: OrderItemRequest[] = selectedItems.map((item) => ({
            dishId: item.dishId,
            quantity: item.qty,
            note: item.note || "",
        }));

        setSubmitting(true);
        try {
            const data = {tableId: tid, items};
            const res = reservationId 
                ? await waiterApi.createOrderFromReservation(reservationId, data)
                : await waiterApi.createOrder(data);

            setSuccessData({
                message: res.data.message || "Tạo order thành công",
                itemSummary: "",
            });
        } catch (error: any) {
            const msg = error.response?.data?.message || typeof error.response?.data === 'string' ? error.response?.data : "Lỗi khi tạo order";
            showToast(msg, "error");
        } finally {
            setSubmitting(false);
            setShowConfirm(false);
        }
    }

    function changeDraftQty(dishId: number, delta: number, min = 0) {
        setOrderDraft((prev) => {
            const cur = prev[dishId] || {qty: 0, note: ""};
            const qty = Math.max(min, cur.qty + delta);
            return {...prev, [dishId]: {...cur, qty}};
        });
    }

    function setDraftNote(dishId: number, note: string) {
        setOrderDraft((prev) => ({
            ...prev,
            [dishId]: {...(prev[dishId] || {qty: 0}), note},
        }));
    }

    return (
        <div className="waiter-container">
            <WaiterHeader/>
            <main className="waiter-main">
                <div className="waiter-sub-header">
                    <BackArrow onClick={() => navigate("/waiter/tables")}/>
                    <h2 className="waiter-title">Tạo Order - Bàn {tid}</h2>
                    <button onClick={openConfirm} className="waiter-action-btn">Tạo Order</button>
                </div>
                <div className="waiter-menu-grid">
                    {menu.map((dish) => {
                        const d = orderDraft[dish.dishId] || {qty: 0, note: ""};
                        return (
                            <div key={dish.dishId} className="waiter-menu-card">
                                <div className="waiter-menu-card-top">
                                    {dish.imageUrl ? (
                                        <img src={dish.imageUrl} alt={dish.name} className="waiter-menu-img"/>
                                    ) : (
                                        <span className="waiter-menu-emoji">🍽️</span>
                                    )}
                                    <div className="waiter-menu-info">
                                        <h4>{dish.name}</h4>
                                        <p>{fmtPrice(dish.price)}</p>
                                    </div>
                                </div>
                                <div className="waiter-qty-controls">
                                    <button
                                        onClick={() => changeDraftQty(dish.dishId, -1)}
                                        disabled={d.qty <= 0}
                                        className="waiter-qty-btn"
                                    >-
                                    </button>
                                    <span className="waiter-qty-val">{d.qty}</span>
                                    <button onClick={() => changeDraftQty(dish.dishId, 1)} className="waiter-qty-btn">+
                                    </button>
                                </div>
                                <input
                                    placeholder="Ghi chú"
                                    value={d.note}
                                    onChange={(e) => setDraftNote(dish.dishId, e.target.value)}
                                    className="waiter-note-input"
                                />
                            </div>
                        );
                    })}
                </div>
            </main>

            {showConfirm && (
                <ConfirmModal
                    title="Xác nhận tạo Order"
                    message={`Bàn ${tid} — ${selectedItems.length} món, tổng tạm tính ${fmtPrice(orderTotal)}`}
                    confirmLabel={submitting ? "Đang tạo..." : "Xác nhận"}
                    onCancel={() => !submitting && setShowConfirm(false)}
                    onConfirm={() => !submitting && submitCreateOrder()}
                >
                    <ul className="waiter-confirm-list">
                        {selectedItems.map((item) => (
                            <li key={item.dishId}>
                                <span>{item.name} × {item.qty}</span>
                                {item.note && <small>Ghi chú: {item.note}</small>}
                            </li>
                        ))}
                    </ul>
                </ConfirmModal>
            )}

            {successData && (
                <ConfirmModal
                    title="Thành công"
                    message={successData.message}
                    confirmLabel="Đóng"
                    cancelLabel=""
                    onConfirm={() => navigate("/waiter/tables")}
                    onCancel={() => navigate("/waiter/tables")}
                >
                    <div style={{marginTop: "1rem", whiteSpace: "pre-wrap", color: "#475569"}}>
                        {successData.itemSummary}
                    </div>
                </ConfirmModal>
            )}

            <WaiterToast toast={toast}/>
        </div>
    );
}
