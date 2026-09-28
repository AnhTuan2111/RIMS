/**
 * Nhãn phụ đứng TRƯỚC tiêu đề tab, ví dụ "3 món mới".
 *
 * <p>Trước đây màn bếp tự ghi đè document.title và tự nhớ "tiêu đề gốc" để trả
 * lại — nhưng tiêu đề gốc nó nhớ là của màn TRƯỚC, vì component cha đặt tiêu
 * đề sau component con. Nay chỉ DocumentBranding ghi document.title; màn nào
 * cần báo thì đặt nhãn phụ ở đây.
 */
let badge: string | null = null
const listeners = new Set<() => void>()

export function setTitleBadge(value: string | null) {
    badge = value
    listeners.forEach((listener) => listener())
}

export function subscribeTitleBadge(listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export function getTitleBadge() {
    return badge
}
