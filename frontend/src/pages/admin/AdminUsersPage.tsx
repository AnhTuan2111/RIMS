import {useCallback, useEffect, useState} from 'react'
import * as adminApi from '../../api/admin'
import type {UserResponse} from '../../types/auth'
import {RoleType} from '../../types/auth'
import {getErrorMessage} from '../../utils/error'

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    CHEF: 'Đầu bếp',
    WAITER: 'Phục vụ',
    CASHIER: 'Thu ngân',
    CUSTOMER: 'Khách hàng',
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    ADMIN: {bg: '#fef3c7', text: '#92400e'},
    CHEF: {bg: '#fee2e2', text: '#991b1b'},
    WAITER: {bg: '#dbeafe', text: '#1e40af'},
    CASHIER: {bg: '#d1fae5', text: '#065f46'},
    CUSTOMER: {bg: '#ede9fe', text: '#5b21b6'},
}

const STAFF_ROLES = [RoleType.CHEF, RoleType.WAITER, RoleType.CASHIER, RoleType.ADMIN]

type Tab = 'staff' | 'customer'
type ModalType = 'create-staff' | 'create-customer' | 'edit' | 'detail' | null

export default function AdminUsersPage() {
    const [tab, setTab] = useState<Tab>('staff')
    const [staffList, setStaffList] = useState<UserResponse[]>([])
    const [customerList, setCustomerList] = useState<UserResponse[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const [modal, setModal] = useState<ModalType>(null)
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)

    const [form, setForm] = useState({
        username: '', email: '', phone: '', password: '', role: 'CHEF', fullName: '',
    })
    const [formError, setFormError] = useState<string | null>(null)
    const [formLoading, setFormLoading] = useState(false)

    // search & filter
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg)
        setTimeout(() => setSuccessMsg(null), 3000)
    }

    const loadData = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [staff, customers] = await Promise.all([
                adminApi.getStaffAccounts(),
                adminApi.getCustomerAccounts(),
            ])
            setStaffList(staff)
            setCustomerList(customers)
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadData()
    }, [loadData])

    const resetForm = () => setForm({username: '', email: '', phone: '', password: '', role: 'CHEF', fullName: ''})

    const openCreate = (type: Tab) => {
        resetForm()
        setFormError(null)
        setModal(type === 'staff' ? 'create-staff' : 'create-customer')
    }

    const openDetail = async (user: UserResponse) => {
        try {
            const detail = await adminApi.getAccountDetail(user.id)
            setSelectedUser(detail)
            setModal('detail')
        } catch (err) {
            setError(getErrorMessage(err))
        }
    }

    const openEdit = (user: UserResponse) => {
        setSelectedUser(user)
        setForm({...form, fullName: user.fullName, email: user.email ?? '', phone: user.phone, role: user.role})
        setFormError(null)
        setModal('edit')
    }

    const handleStatusToggle = async (user: UserResponse) => {
        const newStatus = !user.isActive

        // Optimistic update — đổi UI ngay, không cần chờ server
        const patch = (list: UserResponse[]) =>
            list.map(u => u.id === user.id ? {...u, isActive: newStatus} : u)
        setStaffList(prev => patch(prev))
        setCustomerList(prev => patch(prev))

        try {
            await adminApi.setAccountStatus(user.id, newStatus)
            showSuccess(`Đã ${newStatus ? 'kích hoạt' : 'khóa'} tài khoản ${user.username}`)
        } catch (err) {
            // Revert nếu server lỗi
            const revert = (list: UserResponse[]) =>
                list.map(u => u.id === user.id ? {...u, isActive: user.isActive} : u)
            setStaffList(prev => revert(prev))
            setCustomerList(prev => revert(prev))
            setError(getErrorMessage(err))
        }
    }

    const handleCreateStaff = async () => {
        if (!form.username || !form.email || !form.phone || !form.password) {
            setFormError('Vui lòng điền đầy đủ các trường bắt buộc')
            return
        }
        setFormLoading(true);
        setFormError(null)
        try {
            await adminApi.createStaff({
                username: form.username,
                email: form.email,
                phone: form.phone,
                role: form.role,
                password: form.password
            })
            setModal(null)
            showSuccess('Tạo tài khoản nhân viên thành công!')
            void loadData()
        } catch (err) {
            setFormError(getErrorMessage(err))
        } finally {
            setFormLoading(false)
        }
    }

    const handleCreateCustomer = async () => {
        if (!form.username || !form.email || !form.phone || !form.password) {
            setFormError('Vui lòng điền đầy đủ các trường bắt buộc')
            return
        }
        setFormLoading(true);
        setFormError(null)
        try {
            await adminApi.createCustomer({
                username: form.username,
                email: form.email,
                phone: form.phone,
                password: form.password
            })
            setModal(null)
            showSuccess('Tạo tài khoản khách hàng thành công!')
            void loadData()
        } catch (err) {
            setFormError(getErrorMessage(err))
        } finally {
            setFormLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (!selectedUser) return
        if (!form.fullName || !form.phone) {
            setFormError('Họ tên và số điện thoại không được để trống')
            return
        }
        setFormLoading(true);
        setFormError(null)
        try {
            const isStaff = selectedUser.role !== 'CUSTOMER' && selectedUser.role !== 'ADMIN'
            await adminApi.updateAccount(selectedUser.id, {
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                role: isStaff ? form.role : undefined,
            })
            setModal(null)
            showSuccess('Cập nhật tài khoản thành công!')
            void loadData()
        } catch (err) {
            setFormError(getErrorMessage(err))
        } finally {
            setFormLoading(false)
        }
    }

    const raw = tab === 'staff' ? staffList.filter(user => user.role !== 'ADMIN') : customerList
    const currentList = raw.filter(u => {
        const q = search.toLowerCase()
        const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q) || u.phone.includes(q)
        const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && u.isActive) || (filterStatus === 'inactive' && !u.isActive)
        return matchSearch && matchStatus
    })

    return (
        <div className="page-card">
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h2>Quản lý tài khoản</h2>
                    <p>Xem, thêm, sửa và quản lý trạng thái tài khoản nhân viên và khách hàng.</p>
                </div>
                <button
                    className="primary-button"
                    onClick={() => openCreate(tab)}
                >
                    + Thêm {tab === 'staff' ? 'nhân viên' : 'khách hàng'}
                </button>
            </div>

            {/* ── Alerts ── */}
            {error && (
                <div className="auth-error"
                     style={{marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} style={ghostBtn}>✕</button>
                </div>
            )}
            {successMsg && (
                <div style={{
                    background: '#d1fae5',
                    color: '#065f46',
                    padding: '12px 16px',
                    borderRadius: 8,
                    marginBottom: 16,
                    fontWeight: 500
                }}>
                    ✓ {successMsg}
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={{display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 20}}>
                {(['staff', 'customer'] as Tab[]).map(t => (
                    <button key={t} onClick={() => {
                        setTab(t);
                        setSearch('');
                        setFilterStatus('all')
                    }}
                            style={{
                                padding: '10px 28px', background: 'none', border: 'none', cursor: 'pointer',
                                borderBottom: tab === t ? '2px solid #4f46e5' : '2px solid transparent',
                                color: tab === t ? '#4f46e5' : '#6b7280',
                                fontWeight: tab === t ? 700 : 400, marginBottom: -2, fontSize: 14,
                            }}>
                        {t === 'staff'
                            ? `Nhân viên  (${staffList.filter(u => u.role !== RoleType.ADMIN).length})`
                            : `Khách hàng  (${customerList.length})`}
                    </button>
                ))}
            </div>

            {/* ── Search & Filter bar ── */}
            <div style={{display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap'}}>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm theo tên, tài khoản, email, SĐT..."
                    style={{
                        flex: 1,
                        minWidth: 200,
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 13
                    }}
                />
                {(['all', 'active', 'inactive'] as const).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                            style={{
                                padding: '8px 14px', borderRadius: 8, border: '1px solid',
                                borderColor: filterStatus === s ? '#4f46e5' : '#d1d5db',
                                background: filterStatus === s ? '#eef2ff' : '#fff',
                                color: filterStatus === s ? '#4f46e5' : '#6b7280',
                                fontWeight: filterStatus === s ? 600 : 400, cursor: 'pointer', fontSize: 13,
                            }}>
                        {s === 'all' ? 'Tất cả' : s === 'active' ? '✓ Hoạt động' : '✕ Đã khóa'}
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            {isLoading ? (
                <div style={{textAlign: 'center', padding: 48, color: '#9ca3af'}}>
                    <div style={{fontSize: 28, marginBottom: 8}}>⟳</div>
                    Đang tải dữ liệu...
                </div>
            ) : (
                <div className="simple-table">
                    <div className="simple-table-header" style={gridCols}>
                        <span>#</span>
                        <span>Họ tên</span>
                        <span>Tài khoản</span>
                        <span>Email</span>
                        <span>SĐT</span>
                        <span>Vai trò</span>
                        <span>Trạng thái</span>
                        <span>Thao tác</span>
                    </div>

                    {currentList.length === 0 ? (
                        <div style={{textAlign: 'center', padding: 40, color: '#9ca3af'}}>
                            {search || filterStatus !== 'all' ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có tài khoản nào.'}
                        </div>
                    ) : currentList.map((user, idx) => {
                        const rc = ROLE_COLORS[user.role] ?? {bg: '#f3f4f6', text: '#374151'}
                        return (
                            <div className="simple-table-row" key={user.id} style={{...gridCols, alignItems: 'center'}}>
                                <span style={{color: '#9ca3af', fontSize: 12}}>{idx + 1}</span>
                                <span style={{fontWeight: 600}}>{user.fullName}</span>
                                <span style={{color: '#6b7280', fontSize: 13}}>{user.username}</span>
                                <span style={{color: '#6b7280', fontSize: 12}}>{user.email ?? '—'}</span>
                                <span style={{fontSize: 13}}>{user.phone}</span>
                                <span>
                                    <span style={{
                                        background: rc.bg,
                                        color: rc.text,
                                        padding: '2px 8px',
                                        borderRadius: 12,
                                        fontSize: 11,
                                        fontWeight: 600
                                    }}>
                                        {ROLE_LABELS[user.role] ?? user.role}
                                    </span>
                                </span>
                                <span>
                                    <button
                                        onClick={() => void handleStatusToggle(user)}
                                        title={user.isActive ? 'Nhấn để khóa tài khoản' : 'Nhấn để kích hoạt tài khoản'}
                                        style={{
                                            background: user.isActive ? '#d1fae5' : '#fee2e2',
                                            color: user.isActive ? '#065f46' : '#991b1b',
                                            padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                                            border: `1px solid ${user.isActive ? '#6ee7b7' : '#fca5a5'}`,
                                            cursor: 'pointer', transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {user.isActive ? '● Hoạt động' : '● Đã khóa'}
                                    </button>
                                </span>
                                <span style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
                                    <button onClick={() => void openDetail(user)} style={btn('#f3f4f6', '#374151')}>Chi tiết</button>
                                    <button onClick={() => openEdit(user)}
                                            style={btn('#dbeafe', '#1d4ed8')}>Sửa</button>
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Modals ── */}
            {modal === 'create-staff' && (
                <Modal title="Thêm tài khoản nhân viên" onClose={() => setModal(null)}>
                    <FieldGroup>
                        <Field label="Tên đăng nhập *"><input value={form.username} onChange={e => setForm({
                            ...form,
                            username: e.target.value
                        })} placeholder="username"/></Field>
                        <Field label="Email *"><input type="email" value={form.email}
                                                      onChange={e => setForm({...form, email: e.target.value})}
                                                      placeholder="email@example.com"/></Field>
                        <Field label="Số điện thoại *"><input value={form.phone}
                                                              onChange={e => setForm({...form, phone: e.target.value})}
                                                              placeholder="0xxxxxxxxx"/></Field>
                        <Field label="Vai trò *">
                            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                                {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                        </Field>
                        <Field label="Mật khẩu *"><input type="password" value={form.password}
                                                         onChange={e => setForm({...form, password: e.target.value})}
                                                         placeholder="Tối thiểu 6 ký tự"/></Field>
                    </FieldGroup>
                    {formError && <ErrBox msg={formError}/>}
                    <ModalActions>
                        <button className="secondary-button" onClick={() => setModal(null)}>Hủy</button>
                        <button className="primary-button" disabled={formLoading}
                                onClick={() => void handleCreateStaff()}>
                            {formLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                    </ModalActions>
                </Modal>
            )}

            {modal === 'create-customer' && (
                <Modal title="Thêm tài khoản khách hàng" onClose={() => setModal(null)}>
                    <FieldGroup>
                        <Field label="Tên đăng nhập *"><input value={form.username} onChange={e => setForm({
                            ...form,
                            username: e.target.value
                        })} placeholder="username"/></Field>
                        <Field label="Email *"><input type="email" value={form.email}
                                                      onChange={e => setForm({...form, email: e.target.value})}
                                                      placeholder="email@example.com"/></Field>
                        <Field label="Số điện thoại *"><input value={form.phone}
                                                              onChange={e => setForm({...form, phone: e.target.value})}
                                                              placeholder="0xxxxxxxxx"/></Field>
                        <Field label="Mật khẩu *"><input type="password" value={form.password}
                                                         onChange={e => setForm({...form, password: e.target.value})}
                                                         placeholder="Tối thiểu 6 ký tự"/></Field>
                    </FieldGroup>
                    {formError && <ErrBox msg={formError}/>}
                    <ModalActions>
                        <button className="secondary-button" onClick={() => setModal(null)}>Hủy</button>
                        <button className="primary-button" disabled={formLoading}
                                onClick={() => void handleCreateCustomer()}>
                            {formLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                    </ModalActions>
                </Modal>
            )}

            {modal === 'detail' && selectedUser && (
                <Modal title="Chi tiết tài khoản" onClose={() => setModal(null)}>
                    <div style={{marginBottom: 20}}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '16px 0',
                            borderBottom: '1px solid #f3f4f6'
                        }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: '#4f46e5',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 20
                            }}>
                                {selectedUser.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{fontWeight: 700, fontSize: 16}}>{selectedUser.fullName}</div>
                                <div style={{color: '#9ca3af', fontSize: 13}}>@{selectedUser.username}</div>
                            </div>
                        </div>
                    </div>
                    <DR label="Họ tên" value={selectedUser.fullName}/>
                    <DR label="Email" value={selectedUser.email ?? '—'}/>
                    <DR label="Số điện thoại" value={selectedUser.phone}/>
                    <DR label="Vai trò" value={ROLE_LABELS[selectedUser.role] ?? selectedUser.role}/>
                    <DR label="Trạng thái" value={selectedUser.isActive ? '✓ Đang hoạt động' : '✕ Đã khóa'}
                        color={selectedUser.isActive ? '#065f46' : '#991b1b'}/>
                    <DR label="Ngày tạo"
                        value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN') : '—'}/>
                    <ModalActions>
                        <button className="secondary-button" onClick={() => setModal(null)}>Đóng</button>
                        <button className="primary-button" onClick={() => openEdit(selectedUser)}>Chỉnh sửa</button>
                    </ModalActions>
                </Modal>
            )}

            {modal === 'edit' && selectedUser && (
                <Modal title={`Chỉnh sửa — ${selectedUser.username}`} onClose={() => setModal(null)}>
                    <div style={{
                        background: '#f8fafc',
                        borderRadius: 8,
                        padding: '10px 14px',
                        marginBottom: 16,
                        fontSize: 13,
                        color: '#64748b'
                    }}>
                        Vai trò: <strong>{ROLE_LABELS[selectedUser.role]}</strong> ·
                        ID: <strong>#{selectedUser.id}</strong>
                    </div>
                    <FieldGroup>
                        <Field label="Họ tên *"><input value={form.fullName}
                                                       onChange={e => setForm({...form, fullName: e.target.value})}
                                                       placeholder="Nguyễn Văn A"/></Field>
                        <Field label="Email"><input type="email" value={form.email}
                                                    onChange={e => setForm({...form, email: e.target.value})}
                                                    placeholder="email@example.com"/></Field>
                        <Field label="Số điện thoại *"><input value={form.phone}
                                                              onChange={e => setForm({...form, phone: e.target.value})}
                                                              placeholder="0xxxxxxxxx"/></Field>
                        {selectedUser.role !== 'CUSTOMER' && selectedUser.role !== 'ADMIN' && (
                            <Field label="Vai trò *">
                                <select
                                    value={form.role}
                                    onChange={e => setForm({...form, role: e.target.value})}
                                    style={{
                                        padding: '9px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        fontSize: 14,
                                        background: '#fff'
                                    }}
                                >
                                    <option value="CHEF">Đầu bếp</option>
                                    <option value="WAITER">Phục vụ</option>
                                    <option value="CASHIER">Thu ngân</option>
                                </select>
                            </Field>
                        )}
                    </FieldGroup>
                    {formError && <ErrBox msg={formError}/>}
                    <ModalActions>
                        <button className="secondary-button" onClick={() => setModal(null)}>Hủy</button>
                        <button className="primary-button" disabled={formLoading} onClick={() => void handleUpdate()}>
                            {formLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </ModalActions>
                </Modal>
            )}
        </div>
    )
}

// ── helpers ──────────────────────────────────────────────

const gridCols: React.CSSProperties = {gridTemplateColumns: '40px 1.5fr 1fr 1.5fr 1fr 1fr 1fr 1fr'}

const ghostBtn: React.CSSProperties = {background: 'none', border: 'none', cursor: 'pointer', fontSize: 16}

function btn(bg: string, color: string): React.CSSProperties {
    return {
        background: bg,
        color,
        border: 'none',
        padding: '4px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500
    }
}

function Modal({title, onClose, children}: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 14,
                padding: 28,
                width: 500,
                maxWidth: '92vw',
                maxHeight: '82vh',
                overflowY: 'auto',
                boxShadow: '0 24px 64px rgba(0,0,0,0.28)'
            }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                    <h3 style={{margin: 0, fontSize: 18, fontWeight: 700}}>{title}</h3>
                    <button onClick={onClose} style={{...ghostBtn, fontSize: 22, color: '#9ca3af'}}>✕</button>
                </div>
                {children}
            </div>
        </div>
    )
}

function FieldGroup({children}: { children: React.ReactNode }) {
    return <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16}}>{children}</div>
}

function Field({label, children}: { label: string; children: React.ReactNode }) {
    return (
        <label
            style={{display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 500, color: '#374151'}}>
            {label}
            {children}
        </label>
    )
}

function DR({label, value, color}: { label: string; value: string; color?: string }) {
    return (
        <div style={{display: 'flex', padding: '10px 0', borderBottom: '1px solid #f3f4f6', gap: 16}}>
            <span style={{width: 140, color: '#9ca3af', fontSize: 13, flexShrink: 0}}>{label}</span>
            <span style={{fontWeight: 500, fontSize: 14, color: color ?? '#111827'}}>{value}</span>
        </div>
    )
}

function ModalActions({children}: { children: React.ReactNode }) {
    return <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 22}}>{children}</div>
}

function ErrBox({msg}: { msg: string }) {
    return <div className="auth-error" style={{margin: '0 0 4px'}}>{msg}</div>
}
