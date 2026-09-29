import {useTheme, type ThemePreference} from '@/app/providers/useTheme'
import {Icon} from '@/shared/components/ui/Icon'

/** Bấm một cái đi một bước: theo máy → sáng → tối → theo máy. */
const KE_TIEP: Record<ThemePreference, ThemePreference> = {
    auto: 'light',
    light: 'dark',
    dark: 'auto',
}

const NHAN: Record<ThemePreference, string> = {
    auto: 'Chế độ theo máy, bấm để chuyển sang sáng',
    light: 'Chế độ sáng, bấm để chuyển sang tối',
    dark: 'Chế độ tối, bấm để theo máy',
}

/**
 * Công tắc chế độ hiển thị — một nút, ba trạng thái quay vòng.
 *
 * <p>Trước đây có hai bản: thanh điều hướng của màn đã đăng nhập tự viết một
 * nút icon ngay trong DashboardTopbar, còn trang chủ dùng một component riêng
 * hiện ba nút chữ "Sáng / Tối / Theo máy". Bản ba nút hỏng ở chế độ sáng —
 * nút đang được chọn tô chữ màu nhạt trên nền nhạt nên chữ "Sáng" gần như tàng
 * hình. Gộp về một bản duy nhất, lấy theo bản icon vì nó đã chạy đúng ở cả hai
 * chế độ và sống được ở bề ngang 375px.
 *
 * <p>Vì sao một nút thay vì ba: hàng nhận diện trên trang chủ và thanh điều
 * hướng đều chật, ba nút chữ chiếm gần nửa hàng. Đổi lại phải bấm nhiều nhất
 * hai lần mới tới chế độ mong muốn, và nhãn trợ năng nói rõ bấm tiếp sẽ ra gì.
 */
export function ThemeToggle() {
    const {preference, resolved, setPreference} = useTheme()

    return (
        <button
            type="button"
            className="rk-iconbtn"
            aria-label={NHAN[preference]}
            title={NHAN[preference]}
            onClick={() => setPreference(KE_TIEP[preference])}
        >
            <Icon
                name={preference === 'auto' ? 'contrast' : resolved === 'dark' ? 'moon' : 'sun'}
                className="rk-icon"
            />
        </button>
    )
}
