import {useTheme, type ThemePreference} from '@/app/providers/useTheme'

// Nhãn chữ đã rõ nghĩa nên không đeo icon: bộ icon không có cái nào mang đúng
// nghĩa "Theo máy", mà đặt bừa một cái là phá luật một-nghĩa-một-icon.
const OPTIONS: {value: ThemePreference; label: string}[] = [
    {value: 'light', label: 'Sáng'},
    {value: 'dark', label: 'Tối'},
    {value: 'auto', label: 'Theo máy'},
]

/**
 * Ba lựa chọn hiện cùng lúc thay vì một nút bật/tắt.
 *
 * <p>Nút bật/tắt hai trạng thái không diễn tả được "theo cài đặt của máy", và
 * người dùng cũng không đoán được bấm vào sẽ ra chế độ nào.
 */
export function ThemeToggle() {
    const {preference, setPreference} = useTheme()

    return (
        <div className="rk-themetoggle" role="group" aria-label="Chế độ hiển thị">
            {OPTIONS.map(({value, label}) => (
                <button
                    key={value}
                    type="button"
                    className="rk-themetoggle__btn"
                    aria-pressed={preference === value}
                    title={label}
                    onClick={() => setPreference(value)}
                >
                    <span className="rk-themetoggle__label">{label}</span>
                </button>
            ))}
        </div>
    )
}
