import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {type OrderDetailResponse, waiterApi} from "../../api/waiter";
import {BackArrow, fmtPrice, WaiterHeader} from "../../components/waiter";

export default function WaiterOrderDetailPage() {
    const navigate = useNavigate();
    const {tableId} = useParams();
    const tid = parseInt(tableId || "0");
    const [servingOrders, setServingOrders] = useState<OrderDetailResponse[]>([]);

    useEffect(() => {
        waiterApi.getServingOrders(tid).then(res => setServingOrders(res.data)).catch(console.error);
    }, [tid]);

    return (
        <div className="waiter-container">
            <WaiterHeader/>
            <main className="waiter-main">
                <div className="waiter-sub-header">
                    <BackArrow onClick={() => navigate("/waiter/tables")}/>
                    <h2 className="waiter-title">Table: {tid}</h2>
                    <button onClick={() => navigate(`/waiter/tables/${tid}/order/edit`)}
                            className="waiter-action-btn">Cập nhật Order
                    </button>
                </div>
                <div className="waiter-detail-layout">
                    <div className="waiter-card">
                        <div className="waiter-card-header">Danh sách món</div>
                        <div className="waiter-card-body" style={{padding: 0}}>
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
                                {servingOrders.map(order =>
                                    order.orderItems.map(item => (
                                        <tr key={item.orderItemId}>
                                            <td>
                                                {item.dishName}
                                                {item.note && <div style={{
                                                    fontSize: "0.85rem",
                                                    color: "#64748b",
                                                    marginTop: "0.25rem"
                                                }}>{item.note}</div>}
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>{fmtPrice(item.unitPrice)}</td>
                                            <td>
                                                <span
                                                    className={`waiter-badge waiter-badge-${item.status.toLowerCase()}`}>{item.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
