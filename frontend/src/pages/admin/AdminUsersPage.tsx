import { mockUsers } from '../../data/mockData'

export default function AdminUsersPage() {
    return (
        <div className="page-card">
            <div className="page-header">
                <div>
                    <h2>Quản lý nhân viên</h2>
                    <p>Admin có thể xem, thêm, sửa, khóa tài khoản nhân viên trong hệ thống.</p>
                </div>

                <button className="primary-button">Thêm nhân viên</button>
            </div>

            <div className="simple-table">
                <div className="simple-table-header">
                    <span>Họ tên</span>
                    <span>Tài khoản</span>
                    <span>Vai trò</span>
                    <span>Trạng thái</span>
                </div>

                {mockUsers.map((user) => (
                    <div className="simple-table-row" key={user.id}>
                        <span>{user.fullName}</span>
                        <span>{user.username}</span>
                        <span>{user.role}</span>
                        <span>{user.status}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}