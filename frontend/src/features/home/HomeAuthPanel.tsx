import {useState, type FormEvent} from 'react'
import {Link} from 'react-router-dom'

import {useLoginSubmit} from '@/features/auth/useLoginSubmit'
import {Icon} from '@/shared/components/ui/Icon'
import {PasswordInput} from '@/shared/components/ui'

/**
 * Ô đăng nhập ở GÓC trang chủ — đóng lại thành một nút, bung ra thành biểu mẫu.
 *
 * <p>Bản trước là một hộp cố định chiếm cả cột phải phần đầu trang. Nó đẩy tên
 * quán sang một bên và ngốn đúng chỗ đắt nhất của trang, cho một việc mà chín
 * phần mười người mở trang chủ không làm: khách vào xem thực đơn, chỉ nhân
 * viên mới đăng nhập.
 *
 * <p>Nay nó đóng lại thành một nút trên hàng nhận diện và bung ra khi bấm —
 * đúng chữ "ô ĐỘNG ở góc" đã chốt ở phiếu 02B.
 *
 * <p>Route {@code /login} VẪN GIỮ: token hết hạn giữa ca thì ProtectedRoute
 * chuyển hướng tới đó, và người dùng cần một màn nói rõ chuyện gì vừa xảy ra
 * chứ không phải bị thả về trang chủ như một người lạ.
 *
 * <p>Việc đăng nhập gọi useLoginSubmit — cùng một đoạn mã với màn /login.
 */
export function HomeAuthPanel() {
    const {submit, error, isLoading} = useLoginSubmit()

    const [open, setOpen] = useState(false)
    const [username, setUsername] = useState('')
    const [rawPassword, setRawPassword] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        await submit(username, rawPassword)
    }

    return (
        <div className="rk-homeauth">
            <button
                type="button"
                className="rk-btn rk-btn--ink"
                aria-expanded={open}
                aria-controls="home-auth-form"
                onClick={() => setOpen((value) => !value)}
            >
                <Icon name={open ? 'x' : 'key'} className="rk-icon" />
                {open ? 'Đóng' : 'Đăng nhập'}
            </button>

            {open && (
                <div className="rk-homeauth__drop" id="home-auth-form">
                    <h2 className="rk-homeauth__title">Vào ca</h2>

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

                        <button
                            type="submit"
                            className="rk-btn rk-btn--go"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>

                    <p className="rk-homeauth__foot">
                        <Link className="rk-link" to="/register">
                            Đăng ký
                        </Link>{' '}
                        ·{' '}
                        <Link className="rk-link" to="/forgot-password">
                            Quên mật khẩu
                        </Link>
                    </p>
                </div>
            )}
        </div>
    )
}
