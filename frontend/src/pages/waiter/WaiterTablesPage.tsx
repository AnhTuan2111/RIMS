export default function WaiterTablesPage() {
    return (
        <div className="page-card">
            <h2>Danh sách bàn</h2>
            <p>Phục vụ xem trạng thái bàn để nhận khách và tạo order.</p>

            <div className="table-grid">
                {['T01', 'T02', 'T03', 'T04', 'T05', 'T06'].map((table) => (
                    <div className="table-card" key={table}>
                        <strong>{table}</strong>
                        <span>Bàn trống</span>
                    </div>
                ))}
            </div>
        </div>
    )
}