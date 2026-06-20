import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoiceApi } from "../../api/invoiceAPI";
import "./InvoiceDetailPage.css";

export default function InvoiceDetailPage() {

    const { invoiceId } = useParams();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response =
                await invoiceApi.getInvoiceDetail(
                    Number(invoiceId)
                );

            setInvoice(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    if (!invoice) {
        return <div>Loading...</div>;
    }

    return (
        <div className="invoice-detail-page">

            <div className="header-section">
                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    ←
                </button>

                <div>
                    <h1>
                        Order ORD-{invoice.orderId}
                    </h1>

                    <p>
                        Invoice #{invoice.invoiceId}
                    </p>
                </div>
            </div>

            <div className="info-card">

                <div className="info-item">
                    <span>Created</span>

                    <strong>
                        {new Date(
                            invoice.invoiceDate
                        ).toLocaleString("vi-VN")}
                    </strong>
                </div>

                <div className="info-item">
                    <span>Table</span>

                    <strong>
                        {invoice.tableNumber}
                    </strong>
                </div>

                <div className="info-item">
                    <span>Payment</span>

                    <div
                        className={
                            invoice.paymentMethod === "QRCODE"
                                ? "payment-badge qr"
                                : "payment-badge cash"
                        }
                    >
                        {invoice.paymentMethod === "QRCODE"
                            ? "⌘ QRCODE"
                            : "💵 CASH"}
                    </div>
                </div>

            </div>

            <div className="table-card">
                <table>

                    <thead>
                    <tr>
                        <th>DISH</th>
                        <th>QTY</th>
                        <th>UNIT PRICE</th>
                        <th>AMOUNT</th>
                    </tr>
                    </thead>

                    <tbody>
                    {invoice.items.map(
                        (item: any, index: number) => (
                            <tr key={index}>
                                <td>{item.dishName}</td>

                                <td>{item.quantity}</td>

                                <td>
                                    {item.unitPrice
                                        .toLocaleString("vi-VN")}
                                </td>

                                <td>
                                    {item.amount
                                        .toLocaleString("vi-VN")}
                                </td>
                            </tr>
                        )
                    )}
                    </tbody>

                </table>

                <div className="total-section">
                    <span>Total Amount</span>

                    <strong>
                        {invoice.finalAmount
                            .toLocaleString("vi-VN")} đ
                    </strong>
                </div>
            </div>

        </div>
    );
}
