import {useState, type FormEvent} from 'react'
import {Link} from 'react-router-dom'

import {useLoginSubmit} from '@/features/auth/useLoginSubmit'
import {PasswordInput} from '@/shared/components/ui'

/**
 * Ô đăng nhập ngay trên trang chủ.
 *
 * <p>Khách và nhân viên đều vào cùng một cửa. Bắt họ bấm "Đăng nhập" rồi chờ
 * một màn khác tải xong chỉ để gõ hai ô là thêm một bước không làm gì cả.
 *
 * <p>Route {@code /login} VẪN GIỮ và không được bỏ: token hết hạn giữa ca thì
 * ProtectedRoute chuyển hướng tới đó, và người dùng cần một màn nói rõ chuyện
 * gì vừa xảy ra chứ không phải bị thả về trang chủ như một người lạ.
 *
 * <p>Việc đăng nhập gọi useLoginSubmit — cùng một đoạn mã với màn /login.
 */
export function HomeAuthPanel() {
    const {submit, error, isLoading} = useLoginSubmit()

    const [username, setUsername] = useState('')
    const [rawPassword, setRawPassword] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        await submit(username, rawPassword)
    }

    return (
        <aside className="rk-homeauth" aria-label="Đăng nhập">
            <h2 className="rk-homeauth__title">Đăng nhập</h2>

            {error && <p className="rk-formerror">{error}</p>}

            <form
                className="rk-fieldgroup"
                onSubmit={(event) => void handleSubmit(event)}
            >
                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="home-username">
                        Tên đăng nhập
                    </label>

                    <input
                        id="home-username"
                        className="rk-input"
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        required
                    />
                </div>

                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="home-password">
                        Mật khẩu
                    </label>

                    {/* PasswordInput nhận onChange(value), không nhận event —
                        nó bọc sẵn nút hiện/ẩn nên tự quản ô input bên trong. */}
                    <PasswordInput
                        id="home-password"
                        autoComplete="current-password"
                        value={rawPassword}
                        onChange={setRawPassword}
                    />
                </div>

                <button type="submit" className="rk-btn rk-btn--go" disabled={isLoading}>
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>

            <p className="rk-homeauth__foot">
                Chưa có tài khoản?{' '}
                <Link className="rk-link" to="/register">
                    Đăng ký
                </Link>{' '}
                ·{' '}
                <Link className="rk-link" to="/forgot-password">
                    Quên mật khẩu
                </Link>
            </p>
        </aside>
    )
}
