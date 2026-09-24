import type {ReactNode} from 'react'
import {Link} from 'react-router-dom'
import {ArrowLeft} from 'lucide-react'

type AuthShellProps = {
    title: ReactNode
    description?: ReactNode
    /** Đường quay lại và nhãn của nó. Bỏ trống thì không hiện liên kết. */
    backTo?: string
    backLabel?: string
    /** Thẻ rộng hơn, dùng cho biểu mẫu nhiều trường. */
    wide?: boolean
    children: ReactNode
    /** Dòng cuối thẻ, thường là một câu kèm liên kết sang màn khác. */
    footer?: ReactNode
}

/**
 * Khung chung của ba màn ngoài đăng nhập.
 *
 * <p>Đăng nhập, Đăng ký và Quên mật khẩu trước đây mỗi màn tự chép lại đúng
 * đoạn markup này: main, section, liên kết quay lại, tiêu đề, mô tả. Ba bản
 * sao đó đã bắt đầu lệch nhau — khoảng cách và cỡ chữ mỗi nơi một kiểu.
 */
export function AuthShell({
    title,
    description,
    backTo,
    backLabel = 'Quay lại',
    wide = false,
    children,
    footer,
}: AuthShellProps) {
    return (
        <main className="rk-auth">
            <section className={`rk-auth__card${wide ? ' rk-auth__card--wide' : ''}`}>
                {backTo && (
                    <Link className="rk-backlink" to={backTo}>
                        <ArrowLeft className="rk-icon" aria-hidden="true" />
                        {backLabel}
                    </Link>
                )}

                <h1 className="rk-auth__title">{title}</h1>

                {description && <p className="rk-auth__desc">{description}</p>}

                {children}

                {footer && <div className="rk-auth__foot">{footer}</div>}
            </section>
        </main>
    )
}
