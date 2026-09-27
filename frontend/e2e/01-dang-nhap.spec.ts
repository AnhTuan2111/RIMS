import {expect, test} from '@playwright/test'

import {ACCOUNTS, PW, expectRendered, login} from './helpers'

test.describe('Cửa vào', () => {
    test('trang chủ hiện thực đơn thật của quán', async ({page}) => {
        await page.goto('/')
        await expectRendered(page)

        // Tên quán đọc từ cấu hình, không viết cứng.
        await expect(page.locator('h1')).toBeVisible()

        // Thực đơn phải có món. Trang chủ trống là dấu hiệu API thực đơn hỏng —
        // đúng lỗi đã xảy ra một lần và không công cụ nào bắt được.
        const dishes = page.locator('.rk-dish')
        await expect(dishes.first()).toBeVisible()
        expect(await dishes.count()).toBeGreaterThan(5)
    })

    test('băng danh mục nhảy tới đúng nhóm món', async ({page}) => {
        await page.goto('/')

        const firstCat = page.locator('.rk-home__cat').first()
        const href = await firstCat.getAttribute('href')

        await firstCat.click()

        // Mục tiêu phải tồn tại — một liên kết neo trỏ vào hư không là lỗi
        // im lặng: không có gì báo, trang chỉ đứng yên.
        await expect(page.locator(href!)).toBeVisible()
    })

    test('mỗi vai đăng nhập vào đúng màn của mình', async ({page}) => {
        const landings: Record<string, RegExp> = {
            [ACCOUNTS.admin]: /\/admin\//,
            [ACCOUNTS.chef]: /\/chef\//,
            [ACCOUNTS.waiter]: /\/waiter\//,
            [ACCOUNTS.cashier]: /\/cashier\//,
            [ACCOUNTS.customer]: /\/customer\//,
        }

        for (const [username, landing] of Object.entries(landings)) {
            await page.goto('/')
            await page.evaluate(() => localStorage.clear())

            await login(page, username)

            expect(page.url(), `${username} vào nhầm màn`).toMatch(landing)
            await expectRendered(page)
        }
    })

    test('mật khẩu sai thì báo rõ, không im lặng', async ({page}) => {
        await page.goto('/login')
        await page.fill('#login-username', ACCOUNTS.waiter)
        await page.fill('#login-password', PW + 'sai')
        await page.click('button[type="submit"]')

        await expect(page.locator('.rk-formerror')).toBeVisible()
        await expect(page).toHaveURL(/\/login/)
    })

    test('màn cần quyền thì đá về trang đăng nhập khi chưa đăng nhập', async ({page}) => {
        await page.goto('/')
        await page.evaluate(() => localStorage.clear())

        await page.goto('/admin/dashboard')

        await expect(page).toHaveURL(/\/login/)
    })

    test('ô đăng nhập ở góc trang chủ đăng nhập được', async ({page}) => {
        await page.goto('/')
        await page.evaluate(() => localStorage.clear())
        await page.reload()

        await page.click('.rk-homeauth button')
        await page.fill('#home-username', ACCOUNTS.waiter)
        await page.fill('#home-password', PW)
        await page.click('#home-auth-form button[type="submit"]')

        await expect(page).toHaveURL(/\/waiter\//, {timeout: 15_000})
    })
})
