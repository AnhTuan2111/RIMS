import {expect, test} from '@playwright/test'

import {ACCOUNTS, api, expectRendered, login} from './helpers'

/**
 * Khổ ĐIỆN THOẠI — nơi phục vụ thật sự cầm máy.
 *
 * <p>Ba lỗi dưới đây chỉ hiện ra ở 375px, và cả ba đều không phải lỗi hiển
 * thị mà là lỗi dùng được hay không:
 *   · sơ đồ bàn ở 100% chỉ vừa nửa quán, không gì báo là bên phải còn bàn;
 *   · màn gọi món dài 22.000px, giỏ và nút gửi nằm tận đáy;
 *   · chi tiết đơn là một bảng bốn cột bị cắt ngay cột giá.
 */
test.use({viewport: {width: 375, height: 812}})

test.describe.configure({mode: 'serial'})

test.describe('Điện thoại · phục vụ', () => {
    let tableId: number

    test('sơ đồ bàn tự vừa khung — thấy mọi bàn mà không cuộn ngang', async ({page}) => {
        await login(page, ACCOUNTS.waiter)
        await page.goto('/waiter/tables')
        await expectRendered(page)

        const view = page.locator('.rk-floor__view')
        await expect(view).toBeVisible()

        // Đợi ResizeObserver chọn xong mức thu phóng.
        await expect(page.locator('.rk-floor__zoom')).not.toHaveText('100%')

        const hidden = await page.evaluate(() => {
            const frame = document
                .querySelector('.rk-floor__view')!
                .getBoundingClientRect()
            return [...document.querySelectorAll('.rk-floor__slot')]
                .filter((slot) => slot.getBoundingClientRect().right > frame.right + 1)
                .map((slot) => slot.textContent?.trim().slice(0, 4))
        })

        expect(hidden, `bàn nằm ngoài khung: ${hidden.join(', ')}`).toHaveLength(0)

        // Bấm thu phóng tay thì sơ đồ THÔI tự chỉnh — không giật lại lựa chọn.
        const before = await page.locator('.rk-floor__zoom').textContent()
        await page.getByRole('button', {name: 'Phóng to sơ đồ'}).click()
        await expect(page.locator('.rk-floor__zoom')).not.toHaveText(before!)
    })

    test('gọi món: tổng tiền và nút gửi luôn trong tầm tay', async ({page}) => {
        const tables = await api(ACCOUNTS.waiter, '/waiter/tables')
        const free = tables.find((t: {status: string}) => t.status === 'AVAILABLE')
        expect(free, 'không còn bàn trống nào để kiểm').toBeTruthy()
        tableId = free.tableId

        await login(page, ACCOUNTS.waiter)
        await page.goto(`/waiter/tables/${tableId}/order/new`)
        await expectRendered(page)

        const cart = page.locator('.rk-cart')
        const send = cart.getByRole('button', {name: /gửi đơn/i})
        const toggle = cart.locator('.rk-cart__toggle')

        // Ngay khi mở màn, CHƯA cuộn: nút gửi đã nằm trong khung nhìn.
        await expect(send).toBeInViewport()
        await expect(toggle).toHaveAttribute('aria-expanded', 'false')

        // Cuộn xuống giữa thực đơn rồi gọi một món ở đó.
        const card = page.locator('.rk-menucard').nth(6)
        await card.scrollIntoViewIfNeeded()
        const dishName = (await card.locator('.rk-menucard__name').textContent())!.trim()
        await card.getByRole('button', {name: /^Thêm một phần/}).click()

        // Giỏ vẫn ở đáy màn, đếm đúng, nút gửi vẫn trong tầm.
        await expect(page.locator('.rk-cart__count')).toHaveText('1')
        await expect(send).toBeInViewport()
        await expect(send).toBeEnabled()

        // Mở giỏ thì thấy đúng món vừa gọi.
        await toggle.click()
        await expect(toggle).toHaveAttribute('aria-expanded', 'true')
        await expect(cart.locator('.rk-cart__name')).toContainText(dishName)

        // Trang không còn dài hàng chục nghìn điểm ảnh.
        const height = await page.evaluate(() => document.documentElement.scrollHeight)
        expect(height, `trang cao ${height}px`).toBeLessThan(9000)

        await send.click()
        await page.locator('.rk-modal button', {hasText: /gửi đơn/i}).click()
        await expect(page.locator('.rk-modal')).toContainText(/đã gửi|thành công/i, {
            timeout: 15_000,
        })
    })

    test('chi tiết đơn đọc trọn ở 375px và có tổng tiền', async ({page}) => {
        await login(page, ACCOUNTS.waiter)
        await page.goto(`/waiter/tables/${tableId}/order/detail`)
        await expectRendered(page)

        const line = page.locator('.rk-lines__item').first()
        await expect(line).toBeVisible()

        // Không phần nào của dòng món thò ra ngoài màn.
        const overflow = await page.evaluate(() =>
            [...document.querySelectorAll('.rk-lines__item *')].some(
                (el) => el.getBoundingClientRect().right > window.innerWidth,
            ),
        )
        expect(overflow, 'có phần của dòng món nằm ngoài màn').toBe(false)

        await expect(line.locator('.rk-chip')).toBeVisible()

        const total = page.locator('.rk-summary__row--total .rk-summary__value')
        await expect(total).toBeVisible()
        await expect(total).not.toHaveText(/^0\s/)
    })
})

test.describe('Điện thoại · quản trị', () => {
    test('mọi báo cáo thống kê không tràn ngang và tiêu đề không vỡ chữ', async ({
        page,
    }) => {
        // Bài tràn ngang chung chỉ mở TAB MẶC ĐỊNH của mỗi màn. Tab "Đơn hàng
        // theo ca" từng in tiêu đề thành "THỐ / NG / KÊ" và đẩy trang rộng ra
        // 389px trên màn 375 — bài chung không bao giờ nhìn thấy.
        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/statistics')
        await expectRendered(page)

        const tabs = page.locator('.rk-stat--tab')
        const count = await tabs.count()
        expect(count).toBeGreaterThan(1)

        const problems: string[] = []

        for (let i = 0; i < count; i++) {
            const tab = tabs.nth(i)
            const name = (await tab.locator('.rk-stat__label').textContent())!.trim()
            await tab.click()
            await page.waitForLoadState('networkidle')

            const overflow = await page.evaluate(
                () =>
                    document.documentElement.scrollWidth -
                    document.documentElement.clientWidth,
            )
            if (overflow > 1) problems.push(`${name}: tràn ${overflow}px`)

            // Tiêu đề báo cáo: mỗi dòng phải chứa được ít nhất một từ trọn vẹn.
            const title = page.locator('.rk-pagehead__title').last()
            const box = await title.boundingBox()
            if (box && box.width < 120) {
                problems.push(`${name}: tiêu đề chỉ rộng ${Math.round(box.width)}px`)
            }
        }

        expect(problems, problems.join(String.fromCharCode(10))).toHaveLength(0)
    })
})
