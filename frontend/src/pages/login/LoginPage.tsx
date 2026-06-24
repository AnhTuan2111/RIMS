import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useActor } from '../../context/ActorContext'
import { RoleType } from '../../types/auth'

export default function LoginPage() {
    const navigate = useNavigate()
    const { setActor } = useActor()

    const [username, setUsername] = useState('')
    const [rawPassword, setRawPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        try {
            setIsLoading(true)
            setError(null)

            const user = await login({ username, rawPassword })
            const role = user.role as RoleType
            setActor(role)
            localStorage.setItem('selectedActor', role)

            switch (role) {
                case RoleType.ADMIN:
                    navigate('/dashboard', { replace: true })
                    return
                case RoleType.CHEF:
                    navigate('/chef/orders', { replace: true })
                    return
                case RoleType.WAITER:
                    navigate('/waiter/tables', { replace: true })
                    return
                case RoleType.CASHIER:
                    navigate('/cashier/payments', { replace: true })
                    return
                case RoleType.CUSTOMER:
                    navigate('/profile', { replace: true })
                    return
                default:
                    navigate('/dashboard', { replace: true })
                    return
            }
        } catch {
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
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nhập tên đăng nhập"
                            required
                        />
                    </label>

                    <label className="auth-field">
                        Password
                        <input
                            type="password"
                            value={rawPassword}
                            onChange={(e) => setRawPassword(e.target.value)}
                            placeholder="Nhập mật khẩu"
                            required
                        />
                    </label>

                    <div style={{ textAlign: 'right', marginBottom: '8px' }}>
                        <Link to="/forgot-password" style={{ fontSize: '13px', color: '#4f46e5', textDecoration: 'none' }}>
                            Quên mật khẩu?
                        </Link>
                    </div>

                    <button className="auth-submit" disabled={isLoading}>
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="login-demo">
                    <p>Tài khoản test:</p>
                    <span>admin / 123456</span>
                    <span>chef / 123456</span>
                    <span>waiter / 123456</span>
                    <span>cashier / 123456</span>
                </div>
            </section>
        </main>
    )
}
