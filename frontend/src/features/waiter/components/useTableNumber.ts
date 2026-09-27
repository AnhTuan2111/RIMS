import {useEffect, useState} from 'react'

import {getTables} from '@/shared/api/waiter'

/**
 * Đổi khoá chính của bàn sang SỐ BÀN mà người ta đọc ngoài đời.
 *
 * <p>Đường dẫn của màn đặt món mang `tableId` — khoá chính trong cơ sở dữ
 * liệu. Nhưng bàn ngoài đời mang số "B01", và hai con số đó không trùng nhau.
 * Bốn màn của Phục vụ in thẳng khoá chính ra tiêu đề, nên phục vụ đọc "Bàn 4"
 * rồi đi tìm cái bàn số 4, mà quán không có bàn nào mang số đó.
 *
 * <p>Trong lúc chưa tải xong thì trả `null` chứ không trả khoá chính: hiện một
 * con số sai rồi đổi sang số đúng còn tệ hơn là chưa hiện gì.
 */
export function useTableNumber(tableId: number | null | undefined) {
    const [tableNumber, setTableNumber] = useState<string | null>(null)

    useEffect(() => {
        // Không đặt lại state ở nhánh này: state khởi tạo đã là null, và đặt
        // state ngay trong thân effect là một lần vẽ lại thừa — đúng thứ
        // react-hooks bắt lỗi.
        if (!tableId) {
            return
        }

        const controller = new AbortController()

        getTables(controller.signal)
            .then(({data}) => {
                const found = data.find((table) => table.tableId === tableId)

                if (found) {
                    setTableNumber(found.tableNumber)
                }
            })
            .catch(() => {
                // Không lấy được thì để trống. Đây chỉ là nhãn hiển thị; màn
                // vẫn gọi món được bằng tableId trong đường dẫn.
            })

        return () => controller.abort()
    }, [tableId])

    return tableNumber
}
