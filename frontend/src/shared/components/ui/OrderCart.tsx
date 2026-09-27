import {useId, useState, type ReactNode} from 'react'

import {useMediaQuery} from '../../hooks/useMediaQuery'

type OrderCartProps = {
    /** Nhãn của cả khối cho trình đọc màn hình. */
    label: string
    /** Chữ ở đầu giỏ, ví dụ "Đơn bàn B04". */
    title: ReactNode
    /** Số dòng trong giỏ — hiện ở ô vuông xanh cạnh tiêu đề. */
    count: number
    /** Câu hiện khi giỏ trống. */
    empty: ReactNode
    /** Các dòng món. Chỉ vẽ khi count > 0. */
    children?: ReactNode
    /** Tổng tiền và nút gửi — LUÔN hiện, kể cả khi giỏ đang thu lại. */
    foot: ReactNode
}

/** Dưới ngưỡng này giỏ không còn chỗ đứng thành cột bên phải. */
const DOCKED = '(max-width: 59.99rem)'

/**
 * Giỏ đơn của hai màn Tạo đơn và Sửa đơn.
 *
 * <p>Màn rộng: cột dính bên phải, luôn mở.
 *
 * <p>Màn hẹp: DÍNH Ở ĐÁY MÀN. Trước đây giỏ rơi xuống sau cả thực đơn — trên
 * điện thoại là sau bốn mươi ba món, cuộn gần sáu mươi màn hình mới thấy mình
 * đã gọi gì và nút gửi nằm đâu. Nay tổng tiền và nút gửi luôn trong tầm ngón
 * cái; danh sách món thu lại, bấm vào đầu giỏ để mở.
 *
 * <p>Thu lại mà không sợ gửi nhầm: cả hai màn đều liệt kê lại từng món trong
 * hộp xác nhận trước khi xuống bếp.
 */
export function OrderCart({label, title, count, empty, children, foot}: OrderCartProps) {
    const docked = useMediaQuery(DOCKED)
    const [open, setOpen] = useState(false)
    const bodyId = useId()

    // Phần thân LUÔN có trong cây, chỉ ẩn bằng `hidden`: aria-controls của
    // nút thu/mở phải trỏ vào một phần tử có thật cả lúc đang thu.
    const hidden = docked && !open

    return (
        <aside
            className={`rk-cart${docked ? ' is-docked' : ''}${open ? ' is-open' : ''}`}
            aria-label={label}
        >
            <h2 className="rk-cart__head">
                {docked ? (
                    <button
                        type="button"
                        className="rk-cart__toggle"
                        aria-expanded={open}
                        aria-controls={bodyId}
                        onClick={() => setOpen((value) => !value)}
                    >
                        <span className="rk-cart__title">{title}</span>
                        <span className="rk-cart__count">{count}</span>
                        <span className="rk-cart__hint">
                            {open ? 'Thu lại' : 'Xem món'}
                        </span>
                    </button>
                ) : (
                    <>
                        <span className="rk-cart__title">{title}</span>
                        <span className="rk-cart__count">{count}</span>
                    </>
                )}
            </h2>

            {count === 0 ? (
                <p className="rk-cart__empty" id={bodyId} hidden={hidden}>
                    {empty}
                </p>
            ) : (
                <div className="rk-cart__body" id={bodyId} hidden={hidden}>
                    {children}
                </div>
            )}

            <div className="rk-cart__foot">{foot}</div>
        </aside>
    )
}
