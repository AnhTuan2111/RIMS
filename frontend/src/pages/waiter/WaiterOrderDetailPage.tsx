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
                    <div className="waiter-card">
                        <div className="waiter-card-header">Hóa đơn tạm tính</div>
                        <div className="waiter-card-body">
                            {servingOrders.length > 0 && (
                                <>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <span style={{color: '#64748b', fontWeight: 600}}>Tạm tính:</span>
                                        <span
                                            style={{fontWeight: 700}}>{fmtPrice(servingOrders[0].totalAmountBeforeVat)}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '1.25rem',
                                        borderBottom: '1px solid #e2e8f0',
                                        paddingBottom: '1.25rem'
                                    }}>
                                        <span style={{color: '#64748b', fontWeight: 600}}>VAT (10%):</span>
                                        <span style={{fontWeight: 700}}>{fmtPrice(servingOrders[0].vatAmount)}</span>
                                    </div>
                                    <div
                                        style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem'}}>
                                        <span style={{color: '#0f172a', fontWeight: 800}}>Tổng cộng:</span>
                                        <span style={{
                                            fontWeight: 800,
                                            color: '#dc2626'
                                        }}>{fmtPrice(servingOrders[0].finalAmount)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
