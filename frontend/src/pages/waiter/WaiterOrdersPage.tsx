export default function WaiterOrdersPage() {
    return (
        <div className="page-card">
            <h2>Order đang phục vụ</h2>
            <p>Phục vụ theo dõi các order đang xử lý tại bàn.</p>

            <div className="simple-table">
                <div className="simple-table-header">
                    <span>Bàn</span>
                    <span>Món</span>
                    <span>Trạng thái</span>
                </div>

                <div className="simple-table-row">
                    <span>T01</span>
                    <span>Fried Rice x2</span>
                    <span>Đang chế biến</span>
                </div>

                <div className="simple-table-row">
                    <span>T02</span>
                    <span>Pho Bo x1</span>
                    <span>Hoàn thành</span>
                </div>
            </div>
        </div>
    )
}