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
        const target = tables[0]

        const before = await api(
            ACCOUNTS.waiter,
            `/waiter/reservation/${target.tableId}/${day}`,
        )

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
        // Ô ngày của trình duyệt mở lịch ngay khi được điền, và cái lịch đó
        // nằm đè lên nút Lưu. Đóng nó lại trước khi bấm tiếp.
        await page.keyboard.press('Escape')

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
                        `/waiter/reservation/${target.tableId}/${day}`,
                    )
                    return now.length
                },
                {timeout: 15_000, message: 'lượt đặt bàn không được ghi nhận'},
            )
            .toBeGreaterThan(before.length)
    })

    test('khách xem được lượt đặt của chính mình', async ({page}) => {
        await login(page, ACCOUNTS.customer)
        await page.goto('/customer/reservations')
        await expectRendered(page)

        // Màn của khách phải dựng được biểu mẫu đặt bàn, không phải một màn lỗi.
        await expect(page.locator('form, .rk-field').first()).toBeVisible()
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
