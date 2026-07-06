import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, type RegisterRequest } from '../../api/auth' // Import type
import { getErrorMessage } from '../../utils/error'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState<RegisterRequest>({ // Thêm type
        username: '',
        fullName: '',
        email: '',
        phone: '',
    })
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const result = await register(formData)
            console.log('Register success:', result)
            navigate('/login', {
                state: {
                    message: 'Đăng ký thành công! Mật khẩu mặc định của bạn là: 123456'
                }
            })
        } catch (err) {
            console.error('Register error:', err)
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
                        Username *
                        <input
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Tên đăng nhập"
                            required
                        />
                    </label>

                    <label className="auth-field">
                        Họ và tên *
                        <input
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Nguyễn Văn A"
                            required
                        />
                    </label>

                    <label className="auth-field">
                        Email *
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@gmail.com"
                            required
                        />
                    </label>

                    <label className="auth-field">
                        Số điện thoại *
                        <input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="0123456789"
                            required
                        />
                    </label>

                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 8,
                        padding: '12px 14px',
                        marginBottom: 20,
                        fontSize: 14,
                        color: '#166534'
                    }}>
                        ℹ️ Mật khẩu mặc định sẽ là: <strong>123456</strong>
                        <br />
                        <small>Vui lòng thay đổi mật khẩu sau khi đăng nhập lần đầu.</small>
                    </div>

                    <button className="auth-submit" disabled={isLoading}>
                        {isLoading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
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