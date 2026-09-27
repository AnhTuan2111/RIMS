import {expect, test} from '@playwright/test'

import {ACCOUNTS, api, expectRendered, login} from './helpers'

test.describe.configure({mode: 'serial'})

test.describe('Đặt bàn', () => {
    test('phục vụ đặt bàn cho khách', async ({page}) => {
        // Đối chiếu theo TỪNG BÀN + NGÀY, vì backend không có endpoint nào
        // trả cả lịch đặt trong ngày. Xem ghi chú ở cuối file.
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const day = tomorrow.toISOString().slice(0, 10)

        const tables = await api(ACCOUNTS.waiter, '/waiter/tables')

        // Chọn một bàn CHƯA CÓ LƯỢT NÀO hôm đó. App buộc hai lượt trên cùng
        // một bàn phải cách nhau 2,5 tiếng — luật đúng, nhưng nghĩa là chạy
        // bài này nhiều lần trên cùng một bàn sẽ kín giờ và đỏ vì lý do không
        // liên quan tới thứ đang kiểm.
        let target = null
        let before: unknown[] = []

        for (const table of tables) {
            const list = await api(
                ACCOUNTS.waiter,
                `/waiter/reservation/${table.tableId}/${day}`,
            )

            if (list.length === 0) {
                target = table
                before = list
                break
            }
        }

        expect(target, 'mọi bàn đều đã kín lịch hôm đó').toBeTruthy()

        await login(page, ACCOUNTS.waiter)
        await page.goto('/waiter/reservations')
        await expectRendered(page)

        const phone = '09' + String(Date.now()).slice(-8)
        const name = 'Khách kiểm thử'

        // Gọi ô nhập theo ĐÚNG id mà nhãn trỏ tới. Trước đây biểu mẫu này có
        // nhãn không gắn với ô nào, nên không có cách nào gọi tên chúng — và
        // đó cũng chính là lý do người dùng bàn phím không bấm được vào nhãn.
        await page.fill('#waitercreatereservationpage-ten-khach-hang', name)
        await page.fill('#waitercreatereservationpage-so-dien-thoai', phone)
        await page.fill('#waitercreatereservationpage-ngay-dat', day)

        // Rời khỏi ô để đóng lịch của trình duyệt. KHÔNG dùng Escape: ở ô
        // input[type=date], Escape huỷ luôn giá trị vừa nhập và trả về ngày
        // cũ — bài kiểm đặt bàn cho ngày mai nhưng lại lưu vào hôm nay.
        await page.locator('#waitercreatereservationpage-ten-khach-hang').click()

        // selectOption nhận chuỗi chính xác, không nhận biểu thức chính quy.
        // Lấy đúng nhãn của mục chứa số bàn rồi chọn theo nhãn đó.
        const tableSelect = page.locator('#waitercreatereservationpage-ban')
        const options = await tableSelect.locator('option').allTextContents()
        const wanted = options.find((o) => o.includes(target.tableNumber))

        expect(
            wanted,
            `không thấy bàn ${target.tableNumber} trong danh sách`,
        ).toBeTruthy()

        await tableSelect.selectOption({label: wanted!})

        await page.getByRole('button', {name: /lưu đặt bàn/i}).click()

        await expect
            .poll(
                async () => {
                    const now = await api(
                        ACCOUNTS.waiter,
                        `/waiter/reservation/${target!.tableId}/${day}`,
                    )
                    return now.length
                },
                {timeout: 15_000, message: 'lượt đặt bàn không được ghi nhận'},
            )
            .toBeGreaterThan(before.length)
    })

    test('khách đặt bàn, thấy lượt đó trong "Lượt đặt của tôi", rồi huỷ có hỏi lại', async ({
        page,
    }) => {
        // Bản đầu của bài này mang đúng cái tên "khách xem được lượt đặt của
        // chính mình" nhưng chỉ kiểm biểu mẫu có hiện — không đặt, không xem,
        // không huỷ gì.
        const tomorrow = new Date(Date.now() + 86_400_000).toLocaleDateString('sv-SE')

        await login(page, ACCOUNTS.customer)
        await page.goto('/customer/reservations')
        await expectRendered(page)

        await page.locator('#khach-ten-khach-hang').fill('Khách kiểm thử')
        await page.locator('#khach-so-dien-thoai').fill('0912345678')
        await page.locator('#customerreservations-ngay-dat').fill(tomorrow)
        // Rời ô ngày bằng một cú bấm — Escape ở input[type=date] huỷ giá trị.
        await page.locator('#khach-ten-khach-hang').click()

        // Giờ cuối ngày: ít đụng lượt của các bài khác nhất.
        const time = page.locator('#customerreservations-gio-dat')
        const slots = await time.locator('option').allTextContents()
        await time.selectOption({index: slots.length - 1})

        const table = page.locator('#customerreservations-chon-ban')
        await expect(table.locator('option').nth(1)).toBeAttached({timeout: 10_000})
        await table.selectOption({index: 1})
        const tableText = (await table.locator('option:checked').textContent())!
        const tableNumber = tableText.match(/B\d+/)?.[0] ?? tableText.trim()

        const allTables = await api(ACCOUNTS.waiter, '/waiter/tables')
        const tableId = allTables.find(
            (t: {tableNumber: string}) => t.tableNumber === tableNumber,
        )?.tableId
        expect(tableId, `không tìm được id của bàn ${tableNumber}`).toBeTruthy()

        // Lịch ngày của phục vụ trả tableId, không trả số bàn.
        const openOnWaiterSide = async () => {
            const day = await api(
                ACCOUNTS.waiter,
                `/waiter/reservations?date=${tomorrow}`,
            )
            return day.some(
                (r: {customerName: string; tableId: number; status: string}) =>
                    r.customerName === 'Khách kiểm thử' &&
                    r.tableId === tableId &&
                    r.status !== 'CANCELLED',
            )
        }

        await page.locator('button[type="submit"]').click()

        // Đặt xong thì tự chuyển sang tab xem — và lượt vừa đặt phải ở đó.
        const mine = page.getByRole('button', {name: 'Lượt đặt của tôi'})
        await expect(
            page.locator('.rk-sectiontitle', {hasText: 'Lượt đặt của tôi'}),
        ).toBeVisible({timeout: 15_000})
        const row = page.locator('.rk-rowlist__item', {hasText: tableNumber}).first()
        await expect(row).toBeVisible()
        await expect(mine).toBeVisible()

        // Chiều THUẬN: vừa đặt thì phục vụ phải thấy. Không có bước này thì
        // phép so "không còn thấy" ở cuối có thể xanh vì so với một thứ rỗng.
        await expect.poll(openOnWaiterSide, {timeout: 15_000}).toBe(true)

        // Huỷ phải hỏi lại; "Giữ lượt đặt" thì không có gì thay đổi.
        await row.getByRole('button', {name: 'Huỷ lượt này'}).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toContainText(tableNumber)
        await dialog.getByRole('button', {name: 'Giữ lượt đặt'}).click()
        await expect(row).toBeVisible()

        await row.getByRole('button', {name: 'Huỷ lượt này'}).click()
        await dialog.getByRole('button', {name: 'Huỷ lượt đặt'}).click()
        await expect(page.locator('.rk-note--ok')).toContainText(/đã huỷ/i)

        // Phía phục vụ không còn thấy lượt đó trong lịch ngày mai.
        await expect
            .poll(openOnWaiterSide, {
                timeout: 15_000,
                message: 'lượt đã huỷ vẫn còn trong lịch của phục vụ',
            })
            .toBe(false)
    })
})

/*
 * THIẾU SÓT ĐÃ GHI NHẬN — không phải lỗi của bài kiểm này.
 *
 * Backend không có endpoint nào trả CẢ LỊCH ĐẶT TRONG MỘT NGÀY. Chỉ có
 * `/waiter/reservation/{tableId}/{date}` (một bàn một ngày) và
 * `/waiter/reservations/{id}` (một lượt). Nghĩa là phục vụ muốn biết "tối nay
 * ai đặt" thì phải mở lần lượt cả 14 bàn.
 *
 * Xem e2e/06-thieu-sot.spec.ts.
 */
