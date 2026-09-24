import {Clock} from './Clock'

/**
 * Hàng tiêu đề của các màn Phục vụ: tên màn bên trái, đồng hồ bên phải.
 *
 * <p>Trước đây tiêu đề gõ cứng là "Sơ đồ bàn nhà hàng" cho MỌI màn, kể cả
 * màn Đặt bàn và màn Tạo đơn — nên người dùng đọc thấy tên của một màn khác.
 */
export function WaiterHeader({title = 'Sơ đồ bàn nhà hàng'}: {title?: string}) {
    return (
        <div className="rk-card__head-inline">
            <h2 className="rk-sectiontitle">{title}</h2>
            <Clock />
        </div>
    )
}
