import {useState, type FormEvent} from 'react'
import {Link, useLocation, useNavigate} from 'react-router-dom'

import {AuthShell} from './AuthShell'

import {useActor} from '@/app/providers/ActorContext'
import {useAuth} from '@/app/providers/AuthContext'
import {RoleType} from '@/shared/types/auth'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'
import {useRestaurant} from '@/app/providers/useRestaurant'
import {getHomePathForRole} from '@/app/routes/homePath'

export default function LoginPage() {
    const {profile} = useRestaurant()
    const restaurantName = profile?.name ?? 'RIMS'

    const navigate = useNavigate()
    const {setActor} = useActor()

    /*
     * Đăng nhập qua AuthContext chứ không gọi thẳng authApi.login.
     *
     * Bản cũ gọi thẳng rồi tự ghi localStorage, nên AuthContext vẫn giữ
     * user = null cho đến lần tải trang sau. Mọi chốt chặn đọc user từ context
     * đều thấy chưa đăng nhập và đá người dùng ngược về đây.
     */
    const {login} = useAuth()

    // Màn đổi mật khẩu bắt buộc đẩy người dùng về đây kèm một dòng báo. Không
    // có dòng đó thì họ vừa đổi xong lại thấy mình ở trang đăng nhập, không
    // biết đã thành công hay chưa.
    const location = useLocation()
    const notice = (location.state as {notice?: string} | null)?.notice ?? null

    const [username, setUsername] = useState('')

    const [rawPassword, setRawPassword] = useState('')

    const [error, setError] = useState<string | null>(null)

    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setIsLoading(true)
        setError(null)

        try {
            const user = await login({
                username,
                rawPassword,
            })

            const role = user.role as RoleType

            setActor(role)

            localStorage.setItem('selectedActor', role)

            // Tài khoản còn dùng mật khẩu do người khác đặt thì đi thẳng màn đổi
            // mật khẩu. Vào màn làm việc trước cũng chỉ thấy một màn lỗi, vì
            // backend chặn hết các endpoint khác.
            navigate(
                user.mustChangePassword ? '/change-password' : getHomePathForRole(role),
                {
                    replace: true,
                },
            )
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[LOGIN_ERROR]', requestError)

            setError(
                getErrorMessage(requestError) ||
                    'Đăng nhập thất bại. Vui lòng kiểm tra tài khoản hoặc mật khẩu.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthShell
            backTo="/"
            backLabel="Quay lại trang chủ"
            title={`Đăng nhập ${restaurantName}`}
            description="Đăng nhập tài khoản để đặt bàn ngay hôm nay!"
            footer={
                <>
                    Chưa có tài khoản?{' '}
                    <Link className="rk-link" to="/register">
                        Đăng ký ngay
                    </Link>
                </>
            }
        >
            {notice && !error && <p className="rk-note rk-note--ok">{notice}</p>}

            {error && <p className="rk-formerror">{error}</p>}

            <form
                className="rk-fieldgroup"
                onSubmit={(event) => void handleSubmit(event)}
            >
                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="login-username">
                        Tên đăng nhập
                    </label>

                    <input
                        id="login-username"
                        className="rk-input"
                        value={username}
                        placeholder="Nhập tên đăng nhập"
                        required
                        autoComplete="username"
                        onChange={(event) => setUsername(event.target.value)}
                    />
                </div>

                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="login-password">
                        Mật khẩu
                    </label>

                    <input
                        id="login-password"
                        className="rk-input"
                        type="password"
                        value={rawPassword}
                        placeholder="Nhập mật khẩu"
                        required
                        autoComplete="current-password"
                        onChange={(event) => setRawPassword(event.target.value)}
                    />
                </div>

                <div className="rk-actions rk-actions--end">
                    <Link className="rk-link" to="/forgot-password">
                        Quên mật khẩu?
                    </Link>
                </div>

                <button
                    type="submit"
                    className="rk-btn rk-btn--primary rk-btn--lg rk-btn--block"
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang đăng nhập…' : 'Đăng nhập'}
                </button>
            </form>
        </AuthShell>
    )
}
