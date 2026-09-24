import {Info} from 'lucide-react'
import {useState, type FormEvent} from 'react'
import {Link, useNavigate} from 'react-router-dom'

import {AuthShell} from './AuthShell'

import {register, type RegisterRequest} from '@/shared/api/auth'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizePhone(value: string) {
    return value.replace(/\D/g, '').slice(0, 10)
}

const DEFAULT_FORM: RegisterRequest = {
    username: '',
    fullName: '',
    email: '',
    phone: '',
}

export default function RegisterPage() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState<RegisterRequest>(DEFAULT_FORM)

    const [error, setError] = useState<string | null>(null)

    const [isLoading, setIsLoading] = useState(false)

    function updateField<K extends keyof RegisterRequest>(
        key: K,
        value: RegisterRequest[K],
    ) {
        setFormData((previous) => ({
            ...previous,
            [key]: value,
        }))

        setError(null)
    }

    function validateForm() {
        if (!formData.username.trim()) {
            return 'Vui lòng nhập username.'
        }

        if (!formData.fullName.trim()) {
            return 'Vui lòng nhập họ và tên.'
        }

        if (!formData.email.trim()) {
            return 'Vui lòng nhập email.'
        }

        if (!isValidEmail(formData.email.trim())) {
            return 'Email không hợp lệ.'
        }

        if (!formData.phone.trim()) {
            return 'Vui lòng nhập số điện thoại.'
        }

        if (formData.phone.length !== 10) {
            return 'Số điện thoại phải có 10 chữ số.'
        }

        return null
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const validationError = validateForm()

        if (validationError) {
            setError(validationError)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await register({
                username: formData.username.trim(),
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
            })

            navigate('/login', {
                state: {
                    message: 'Đăng ký thành công! Mật khẩu mặc định của bạn là: 123456',
                },
            })
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[REGISTER_ERROR]', requestError)

            setError(getErrorMessage(requestError))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthShell
            backTo="/login"
            backLabel="Quay lại đăng nhập"
            title="Đăng ký tài khoản"
            description="Tạo tài khoản khách hàng mới"
            footer={
                <>
                    Đã có tài khoản?{' '}
                    <Link className="rk-link" to="/login">
                        Đăng nhập
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
                    <label className="rk-field__label" htmlFor="reg-username">
                        Tên đăng nhập
                        <span className="rk-field__required">*</span>
                    </label>

                    <input
                        id="reg-username"
                        className="rk-input"
                        value={formData.username}
                        placeholder="Tên đăng nhập"
                        required
                        autoComplete="username"
                        onChange={(event) => updateField('username', event.target.value)}
                    />
                </div>

                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="reg-fullname">
                        Họ và tên
                        <span className="rk-field__required">*</span>
                    </label>

                    <input
                        id="reg-fullname"
                        className="rk-input"
                        value={formData.fullName}
                        placeholder="Nguyễn Văn A"
                        required
                        autoComplete="name"
                        onChange={(event) => updateField('fullName', event.target.value)}
                    />
                </div>

                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="reg-email">
                        Email
                        <span className="rk-field__required">*</span>
                    </label>

                    <input
                        id="reg-email"
                        className="rk-input"
                        type="email"
                        value={formData.email}
                        placeholder="email@gmail.com"
                        required
                        autoComplete="email"
                        onChange={(event) => updateField('email', event.target.value)}
                    />
                </div>

                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="reg-phone">
                        Số điện thoại
                        <span className="rk-field__required">*</span>
                    </label>

                    <input
                        id="reg-phone"
                        className="rk-input"
                        value={formData.phone}
                        placeholder="0123456789"
                        required
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        onChange={(event) =>
                            updateField('phone', normalizePhone(event.target.value))
                        }
                    />
                </div>

                <p className="rk-note">
                    <Info className="rk-icon" aria-hidden="true" />

                    <span>
                        Mật khẩu mặc định sẽ là <strong>123456</strong>. Đổi mật khẩu ngay
                        sau khi đăng nhập lần đầu.
                    </span>
                </p>

                <button
                    type="submit"
                    className="rk-btn rk-btn--primary rk-btn--lg rk-btn--block"
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang đăng ký…' : 'Tạo tài khoản'}
                </button>
            </form>
        </AuthShell>
    )
}
