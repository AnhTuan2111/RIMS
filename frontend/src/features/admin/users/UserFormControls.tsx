import type {ReactNode} from 'react'

/**
 * Các mảnh biểu mẫu của màn Quản lý tài khoản.
 *
 * <p>Trước đây mỗi mảnh tự dựng bằng inline style với cỡ chữ và khoảng đệm
 * riêng, nên cùng một loại trường mà mỗi hộp thoại trông một kiểu. Nay chỉ còn
 * là lớp bọc mỏng quanh các class của bộ kit.
 */
export function FieldGroup({children}: {children: ReactNode}) {
    return <div className="rk-fieldgroup">{children}</div>
}

export function Field({label, children}: {label: string; children: ReactNode}) {
    return (
        <label className="rk-field">
            <span className="rk-field__label">{label}</span>
            {children}
        </label>
    )
}

/**
 * Một dòng trong bảng "chi tiết tài khoản": nhãn bên trái, giá trị bên phải.
 *
 * <p>`tone` trước đây là `color` nhận một chuỗi màu bất kỳ rồi tô thẳng vào
 * thuộc tính style. Nay là hai giá trị có nghĩa, để trình biên dịch chặn
 * được màu lạ và để sửa màu thì sửa trong CSS.
 */
export function DR({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone?: 'ok' | 'alert'
}) {
    return (
        <div className="rk-detailrow">
            <span className="rk-detailrow__label">{label}</span>

            <span className={`rk-detailrow__value${tone ? ` rk-text--${tone}` : ''}`}>
                {value}
            </span>
        </div>
    )
}

export function ErrBox({msg}: {msg: string}) {
    return <p className="rk-formerror">{msg}</p>
}
