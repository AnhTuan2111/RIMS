import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../../api/auth'
import { getErrorMessage } from '../../utils/error'

type Step = 'email' | 'otp' | 'done'

export default function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSendOtp = async () => {
        if (!email) { setError('Vui lòng nhập email'); return }
        setIsLoading(true)
        setError(null)
        try {
            await forgotPassword(email)
            setStep('otp')
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (!otp || otp.length !== 6) { setError('OTP phải có đúng 6 chữ số'); return }
        if (!newPassword || newPassword.length < 6) { setError('Mật khẩu mới phải có ít nhất 6 ký tự'); return }
        if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }

        setIsLoading(true)
        setError(null)
        try {
            await resetPassword(email, otp, newPassword)
            setStep('done')
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <Link className="login-back-link" to="/login">
                    ← Quay lại đăng nhập
                </Link>

                <div className="login-header">
                    <h1>Quên mật khẩu</h1>
                    <p>Chỉ dành cho tài khoản khách hàng.</p>
                </div>

                {/* Steps indicator */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
                    {(['email', 'otp', 'done'] as Step[]).map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: step === s ? '#4f46e5' : (i < ['email', 'otp', 'done'].indexOf(step) ? '#22c55e' : '#e5e7eb'),
                                color: step === s || i < ['email', 'otp', 'done'].indexOf(step) ? '#fff' : '#9ca3af',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', fontWeight: 600,
                            }}>
                                {i < ['email', 'otp', 'done'].indexOf(step) ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: '12px', color: step === s ? '#4f46e5' : '#9ca3af', fontWeight: step === s ? 600 : 400 }}>
                                {s === 'email' ? 'Nhập email' : s === 'otp' ? 'Xác nhận OTP' : 'Hoàn thành'}
                            </span>
                            {i < 2 && <span style={{ color: '#e5e7eb' }}>›</span>}
                        </div>
                    ))}
                </div>

                {error && <div className="auth-error" style={{ marginBottom: '16px' }}>{error}</div>}

                {step === 'email' && (
                    <>
                        <label className="auth-field">
                            Email tài khoản
                            <input
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setError(null) }}
                                placeholder="email@example.com"
                            />
                        </label>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '8px 0 16px' }}>
                            Chúng tôi sẽ gửi mã OTP 6 số đến email của bạn. Mã có hiệu lực trong 5 phút.
                        </p>
                        <button className="auth-submit" disabled={isLoading} onClick={() => void handleSendOtp()}>
                            {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                        </button>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: '#166534' }}>
                            ✓ Đã gửi mã OTP đến <strong>{email}</strong>
                        </div>

                        <label className="auth-field">
                            Mã OTP (6 chữ số)
                            <input
                                value={otp}
                                maxLength={6}
                                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(null) }}
                                placeholder="123456"
                                style={{ letterSpacing: '4px', fontSize: '20px', textAlign: 'center' }}
                            />
                        </label>

                        <label className="auth-field" style={{ marginTop: '12px' }}>
                            Mật khẩu mới
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => { setNewPassword(e.target.value); setError(null) }}
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </label>

                        <label className="auth-field" style={{ marginTop: '12px' }}>
                            Xác nhận mật khẩu mới
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => { setConfirmPassword(e.target.value); setError(null) }}
                                placeholder="Nhập lại mật khẩu mới"
                            />
                        </label>

                        <button className="auth-submit" disabled={isLoading} style={{ marginTop: '16px' }} onClick={() => void handleResetPassword()}>
                            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </button>

                        <button
                            style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '14px' }}
                            onClick={() => { setStep('email'); setOtp(''); setNewPassword(''); setConfirmPassword(''); setError(null) }}
                        >
                            ← Gửi lại OTP
                        </button>
                    </>
                )}

                {step === 'done' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h3 style={{ color: '#065f46', marginBottom: '8px' }}>Đặt lại mật khẩu thành công!</h3>
                        <p style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '14px' }}>
                            Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.
                        </p>
                        <button className="primary-button" onClick={() => navigate('/login')}>
                            Đăng nhập ngay
                        </button>
                    </div>
                )}
            </section>
        </main>
    )
}
