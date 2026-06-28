import {useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {forgotPassword, resetPassword} from '../../api/auth'
import {getErrorMessage} from '../../utils/error'

type Step = 'email' | 'otp' | 'done'

const STEPS: Step[] = ['email', 'otp', 'done']
const STEP_LABELS: Record<Step, string> = {
    email: 'Nhập email',
    otp: 'Xác nhận OTP',
    done: 'Hoàn thành',
}

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
        if (!email.trim()) {
            setError('Vui lòng nhập email');
            return
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            setError('Email không hợp lệ');
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            await forgotPassword(email.trim())
            setStep('otp')
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (!otp || otp.length !== 6) {
            setError('OTP phải có đúng 6 chữ số');
            return
        }
        if (!newPassword || newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            await resetPassword(email.trim(), otp, newPassword)
            setStep('done')
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setIsLoading(false)
        }
    }

    const currentStepIdx = STEPS.indexOf(step)

    return (
        <main className="login-page">
            <section className="login-card">
                <Link className="login-back-link" to="/login">← Quay lại đăng nhập</Link>

                <div className="login-header">
                    <h1>Quên mật khẩu</h1>
                    <p>Chỉ dành cho tài khoản khách hàng.</p>
                </div>

                {/* Step indicator */}
                <div style={{display: 'flex', alignItems: 'center', marginBottom: 24, gap: 0}}>
                    {STEPS.map((s, i) => (
                        <div key={s}
                             style={{display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none'}}>
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                                    background: i < currentStepIdx ? '#22c55e' : i === currentStepIdx ? '#4f46e5' : '#e5e7eb',
                                    color: i <= currentStepIdx ? '#fff' : '#9ca3af',
                                }}>
                                    {i < currentStepIdx ? '✓' : i + 1}
                                </div>
                                <span style={{
                                    fontSize: 11,
                                    color: i === currentStepIdx ? '#4f46e5' : '#9ca3af',
                                    fontWeight: i === currentStepIdx ? 600 : 400,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {STEP_LABELS[s]}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{
                                    flex: 1,
                                    height: 2,
                                    background: i < currentStepIdx ? '#22c55e' : '#e5e7eb',
                                    margin: '0 8px',
                                    marginBottom: 18
                                }}/>
                            )}
                        </div>
                    ))}
                </div>

                {/* Error box */}
                {error && (
                    <div className="auth-error" style={{
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 8
                    }}>
                        <span>{error}</span>
                        <button onClick={() => setError(null)} style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontSize: 16,
                            lineHeight: 1
                        }}>✕
                        </button>
                    </div>
                )}

                {/* ── Step 1: Nhập email ── */}
                {step === 'email' && (
                    <>
                        <label className="auth-field">
                            Email tài khoản khách hàng
                            <input
                                type="email"
                                value={email}
                                onChange={e => {
                                    setEmail(e.target.value);
                                    setError(null)
                                }}
                                onKeyDown={e => e.key === 'Enter' && void handleSendOtp()}
                                placeholder="email@gmail.com"
                                autoFocus
                            />
                        </label>
                        <p style={{fontSize: 13, color: '#9ca3af', margin: '8px 0 20px'}}>
                            Nhập đúng email đã đăng ký. Chúng tôi sẽ gửi mã OTP 6 số — có hiệu lực trong 5 phút.
                        </p>
                        <button className="auth-submit" disabled={isLoading} onClick={() => void handleSendOtp()}>
                            {isLoading ? 'Đang gửi...' : 'Gửi mã OTP →'}
                        </button>
                    </>
                )}

                {/* ── Step 2: Nhập OTP + mật khẩu mới ── */}
                {step === 'otp' && (
                    <>
                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 8,
                            padding: '12px 14px',
                            marginBottom: 20,
                            fontSize: 14,
                            color: '#166534'
                        }}>
                            ✓ Đã gửi mã OTP đến <strong>{email}</strong>
                        </div>

                        <label className="auth-field">
                            Mã OTP (6 chữ số)
                            <input
                                value={otp}
                                maxLength={6}
                                onChange={e => {
                                    setOtp(e.target.value.replace(/\D/g, ''));
                                    setError(null)
                                }}
                                placeholder="_ _ _ _ _ _"
                                style={{letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: 700}}
                                autoFocus
                            />
                        </label>

                        <label className="auth-field" style={{marginTop: 14}}>
                            Mật khẩu mới
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => {
                                    setNewPassword(e.target.value);
                                    setError(null)
                                }}
                                placeholder="Tối thiểu 6 ký tự"
                            />
                        </label>

                        <label className="auth-field" style={{marginTop: 14}}>
                            Xác nhận mật khẩu mới
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => {
                                    setConfirmPassword(e.target.value);
                                    setError(null)
                                }}
                                placeholder="Nhập lại mật khẩu mới"
                                onKeyDown={e => e.key === 'Enter' && void handleResetPassword()}
                            />
                        </label>

                        <button className="auth-submit" disabled={isLoading} style={{marginTop: 20}}
                                onClick={() => void handleResetPassword()}>
                            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </button>

                        <button
                            style={{
                                width: '100%',
                                marginTop: 10,
                                padding: 10,
                                background: 'none',
                                border: 'none',
                                color: '#4f46e5',
                                cursor: 'pointer',
                                fontSize: 13
                            }}
                            onClick={() => {
                                setStep('email');
                                setOtp('');
                                setNewPassword('');
                                setConfirmPassword('');
                                setError(null)
                            }}
                        >
                            ← Quay lại / Gửi lại OTP
                        </button>
                    </>
                )}

                {/* ── Step 3: Xong ── */}
                {step === 'done' && (
                    <div style={{textAlign: 'center', padding: '20px 0'}}>
                        <div style={{fontSize: 52, marginBottom: 16}}>✅</div>
                        <h3 style={{color: '#065f46', marginBottom: 8}}>Đặt lại mật khẩu thành công!</h3>
                        <p style={{color: '#9ca3af', marginBottom: 28, fontSize: 14}}>
                            Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.
                        </p>
                        <button className="primary-button" style={{width: '100%', padding: '12px'}}
                                onClick={() => navigate('/login')}>
                            Đăng nhập ngay
                        </button>
                    </div>
                )}
            </section>
        </main>
    )
}