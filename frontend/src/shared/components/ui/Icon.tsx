import {ICONS, type IconName} from './icons'

export type {IconName}

/**
 * Icon của hệ "Phiếu bếp".
 *
 * <p>Một component duy nhất đọc từ một bảng hằng duy nhất. Không có file SVG rời,
 * không có thư viện icon. Lý do: luật "một nghĩa một icon, một icon một nghĩa" chỉ
 * giữ được khi mọi icon nằm cùng một chỗ và có sổ nghĩa đi kèm — xem `icons.ts`.
 *
 * <p>Độ dày nét, kiểu đầu nét và cỡ đặt MỘT LẦN ở class `.rims-i` trong tokens.css,
 * không viết trong từng icon. Đổi nét toàn app là sửa một dòng.
 *
 * <p>Chuỗi path lấy từ bảng hằng trong mã, không bao giờ từ dữ liệu người dùng,
 * nên chèn thẳng vào SVG là an toàn.
 *
 * <p>`aria-hidden` vì icon trong hệ này luôn đi kèm nhãn chữ. Nút chỉ có icon phải
 * tự đặt `aria-label` cho chính nó.
 */
export function Icon({name, className}: {name: IconName; className?: string}) {
    return (
        <svg
            className={className ? `rims-i ${className}` : 'rims-i'}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            dangerouslySetInnerHTML={{__html: ICONS[name]}}
        />
    )
}
