import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InvoiceHistoryPage.css";
import { invoiceApi } from "../../api/invoiceAPI";

interface InvoiceHistory {
    invoiceId: number;
    orderId: number;
    tableNumber: string;
    paymentMethod: string;
    amount: number;
    paymentDate: string;
}

export default function InvoiceHistoryPage() {

const navigate = useNavigate();

const [items, setItems] = useState<InvoiceHistory[]>([]);

useEffect(() => {
    loadData();
}, []);

const loadData = async () => {
    try {
        const response = await invoiceApi.getInvoiceHistory();
        setItems(response.data || []);
    } catch (error) {
        console.error(error);
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
};

const formatMoney = (amount: number) => {
    return amount.toLocaleString("vi-VN") + " đ";
};

return (
    <div className="payment-history-page">

        <div className="header-section">
            <button
                className="back-button"
                onClick={() => navigate(-1)}
            >
                ←
            </button>

            <div>
                <h1 className="page-title">
                    Payment History
                </h1>

                <p className="page-subtitle">
                    Successfully paid invoices
                </p>
            </div>
        </div>

        <div className="table-card">
            <table>
                <thead>
                <tr>
                    <th>INVOICE ID</th>
                    <th>ORDER ID</th>
                    <th>TABLE</th>
                    <th>METHOD</th>
                    <th className="text-right">AMOUNT</th>
                    <th>PAYMENT DATE</th>
                </tr>
                </thead>

                <tbody>
                {items.map((item) => (
                    <tr
                        key={item.invoiceId}
                        className="clickable-row"
                        onClick={() =>
                            navigate(
                                `/admin/invoices/${item.invoiceId}`
                            )
                        }
                    >
                        <td>{item.invoiceId}</td>

                        <td>{item.orderId}</td>

                        <td>{item.tableNumber}</td>

                        <td>
                            <span
                                className={
                                    item.paymentMethod === "QRCODE"
                                        ? "method-badge qr"
                                        : "method-badge cash"
                                }
                                onClick={(e) => {
                                    e.stopPropagation();

                                    alert(
                                        `Payment Method: ${item.paymentMethod}`
                                    );
                                }}
                            >
                                {item.paymentMethod}
                            </span>
                        </td>

                        <td className="text-right amount">
                            {formatMoney(item.amount)}
                        </td>

                        <td>
                            {formatDate(item.paymentDate)}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
);

}
