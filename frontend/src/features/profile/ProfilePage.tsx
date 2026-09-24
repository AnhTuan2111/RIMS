import {useCallback, useEffect, useRef, useState, type CSSProperties} from 'react'

import * as meApi from '@/shared/api/me'
import {useActor} from '@/app/providers/ActorContext'
import {RoleType} from '@/shared/types/auth'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'
import {PasswordInput} from '@/shared/components/ui'

type StoredUser = {
    userId: number
    id?: number
    username: string
    fullName: string
    phone: string
    email: string | null
    role: string
    rewardPoints?: number
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    CHEF: 'Đầu bếp',
    WAITER: 'Phục vụ',
    CASHIER: 'Thu ngân',
    CUSTOMER: 'Khách hàng',
}

function readStoredUser() {
    const stored = localStorage.getItem('currentUser')

    if (!stored) {
        return null
    }

    try {
        return JSON.parse(stored) as StoredUser
    } catch {
        return null
    }
}

function getUserId(user: StoredUser) {
    return user.userId ?? user.id ?? 0
}

function persistUser(user: StoredUser) {
    localStorage.setItem('currentUser', JSON.stringify(user))
}

function normalizeCustomerProfile(
    profile: {
        id?: number
        userId?: number
        username: string
        fullName: string
        phone: string
        email: string | null
        role: string
        rewardPoints?: number
    },
    fallback: StoredUser | null,
): StoredUser {
    return {
        userId: profile.userId ?? profile.id ?? fallback?.userId ?? fallback?.id ?? 0,

        id: profile.id ?? fallback?.id,

        username: profile.username,
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        role: profile.role,
        rewardPoints: profile.rewardPoints ?? fallback?.rewardPoints ?? 0,
    }
}

export default function ProfilePage() {
    const {actor} = useActor()

    const [savedUser, setSavedUser] = useState<StoredUser | null>(() => readStoredUser())

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

    const isCustomer =
        actor === RoleType.CUSTOMER || savedUser?.role === RoleType.CUSTOMER

    const isAdmin = actor === RoleType.ADMIN || savedUser?.role === RoleType.ADMIN

    const canEditProfile = isCustomer || isAdmin

    // Các setter của useState vốn ổn định, nên deps rỗng là đủ.
    const syncFormFromUser = useCallback((user: StoredUser) => {
        setUsername(user.username)
        setFullName(user.fullName)
        setEmail(user.email ?? '')
        setPhone(user.phone)
    }, [])

    // loadCustomerProfile ghi lại savedUser. Nếu đưa savedUser/isEditing vào deps thì
    // effect bên dưới sẽ chạy lại sau mỗi lần fetch -> vòng lặp vô hạn. Giữ chúng
    // trong ref để đọc được giá trị mới nhất mà không tạo phụ thuộc.
    const latestProfileRef = useRef({savedUser, isEditing})

    useEffect(() => {
        latestProfileRef.current = {savedUser, isEditing}
    })

    const loadCustomerProfile = useCallback(
        async (signal?: AbortSignal) => {
            if (!isCustomer) {
                return
            }

            try {
                const profile = await meApi.getMyProfile(signal)

                if (signal?.aborted) {
                    return
                }

                const {savedUser: latestUser, isEditing: isEditingNow} =
                    latestProfileRef.current

                const nextUser = normalizeCustomerProfile(profile, latestUser)

                setSavedUser(nextUser)
                persistUser(nextUser)

                // Đang sửa dở thì không ghi đè những gì người dùng vừa gõ.
                if (!isEditingNow) {
                    syncFormFromUser(nextUser)
                }
            } catch (requestError: unknown) {
                if (signal?.aborted || isRequestCanceled(requestError)) {
                    return
                }

                console.error('[PROFILE_CUSTOMER_FETCH_ERROR]', requestError)
            }
        },
        [isCustomer, syncFormFromUser],
    )

    // Điểm thưởng thay đổi mỗi lần khách thanh toán, nhưng savedUser chỉ được ghi lúc
    // đăng nhập. Không đọc lại từ server thì màn hình sẽ hiển thị điểm cũ mãi.
    useEffect(() => {
        const controller = new AbortController()

        void loadCustomerProfile(controller.signal)

        return () => controller.abort()
    }, [loadCustomerProfile])

    if (!savedUser) {
        return (
            <div className="page-card">
                <p>Không tìm thấy thông tin người dùng.</p>
            </div>
        )
    }

    const currentUser = savedUser

    async function handleSaveProfile() {
        if (!canEditProfile) {
            return
        }

        setUpdateLoading(true)
        setUpdateError(null)

        try {
            const userId = getUserId(currentUser)

            if (!userId) {
                throw new Error('Không xác định được tài khoản cần cập nhật.')
            }

            const data = {
                fullName,
                username,
                email,
                phone,
            }

            // Một đường duy nhất cho mọi vai trò. Trước đây nhân viên đi qua
            // endpoint của Quản trị, nên Bếp, Phục vụ và Thu ngân nhận 403.
            const updated = await meApi.updateMyProfile(data)
            const nextUser: StoredUser = {
                ...currentUser,
                userId:
                    ((updated as unknown as Record<string, unknown>).userId as number) ??
                    ((updated as unknown as Record<string, unknown>).id as number) ??
                    currentUser.userId,
                username: updated.username,
                fullName: updated.fullName,
                email: updated.email,
                phone: updated.phone,
                role: updated.role,
                rewardPoints: updated.rewardPoints ?? currentUser.rewardPoints,
            }

            persistUser(nextUser)
            setSavedUser(nextUser)
            syncFormFromUser(nextUser)

            setIsEditing(false)
            setUpdateSuccess(true)

            window.setTimeout(() => setUpdateSuccess(false), 3000)
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[PROFILE_UPDATE_ERROR]', requestError)

            setUpdateError(getErrorMessage(requestError))
        } finally {
            setUpdateLoading(false)
        }
    }

    async function handleChangePassword() {
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
            await meApi.changePassword({
                currentPassword: currentPw,
                newPassword: newPw,
            })

            setCurrentPw('')
            setNewPw('')
            setConfirmPw('')
            setShowChangePw(false)
            setPwSuccess(true)

            window.setTimeout(() => setPwSuccess(false), 3000)
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[PROFILE_CHANGE_PASSWORD_ERROR]', requestError)

            setPwError(getErrorMessage(requestError))
        } finally {
            setPwLoading(false)
        }
    }

    return (
        <div className="page-card">
            <div className="page-header">
                <div>
                    <h2>Hồ sơ cá nhân</h2>
                    <p>Xem và cập nhật thông tin tài khoản của bạn.</p>
                </div>

                {!isEditing && canEditProfile && (
                    <button
                        type="button"
                        className="rk-btn rk-btn--primary"
                        onClick={() => setIsEditing(true)}
                    >
                        Chỉnh sửa
                    </button>
                )}
            </div>

            {updateSuccess && <div style={successStyle}> Cập nhật hồ sơ thành công!</div>}

            {pwSuccess && <div style={successStyle}> Đổi mật khẩu thành công!</div>}

            <div style={cardStyle}>
                <div style={profileHeaderStyle}>
                    <div style={avatarStyle}>
                        {currentUser.fullName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <h3 style={profileNameStyle}>{currentUser.fullName}</h3>

                        <span style={roleBadgeStyle}>
                            {ROLE_LABELS[currentUser.role] ?? currentUser.role}
                        </span>
                    </div>
                </div>

                <div style={fieldGridStyle}>
                    {isEditing ? (
                        <>
                            <EditField
                                label="Họ tên *"
                                value={fullName}
                                placeholder="Nguyễn Văn A"
                                onChange={setFullName}
                            />

                            <EditField
                                label="Tên đăng nhập *"
                                value={username}
                                placeholder="Ví dụ: nguyenvana"
                                onChange={setUsername}
                            />

                            <EditField
                                label="Email"
                                type="email"
                                value={email}
                                placeholder="email@example.com"
                                onChange={setEmail}
                            />

                            <EditField
                                label="Số điện thoại *"
                                value={phone}
                                pattern="0[0-9]{9}"
                                placeholder="0xxxxxxxxx"
                                onChange={setPhone}
                            />
                        </>
                    ) : (
                        <>
                            <ProfileField label="Họ tên" value={currentUser.fullName} />

                            <ProfileField
                                label="Tên đăng nhập"
                                value={currentUser.username}
                            />

                            <ProfileField
                                label="Email"
                                value={currentUser.email ?? '—'}
                            />

                            <ProfileField
                                label="Số điện thoại"
                                value={currentUser.phone}
                            />

                            {isCustomer && (
                                <ProfileField
                                    label="Điểm tích lũy"
                                    value={`${currentUser.rewardPoints ?? 0} điểm`}
                                />
                            )}
                        </>
                    )}
                </div>

                {updateError && (
                    <div className="auth-error" style={profileErrorStyle}>
                        {updateError}
                    </div>
                )}

                {isEditing && (
                    <div style={profileActionStyle}>
                        <button
                            type="button"
                            className="rk-btn rk-btn--quiet"
                            onClick={() => {
                                setIsEditing(false)
                                syncFormFromUser(currentUser)
                                setUpdateError(null)
                            }}
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            className="rk-btn rk-btn--primary"
                            disabled={updateLoading}
                            onClick={() => void handleSaveProfile()}
                        >
                            {updateLoading ? 'Đang lưu…' : 'Lưu thay đổi'}
                        </button>
                    </div>
                )}
            </div>

            {/* Mọi vai trò đều phải tự đổi được mật khẩu của mình. Trước đây
                khối này chỉ hiện cho khách hàng, nên nhân viên muốn đổi phải
                nhờ quản trị viên sửa thẳng trong cơ sở dữ liệu. */}
            <div style={passwordCardStyle}>
                <div style={passwordHeaderStyle}>
                    <div>
                        <h3 style={passwordTitleStyle}>Đổi mật khẩu</h3>

                        <p style={passwordSubtitleStyle}>
                            Cập nhật mật khẩu để bảo mật tài khoản
                        </p>
                    </div>

                    <button
                        type="button"
                        className={`rk-btn ${
                            showChangePw ? 'rk-btn--quiet' : 'rk-btn--primary'
                        }`}
                        onClick={() => {
                            setShowChangePw(!showChangePw)
                            setPwError(null)
                        }}
                    >
                        {showChangePw ? 'Hủy' : 'Đổi mật khẩu'}
                    </button>
                </div>

                {showChangePw && (
                    <div style={passwordFormStyle}>
                        <EditField
                            label="Mật khẩu hiện tại *"
                            type="password"
                            value={currentPw}
                            placeholder="••••••"
                            onChange={setCurrentPw}
                        />

                        <EditField
                            label="Mật khẩu mới *"
                            type="password"
                            value={newPw}
                            placeholder="Tối thiểu 6 ký tự"
                            onChange={setNewPw}
                        />

                        <EditField
                            label="Xác nhận mật khẩu mới *"
                            type="password"
                            value={confirmPw}
                            placeholder="Nhập lại mật khẩu mới"
                            onChange={setConfirmPw}
                        />

                        {pwError && <div className="auth-error">{pwError}</div>}

                        <div style={passwordActionStyle}>
                            <button
                                type="button"
                                className="rk-btn rk-btn--primary"
                                disabled={pwLoading}
                                onClick={() => void handleChangePassword()}
                            >
                                {pwLoading ? 'Đang xử lý…' : 'Xác nhận đổi mật khẩu'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ProfileField({
    label,
    value,
    readOnly,
}: {
    label: string
    value: string
    readOnly?: boolean
}) {
    return (
        <div style={profileFieldStyle}>
            <span style={profileFieldLabelStyle}>{label}</span>

            <span
                style={{
                    ...profileFieldValueStyle,
                    color: readOnly ? 'var(--rims-ink-3)' : 'var(--rims-ink)',
                }}
            >
                {value}
            </span>
        </div>
    )
}

function EditField({
    label,
    value,
    onChange,
    placeholder,
    pattern,
    type = 'text',
}: {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    pattern?: string
    type?: string
}) {
    return (
        <label className="rk-field">
            <span className="rk-field__label">{label}</span>

            {type === 'password' ? (
                <PasswordInput
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                />
            ) : (
                <input
                    className="rk-input"
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    pattern={pattern}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}
        </label>
    )
}

const cardStyle: CSSProperties = {
    background: 'var(--rims-surface-2)',
    border: '1px solid var(--rims-line)',
    borderRadius: '12px',
    padding: '24px',
}

const passwordCardStyle: CSSProperties = {
    ...cardStyle,
    marginTop: '16px',
}

const avatarStyle: CSSProperties = {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--rims-brand)',
    color: 'var(--rims-ink-on-brand)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
    flexShrink: 0,
}

const successStyle: CSSProperties = {
    background: 'var(--rims-ok-soft)',
    color: 'var(--rims-ok)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontWeight: 500,
}

const profileHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '28px',
}

const profileNameStyle: CSSProperties = {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
}

const roleBadgeStyle: CSSProperties = {
    background: 'var(--rims-brand-soft)',
    color: 'var(--rims-brand)',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
}

const fieldGridStyle: CSSProperties = {
    display: 'grid',
    gap: '16px',
}

const profileErrorStyle: CSSProperties = {
    marginTop: '12px',
}

const profileActionStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '20px',
    justifyContent: 'flex-end',
}

const passwordHeaderStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}

const passwordTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
}

const passwordSubtitleStyle: CSSProperties = {
    margin: '4px 0 0',
    color: 'var(--rims-ink-3)',
    fontSize: '13px',
}

const passwordFormStyle: CSSProperties = {
    display: 'grid',
    gap: '16px',
    marginTop: '20px',
}

const passwordActionStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
}

const profileFieldStyle: CSSProperties = {
    display: 'flex',
    padding: '12px 0',
    borderBottom: '1px solid var(--rims-line)',
    gap: '16px',
}

const profileFieldLabelStyle: CSSProperties = {
    width: '160px',
    color: 'var(--rims-ink-3)',
    fontSize: '13px',
    flexShrink: 0,
}

const profileFieldValueStyle: CSSProperties = {
    fontWeight: 500,
    fontSize: '14px',
}
