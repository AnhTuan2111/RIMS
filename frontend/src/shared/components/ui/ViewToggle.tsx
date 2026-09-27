import {Icon} from './Icon'
import type {ViewMode} from '@/shared/hooks/useViewMode'

type ViewToggleProps = {
    value: ViewMode
    onChange: (next: ViewMode) => void
}

/**
 * Đổi giữa khung THẺ và khung BẢNG.
 *
 * <p>Hai khung cho hai việc khác nhau, không phải hai sở thích. Thẻ để NHẬN RA
 * món — ảnh, tên, giá. Bảng để SO SÁNH và SẮP XẾP — bốn mươi dòng, bảy cột, ai
 * đắt hơn ai. Bắt một màn chọn sẵn một khung là bắt một nửa người dùng làm việc
 * bằng công cụ sai.
 *
 * <p>Nhãn chữ, không chỉ icon: hai icon lưới và bảng trông giống nhau ở cỡ
 * 24px, và đây là nút mà người ta chỉ bấm vài tháng một lần nên không kịp học.
 */
export function ViewToggle({value, onChange}: ViewToggleProps) {
    return (
        <div className="rk-segment" role="group" aria-label="Kiểu hiển thị">
            <button
                type="button"
                className={`rk-segment__btn${value === 'cards' ? ' is-active' : ''}`}
                aria-pressed={value === 'cards'}
                onClick={() => onChange('cards')}
            >
                <Icon name="cards" className="rk-icon" />
                Thẻ
            </button>

            <button
                type="button"
                className={`rk-segment__btn${value === 'table' ? ' is-active' : ''}`}
                aria-pressed={value === 'table'}
                onClick={() => onChange('table')}
            >
                <Icon name="rows" className="rk-icon" />
                Bảng
            </button>
        </div>
    )
}
