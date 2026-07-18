import {
    Fragment,
    useCallback,
    useEffect,
    useState,
} from "react";
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import { getAccessToken } from "../../utils/tokenStorage";
import {
    type OrderDetailResponse,
    waiterApi,
} from "../../api/waiter";
import {
    BackArrow,
    fmtPrice,
    WaiterHeader,
} from "../../components/waiter";

function formatDateTime(value?: string | null) {
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

export default function WaiterOrderDetailPage() {
    const navigate = useNavigate();
    const {tableId} = useParams();
    const tid = parseInt(tableId || "0");

    const [servingOrders, setServingOrders] =
        useState<OrderDetailResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [
        acknowledgingItemId,
        setAcknowledgingItemId,
    ] = useState<number | null>(null);

    const loadServingOrders = useCallback(async () => {
        if (!tid) {
            setPageError("Mã bàn không hợp lệ.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setPageError("");

            const response =
                await waiterApi.getServingOrders(tid);

            setServingOrders(response.data ?? []);
        } catch (error) {
            console.error(error);
            setPageError(
                "Không thể tải chi tiết Order. Vui lòng thử lại.",
            );
        } finally {
            setLoading(false);
        }
    }, [tid]);

    useEffect(() => {
        void loadServingOrders();
    }, [loadServingOrders]);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws-rims');
        const client = Stomp.over(socket);

        client.connect({ Authorization: `Bearer ${getAccessToken()}` }, () => {
            client.subscribe('/topic/waiter', () => {
                void loadServingOrders();
            });
        }, (error) => {
            console.error('Lỗi kết nối WebSocket Waiter: ', error);
        });

        return () => {
            if (client.connected) {
                client.disconnect(() => {});
            }
        };
    }, [loadServingOrders]);

    async function handleAcknowledgeChefNote(
        orderItemId: number,
    ) {
        try {
            setAcknowledgingItemId(orderItemId);
            setPageError("");

            await waiterApi.acknowledgeChefInternalNote(
                orderItemId,
            );

            const acknowledgedAt =
                new Date().toISOString();

            setServingOrders((currentOrders) =>
                currentOrders.map((order) => ({
                    ...order,
                    orderItems: order.orderItems.map(
                        (item) =>
                            item.orderItemId === orderItemId
                                ? {
                                    ...item,
                                    chefInternalNoteAcknowledgedAt:
                                    acknowledgedAt,
                                }
                                : item,
                    ),
                })),
            );
        } catch (error) {
            console.error(error);
            setPageError(
                "Không thể xác nhận đã xem ghi chú từ bếp.",
            );
        } finally {
            setAcknowledgingItemId(null);
        }
    }

    const totalItems = servingOrders.reduce(
        (total, order) =>
            total + order.orderItems.length,
        0,
    );

    return (
        <div className="waiter-container">
            <WaiterHeader/>

            <main className="waiter-main">
                <div className="waiter-sub-header">
                    <BackArrow
                        onClick={() =>
                            navigate("/waiter/tables")
                        }
                    />

                    <h2 className="waiter-title">
                        Chi tiết Order - Bàn {tid}
                    </h2>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/waiter/tables/${tid}/order/edit`,
                            )
                        }
                        className="waiter-action-btn"
                    >
                        Cập nhật Order
                    </button>
                </div>

                {pageError && (
                    <div
                        className="waiter-form-error"
                        style={{marginBottom: "1rem"}}
                    >
                        {pageError}
                    </div>
                )}

                {loading ? (
                    <div className="waiter-card">
                        <div className="waiter-card-body">
                            Đang tải chi tiết Order...
                        </div>
                    </div>
                ) : totalItems === 0 ? (
                    <div className="waiter-card">
                        <div className="waiter-card-body">
                            Không có món nào trong Order đang phục vụ.
                        </div>
                    </div>
                ) : (
                    <div className="waiter-detail-layout">
                        <div className="waiter-card">
                            <div className="waiter-card-header">
                                Danh sách món
                            </div>

                            <div
                                className="waiter-card-body"
                                style={{padding: 0}}
                            >
                                <table className="waiter-table-custom">
                                    <thead>
                                    <tr>
                                        <th>Món</th>
                                        <th>SL</th>
                                        <th>Đơn giá</th>
                                        <th>Trạng thái</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {servingOrders.map(
                                        (order) =>
                                            order.orderItems.map(
                                                (item) => (
                                                    <Fragment
                                                        key={
                                                            item.orderItemId
                                                        }
                                                    >
                                                        <tr>
                                                            <td>
                                                                <strong>
                                                                    {
                                                                        item.dishName
                                                                    }
                                                                </strong>

                                                                {item.note && (
                                                                    <div
                                                                        style={{
                                                                            fontSize:
                                                                                "0.85rem",
                                                                            color:
                                                                                "#64748b",
                                                                            marginTop:
                                                                                "0.25rem",
                                                                        }}
                                                                    >
                                                                        Ghi chú khách:
                                                                        {" "}
                                                                        {
                                                                            item.note
                                                                        }
                                                                    </div>
                                                                )}
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.quantity
                                                                }
                                                            </td>

                                                            <td>
                                                                {fmtPrice(
                                                                    item.unitPrice,
                                                                )}
                                                            </td>

                                                            <td>
                                                                    <span
                                                                        className={`waiter-badge waiter-badge-${item.status.toLowerCase()}`}
                                                                    >
                                                                        {
                                                                            item.status
                                                                        }
                                                                    </span>
                                                            </td>
                                                        </tr>

                                                        {item.chefInternalNote && (
                                                            <tr>
                                                                <td
                                                                    colSpan={
                                                                        4
                                                                    }
                                                                    style={{
                                                                        paddingTop:
                                                                            0,
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            margin:
                                                                                "0.25rem 0 0.75rem",
                                                                            padding:
                                                                                "0.9rem 1rem",
                                                                            border:
                                                                                item.chefInternalNoteAcknowledgedAt
                                                                                    ? "1px solid #cbd5e1"
                                                                                    : "1px solid #f59e0b",
                                                                            borderLeft:
                                                                                item.chefInternalNoteAcknowledgedAt
                                                                                    ? "4px solid #94a3b8"
                                                                                    : "4px solid #f59e0b",
                                                                            borderRadius:
                                                                                "10px",
                                                                            background:
                                                                                item.chefInternalNoteAcknowledgedAt
                                                                                    ? "#f8fafc"
                                                                                    : "#fffbeb",
                                                                            color:
                                                                                item.chefInternalNoteAcknowledgedAt
                                                                                    ? "#475569"
                                                                                    : "#78350f",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                justifyContent:
                                                                                    "space-between",
                                                                                gap:
                                                                                    "1rem",
                                                                                flexWrap:
                                                                                    "wrap",
                                                                            }}
                                                                        >
                                                                            <strong>
                                                                                🔔
                                                                                Bếp
                                                                                nhắn
                                                                            </strong>

                                                                            {item.chefInternalNoteCreatedAt && (
                                                                                <span
                                                                                    style={{
                                                                                        fontSize:
                                                                                            "0.78rem",
                                                                                        color:
                                                                                            "#64748b",
                                                                                    }}
                                                                                >
                                                                                        {formatDateTime(
                                                                                            item.chefInternalNoteCreatedAt,
                                                                                        )}
                                                                                    </span>
                                                                            )}
                                                                        </div>

                                                                        <p
                                                                            style={{
                                                                                margin:
                                                                                    "0.5rem 0",
                                                                                whiteSpace:
                                                                                    "pre-wrap",
                                                                                lineHeight:
                                                                                    1.5,
                                                                            }}
                                                                        >
                                                                            {
                                                                                item.chefInternalNote
                                                                            }
                                                                        </p>

                                                                        {item.chefInternalNoteAcknowledgedAt ? (
                                                                            <div
                                                                                style={{
                                                                                    fontSize:
                                                                                        "0.82rem",
                                                                                    fontWeight:
                                                                                        700,
                                                                                    color:
                                                                                        "#15803d",
                                                                                }}
                                                                            >
                                                                                ✓
                                                                                Đã
                                                                                xem
                                                                                lúc
                                                                                {" "}
                                                                                {formatDateTime(
                                                                                    item.chefInternalNoteAcknowledgedAt,
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                className="waiter-btn-primary"
                                                                                disabled={
                                                                                    acknowledgingItemId
                                                                                    ===
                                                                                    item.orderItemId
                                                                                }
                                                                                onClick={() =>
                                                                                    void handleAcknowledgeChefNote(
                                                                                        item.orderItemId,
                                                                                    )
                                                                                }
                                                                                style={{
                                                                                    marginTop:
                                                                                        "0.25rem",
                                                                                    padding:
                                                                                        "0.45rem 0.9rem",
                                                                                }}
                                                                            >
                                                                                {acknowledgingItemId
                                                                                ===
                                                                                item.orderItemId
                                                                                    ? "Đang xác nhận..."
                                                                                    : "Đã xem"}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                ),
                                            ),
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}