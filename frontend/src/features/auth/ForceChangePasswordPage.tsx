import {useState, type FormEvent} from 'react'
import {Navigate, useNavigate} from 'react-router-dom'
import {KeyRound} from 'lucide-react'

import {useAuth} from '@/app/providers/AuthContext'
import * as meApi from '@/shared/api/me'
import {PasswordInput} from '@/shared/components/ui'
import {getErrorMessage} from '@/shared/utils/error'

import {AuthShell} from './AuthShell'

/** Đủ dài để không đoán ra, đủ ngắn để nhân viên ca tối còn nhớ được. */
const MIN_LENGTH = 6

/**
 * Bắt đổi mật khẩu ở lần đăng nhập đầu.
 *
 * <p>Tài khoản mới tạo và tài khoản vừa được Quản trị viên đặt lại đều mang
 * mật khẩu do người khác biết — thường là chuỗi mặc định chung cho cả hệ
 * thống. Trước đây việc đổi hoàn toàn dựa vào nhắc nhở, nên phần lớn tài khoản
 * giữ nguyên mật khẩu đó mãi.
 *
 * <p>Màn này nằm ngoài khung quản trị: người dùng chưa đổi mật khẩu thì backend
 * cũng chưa cho gọi API nào khác, hiện thanh bên đầy đủ chỉ làm họ tưởng bấm
 * vào được.
 *
 * <p>Đổi xong thì đăng xuất và quay về màn đăng nhập. Token đang cầm mang cờ
 * "phải đổi mật khẩu" ngay trong chữ ký, nên chỉ có đăng nhập lại mới sinh ra
 * token sạch. Đăng nhập lại cũng là cách chắc chắn nhất để người dùng biết mật
 * khẩu mới của họ thật sự dùng được.
 */
export default function ForceChangePasswordPage() {
    const {user, isLoading, logout} = useAuth()
    const navigate = useNavigate()

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()

        if (newPassword.length < MIN_LENGTH) {
            setError(`Mật khẩu mới phải có ít nhất ${MIN_LENGTH} ký tự.`)
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Hai ô mật khẩu mới không khớp nhau.')
            return
        }

        if (newPassword === currentPassword) {
            setError('Mật khẩu mới phải khác mật khẩu hiện tại.')
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            await meApi.changePassword({currentPassword, newPassword})

            // Đặt cờ trước khi đăng xuất. Đăng xuất làm user thành null, nhánh
            // "chưa đăng nhập" bên dưới sẽ đá về /login ngay trong lần vẽ lại đó
            // — sớm hơn câu navigate ở đây, và đá đi mà không mang theo lời nhắn.
            setDone(true)

            await logout()
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, 'Không thể đổi mật khẩu.'))
            setDone(false)
            setSubmitting(false)
        }
    }

    if (done) {
        return (
            <Navigate
                replace
                state={{notice: 'Đổi mật khẩu thành công. Hãy đăng nhập lại.'}}
                to="/login"
            />
        )
    }

    // Chưa đăng nhập thì không có mật khẩu nào để đổi.
    if (!isLoading && !user) {
        return <Navigate to="/login" replace />
    }

    return (
        <AuthShell
            title="Đổi mật khẩu trước khi tiếp tục"
            description={
                user
                    ? `Tài khoản ${user.username} đang dùng mật khẩu do người khác đặt.`
                    : 'Tài khoản đang dùng mật khẩu do người khác đặt.'
            }
            footer={
                <button
                    type="button"
                    className="rk-btn rk-btn--quiet rk-btn--block"
                    disabled={submitting}
                    onClick={() => {
                        void logout().then(() => navigate('/login', {replace: true}))
                    }}
                >
                    Đăng xuất
                </button>
            }
        >
            <p className="rk-note">
                <KeyRound className="rk-icon" aria-hidden="true" />

                <span>
                    Mật khẩu hiện tại là mật khẩu được cấp khi tạo tài khoản hoặc khi Quản
                    trị viên đặt lại. Đổi xong bạn sẽ đăng nhập lại bằng mật khẩu mới.
                </span>
            </p>

            {error && <p className="rk-formerror">{error}</p>}

            <form
                className="rk-fieldgroup"
                onSubmit={(event) => void handleSubmit(event)}
            >
                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="mat-khau-hien-tai">
                        Mật khẩu hiện tại
                    </label>

                    <PasswordInput
                        id="mat-khau-hien-tai"
                        value={currentPassword}
                        placeholder="Mật khẩu được cấp"
                        autoComplete="current-password"
                        onChange={setCurrentPassword}
                    />
                </div>

                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="mat-khau-moi">
                        Mật khẩu mới
                    </label>

                    <PasswordInput
                        id="mat-khau-moi"
                        value={newPassword}
                        placeholder={`Ít nhất ${MIN_LENGTH} ký tự`}
                        autoComplete="new-password"
                        onChange={setNewPassword}
                    />
                </div>

                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="mat-khau-moi-nhac-lai">
                        Nhập lại mật khẩu mới
                    </label>

                    <PasswordInput
                        id="mat-khau-moi-nhac-lai"
                        value={confirmPassword}
                        placeholder="Nhập lại cho chắc"
                        autoComplete="new-password"
                        onChange={setConfirmPassword}
                    />
                </div>

                <button
                    type="submit"
                    className="rk-btn rk-btn--primary rk-btn--block"
                    disabled={submitting}
                >
                    {submitting ? 'Đang đổi…' : 'Đổi mật khẩu'}
                </button>
            </form>
        </AuthShell>
    )
}
