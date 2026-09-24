/**
 * Ảnh thay thế khi ảnh món hỏng hoặc chưa có.
 *
 * <p>Trước đây hai màn quản trị trỏ thẳng sang `https://placehold.co` — một
 * dịch vụ ngoài. Nghĩa là mỗi ảnh hỏng lại phát một request ra Internet, app
 * chạy trong mạng nội bộ thì ô ảnh trống trơn, và địa chỉ của nhà hàng bị lộ
 * sang bên thứ ba qua Referer.
 *
 * <p>Đây là một SVG nội tuyến dạng data URI: không request nào, không phụ
 * thuộc ai, và màu lấy đúng từ bảng màu của hệ.
 */
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
<rect width="48" height="48" fill="#eceff3"/>
<path d="M14 30l6-7 5 6 4-4 5 5v3H14z" fill="#b8c1cc"/>
<circle cx="18" cy="18" r="3" fill="#b8c1cc"/>
</svg>`

export const ANH_THAY_THE = `data:image/svg+xml;utf8,${encodeURIComponent(SVG)}`

/**
 * Gắn vào `onError` của thẻ img: đổi sang ảnh thay thế đúng một lần.
 *
 * <p>Phải gỡ `onerror` sau lần đầu, nếu không ảnh thay thế lỗi nốt thì trình
 * duyệt gọi lại chính nó thành vòng lặp vô tận.
 */
export function dungAnhThayThe(event: {currentTarget: HTMLImageElement}) {
    const img = event.currentTarget

    img.onerror = null
    img.src = ANH_THAY_THE
}
