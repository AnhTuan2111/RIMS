import {Monitor, Moon, Sun} from 'lucide-react'

import {useTheme, type ThemePreference} from '@/app/providers/useTheme'

const OPTIONS: {value: ThemePreference; label: string; Icon: typeof Sun}[] = [
    {value: 'light', label: 'Sáng', Icon: Sun},
    {value: 'dark', label: 'Tối', Icon: Moon},
    {value: 'auto', label: 'Theo máy', Icon: Monitor},
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
            {OPTIONS.map(({value, label, Icon}) => (
                <button
                    key={value}
                    type="button"
                    className="rk-themetoggle__btn"
                    aria-pressed={preference === value}
                    title={label}
                    onClick={() => setPreference(value)}
                >
                    <Icon className="rk-icon" aria-hidden="true" />
                    <span className="rk-themetoggle__label">{label}</span>
                </button>
            ))}
        </div>
    )
}
