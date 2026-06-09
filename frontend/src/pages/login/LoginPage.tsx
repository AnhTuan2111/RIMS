import { type FormEvent, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export function LoginPage() {
    const { login, isLoading, error, clearError } = useAuth()
    const [username, setUsername] = useState('')
    const [rawPassword, setRawPassword] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        clearError()
        try {
            await login({ username, rawPassword })
        } catch {
            // Error message is handled in AuthContext
        }
    }

    return (
        <div className="auth-layout">
            <form className="auth-card" onSubmit={handleSubmit}>
                <div className="auth-header">
                    <h1>Đăng nhập</h1>
                    <p>RIMS — Restaurant Management System</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <label className="auth-field">
                    <span>Tên đăng nhập</span>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        autoComplete="username"
                        required
                    />
                </label>

                <label className="auth-field">
                    <span>Mật khẩu</span>
                    <input
                        type="password"
                        value={rawPassword}
                        onChange={(e) => setRawPassword(e.target.value)}
                        placeholder="••••••"
                        autoComplete="current-password"
                        required
                    />
                </label>

                <button className="auth-submit" type="submit" disabled={isLoading}>
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                <p className="auth-hint">
                    Tài khoản demo: admin / chef / waiter / cashier — mật khẩu: 123456
                </p>
            </form>
        </div>
    )
}
