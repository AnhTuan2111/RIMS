import {useCallback, useState} from 'react'

export type ViewMode = 'cards' | 'table'

const PREFIX = 'rims.view.'

/**
 * Nhớ người dùng đang xem màn này bằng khung nào.
 *
 * <p>Mặc định là THẺ, vì ba màn dùng hook này đều là màn có ảnh món — ảnh là
 * nhân vật chính ở thực đơn. Ai cần so sánh và sắp xếp thì đổi sang bảng, và
 * lựa chọn đó phải còn nguyên ở lần mở sau: người quản lý kho đổi sang bảng
 * một lần rồi phải đổi lại mỗi sáng là một thứ gây bực mà không ai báo lỗi.
 *
 * <p>Nhớ theo MÀN, không nhớ chung: người ta muốn xem Món ăn bằng thẻ mà xem
 * Danh mục bằng bảng là chuyện bình thường.
 *
 * <p>localStorage có thể ném lỗi ở chế độ riêng tư hoặc khi bị chặn, nên mọi
 * lần đọc và ghi đều bọc try/catch và màn vẫn chạy với giá trị mặc định.
 */
export function useViewMode(screenKey: string, fallback: ViewMode = 'cards') {
    const [mode, setMode] = useState<ViewMode>(() => {
        try {
            const saved = localStorage.getItem(PREFIX + screenKey)
            return saved === 'cards' || saved === 'table' ? saved : fallback
        } catch {
            return fallback
        }
    })

    const choose = useCallback(
        (next: ViewMode) => {
            setMode(next)

            try {
                localStorage.setItem(PREFIX + screenKey, next)
            } catch {
                // Không ghi được thì lựa chọn chỉ sống trong phiên này. Vẫn
                // hơn là để màn chết vì một thứ chỉ là tiện nghi.
            }
        },
        [screenKey],
    )

    return [mode, choose] as const
}
