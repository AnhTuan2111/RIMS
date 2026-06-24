export default function CashierInvoicesPage() {
    return (
        <div className="page-card">
            <h2>Hóa đơn</h2>
            <p>Thu ngân xem danh sách hóa đơn đã thanh toán.</p>

            <div className="simple-table">
                <div className="simple-table-header">
                    <span>Mã hóa đơn</span>
                    <span>Bàn</span>
                    <span>Tổng tiền</span>
                </div>

                <div className="simple-table-row">
                    <span>INV001</span>
                    <span>T03</span>
                    <span>180.000đ</span>
                </div>

                <div className="simple-table-row">
                    <span>INV002</span>
                    <span>T04</span>
                    <span>220.000đ</span>
                </div>
            </div>
        </div>
    )
}