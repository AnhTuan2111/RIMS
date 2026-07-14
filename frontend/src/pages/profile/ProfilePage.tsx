import {useState} from 'react'
import {useActor} from '../../context/ActorContext'
import {RoleType} from '../../types/auth'
import * as customerApi from '../../api/customer'
import * as adminApi from '../../api/admin'
import {getErrorMessage} from '../../utils/error'

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Quản trị viên', CHEF: 'Đầu bếp',
    WAITER: 'Phục vụ', CASHIER: 'Thu ngân', CUSTOMER: 'Khách hàng',
}

export default function ProfilePage() {
    const {actor} = useActor()

    // Load user from localStorage
    const stored = localStorage.getItem('currentUser')
    const savedUser = stored ? JSON.parse(stored) as {
        userId: number
        username: string
        fullName: string
        phone: string
        email: string | null
        role: string
        rewardPoints?: number
    } : null

    const [isEditing, setIsEditing] = useState(false)
    const [fullName, setFullName] = useState(savedUser?.fullName ?? '')
    const [username, setUsername] = useState(savedUser?.username ?? '')
    const [email, setEmail] = useState(savedUser?.email ?? '')
    const [phone, setPhone] = useState(savedUser?.phone ?? '')
    const [updateLoading, setUpdateLoading] = useState(false)
    const [updateError, setUpdateError] = useState<string | null>(null)
    const [updateSuccess, setUpdateSuccess] = useState(false)

    const [showChangePw, setShowChangePw] = useState(false)
    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [pwLoading, setPwLoading] = useState(false)
    const [pwError, setPwError] = useState<string | null>(null)
    const [pwSuccess, setPwSuccess] = useState(false)

    if (!savedUser) {
        return <div className="page-card"><p>Không tìm thấy thông tin người dùng.</p></div>
    }

    const handleSaveProfile = async () => {
        setUpdateLoading(true)
        setUpdateError(null)

        try {

            const data = {
                fullName,
                username,
                email,
                phone
            }

            // Dùng endpoint legacy PUT /admin/user/profile/update/{id} (giống GET /admin/user/profile/{id})
            const updated = await adminApi.updateProfile(savedUser.userId, data)

            const newUser = {
                ...savedUser,
                username: updated.username,
                fullName: updated.fullName,
                email: updated.email,
                phone: updated.phone
            }

            localStorage.setItem(
                'currentUser',
                JSON.stringify(newUser)
            )

            setUsername(updated.username)
            setFullName(updated.fullName)
            setEmail(updated.email)
            setPhone(updated.phone)

            setIsEditing(false)

            setUpdateSuccess(true)
            setTimeout(() => setUpdateSuccess(false), 3000)

        } catch (err) {

            setUpdateError(getErrorMessage(err))

        } finally {

            setUpdateLoading(false)

        }
    }

    const handleChangePassword = async () => {
        if (newPw !== confirmPw) {
            setPwError('Mật khẩu xác nhận không khớp')
            return
        }
        if (newPw.length < 6) {
            setPwError('Mật khẩu mới phải có ít nhất 6 ký tự')
            return
        }
        setPwLoading(true)
        setPwError(null)
        try {
            await customerApi.changePassword({currentPassword: currentPw, newPassword: newPw})
            setCurrentPw('');
            setNewPw('');
            setConfirmPw('')
            setShowChangePw(false)
            setPwSuccess(true)
            setTimeout(() => setPwSuccess(false), 3000)
        } catch (err) {
            setPwError(getErrorMessage(err))
        } finally {
            setPwLoading(false)
        }
    }

    const isCustomer = actor === RoleType.CUSTOMER

    return (
        <div className="page-card">
            <div className="page-header">
                <div>
                    <h2>Hồ sơ cá nhân</h2>
                    <p>Xem và cập nhật thông tin tài khoản của bạn.</p>
                </div>
                {!isEditing && (
                    <button className="primary-button" onClick={() => setIsEditing(true)}>
                        Chỉnh sửa
                    </button>
                )}
            </div>

            {updateSuccess && (
                <div style={successStyle}>✓ Cập nhật hồ sơ thành công!</div>
            )}
            {pwSuccess && (
                <div style={successStyle}>✓ Đổi mật khẩu thành công!</div>
            )}

            {/* Profile Card - dùng chung cho mọi vai trò (customer + staff) */}
            <div style={cardStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px'}}>
                    <div style={avatarStyle}>
                        {savedUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 style={{margin: 0, fontSize: '20px', fontWeight: 700}}>{savedUser.fullName}</h3>
                        <span style={{
                            background: '#e0e7ff', color: '#4338ca',
                            padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600
                        }}>
                            {ROLE_LABELS[savedUser.role] ?? savedUser.role}
                        </span>
                    </div>
                </div>

                <div style={{display: 'grid', gap: '16px'}}>
                    {isEditing ? (
                        <>
                            <EditField label="Họ tên *" value={fullName} onChange={setFullName}
                                       placeholder="Nguyễn Văn A"/>
                            <EditField label="Username *" value={username} onChange={setUsername}
                                       placeholder="abc"/>
                            <EditField label="Email" type="email" value={email} onChange={setEmail}
                                       placeholder="email@example.com"/>
                            <EditField label="Số điện thoại *" value={phone} onChange={setPhone}
                                       placeholder="0xxxxxxxxx"/>
                        </>
                    ) : (
                        <>
                            <ProfileField label="Họ tên" value={savedUser.fullName}/>
                            <ProfileField label="Username" value={savedUser.username}/>
                            <ProfileField label="Email" value={savedUser.email ?? '—'}/>
                            <ProfileField label="Số điện thoại" value={savedUser.phone}/>
                            {isCustomer && (
                                <ProfileField
                                    label="Điểm tích lũy"
                                    value={`${savedUser.rewardPoints ?? 0} điểm`}
                                />
                            )}
                        </>
                    )}
                </div>


                {updateError && <div className="auth-error" style={{marginTop: '12px'}}>{updateError}</div>}

                {isEditing && (
                    <div style={{display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end'}}>
                        <button className="secondary-button" onClick={() => {
                            setIsEditing(false);
                            setFullName(savedUser.fullName)
                            setUsername(savedUser.username)
                            setEmail(savedUser.email ?? '')
                            setPhone(savedUser.phone)
                            setUpdateError(null)
                        }}>
                            Hủy
                        </button>
                        <button className="primary-button" disabled={updateLoading}
                                onClick={() => void handleSaveProfile()}>
                            {updateLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                )}
            </div>

            {/* Change Password (for customer or all) */}
            {isCustomer && (
                <div style={{...cardStyle, marginTop: '16px'}}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: showChangePw ? '20px' : 0
                    }}>
                        <div>
                            <h3 style={{margin: 0, fontSize: '16px', fontWeight: 600}}>Đổi mật khẩu</h3>
                            <p style={{margin: '4px 0 0', color: '#9ca3af', fontSize: '13px'}}>Cập nhật mật khẩu để bảo
                                mật tài khoản</p>
                        </div>
                        <button
                            className={showChangePw ? 'secondary-button' : 'primary-button'}
                            onClick={() => {
                                setShowChangePw(!showChangePw);
                                setPwError(null)
                            }}
                        >
                            {showChangePw ? 'Hủy' : 'Đổi mật khẩu'}
                        </button>
                    </div>

                    {showChangePw && (
                        <div style={{display: 'grid', gap: '16px'}}>
                            <EditField label="Mật khẩu hiện tại *" type="password" value={currentPw}
                                       onChange={setCurrentPw} placeholder="••••••"/>
                            <EditField label="Mật khẩu mới *" type="password" value={newPw} onChange={setNewPw}
                                       placeholder="Tối thiểu 6 ký tự"/>
                            <EditField label="Xác nhận mật khẩu mới *" type="password" value={confirmPw}
                                       onChange={setConfirmPw} placeholder="Nhập lại mật khẩu mới"/>

                            {pwError && <div className="auth-error">{pwError}</div>}

                            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                <button className="primary-button" disabled={pwLoading}
                                        onClick={() => void handleChangePassword()}>
                                    {pwLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function ProfileField({label, value, readOnly}: { label: string; value: string; readOnly?: boolean }) {
    return (
        <div style={{display: 'flex', padding: '12px 0', borderBottom: '1px solid #f3f4f6', gap: '16px'}}>
            <span style={{width: '160px', color: '#9ca3af', fontSize: '13px', flexShrink: 0}}>{label}</span>
            <span style={{fontWeight: 500, fontSize: '14px', color: readOnly ? '#9ca3af' : '#111827'}}>{value}</span>
        </div>
    )
}

function EditField({label, value, onChange, placeholder, type = 'text'}: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
    const [visible, setVisible] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword ? (visible ? 'text' : 'password') : type

    return (
        <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151'
        }}>
            {label}
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <input
                    type={inputType}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: isPassword ? '10px 40px 10px 12px' : '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                    }}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setVisible(v => !v)}
                        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        style={{
                            position: 'absolute',
                            right: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            background: 'transparent',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            color: '#9ca3af',
                            transition: 'color 0.15s ease, background-color 0.15s ease',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = '#4f46e5'
                            e.currentTarget.style.backgroundColor = '#eef2ff'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = '#9ca3af'
                            e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                    >
                        {visible ? <EyeOffIcon/> : <EyeIcon/>}
                    </button>
                )}
            </div>
        </label>
    )
}

function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    )
}

function EyeOffIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.62 21.62 0 0 1 5.06-6.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-3.22 4.36M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    )
}

const cardStyle: React.CSSProperties = {
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px',
}

const avatarStyle: React.CSSProperties = {
    width: '64px', height: '64px', borderRadius: '50%', background: '#4f46e5',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '24px', fontWeight: 700, flexShrink: 0,
}

const successStyle: React.CSSProperties = {
    background: '#d1fae5', color: '#065f46', padding: '12px 16px',
    borderRadius: '8px', marginBottom: '16px', fontWeight: 500,
}