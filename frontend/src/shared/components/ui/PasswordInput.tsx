import {useState} from 'react'
import {Icon} from '@/shared/components/ui/Icon'
interface PasswordInputProps {
    /** Gắn với thuộc tính htmlFor của nhãn, để bấm vào nhãn là nhảy vào ô. */
    id?: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    autoComplete?: string
}

/**
 * Ô nhập mật khẩu kèm nút hiện/ẩn.
 *
 * <p>Trước đây có hai bản: một ở màn Quản trị tài khoản, một ở màn Hồ sơ. Mỗi
 * bản tự vẽ lại con mắt bằng SVG viết tay dù dự án đã dùng bộ lucide, và mỗi
 * bản một cỡ chữ, một khoảng đệm.
 */
export function PasswordInput({
    id,
    value,
    onChange,
    placeholder,
    autoComplete,
}: PasswordInputProps) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="rk-passwordfield">
            <input
                id={id}
                className="rk-input"
                type={visible ? 'text' : 'password'}
                value={value}
                placeholder={placeholder}
                autoComplete={autoComplete}
                onChange={(event) => onChange(event.target.value)}
            />

            <button
                type="button"
                className="rk-passwordfield__toggle"
                aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setVisible((current) => !current)}
            >
                {visible ? (
                    <Icon name="eyeOff" className="rk-icon" />
                ) : (
                    <Icon name="eye" className="rk-icon" />
                )}
            </button>
        </div>
    )
}
