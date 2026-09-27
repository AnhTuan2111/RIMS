import {useEffect, useState} from 'react'

import type {IconName} from '@/shared/components/ui/Icon'

/**
 * Giờ hiện tại và ca làm.
 *
 * <p>Khung giờ lấy đúng từ enum OrderShift của backend — sửa ở một nơi thì phải
 * sửa cả hai, nên khung giờ ghi lại ngay đây kèm nguồn để không ai đoán.
 *
 * <p>Ngoài 08:00–22:00 thì nhà hàng không thuộc ca nào. Không bịa ra một ca thứ
 * năm: nói thẳng "Ngoài ca" đúng hơn là gán bừa vào ca tối.
 */
const SHIFTS: {from: number; to: number; label: string; icon: IconName}[] = [
    {from: 8 * 60, to: 11 * 60, label: 'Ca sáng', icon: 'sun'},
    {from: 11 * 60, to: 14 * 60, label: 'Ca trưa', icon: 'sun'},
    {from: 14 * 60, to: 17 * 60, label: 'Ca chiều', icon: 'sun'},
    {from: 17 * 60, to: 22 * 60 + 1, label: 'Ca tối', icon: 'moon'},
]

function read() {
    const now = new Date()
    const minutes = now.getHours() * 60 + now.getMinutes()
    const shift = SHIFTS.find((s) => minutes >= s.from && minutes < s.to)

    return {
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        label: shift?.label ?? 'Ngoài ca',
        icon: shift?.icon ?? ('clock' as IconName),
    }
}

export function useShiftClock() {
    const [state, setState] = useState(read)

    useEffect(() => {
        // Nhịp 20 giây: đủ để phút không bao giờ lệch quá lâu, mà không bắt
        // React vẽ lại mỗi giây cho một con số chỉ đổi mỗi phút.
        const id = window.setInterval(() => setState(read()), 20_000)
        return () => window.clearInterval(id)
    }, [])

    return state
}
