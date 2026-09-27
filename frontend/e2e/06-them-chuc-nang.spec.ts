import {expect, test} from '@playwright/test'

import {ACCOUNTS, api, expectRendered, login} from './helpers'

test.describe.configure({mode: 'serial'})

test.describe('Vỏ app', () => {
    test('đổi sáng/tối ba trạng thái và NHỚ sau khi tải lại', async ({page}) => {
        await login(page, ACCOUNTS.admin)

        const toggle = page.locator('.rk-iconbtn[aria-label*="chế độ" i]').first()
        await expect(toggle).toBeVisible()

        const read = () =>
            page.evaluate(() => document.documentElement.getAttribute('data-theme'))

        const first = await read()

        await toggle.click()
        const second = await read()
        expect(second, 'bấm một lần mà chế độ không đổi').not.toBe(first)

        await page.reload()
        expect(await read(), 'chế độ không được nhớ sau khi tải lại').toBe(second)

        // Ba trạng thái: theo máy → sáng → tối → theo máy.
        await toggle.click()
        await toggle.click()
        expect(await read(), 'vòng ba trạng thái không quay về chỗ cũ').toBe(first)
    })

    test('rail thu thành ngăn kéo dưới 60rem', async ({page}) => {
        await login(page, ACCOUNTS.chef)
        await page.goto('/chef/orders')

        // Rộng: rail luôn ở đó, không có nút mở.
        await expect(page.locator('.rk-rail')).toBeVisible()
        await expect(page.locator('.rk-top__menubtn')).toBeHidden()

        // Hẹp: rail ẩn đi, phải có nút mở.
        await page.setViewportSize({width: 375, height: 800})
        await expect(page.locator('.rk-top__menubtn')).toBeVisible()

        await page.locator('.rk-top__menubtn').click()
        await expect(page.locator('.rk-rail.is-open')).toBeVisible()
    })

    test('breadcrumb nói đúng màn đang mở', async ({page}) => {
        await login(page, ACCOUNTS.admin)

        for (const [path, expected] of [
            ['/admin/dishes', /món ăn/i],
            ['/admin/users', /nhân sự/i],
            ['/admin/floor', /mặt bằng/i],
        ] as const) {
            await page.goto(path)
            await expect(page.locator('.rk-crumb')).toContainText(expected)
        }
    })
})

test.describe('Bếp', () => {
    test('huỷ một món phải nhập lý do, và lý do hiện ở cột Đã huỷ', async ({page}) => {
        // Dựng một đơn mới để chắc chắn có món đang chờ.
        const tables = await api(ACCOUNTS.waiter, '/waiter/tables')
        const free = tables.find((t: {status: string}) => t.status === 'AVAILABLE')
        const menu = await api(ACCOUNTS.waiter, '/waiter/menu')

        await api(ACCOUNTS.waiter, '/waiter/orders', {
            method: 'POST',
            body: JSON.stringify({
                tableId: free.tableId,
                items: [{dishId: menu[0].dishId, quantity: 1}],
            }),
        })

        await login(page, ACCOUNTS.chef)
        await page.goto('/chef/orders')
        await expectRendered(page)

        const ticket = page
            .locator('.rk-board__col')
            .first()
            .locator('.rk-ticket')
            .filter({hasText: free.tableNumber})
            .first()

        await ticket.locator('.rk-btn--quiet', {hasText: /chi tiết/i}).click()

        const modal = page.locator('.rk-modal')
        await expect(modal).toBeVisible()

        await modal
            .locator('button', {hasText: /huỷ món/i})
            .first()
            .click()

        const reason = 'Hết nguyên liệu hôm nay'
        await modal.locator('textarea, input[type="text"]').last().fill(reason)
        await modal.locator('.rk-btn--danger, .rk-btn--danger-solid').last().click()

        // Cột Đã huỷ phải nhận phiếu, kèm LÝ DO — huỷ mà không nói vì sao thì
        // phục vụ không có gì để báo lại khách.
        const voided = page.locator('.rk-board__col').nth(2)
        await expect(voided).toContainText(reason, {timeout: 15_000})
    })
})

test.describe('Quản trị · vòng đời món ăn', () => {
    const name = 'Món kiểm thử ' + String(Date.now()).slice(-5)

    test('thêm món mới, sửa giá, rồi xoá', async ({page}) => {
        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/dishes')
        await expectRendered(page)

        await page.locator('.rk-btn--primary', {hasText: /thêm món/i}).click()

        const modal = page.locator('.rk-modal')
        await expect(modal).toBeVisible()

        await modal.locator('#admindishespage-ten-mon-an').fill(name)
        await modal.locator('#admindishespage-gia-ban-vnd').fill('123000')
        await modal.locator('select').first().selectOption({index: 1})

        await modal.locator('.rk-btn--primary, .rk-btn--go').last().click()

        // Món mới phải có mặt ở backend.
        await expect
            .poll(
                async () => {
                    const dishes = await api(ACCOUNTS.admin, '/admin/dish/all')
                    return dishes.some((d: {name: string}) => d.name === name)
                },
                {timeout: 15_000, message: 'món mới không được lưu'},
            )
            .toBe(true)

        // Và phải tìm được trên màn.
        await page.fill('input[type="text"]', name)
        const card = page.locator('.rk-dishcard', {hasText: name})
        await expect(card).toBeVisible()

        // SỬA GIÁ — bài này mang tên "thêm, sửa giá, rồi xoá" nhưng bản đầu chỉ
        // thêm. Mỗi lần chạy để lại một "Món kiểm thử" trong thực đơn THẬT, và
        // mười hai món như vậy đã hiện trên trang chủ công khai.
        await card.getByRole('button', {name: 'Chỉnh sửa'}).click()
        await expect(modal).toBeVisible()
        await modal.locator('#admindishespage-gia-ban-vnd-2').fill('135000')
        await modal.getByRole('button', {name: /cập nhật/i}).click()

        await expect
            .poll(
                async () => {
                    const dishes = await api(ACCOUNTS.admin, '/admin/dish/all')
                    return dishes.find((d: {name: string}) => d.name === name)?.price
                },
                {timeout: 15_000, message: 'giá mới không được lưu'},
            )
            .toBe(135000)

        // Giá mới phải hiện trên thẻ theo luật tiền rút gọn.
        await expect(card).toContainText('135K')

        // XOÁ — có hỏi lại, vì xoá món là việc không lùi được.
        await card.getByRole('button', {name: 'Xoá món'}).click()
        await page.getByRole('button', {name: 'Xoá món ăn'}).click()

        await expect
            .poll(
                async () => {
                    const dishes = await api(ACCOUNTS.admin, '/admin/dish/all')
                    return dishes.some((d: {name: string}) => d.name === name)
                },
                {timeout: 15_000, message: 'món vẫn còn sau khi xoá'},
            )
            .toBe(false)

        await expect(card).toHaveCount(0)
    })

    test('bật/tắt bán một món đổi trạng thái thật', async ({page}) => {
        await login(page, ACCOUNTS.chef)
        await page.goto('/chef/dishes')
        await expectRendered(page)

        const row = page.locator('.rk-table tbody tr').first()
        const before = (await row.locator('.rk-chip').textContent())!.trim()

        // Tắt bán một món sẽ HUỶ mọi phần món đó đang chờ trong bếp, nên app
        // hỏi lại. Hộp thoại này là đúng, và chính nó là thứ đáng kiểm.
        // Hai chiều KHÔNG đối xứng, và đó là đúng: TẮT bán sẽ huỷ mọi phần
        // món đó đang chờ trong bếp nên phải hỏi lại; BẬT bán lại không phá
        // gì nên đi thẳng. Bài kiểm phải chấp nhận cả hai, nếu không nó đang
        // đòi app hỏi một câu vô nghĩa.
        const toggleOnce = async () => {
            await row.locator('.rk-btn').first().click()

            const modal = page.locator('.rk-modal')

            if (await modal.isVisible().catch(() => false)) {
                // Gọi nút theo TÊN chứ không theo class: gọi theo class thì
                // bài kiểm đỏ mỗi lần ai đó đổi biến thể nút.
                await modal
                    .getByRole('button', {name: /đặt tạm hết|mở bán|xác nhận/i})
                    .click()

                await expect(modal).toBeHidden({timeout: 15_000})
            }
        }

        await toggleOnce()

        await expect
            .poll(async () => (await row.locator('.rk-chip').textContent())!.trim(), {
                timeout: 15_000,
                message: 'trạng thái bán không đổi sau khi bấm',
            })
            .not.toBe(before)

        // Trả lại như cũ để không làm hỏng tiền đề của bài khác.
        await toggleOnce()

        await expect
            .poll(async () => (await row.locator('.rk-chip').textContent())!.trim(), {
                timeout: 15_000,
            })
            .toBe(before)
    })
})

test.describe('Hồ sơ', () => {
    test('đổi mật khẩu sai thì báo, không im lặng', async ({page}) => {
        await login(page, ACCOUNTS.waiter)
        await page.goto('/profile')
        await expectRendered(page)

        await page
            .locator('button', {hasText: /đổi mật khẩu/i})
            .first()
            .click()

        const boxes = page.locator('input[type="password"]')
        await expect(boxes.first()).toBeVisible()

        await boxes.nth(0).fill('sai-hoan-toan')
        await boxes.nth(1).fill('Moimoi@2026')

        if ((await boxes.count()) > 2) {
            await boxes.nth(2).fill('Moimoi@2026')
        }

        await page.locator('.rk-btn--primary, .rk-btn--go').last().click()

        // Lỗi phải hiện ra, và phải mang role="alert" để trình đọc màn hình
        // đọc nó ngay — một thông báo lỗi im lặng thì người dùng bàn phím
        // không bao giờ biết mình vừa gõ sai gì.
        const alert = page.getByRole('alert')
        await expect(alert).toBeVisible({timeout: 15_000})
        await expect(alert).toContainText(/mật khẩu/i)
    })
})
