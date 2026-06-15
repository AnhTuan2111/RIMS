export default function CashierPaymentsPage() {
    return (
        <div className="page-card">
            <h2>Thanh toán</h2>
            <p>Thu ngân chọn bàn, kiểm tra hóa đơn và xử lý thanh toán.</p>

            <div className="simple-table">
                <div className="simple-table-header">
                    <span>Bàn</span>
                    <span>Tổng tiền</span>
                    <span>Trạng thái</span>
                </div>

                <div className="simple-table-row">
                    <span>T01</span>
                    <span>140.000đ</span>
                    <span>Chờ thanh toán</span>
                </div>

                <div className="simple-table-row">
                    <span>T02</span>
                    <span>200.000đ</span>
                    <span>Chờ thanh toán</span>
                </div>
            </div>
        </div>
    )
}