import { useEffect, useState } from 'react'
import { adminApi } from '../../api/admin'
import type { TableDetailResponse } from '../../api/waiter'

export default function AdminTablesPage() {
    const [tables, setTables] = useState<TableDetailResponse[]>([])

    useEffect(() => {
        adminApi.getTables()
            .then(res => setTables(res.data))
            .catch(console.error)
    }, [])

    const totalTables = tables.length
    const availableTables = tables.filter((table) => table.status === 'AVAILABLE').length
    const occupiedTables = tables.filter((table) => table.status === 'SERVING').length
    const reservedTables = tables.filter((table) => table.status === 'RESERVED').length

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

                <div className="stat-card">
                    <strong>{reservedTables}</strong>
                    <span>Đã đặt trước</span>
                </div>
            </div>

            <div className="table-grid">
                {tables.map((table) => (
                    <div className="table-card" key={table.tableId}>
                        <strong>Bàn {table.tableNumber}</strong>
                        <span>{table.capacity} người</span>
                        <small>
                            {table.status === 'AVAILABLE' && 'Bàn trống'}
                            {table.status === 'SERVING' && 'Đang phục vụ'}
                            {table.status === 'RESERVED' && 'Đã đặt trước'}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    )
}