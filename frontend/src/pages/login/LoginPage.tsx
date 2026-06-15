import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useActor } from '../../context/ActorContext'
import type { ActorRole } from '../../config/actorMenus'

export default function LoginPage() {
    const navigate = useNavigate()
    const { setActor } = useActor()

    const [username, setUsername] = useState('chef')
    const [rawPassword, setRawPassword] = useState('123456')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        try {
            setIsLoading(true)
            setError(null)

            const user = await login({
                username,
                rawPassword,
            })

            const role = user.role as ActorRole

            setActor(role)
            localStorage.setItem('selectedActor', role)

            switch (role) {
                case 'ADMIN':
                    navigate('/dashboard', { replace: true })
                    return

                case 'CHEF':
                    navigate('/chef/orders', { replace: true })
                    return

                case 'WAITER':
                    navigate('/waiter/tables', { replace: true })
                    return

                case 'CASHIER':
                    navigate('/cashier/payments', { replace: true })
                    return

                default:
                    navigate('/dashboard', { replace: true })
                    return
            }
        } catch (error) {
            console.error(error)
            setError('Đăng nhập thất bại. Vui lòng kiểm tra tài khoản hoặc mật khẩu.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <Link className="login-back-link" to="/">
                    ← Quay lại trang chủ
                </Link>

                <div className="login-header">
                    <h1>Đăng nhập RIMS</h1>
                    <p>Nhập tài khoản để truy cập hệ thống quản lý nhà hàng.</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <label className="auth-field">
                        Username
                        <input
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="chef"
                        />
                    </label>

                    <label className="auth-field">
                        Password
                        <input
                            type="password"
                            value={rawPassword}
                            onChange={(event) => setRawPassword(event.target.value)}
                            placeholder="123456"
                        />
                    </label>

                    <button className="auth-submit" disabled={isLoading}>
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="login-demo">
                    <p>Tài khoản test:</p>
                    <span>chef / 123456</span>
                    <span>admin / 123456</span>
                    <span>waiter / 123456</span>
                    <span>cashier / 123456</span>
                </div>
            </section>
        </main>
    )
}