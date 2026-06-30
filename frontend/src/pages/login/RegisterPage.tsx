import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../api/auth'
import { getErrorMessage } from '../../utils/error'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            await register(formData)
            navigate('/login', { state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' } })
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <Link className="login-back-link" to="/login">← Quay lại đăng nhập</Link>
                <div className="login-header">
                    <h1>Đăng ký tài khoản</h1>
                    <p>Tạo tài khoản khách hàng mới</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <label className="auth-field">
                        Username
                        <input
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </label>

                    <label className="auth-field">
                        Email
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </label>

                    <label className="auth-field">
                        Số điện thoại
                        <input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </label>

                    <label className="auth-field">
                        Mật khẩu
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </label>

                    <label className="auth-field">
                        Xác nhận mật khẩu
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                    </label>

                    <button className="auth-submit" disabled={isLoading}>
                        {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#9ca3af' }}>
                    Đã có tài khoản?{' '}
                    <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
                        Đăng nhập
                    </Link>
                </div>
            </section>
        </main>
    )
}