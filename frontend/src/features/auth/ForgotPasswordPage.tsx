import {ArrowLeft, Check, X} from 'lucide-react'

import {useState, type KeyboardEvent} from 'react'
import {useNavigate} from 'react-router-dom'

import {AuthShell} from './AuthShell'

import {forgotPassword, resetPassword} from '@/shared/api/auth'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'

type Step = 'email' | 'otp' | 'done'

const STEPS: Step[] = ['email', 'otp', 'done']

const STEP_LABELS: Record<Step, string> = {
    email: 'Nhập email',
    otp: 'Xác nhận OTP',
    done: 'Hoàn thành',
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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

    const currentStepIdx = STEPS.indexOf(step)

    async function handleSendOtp() {
        const normalizedEmail = email.trim()

        if (!normalizedEmail) {
            setError('Vui lòng nhập email')
            return
        }

        if (!isValidEmail(normalizedEmail)) {
            setError('Email không hợp lệ')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await forgotPassword(normalizedEmail)

            setStep('otp')
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[FORGOT_PASSWORD_SEND_OTP_ERROR]', requestError)

            setError(getErrorMessage(requestError))
        } finally {
            setIsLoading(false)
        }
    }

    async function handleResetPassword() {
        if (!otp || otp.length !== 6) {
            setError('OTP phải có đúng 6 chữ số')
            return
        }

        if (!newPassword || newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await resetPassword(email.trim(), otp, newPassword)

            setStep('done')
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[FORGOT_PASSWORD_RESET_ERROR]', requestError)

            setError(getErrorMessage(requestError))
        } finally {
            setIsLoading(false)
        }
    }

    function handleEmailKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.preventDefault()
            void handleSendOtp()
        }
    }

    function handleResetKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.preventDefault()
            void handleResetPassword()
        }
    }

    function goBackToEmailStep() {
        setStep('email')
        setOtp('')
        setNewPassword('')
        setConfirmPassword('')
        setError(null)
    }

    return (
        <AuthShell
            backTo="/login"
            backLabel="Quay lại đăng nhập"
            title="Quên mật khẩu"
            description="Chỉ dành cho tài khoản khách hàng."
        >
            <ol className="rk-steps">
                {STEPS.map((stepItem, index) => {
                    const state =
                        index < currentStepIdx
                            ? ' rk-steps__item--done'
                            : index === currentStepIdx
                              ? ' rk-steps__item--active'
                              : ''

                    return (
                        <li className={`rk-steps__item${state}`} key={stepItem}>
                            <span className="rk-steps__mark">
                                {index < currentStepIdx ? (
                                    <Check className="rk-icon" aria-hidden="true" />
                                ) : (
                                    index + 1
                                )}
                            </span>

                            <span className="rk-steps__label">
                                {STEP_LABELS[stepItem]}
                            </span>
                        </li>
                    )
                })}
            </ol>

            {error && (
                <p className="rk-note rk-note--alert">
                    <span>{error}</span>

                    <button
                        type="button"
                        className="rk-iconbtn"
                        aria-label="Đóng thông báo lỗi"
                        onClick={() => setError(null)}
                    >
                        <X className="rk-icon" aria-hidden="true" />
                    </button>
                </p>
            )}

            {step === 'email' && (
                <div className="rk-fieldgroup">
                    <div className="rk-field">
                        <label className="rk-field__label" htmlFor="fp-email">
                            Email tài khoản khách hàng
                        </label>

                        <input
                            id="fp-email"
                            className="rk-input"
                            type="email"
                            value={email}
                            placeholder="email@gmail.com"
                            autoFocus
                            onChange={(event) => {
                                setEmail(event.target.value)
                                setError(null)
                            }}
                            onKeyDown={handleEmailKeyDown}
                        />

                        <p className="rk-field__hint">
                            Nhập đúng email đã đăng ký. Chúng tôi sẽ gửi mã OTP 6 số, có
                            hiệu lực trong 5 phút.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="rk-btn rk-btn--primary rk-btn--lg rk-btn--block"
                        disabled={isLoading}
                        onClick={() => void handleSendOtp()}
                    >
                        {isLoading ? 'Đang gửi…' : 'Gửi mã OTP'}
                    </button>
                </div>
            )}

            {step === 'otp' && (
                <div className="rk-fieldgroup">
                    <p className="rk-note rk-note--ok">
                        <Check className="rk-icon" aria-hidden="true" />

                        <span>
                            Đã gửi mã OTP đến <strong>{email}</strong>
                        </span>
                    </p>

                    <div className="rk-field">
                        <label className="rk-field__label" htmlFor="fp-otp">
                            Mã OTP (6 chữ số)
                        </label>

                        <input
                            id="fp-otp"
                            className="rk-input rk-input--code"
                            value={otp}
                            maxLength={6}
                            inputMode="numeric"
                            placeholder="––––––"
                            autoFocus
                            onChange={(event) => {
                                setOtp(event.target.value.replace(/\D/g, ''))
                                setError(null)
                            }}
                        />
                    </div>

                    <div className="rk-field">
                        <label className="rk-field__label" htmlFor="fp-new">
                            Mật khẩu mới
                        </label>

                        <input
                            id="fp-new"
                            className="rk-input"
                            type="password"
                            value={newPassword}
                            placeholder="Tối thiểu 6 ký tự"
                            onChange={(event) => {
                                setNewPassword(event.target.value)
                                setError(null)
                            }}
                        />
                    </div>

                    <div className="rk-field">
                        <label className="rk-field__label" htmlFor="fp-confirm">
                            Xác nhận mật khẩu mới
                        </label>

                        <input
                            id="fp-confirm"
                            className="rk-input"
                            type="password"
                            value={confirmPassword}
                            placeholder="Nhập lại mật khẩu mới"
                            onChange={(event) => {
                                setConfirmPassword(event.target.value)
                                setError(null)
                            }}
                            onKeyDown={handleResetKeyDown}
                        />
                    </div>

                    <button
                        type="button"
                        className="rk-btn rk-btn--primary rk-btn--lg rk-btn--block"
                        disabled={isLoading}
                        onClick={() => void handleResetPassword()}
                    >
                        {isLoading ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}
                    </button>

                    <button
                        type="button"
                        className="rk-btn rk-btn--block"
                        onClick={goBackToEmailStep}
                    >
                        <ArrowLeft className="rk-icon" aria-hidden="true" />
                        Quay lại / Gửi lại OTP
                    </button>
                </div>
            )}

            {step === 'done' && (
                <div className="rk-feedback rk-feedback--sm">
                    <div className="rk-feedback__icon rk-feedback__icon--ok">
                        <Check className="rk-icon" aria-hidden="true" />
                    </div>

                    <div>
                        <h3 className="rk-feedback__title">
                            Đặt lại mật khẩu thành công
                        </h3>

                        <p className="rk-feedback__text">
                            Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.
                        </p>

                        <div className="rk-feedback__actions">
                            <button
                                type="button"
                                className="rk-btn rk-btn--primary"
                                onClick={() => navigate('/login')}
                            >
                                Đăng nhập ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthShell>
    )
}
