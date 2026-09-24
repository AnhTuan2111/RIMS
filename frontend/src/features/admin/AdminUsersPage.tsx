import {Eye, KeyRound, Pencil, X} from 'lucide-react'

import {DR, ErrBox, Field, FieldGroup} from '@/features/admin/users/UserFormControls'
import {ConfirmDialog, Modal, PasswordInput} from '@/shared/components/ui'
import {ROLE_COLORS, ROLE_LABELS, STAFF_ROLES} from '@/features/admin/users/constants'
import type {ModalType, Tab} from '@/features/admin/users/constants'
import {
    isValidEmail,
    isValidPhone,
    sanitizePhoneInput,
} from '@/features/admin/users/validation'
import {useCallback, useEffect, useState} from 'react'
import * as adminApi from '@/shared/api/admin'
import type {UserResponse} from '@/shared/types/auth'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'
import {EmptyState, LoadingState} from '@/shared/components/feedback'
import {PageCard, PageHeader, Pagination} from '@/shared/components/ui'

export default function AdminUsersPage() {
    const [tab, setTab] = useState<Tab>('staff')

    // dữ liệu của trang hiện tại (server trả về)
    const [items, setItems] = useState<UserResponse[]>([])
    const [totalElements, setTotalElements] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    // số lượng hiển thị trên tab (đếm riêng, không phụ thuộc tab đang xem)
    const [staffCount, setStaffCount] = useState(0)
    const [customerCount, setCustomerCount] = useState(0)

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const [modal, setModal] = useState<ModalType>(null)

    const [resetTarget, setResetTarget] = useState<UserResponse | null>(null)
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)

    const [form, setForm] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'CHEF',
        fullName: '',
    })
    const [formError, setFormError] = useState<string | null>(null)
    const [formLoading, setFormLoading] = useState(false)

    // search & filter
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

    // pagination — page tính từ 0 để khớp với API backend (Spring Data)
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg)
        setTimeout(() => setSuccessMsg(null), 3000)
    }

    const loadData = useCallback(
        async (showFullLoading = true, signal?: AbortSignal) => {
            if (showFullLoading) {
                setIsLoading(true)
            }

            setError(null)

            try {
                const params: adminApi.GetAccountsParams = {
                    keyword: search.trim() || undefined,
                    active:
                        filterStatus === 'all' ? undefined : filterStatus === 'active',
                    page,
                    size: pageSize,
                }

                const res =
                    tab === 'staff'
                        ? await adminApi.getStaffAccounts(params, signal)
                        : await adminApi.getCustomerAccounts(params, signal)

                setItems(res.content)
                setTotalElements(res.totalElements)
                setTotalPages(Math.max(res.totalPages, 1))

                if (tab === 'staff') {
                    setStaffCount(res.totalElements)
                } else {
                    setCustomerCount(res.totalElements)
                }
            } catch (err: unknown) {
                if (isRequestCanceled(err)) {
                    return
                }

                setError(getErrorMessage(err))
            } finally {
                if (showFullLoading) {
                    setIsLoading(false)
                }
            }
        },
        [tab, search, filterStatus, page, pageSize],
    )

    const loadCounts = useCallback(async (signal?: AbortSignal) => {
        try {
            const [staffRes, customerRes] = await Promise.all([
                adminApi.getStaffAccounts(
                    {
                        page: 0,
                        size: 1,
                    },
                    signal,
                ),
                adminApi.getCustomerAccounts(
                    {
                        page: 0,
                        size: 1,
                    },
                    signal,
                ),
            ])

            setStaffCount(staffRes.totalElements)
            setCustomerCount(customerRes.totalElements)
        } catch (err: unknown) {
            if (isRequestCanceled(err)) {
                return
            }

            console.error('[ADMIN_USERS_COUNT_FETCH_ERROR]', err)
        }
    }, [])

    // Khác các trang admin khác: effect này chạy lại mỗi khi đổi tab/từ khoá/trang,
    // nên setIsLoading(true) đồng bộ ở đầu loadData là đúng ý đồ — phải hiện spinner
    // cho mỗi lần lọc lại, không chỉ lần mở trang đầu tiên.
    useEffect(() => {
        const controller = new AbortController()

        void Promise.all([
            // eslint-disable-next-line react-hooks/set-state-in-effect -- xem ghi chú trên
            loadData(true, controller.signal),
            loadCounts(controller.signal),
        ])

        return () => controller.abort()
    }, [loadData, loadCounts])

    const resetForm = () =>
        setForm({
            username: '',
            email: '',
            phone: '',
            password: '',
            role: 'CHEF',
            fullName: '',
        })

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
        } catch (err: unknown) {
            setError(getErrorMessage(err))
        }
    }

    const openEdit = (user: UserResponse) => {
        setSelectedUser(user)
        setForm({
            ...form,
            username: user.username,
            fullName: user.fullName,
            email: user.email ?? '',
            phone: user.phone,
            role: user.role,
        })
        setFormError(null)
        setModal('edit')
    }

    const handleResetPassword = async () => {
        if (!resetTarget) {
            return
        }

        const target = resetTarget
        setResetTarget(null)

        try {
            await adminApi.resetPassword(target.id)
            showSuccess(`Đã đặt lại mật khẩu tài khoản ${target.username} về mặc định.`)
        } catch (err: unknown) {
            setError(getErrorMessage(err))
        }
    }

    const handleStatusToggle = async (user: UserResponse) => {
        const newStatus = !user.isActive

        // Optimistic update — đổi UI ngay, không cần chờ server
        setItems((prev) =>
            prev.map((u) => (u.id === user.id ? {...u, isActive: newStatus} : u)),
        )

        try {
            await adminApi.setAccountStatus(user.id, newStatus)
            showSuccess(
                `Đã ${newStatus ? 'kích hoạt' : 'khóa'} tài khoản ${user.username}`,
            )
        } catch (err: unknown) {
            // Revert nếu server lỗi
            setItems((prev) =>
                prev.map((u) => (u.id === user.id ? {...u, isActive: user.isActive} : u)),
            )
            setError(getErrorMessage(err))
        }
    }

    const handleCreateStaff = async () => {
        if (
            !form.username.trim() ||
            !form.fullName.trim() ||
            !form.email.trim() ||
            !form.phone.trim() ||
            !form.password
        ) {
            setFormError('Vui lòng điền đầy đủ các trường bắt buộc')
            return
        }
        if (!isValidPhone(form.phone)) {
            setFormError('Số điện thoại không hợp lệ! Phải bắt đầu bằng 0 và đủ 10 số.')
            return
        }
        if (!isValidEmail(form.email)) {
            setFormError('Email không hợp lệ!')
            return
        }
        if (form.password.length < 6) {
            setFormError('Mật khẩu phải có ít nhất 6 ký tự!')
            return
        }
        setFormLoading(true)
        setFormError(null)
        try {
            await adminApi.createStaff({
                username: form.username,
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                role: form.role,
                password: form.password,
            })
            setModal(null)
            showSuccess('Tạo tài khoản nhân viên thành công!')
            void loadData()
        } catch (err: unknown) {
            setFormError(getErrorMessage(err))
        } finally {
            setFormLoading(false)
        }
    }

    const handleCreateCustomer = async () => {
        if (
            !form.username.trim() ||
            !form.fullName.trim() ||
            !form.email.trim() ||
            !form.phone.trim() ||
            !form.password
        ) {
            setFormError('Vui lòng điền đầy đủ các trường bắt buộc')
            return
        }
        if (!isValidPhone(form.phone)) {
            setFormError('Số điện thoại không hợp lệ! Phải bắt đầu bằng 0 và đủ 10 số.')
            return
        }
        if (!isValidEmail(form.email)) {
            setFormError('Email không hợp lệ!')
            return
        }
        if (form.password.length < 6) {
            setFormError('Mật khẩu phải có ít nhất 6 ký tự!')
            return
        }
        setFormLoading(true)
        setFormError(null)
        try {
            await adminApi.createCustomer({
                username: form.username,
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                password: form.password,
            })
            setModal(null)
            showSuccess('Tạo tài khoản khách hàng thành công!')
            void loadData()
        } catch (err: unknown) {
            setFormError(getErrorMessage(err))
        } finally {
            setFormLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (!selectedUser) return
        if (!form.username.trim() || !form.fullName.trim() || !form.phone.trim()) {
            setFormError('Tên đăng nhập, họ tên và số điện thoại không được để trống')
            return
        }
        if (!isValidPhone(form.phone)) {
            setFormError('Số điện thoại không hợp lệ! Phải bắt đầu bằng 0 và đủ 10 số.')
            return
        }
        if (form.email.trim() && !isValidEmail(form.email)) {
            setFormError('Email không hợp lệ!')
            return
        }
        setFormLoading(true)
        setFormError(null)
        try {
            const isStaff =
                selectedUser.role !== 'CUSTOMER' && selectedUser.role !== 'ADMIN'
            await adminApi.updateAccount(selectedUser.id, {
                username: form.username,
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                role: isStaff ? form.role : undefined,
            })
            setModal(null)
            showSuccess('Cập nhật tài khoản thành công!')
            void loadData()
        } catch (err: unknown) {
            setFormError(getErrorMessage(err))
        } finally {
            setFormLoading(false)
        }
    }

    return (
        <PageCard>
            {/* ── Header ── */}
            <PageHeader
                title="Quản lý tài khoản"
                description="Xem, thêm, sửa và quản lý trạng thái tài khoản nhân viên và khách hàng."
                actions={
                    <button
                        type="button"
                        className="rk-btn rk-btn--primary"
                        onClick={() => openCreate(tab)}
                    >
                        + Thêm {tab === 'staff' ? 'nhân viên' : 'khách hàng'}
                    </button>
                }
            />

            {/* ── Alerts ── */}
            {error && (
                <div
                    className="rk-note rk-note--alert"
                    style={{
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        className="rk-iconbtn"
                        onClick={() => setError(null)}
                    >
                        <X className="rk-icon" aria-hidden="true" />
                    </button>
                </div>
            )}
            {successMsg && (
                <div
                    style={{
                        background: 'var(--rims-ok-soft)',
                        color: 'var(--rims-ok)',
                        padding: '12px 16px',
                        borderRadius: 8,
                        marginBottom: 16,
                        fontWeight: 500,
                    }}
                >
                    {successMsg}
                </div>
            )}

            {/* ── Tabs ── */}
            <div
                style={{
                    display: 'flex',
                    borderBottom: '2px solid var(--rims-line)',
                    marginBottom: 20,
                }}
            >
                {(['staff', 'customer'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => {
                            setTab(t)
                            setSearch('')
                            setFilterStatus('all')
                            setPage(0)
                        }}
                        style={{
                            padding: '10px 28px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            borderBottom:
                                tab === t
                                    ? '2px solid var(--rims-brand)'
                                    : '2px solid transparent',
                            color: tab === t ? 'var(--rims-brand)' : 'var(--rims-ink-3)',
                            fontWeight: tab === t ? 700 : 400,
                            marginBottom: -2,
                            fontSize: 14,
                        }}
                    >
                        {t === 'staff'
                            ? `Nhân viên  (${staffCount})`
                            : `Khách hàng  (${customerCount})`}
                    </button>
                ))}
            </div>

            {/* ── Search & Filter bar ── */}
            <div style={{display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap'}}>
                <input
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(0)
                    }}
                    placeholder="Tìm theo tên, tài khoản, email hoặc số điện thoại…"
                    style={{
                        flex: 1,
                        minWidth: 200,
                        padding: '8px 12px',
                        border: '1px solid var(--rims-line-strong)',
                        borderRadius: 8,
                        fontSize: 13,
                    }}
                />
                {(['all', 'active', 'inactive'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => {
                            setFilterStatus(s)
                            setPage(0)
                        }}
                        style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: '1px solid',
                            borderColor:
                                filterStatus === s
                                    ? 'var(--rims-brand)'
                                    : 'var(--rims-line-strong)',
                            background:
                                filterStatus === s
                                    ? 'var(--rims-brand-soft)'
                                    : 'var(--rims-surface)',
                            color:
                                filterStatus === s
                                    ? 'var(--rims-brand)'
                                    : 'var(--rims-ink-3)',
                            fontWeight: filterStatus === s ? 600 : 400,
                            cursor: 'pointer',
                            fontSize: 13,
                        }}
                    >
                        {s === 'all'
                            ? 'Tất cả'
                            : s === 'active'
                              ? 'Hoạt động'
                              : 'Đã khóa'}
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            {isLoading ? (
                <LoadingState
                    title="Đang tải danh sách tài khoản…"
                    description="Hệ thống đang lấy dữ liệu tài khoản mới nhất."
                />
            ) : items.length === 0 ? (
                <EmptyState
                    title={
                        search || filterStatus !== 'all'
                            ? 'Không tìm thấy tài khoản phù hợp'
                            : 'Chưa có tài khoản nào'
                    }
                    description={
                        search || filterStatus !== 'all'
                            ? 'Hãy đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'
                            : 'Tạo tài khoản mới để bắt đầu quản lý người dùng.'
                    }
                    action={
                        <button
                            type="button"
                            className="rk-btn rk-btn--primary"
                            onClick={() => openCreate(tab)}
                        >
                            + Thêm {tab === 'staff' ? 'nhân viên' : 'khách hàng'}
                        </button>
                    }
                />
            ) : (
                <div className="rk-tablewrap">
                    <table className="rk-table">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Họ tên</th>
                                <th scope="col">Tài khoản</th>
                                <th scope="col">Email</th>
                                <th scope="col">Số điện thoại</th>
                                <th scope="col">Vai trò</th>
                                <th scope="col">Trạng thái</th>
                                <th scope="col">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((user, idx) => {
                                const rc = ROLE_COLORS[user.role] ?? {
                                    bg: 'var(--rims-surface-2)',
                                    text: 'var(--rims-ink-2)',
                                }

                                return (
                                    <tr key={user.id}>
                                        <td className="rk-td--num">
                                            {page * pageSize + idx + 1}
                                        </td>

                                        <td>
                                            <strong>{user.fullName}</strong>
                                        </td>

                                        <td>{user.username}</td>

                                        <td>{user.email ?? '—'}</td>

                                        <td className="rk-td--num">{user.phone}</td>

                                        <td>
                                            <span
                                                className="rk-tag"
                                                style={{
                                                    background: rc.bg,
                                                    color: rc.text,
                                                }}
                                            >
                                                {ROLE_LABELS[user.role] ?? user.role}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className={`rk-chip ${
                                                    user.isActive
                                                        ? 'rk-chip--ok'
                                                        : 'rk-chip--alert'
                                                }`}
                                                onClick={() =>
                                                    void handleStatusToggle(user)
                                                }
                                                title={
                                                    user.isActive
                                                        ? 'Nhấn để khoá tài khoản'
                                                        : 'Nhấn để kích hoạt tài khoản'
                                                }
                                            >
                                                {user.isActive ? 'Hoạt động' : 'Đã khoá'}
                                            </button>
                                        </td>

                                        <td>
                                            <div className="rk-actions">
                                                <button
                                                    type="button"
                                                    className="rk-iconbtn"
                                                    title="Xem chi tiết"
                                                    onClick={() => void openDetail(user)}
                                                >
                                                    <Eye
                                                        className="rk-icon"
                                                        aria-hidden="true"
                                                    />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="rk-iconbtn rk-iconbtn--brand"
                                                    title="Chỉnh sửa"
                                                    onClick={() => openEdit(user)}
                                                >
                                                    <Pencil
                                                        className="rk-icon"
                                                        aria-hidden="true"
                                                    />
                                                </button>

                                                {/* Nhân viên không tự đổi được mật khẩu
                                                    nên quên thì phải nhờ đường này. Tài
                                                    khoản Quản trị viên không đặt lại được. */}
                                                {user.role !== 'ADMIN' && (
                                                    <button
                                                        type="button"
                                                        className="rk-iconbtn"
                                                        title="Đặt lại mật khẩu"
                                                        onClick={() =>
                                                            setResetTarget(user)
                                                        }
                                                    >
                                                        <KeyRound
                                                            className="rk-icon"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={Boolean(resetTarget)}
                title="Đặt lại mật khẩu tài khoản này?"
                description={
                    resetTarget
                        ? `Mật khẩu của ${resetTarget.fullName} (${resetTarget.username}) sẽ về mặc định. Họ sẽ không đăng nhập được bằng mật khẩu cũ nữa, nhớ báo lại cho họ.`
                        : undefined
                }
                confirmLabel="Đặt lại"
                destructive
                onConfirm={() => void handleResetPassword()}
                onCancel={() => setResetTarget(null)}
            />

            {/* ── Pagination ── */}
            {!isLoading && totalElements > 0 && (
                <Pagination
                    page={page + 1}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalElements}
                    onPageChange={(p) => setPage(p - 1)}
                    onPageSizeChange={(size) => {
                        setPageSize(size)
                        setPage(0)
                    }}
                />
            )}

            {/* ── Modals ── */}
            {modal === 'create-staff' && (
                <Modal
                    open
                    title="Thêm tài khoản nhân viên"
                    onClose={() => setModal(null)}
                    footer={
                        <>
                            <button
                                className="rk-btn rk-btn--quiet"
                                onClick={() => setModal(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="rk-btn rk-btn--primary"
                                disabled={formLoading}
                                onClick={() => void handleCreateStaff()}
                            >
                                {formLoading ? 'Đang tạo…' : 'Tạo tài khoản'}
                            </button>
                        </>
                    }
                >
                    <FieldGroup>
                        <Field label="Họ tên *">
                            <input
                                value={form.fullName}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        fullName: e.target.value,
                                    })
                                }
                                placeholder="Nguyễn Văn A"
                            />
                        </Field>
                        <Field label="Tên đăng nhập *">
                            <input
                                value={form.username}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        username: e.target.value,
                                    })
                                }
                                placeholder="username"
                            />
                        </Field>
                        <Field label="Email *">
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({...form, email: e.target.value})
                                }
                                placeholder="email@example.com"
                            />
                        </Field>
                        <Field label="Số điện thoại *">
                            <input
                                value={form.phone}
                                pattern="0[0-9]{9}"
                                inputMode="numeric"
                                maxLength={10}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        phone: sanitizePhoneInput(e.target.value),
                                    })
                                }
                                placeholder="0xxxxxxxxx"
                            />
                        </Field>
                        <Field label="Vai trò *">
                            <select
                                value={form.role}
                                onChange={(e) => setForm({...form, role: e.target.value})}
                            >
                                {STAFF_ROLES.map((r) => (
                                    <option key={r} value={r}>
                                        {ROLE_LABELS[r]}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Mật khẩu *">
                            <PasswordInput
                                value={form.password}
                                onChange={(v) => setForm({...form, password: v})}
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </Field>
                    </FieldGroup>
                    {formError && <ErrBox msg={formError} />}
                </Modal>
            )}

            {modal === 'create-customer' && (
                <Modal
                    open
                    title="Thêm tài khoản khách hàng"
                    onClose={() => setModal(null)}
                    footer={
                        <>
                            <button
                                className="rk-btn rk-btn--quiet"
                                onClick={() => setModal(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="rk-btn rk-btn--primary"
                                disabled={formLoading}
                                onClick={() => void handleCreateCustomer()}
                            >
                                {formLoading ? 'Đang tạo…' : 'Tạo tài khoản'}
                            </button>
                        </>
                    }
                >
                    <FieldGroup>
                        <Field label="Họ tên *">
                            <input
                                value={form.fullName}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        fullName: e.target.value,
                                    })
                                }
                                placeholder="Nguyễn Văn A"
                            />
                        </Field>
                        <Field label="Tên đăng nhập *">
                            <input
                                value={form.username}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        username: e.target.value,
                                    })
                                }
                                placeholder="username"
                            />
                        </Field>
                        <Field label="Email *">
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({...form, email: e.target.value})
                                }
                                placeholder="email@example.com"
                            />
                        </Field>
                        <Field label="Số điện thoại *">
                            <input
                                value={form.phone}
                                pattern="0[0-9]{9}"
                                inputMode="numeric"
                                maxLength={10}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        phone: sanitizePhoneInput(e.target.value),
                                    })
                                }
                                placeholder="0xxxxxxxxx"
                            />
                        </Field>
                        <Field label="Mật khẩu *">
                            <PasswordInput
                                value={form.password}
                                onChange={(v) => setForm({...form, password: v})}
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </Field>
                    </FieldGroup>
                    {formError && <ErrBox msg={formError} />}
                </Modal>
            )}

            {modal === 'detail' && selectedUser && (
                <Modal
                    open
                    title="Chi tiết tài khoản"
                    onClose={() => setModal(null)}
                    footer={
                        <>
                            <button
                                className="rk-btn rk-btn--quiet"
                                onClick={() => setModal(null)}
                            >
                                Đóng
                            </button>
                            <button
                                className="rk-btn rk-btn--primary"
                                onClick={() => openEdit(selectedUser)}
                            >
                                Chỉnh sửa
                            </button>
                        </>
                    }
                >
                    <div style={{marginBottom: 20}}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '16px 0',
                                borderBottom: '1px solid var(--rims-line)',
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: 'var(--rims-brand)',
                                    color: 'var(--rims-ink-on-brand)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: 20,
                                }}
                            >
                                {selectedUser.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{fontWeight: 700, fontSize: 16}}>
                                    {selectedUser.fullName}
                                </div>
                                <div style={{color: 'var(--rims-ink-3)', fontSize: 13}}>
                                    @{selectedUser.username}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DR label="Họ tên" value={selectedUser.fullName} />
                    <DR label="Tên đăng nhập" value={selectedUser.username} />
                    <DR label="Email" value={selectedUser.email ?? '—'} />
                    <DR label="Số điện thoại" value={selectedUser.phone} />
                    <DR
                        label="Vai trò"
                        value={ROLE_LABELS[selectedUser.role] ?? selectedUser.role}
                    />
                    {selectedUser.role === 'CUSTOMER' && (
                        <DR
                            label="Điểm tích lũy"
                            value={`${selectedUser.rewardPoints ?? 0} điểm`}
                            color="var(--rims-ok)"
                        />
                    )}
                    <DR
                        label="Trạng thái"
                        value={selectedUser.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        color={
                            selectedUser.isActive ? 'var(--rims-ok)' : 'var(--rims-alert)'
                        }
                    />
                    <DR
                        label="Ngày tạo"
                        value={
                            selectedUser.createdAt
                                ? new Date(selectedUser.createdAt).toLocaleDateString(
                                      'vi-VN',
                                  )
                                : '—'
                        }
                    />
                </Modal>
            )}

            {modal === 'edit' && selectedUser && (
                <Modal
                    open
                    title={`Chỉnh sửa — ${selectedUser.username}`}
                    onClose={() => setModal(null)}
                    footer={
                        <>
                            <button
                                className="rk-btn rk-btn--quiet"
                                onClick={() => setModal(null)}
                            >
                                Hủy
                            </button>
                            <button
                                className="rk-btn rk-btn--primary"
                                disabled={formLoading}
                                onClick={() => void handleUpdate()}
                            >
                                {formLoading ? 'Đang lưu…' : 'Lưu thay đổi'}
                            </button>
                        </>
                    }
                >
                    <div
                        style={{
                            background: 'var(--rims-surface-2)',
                            borderRadius: 8,
                            padding: '10px 14px',
                            marginBottom: 16,
                            fontSize: 13,
                            color: 'var(--rims-ink-3)',
                        }}
                    >
                        Vai trò: <strong>{ROLE_LABELS[selectedUser.role]}</strong> · ID:{' '}
                        <strong>#{selectedUser.id}</strong>
                    </div>
                    <FieldGroup>
                        <Field label="Tên đăng nhập *">
                            <input
                                value={form.username}
                                onChange={(e) =>
                                    setForm({...form, username: e.target.value})
                                }
                                placeholder="username"
                            />
                        </Field>
                        <Field label="Họ tên *">
                            <input
                                value={form.fullName}
                                onChange={(e) =>
                                    setForm({...form, fullName: e.target.value})
                                }
                                placeholder="Nguyễn Văn A"
                            />
                        </Field>
                        <Field label="Email">
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({...form, email: e.target.value})
                                }
                                placeholder="email@example.com"
                            />
                        </Field>
                        <Field label="Số điện thoại *">
                            <input
                                value={form.phone}
                                pattern="0[0-9]{9}"
                                inputMode="numeric"
                                maxLength={10}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        phone: sanitizePhoneInput(e.target.value),
                                    })
                                }
                                placeholder="0xxxxxxxxx"
                            />
                        </Field>
                        {selectedUser.role !== 'CUSTOMER' &&
                            selectedUser.role !== 'ADMIN' && (
                                <Field label="Vai trò *">
                                    <select
                                        value={form.role}
                                        onChange={(e) =>
                                            setForm({...form, role: e.target.value})
                                        }
                                        style={{
                                            padding: '9px 12px',
                                            border: '1px solid var(--rims-line-strong)',
                                            borderRadius: 8,
                                            fontSize: 14,
                                            background: 'var(--rims-surface)',
                                        }}
                                    >
                                        <option value="CHEF">Đầu bếp</option>
                                        <option value="WAITER">Phục vụ</option>
                                        <option value="CASHIER">Thu ngân</option>
                                    </select>
                                </Field>
                            )}
                    </FieldGroup>
                    {formError && <ErrBox msg={formError} />}
                </Modal>
            )}
        </PageCard>
    )
}

// ── helpers ──────────────────────────────────────────────
