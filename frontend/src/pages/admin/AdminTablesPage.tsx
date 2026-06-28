import {mockTables} from '../../data/mockData'

export default function AdminTablesPage() {
    const totalTables = mockTables.length
    const availableTables = mockTables.filter((table) => table.status === 'AVAILABLE').length
    const occupiedTables = mockTables.filter((table) => table.status === 'OCCUPIED').length

    return (
        <div className="page-card">
            <div className="page-header">
                <div>
                    <h2>Quản lý bàn</h2>
                    <p>Admin có thể quản lý số bàn, sức chứa và trạng thái bàn trong nhà hàng.</p>
                </div>

                <button className="primary-button">Thêm bàn</button>
            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <strong>{totalTables}</strong>
                    <span>Tổng số bàn</span>
                </div>

                <div className="stat-card">
                    <strong>{availableTables}</strong>
                    <span>Bàn trống</span>
                </div>

                <div className="stat-card">
                    <strong>{occupiedTables}</strong>
                    <span>Đang phục vụ</span>
                </div>
            </div>

            <div className="table-grid">
                {mockTables.map((table) => (
                    <div className="table-card" key={table.id}>
                        <strong>{table.tableNumber}</strong>
                        <span>{table.capacity} người</span>
                        <small>{table.status === 'AVAILABLE' ? 'Bàn trống' : 'Đang phục vụ'}</small>
                    </div>
                ))}
            </div>
        </div>
    )
}