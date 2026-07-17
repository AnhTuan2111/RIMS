import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {type MenuItemResponse, type OrderDetailResponse, type OrderItemStatus, waiterApi,} from "../../api/waiter";
import {BackArrow, ConfirmModal, fmtPrice, WaiterHeader, WaiterToast} from "../../components/waiter";
import type {AxiosError} from "axios";

type DraftItem = {
    qty: number;
    originalQty?: number;
    note: string;
    orderItemId?: number | null;
    status?: OrderItemStatus;
    chefInternalNote?: string | null;
    chefInternalNoteCreatedAt?: string | null;
    chefInternalNoteAcknowledgedAt?: string | null;
};

export default function WaiterUpdateOrderPage() {
    const navigate = useNavigate();
    const {tableId} = useParams();
    const tid = parseInt(tableId || "0");
    const [menu, setMenu] = useState<MenuItemResponse[]>([]);
    const [servingOrders, setServingOrders] = useState<OrderDetailResponse[]>([]);
    const [orderDraft, setOrderDraft] = useState<Record<number, DraftItem>>({});
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<{ message: string; itemSummary: string } | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("Tất cả");
    const [acknowledgingItemId, setAcknowledgingItemId] =
        useState<number | null>(null);

    useEffect(() => {
        Promise.all([waiterApi.getMenu(), waiterApi.getServingOrders(tid)])
            .then(([menuRes, orderRes]) => {
                setMenu(menuRes.data);
                setServingOrders(orderRes.data);

                const draft: Record<number, DraftItem> = {};
                orderRes.data.forEach((o) => {
                    o.orderItems.forEach((item) => {
                        const dish = menuRes.data.find((m) => m.name === item.dishName);
                        if (dish) {
                            draft[dish.dishId] = {
                                qty: item.quantity,
                                originalQty: item.quantity,
                                note: item.note || "",
                                orderItemId: item.orderItemId,
                                status: item.status,
                                chefInternalNote: item.chefInternalNote,
                                chefInternalNoteCreatedAt:
                                item.chefInternalNoteCreatedAt,
                                chefInternalNoteAcknowledgedAt:
                                item.chefInternalNoteAcknowledgedAt,
                            };
                        }
                    });
                });
                setOrderDraft(draft);
            })
            .catch(console.error);
    }, [tid]);

    function showToast(msg: string, type = "success") {
        setToast({msg, type});
        setTimeout(() => setToast(null), 3000);
    }

    function getMinQty(dishId: number): number {
        const cur = orderDraft[dishId];
        if (!cur) return 0;
        // Only COMPLETED items are pinned to their original qty
        if (cur.status === "COMPLETED") {
            return cur.originalQty || 0;
        }
        return 0;
    }

    const updateItems = Object.entries(orderDraft)
        .filter(([, v]) => {
            if (!v.orderItemId) return v.qty > 0;
            return true;
        })
        .filter(([, v]) => v.qty > 0 || (v.orderItemId && v.status === "PREPARING"))
        .map(([dishId, v]) => ({
            orderItemId: v.orderItemId ?? null,
            dishId: parseInt(dishId),
            quantity: v.qty,
            note: v.note || "",
            // for display in confirm modal
            name: menu.find(m => m.dishId === parseInt(dishId))?.name || "Món"
        }));

    function openConfirm() {
        if (!servingOrders.length) return;
        if (updateItems.length === 0) {
            showToast("Không có món nào để cập nhật.", "error");
            return;
        }
        setShowConfirm(true);
    }

    async function submitUpdateOrder() {
        if (!servingOrders.length) return;
        const targetOrderId = servingOrders[0].orderId;

        setSubmitting(true);

        try {
            const res = await waiterApi.updateOrder(targetOrderId, {items: updateItems});
            setSuccessData({
                message: res.data?.message || "Cập nhật order thành công!",
                itemSummary: "",
            });
        } catch (err) {
            // Backend ErrorResponse: { message, details: Record<string,string> }
            const axiosErr = err as AxiosError<{ message?: string; details?: Record<string, string> }>;
            let reason = "Lỗi không xác định";
            if (axiosErr.response?.data) {
                const data = axiosErr.response.data;
                if (data.details && Object.keys(data.details).length > 0) {
                    // Validation errors: format "field: message"
                    reason = Object.entries(data.details)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join("; ");
                } else if (data.message) {
                    reason = data.message;
                }
            } else if (axiosErr.message) {
                reason = axiosErr.message;
            }
            showToast(`Cập nhật thất bại: ${reason}`, "error");
        } finally {
            setSubmitting(false);
            setShowConfirm(false);
        }
    }

    function changeDraftQty(dishId: number, delta: number) {
        setOrderDraft((prev) => {
            const cur = prev[dishId] || {qty: 0, note: "", orderItemId: null};
            if (cur.status === "CANCELLED") {
                const qty = Math.max(0, cur.qty + delta);
                // First time adding from 0 → clear old orderItemId, treat as new item
                if (cur.qty === 0 && qty > 0) {
                    return {
                        ...prev,
                        [dishId]: {qty, note: cur.note, orderItemId: null, status: undefined},
                    };
                }
                return {...prev, [dishId]: {...cur, qty}};
            }
            const min = getMinQty(dishId);
            const qty = Math.max(min, cur.qty + delta);
            return {...prev, [dishId]: {...cur, qty}};
        });
    }

    function setDraftNote(dishId: number, note: string) {
        setOrderDraft((prev) => ({
            ...prev,
            [dishId]: {...(prev[dishId] || {qty: 0, orderItemId: null}), note},
        }));
    }


    async function handleAcknowledgeChefNote(
        dishId: number,
        orderItemId: number,
    ) {
        try {
            setAcknowledgingItemId(orderItemId);

            await waiterApi.acknowledgeChefInternalNote(
                orderItemId,
            );

            setOrderDraft((currentDraft) => ({
                ...currentDraft,
                [dishId]: {
                    ...currentDraft[dishId],
                    chefInternalNoteAcknowledgedAt:
                        new Date().toISOString(),
                },
            }));

            showToast("Đã xác nhận ghi chú từ bếp.");
        } catch (error) {
            console.error(error);
            showToast(
                "Không thể xác nhận ghi chú từ bếp.",
                "error",
            );
        } finally {
            setAcknowledgingItemId(null);
        }
    }

    function formatChefNoteTime(value?: string | null) {
        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    return (
        <div className="waiter-container">
            <WaiterHeader/>
            <main className="waiter-main">
                <div className="waiter-sub-header">
                    <BackArrow onClick={() => navigate(`/waiter/tables/${tid}/order/detail`)}/>
                    <h2 className="waiter-title">Cập nhật Order - Bàn {tid}</h2>
                    <button onClick={openConfirm} className="waiter-action-btn">Lưu Cập Nhật</button>
                </div>
                <div className="waiter-category-nav">
                    {["Tất cả", ...Array.from(new Set(menu.map((d) => d.categoryName).filter(Boolean)))].map((cat) => (
                        <button
                            key={cat}
                            className={`waiter-category-tab${activeCategory === cat ? " waiter-category-tab-active" : ""}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="waiter-menu-grid">
                    {menu
                        .filter((dish) => activeCategory === "Tất cả" || dish.categoryName === activeCategory)
                        .map((dish) => {
                            const d = orderDraft[dish.dishId] || {qty: 0, note: ""};
                            const minQty = getMinQty(dish.dishId);
                            const hasExisting = Boolean(d.status);
                            const isUnavailable = dish.available === false;
                            return (
                                <div
                                    key={dish.dishId}
                                    className="waiter-menu-card"
                                    style={isUnavailable ? {opacity: 0.5} : undefined}
                                >
                                    <div className="waiter-menu-card-top">
                                        {dish.imageUrl ? (
                                            <img src={dish.imageUrl} alt={dish.name} className="waiter-menu-img"/>
                                        ) : (
                                            <span className="waiter-menu-emoji">🍽️</span>
                                        )}
                                        <div className="waiter-menu-info">
                                            <h4>{dish.name}</h4>
                                            <p>{fmtPrice(dish.price)}</p>
                                            {hasExisting && d.status && (
                                                <span className={`waiter-badge waiter-badge-${d.status.toLowerCase()}`}>
                                                {d.status}
                                            </span>
                                            )}
                                            {isUnavailable && (
                                                <span className="waiter-badge waiter-badge-cancelled">Tạm hết</span>
                                            )}
                                        </div>
                                    </div>
                                    {d.chefInternalNote && (
                                        <div
                                            style={{
                                                margin: "0.85rem 0",
                                                padding: "0.85rem 0.95rem",
                                                border: d.chefInternalNoteAcknowledgedAt
                                                    ? "1px solid #cbd5e1"
                                                    : "1px solid #f59e0b",
                                                borderLeft: d.chefInternalNoteAcknowledgedAt
                                                    ? "4px solid #94a3b8"
                                                    : "4px solid #f59e0b",
                                                borderRadius: "10px",
                                                background: d.chefInternalNoteAcknowledgedAt
                                                    ? "#f8fafc"
                                                    : "#fffbeb",
                                                color: d.chefInternalNoteAcknowledgedAt
                                                    ? "#475569"
                                                    : "#78350f",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <strong>🔔 Bếp nhắn</strong>

                                                {d.chefInternalNoteCreatedAt && (
                                                    <span
                                                        style={{
                                                            fontSize: "0.75rem",
                                                            color: "#64748b",
                                                        }}
                                                    >
                                                    {formatChefNoteTime(
                                                        d.chefInternalNoteCreatedAt,
                                                    )}
                                                </span>
                                                )}
                                            </div>

                                            <p
                                                style={{
                                                    margin: "0.45rem 0",
                                                    whiteSpace: "pre-wrap",
                                                    lineHeight: 1.45,
                                                }}
                                            >
                                                {d.chefInternalNote}
                                            </p>

                                            {d.chefInternalNoteAcknowledgedAt ? (
                                                <small
                                                    style={{
                                                        color: "#15803d",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    ✓ Đã xem
                                                </small>
                                            ) : (
                                                d.orderItemId && (
                                                    <button
                                                        type="button"
                                                        className="waiter-btn-outline"
                                                        disabled={
                                                            acknowledgingItemId ===
                                                            d.orderItemId
                                                        }
                                                        onClick={() =>
                                                            void handleAcknowledgeChefNote(
                                                                dish.dishId,
                                                                d.orderItemId!,
                                                            )
                                                        }
                                                        style={{
                                                            marginTop: "0.25rem",
                                                            padding: "0.4rem 0.75rem",
                                                        }}
                                                    >
                                                        {acknowledgingItemId ===
                                                        d.orderItemId
                                                            ? "Đang xác nhận..."
                                                            : "Đã xem"}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}

                                    <div className="waiter-qty-controls">
                                        <button
                                            onClick={() => changeDraftQty(dish.dishId, -1)}
                                            disabled={d.qty <= minQty}
                                            className="waiter-qty-btn"
                                        >-
                                        </button>
                                        <span className="waiter-qty-val">{d.qty}</span>
                                        <button
                                            onClick={() => changeDraftQty(dish.dishId, 1)}
                                            disabled={isUnavailable}
                                            className="waiter-qty-btn"
                                        >+
                                        </button>
                                    </div>
                                    <input
                                        placeholder="Ghi chú (ít cay, ...)"
                                        value={d.note}
                                        onChange={(e) => setDraftNote(dish.dishId, e.target.value)}
                                        className="waiter-note-input"
                                    />
                                    {d.status === "COMPLETED" && (
                                        <p className="waiter-item-hint">Món đã hoàn thành — không thể giảm số lượng
                                            dưới {minQty}.</p>
                                    )}
                                    {d.status === "CANCELLED" && (
                                        <p className="waiter-item-hint">Món đã hủy — nhấn + để thêm mới từ đầu (số lượng sẽ reset về 0).</p>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </main>

            {showConfirm && (
                <ConfirmModal
                    title="Xác nhận cập nhật Order"
                    message={`Bàn ${tid} — Bạn đang gửi yêu cầu cập nhật các món sau:`}
                    confirmLabel={submitting ? "Đang gửi..." : "Xác nhận"}
                    onCancel={() => !submitting && setShowConfirm(false)}
                    onConfirm={() => !submitting && submitUpdateOrder()}
                >
                    <ul className="waiter-confirm-list">
                        {updateItems.map((item) => (
                            <li key={item.dishId}>
                                <span>{item.name} × {item.quantity}</span>
                                {item.note && <small>Ghi chú: {item.note}</small>}
                                {!item.quantity && <small> (Hủy món)</small>}
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