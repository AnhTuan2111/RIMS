import {expect, test} from '@playwright/test'

import {ACCOUNTS, api, expectRendered, login} from './helpers'

/**
 * Luồng chính của cả app: phục vụ gọi món → bếp nấu xong → thu ngân thu tiền.
 *
 * <p>Ba bài này chạy NỐI TIẾP và dùng chung một cái bàn. Tách ra thành ba bài
 * độc lập thì mỗi bài phải tự dựng lại tiền đề, và khi đó chúng không còn kiểm
 * được thứ đáng kiểm nhất: ba vai có nhìn thấy việc của nhau không.
 */
test.describe.configure({mode: 'serial'})

test.describe('Luồng bán hàng', () => {
    let tableId: number
    let tableNumber: string

    test('phục vụ gọi món cho một bàn trống', async ({page}) => {
        const tables = await api(ACCOUNTS.waiter, '/waiter/tables')
        const free = tables.find((t: {status: string}) => t.status === 'AVAILABLE')

        expect(free, 'không còn bàn trống nào để kiểm').toBeTruthy()

        tableId = free.tableId
        tableNumber = free.tableNumber

        await login(page, ACCOUNTS.waiter)
        await page.goto(`/waiter/tables/${tableId}/order/new`)
        await expectRendered(page)

        // Tiêu đề phải nói SỐ BÀN thật, không phải khoá chính.
        await expect(page.locator('.rk-sectiontitle')).toContainText(tableNumber)

        // Giỏ đơn rỗng thì nút gửi phải khoá — gửi một đơn không có món nào là
        // việc vô nghĩa, và backend sẽ từ chối.
        const send = page.locator('.rk-cart button[type="button"]').last()
        await expect(send).toBeDisabled()

        // Gọi hai phần của món đầu tiên.
        const firstCard = page.locator('.rk-menucard').first()
        const dishName = (await firstCard
            .locator('.rk-menucard__name')
            .textContent())!.trim()

        const plus = firstCard.locator('.rk-stepper__btn').last()
        await plus.click()
        await plus.click()

        // Số phần phải hiện đè lên ảnh, và giỏ phải đếm đúng.
        await expect(firstCard.locator('.rk-menucard__count')).toHaveText('2')
        await expect(page.locator('.rk-cart__count')).toHaveText('1')
        await expect(page.locator('.rk-cart__name')).toContainText(dishName)

        // Tạm tính phải khác 0 sau khi đã gọi món.
        const total = await page.locator('.rk-cart__total b').textContent()
        expect(total).not.toMatch(/^0\s/)

        await expect(send).toBeEnabled()
        await send.click()

        // Hộp thoại xác nhận, rồi gửi thật.
        await page.locator('.rk-modal button', {hasText: /gửi đơn/i}).click()

        // Màn báo đã gửi.
        await expect(page.locator('.rk-modal')).toContainText(/đã gửi|thành công/i, {
            timeout: 15_000,
        })

        // Đối chiếu ở backend: bàn phải chuyển sang đang phục vụ.
        const after = await api(ACCOUNTS.waiter, '/waiter/tables')
        const now = after.find((t: {tableId: number}) => t.tableId === tableId)
        expect(now.status, 'bàn chưa chuyển sang SERVING sau khi gọi món').toBe('SERVING')
    })

    test('bếp thấy món mới và báo xong', async ({page}) => {
        await login(page, ACCOUNTS.chef)
        await page.goto('/chef/orders')
        await expectRendered(page)

        const doing = page.locator('.rk-board__col').first()
        const ticket = doing.locator('.rk-ticket').filter({hasText: tableNumber}).first()

        await expect(ticket, `bếp không thấy món của bàn ${tableNumber}`).toBeVisible()

        const before = Number(
            await page
                .locator('.rk-board__col')
                .nth(1)
                .locator('.rk-board__count')
                .textContent(),
        )

        await ticket.locator('.rk-btn--go').click()

        // Hoàn thành món KHÔNG hoàn tác được, nên app hỏi lại. Phải bấm qua
        // hộp thoại — và chính việc có hộp thoại này là điều đáng kiểm.
        const confirm = page.locator('.rk-modal')
        await expect(confirm).toBeVisible()
        await confirm
            .locator('button', {hasText: /xong|hoàn thành|đồng ý/i})
            .last()
            .click()

        // Cột "Đã xong" phải tăng đúng một phiếu.
        await expect(
            page.locator('.rk-board__col').nth(1).locator('.rk-board__count'),
        ).toHaveText(String(before + 1), {timeout: 15_000})
    })

    test('thu ngân thu tiền và sinh hoá đơn', async ({page}) => {
        const invoicesBefore = await api(ACCOUNTS.admin, '/admin/invoice/history')

        await login(page, ACCOUNTS.cashier)
        await page.goto('/cashier/payments')
        await expectRendered(page)

        // Bàn phải nằm ở cột "Đang phục vụ".
        const card = page.locator('.rk-tablecard').filter({hasText: tableNumber}).first()
        await expect(card).toBeVisible()
        await card.click()

        // Panel đơn mở ra kèm nút thanh toán.
        const pay = page.locator('button', {hasText: /thanh toán/i}).last()
        await expect(pay).toBeVisible({timeout: 15_000})
        await pay.click()

        // Hộp thoại thanh toán có HAI BƯỚC: chọn phương thức, rồi nhập tiền
        // khách đưa. Hai bước là đúng — chọn nhầm phương thức rồi mới biết thì
        // phải quay lại được, và nút "Quay lại" ở bước hai làm đúng việc đó.
        const modal = page.locator('.rk-modal')
        await expect(modal).toBeVisible()

        await modal.locator('button', {hasText: /tiền mặt/i}).click()

        const amount = modal.locator('input').first()
        await expect(amount).toBeVisible()
        await amount.fill('2000000')

        await modal.locator('.rk-btn--go').click()

        // Đối chiếu ở backend: phải có thêm đúng một hoá đơn.
        await expect
            .poll(
                async () => {
                    const now = await api(ACCOUNTS.admin, '/admin/invoice/history')
                    return now.totalItems
                },
                {timeout: 20_000, message: 'không sinh hoá đơn sau khi thu tiền'},
            )
            .toBe(invoicesBefore.totalItems + 1)

        // Và bàn phải về trống.
        const tables = await api(ACCOUNTS.waiter, '/waiter/tables')
        const now = tables.find((t: {tableId: number}) => t.tableId === tableId)
        expect(now.status, 'bàn chưa về trống sau khi thu tiền').toBe('AVAILABLE')
    })
})
