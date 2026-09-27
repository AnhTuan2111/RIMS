import {useState, type FormEvent} from 'react'
import {Link, useLocation} from 'react-router-dom'

import {AuthShell} from './AuthShell'
import {useLoginSubmit} from './useLoginSubmit'

import {useRestaurant} from '@/app/providers/useRestaurant'

export default function LoginPage() {
    const {profile} = useRestaurant()
    const restaurantName = profile?.name ?? 'RIMS'

    // Một lần đăng nhập nay nằm ở useLoginSubmit, dùng chung với ô đăng nhập ở
    // trang chủ. Hai chỗ đăng nhập mà hai đoạn mã thì chúng sẽ lệch nhau.
    const {submit, error, isLoading} = useLoginSubmit()

    // Màn đổi mật khẩu bắt buộc đẩy người dùng về đây kèm một dòng báo. Không
    // có dòng đó thì họ vừa đổi xong lại thấy mình ở trang đăng nhập, không
    // biết đã thành công hay chưa.
    const location = useLocation()
    const notice = (location.state as {notice?: string} | null)?.notice ?? null

    const [username, setUsername] = useState('')

    const [rawPassword, setRawPassword] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        await submit(username, rawPassword)
    }

    return (
        <AuthShell
            backTo="/"
            backLabel="Quay lại trang chủ"
            title={`Đăng nhập ${restaurantName}`}
            description="Đăng nhập tài khoản để đặt bàn ngay hôm nay!"
            footer={
                <>
                    Chưa có tài khoản?{' '}
                    <Link className="rk-link" to="/register">
                        Đăng ký ngay
                    </Link>
                </>
            }
        >
            {notice && !error && <p className="rk-note rk-note--ok">{notice}</p>}

            {error && <p className="rk-formerror">{error}</p>}

            <form
                className="rk-fieldgroup"
                onSubmit={(event) => void handleSubmit(event)}
            >
                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="login-username">
                        Tên đăng nhập
                    </label>

                    <input
                        id="login-username"
                        className="rk-input"
                        value={username}
                        placeholder="Nhập tên đăng nhập"
                        required
                        autoComplete="username"
                        onChange={(event) => setUsername(event.target.value)}
                    />
                </div>

                <div className="rk-field">
                    <label className="rk-field__label" htmlFor="login-password">
                        Mật khẩu
                    </label>

                    <input
                        id="login-password"
                        className="rk-input"
                        type="password"
                        value={rawPassword}
                        placeholder="Nhập mật khẩu"
                        required
                        autoComplete="current-password"
                        onChange={(event) => setRawPassword(event.target.value)}
                    />
                </div>

                <div className="rk-actions rk-actions--end">
                    <Link className="rk-link" to="/forgot-password">
                        Quên mật khẩu?
                    </Link>
                </div>

                <button
                    type="submit"
                    className="rk-btn rk-btn--primary rk-btn--lg rk-btn--block"
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>
        </AuthShell>
    )
}
