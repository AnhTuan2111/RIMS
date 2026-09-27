import {expect, test} from '@playwright/test'

import {ACCOUNTS, api, expectRendered, login} from './helpers'

test.describe.configure({mode: 'serial'})

test.describe('Quản trị', () => {
    test('đổi khung Thẻ ↔ Bảng và NHỚ lựa chọn sau khi tải lại', async ({page}) => {
        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/dishes')
        await expectRendered(page)

        // Mặc định là THẺ.
        await expect(page.locator('.rk-dishcard').first()).toBeVisible()

        await page.locator('.rk-segment__btn', {hasText: 'Bảng'}).click()
        await expect(page.locator('.rk-table').first()).toBeVisible()

        // Nhớ theo người dùng: tải lại vẫn phải là Bảng.
        await page.reload()
        await expect(page.locator('.rk-table').first()).toBeVisible()
        await expect(page.locator('.rk-dishcard')).toHaveCount(0)

        // Trả lại mặc định để không làm hỏng tiền đề của bài khác.
        await page.locator('.rk-segment__btn', {hasText: 'Thẻ'}).click()
        await expect(page.locator('.rk-dishcard').first()).toBeVisible()
    })

    test('lọc món theo danh mục thì lưới đổi theo', async ({page}) => {
        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/dishes')

        // Chờ lưới vẽ xong rồi mới đếm: đếm ngay sau goto là đếm một trang
        // còn đang tải, và con số 0 lúc đó không nói lên điều gì.
        await expect(page.locator('.rk-dishcard').first()).toBeVisible()

        const all = await page.locator('.rk-dishcard').count()
        expect(all).toBeGreaterThan(5)

        const select = page.locator('select').first()
        await select.selectOption({index: 1})

        await expect
            .poll(async () => page.locator('.rk-dishcard').count(), {timeout: 10_000})
            .toBeLessThan(all)
    })

    test('tìm kiếm món lọc đúng theo tên', async ({page}) => {
        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/dishes')
        await expect(page.locator('.rk-dishcard').first()).toBeVisible()

        await page.fill('input[type="text"]', 'ramen')

        await expect
            .poll(async () => page.locator('.rk-dishcard').count(), {timeout: 10_000})
            .toBeGreaterThan(0)

        const names = await page.locator('.rk-dishcard__name').allTextContents()
        expect(names.length).toBeGreaterThan(0)

        for (const name of names) {
            expect(name.toLowerCase(), 'kết quả tìm kiếm lọt món không khớp').toContain(
                'ramen',
            )
        }
    })

    test('màn Mặt bằng lưu được chỗ đứng của bàn', async ({page}) => {
        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/floor')
        await expectRendered(page)

        // Có bàn trên mặt bằng, và có nút lưu.
        await expect(page.locator('.rk-planbtn').first()).toBeVisible()

        const save = page.locator('.rk-btn--go', {hasText: /lưu/i})

        // Chưa đổi gì thì nút lưu phải khoá — lưu một thứ không đổi là một
        // lần ghi vô nghĩa, và nó xoá mất dấu "đang có thay đổi chưa lưu".
        await expect(save).toBeDisabled()

        // Chọn một bàn rồi dời bằng phím mũi tên: mặt bằng phải đặt được bằng
        // BÀN PHÍM, không chỉ bằng kéo thả.
        const tile = page.locator('.rk-planbtn').first()
        await tile.click()

        // Đặt focus tường minh rồi mới gõ phím: không có focus thì phím mũi
        // tên đi thẳng vào trình duyệt và CUỘN TRANG, còn bàn thì đứng yên.
        await tile.focus()
        await tile.press('ArrowRight')

        await expect(save).toBeEnabled()

        await save.click()

        await expect
            .poll(
                async () => {
                    const tables = await api(ACCOUNTS.admin, '/admin/table/all')
                    return tables.filter(
                        (t: {layoutX: number | null}) => t.layoutX != null,
                    ).length
                },
                {timeout: 15_000, message: 'mặt bằng không được lưu'},
            )
            .toBeGreaterThan(0)
    })

    test('màn Nhân sự hiện đủ nhân viên và khách ở hai tab', async ({page}) => {
        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/users')
        await expectRendered(page)

        const rows = page.locator('.rk-table tbody tr')
        expect(await rows.count()).toBeGreaterThan(0)

        await page.locator('.rk-tabs__btn', {hasText: /khách hàng/i}).click()

        await expect
            .poll(async () => page.locator('.rk-table tbody tr').count(), {
                timeout: 10_000,
            })
            .toBeGreaterThan(0)
    })
})
