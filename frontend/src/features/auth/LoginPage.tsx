import {useState, type FormEvent} from 'react'
import {Link, useNavigate} from 'react-router-dom'

import {AuthShell} from './AuthShell'

import {login} from '@/shared/api/auth'
import {useActor} from '@/app/providers/ActorContext'
import {RoleType} from '@/shared/types/auth'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'
import {useRestaurant} from '@/app/providers/useRestaurant'
import {getHomePathForRole} from '@/app/routes/homePath'

export default function LoginPage() {
    const {profile} = useRestaurant()
    const restaurantName = profile?.name ?? 'RIMS'

    const navigate = useNavigate()
    const {setActor} = useActor()

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

            localStorage.setItem('currentUser', JSON.stringify(user))

            navigate(getHomePathForRole(role), {
                replace: true,
            })
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
