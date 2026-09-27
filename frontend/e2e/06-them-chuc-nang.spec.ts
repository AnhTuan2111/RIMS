import {expect, test} from '@playwright/test'

import {ACCOUNTS, PW, api, expectRendered, login} from './helpers'

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

test.describe('Phục vụ · gọi lại món bếp đã huỷ', () => {
    // Lỗi mất món: món bị bếp huỷ nạp vào màn Sửa đơn với số lượng GỐC, nên
    // bấm + tăng số lượng trên CHÍNH DÒNG ĐÃ HUỶ. Backend đổi con số nhưng
    // dòng vẫn huỷ — phục vụ thấy "gửi thành công", bếp không bao giờ thấy món.
    let tableId: number
    let tableNumber: string
    let dish: {dishId: number; name: string}
    let cancelledItemId: number
    let orderId: number

    test.beforeAll(async () => {
        const tables = await api(ACCOUNTS.waiter, '/waiter/tables')
        const free = tables.find((t: {status: string}) => t.status === 'AVAILABLE')
        expect(free, 'không còn bàn trống nào để kiểm').toBeTruthy()
        tableId = free.tableId
        tableNumber = free.tableNumber

        const menu = await api(ACCOUNTS.waiter, '/waiter/menu')
        dish = menu.find((d: {available: boolean}) => d.available)

        // Gọi hai món: một món để bếp huỷ, một món giữ cho bàn còn phục vụ.
        const other = menu.find(
            (d: {available: boolean; dishId: number}) =>
                d.available && d.dishId !== dish.dishId,
        )
        await api(ACCOUNTS.waiter, '/waiter/orders', {
            method: 'POST',
            body: JSON.stringify({
                tableId,
                items: [
                    {dishId: dish.dishId, quantity: 1},
                    {dishId: other.dishId, quantity: 1},
                ],
            }),
        })

        const queue = await api(ACCOUNTS.chef, '/chef/orders')
        const line = queue.find(
            (item: {tableNumber: string; dishName: string}) =>
                item.tableNumber === tableNumber && item.dishName === dish.name,
        )
        cancelledItemId = line.orderItemId
        orderId = line.orderId

        await api(ACCOUNTS.chef, `/chef/orders/${cancelledItemId}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({reason: 'Hết nguyên liệu'}),
        })
    })

    test('món đã huỷ không hiện như đang gọi, và bấm + gọi lại thành món mới', async ({
        page,
    }) => {
        await login(page, ACCOUNTS.waiter)
        await page.goto(`/waiter/tables/${tableId}/order/edit`)
        await expectRendered(page)

        const card = page.locator('.rk-menucard', {
            has: page.locator('.rk-menucard__name', {hasText: dish.name}),
        })
        await expect(card).toContainText(/đã huỷ/i)

        // Bàn không nhận món này: không viền "đã gọi", không số phần trên ảnh.
        await expect(card).not.toHaveClass(/is-picked/)
        await expect(card.locator('.rk-menucard__count')).toHaveCount(0)

        await card.getByRole('button', {name: 'Thêm một phần ' + dish.name}).click()

        // Giỏ phải nói đây là MÓN MỚI, không phải "gọi thêm" trên dòng cũ.
        const cart = page.locator('.rk-cart')
        await expect(cart).toContainText(dish.name)
        await expect(cart).toContainText(/món mới/i)

        await cart.getByRole('button', {name: /gửi cập nhật/i}).click()
        await page
            .locator('.rk-modal')
            .getByRole('button', {name: /gửi cập nhật/i})
            .click()

        // Bếp phải thấy món đó — đây mới là điều duy nhất quan trọng.
        await expect
            .poll(
                async () => {
                    const queue = await api(ACCOUNTS.chef, '/chef/orders')
                    return queue.some(
                        (item: {
                            tableNumber: string
                            dishName: string
                            orderItemId: number
                        }) =>
                            item.tableNumber === tableNumber &&
                            item.dishName === dish.name &&
                            item.orderItemId !== cancelledItemId,
                    )
                },
                {timeout: 15_000, message: 'bếp không nhận được món gọi lại'},
            )
            .toBe(true)
    })

    test('backend từ chối sửa số lượng trên dòng đã huỷ', async () => {
        const base = process.env.E2E_API ?? 'http://localhost:8080/rims'
        const auth = await fetch(`${base}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: ACCOUNTS.waiter, rawPassword: PW}),
        })
        const {accessToken} = await auth.json()

        const res = await fetch(`${base}/waiter/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                items: [{orderItemId: cancelledItemId, dishId: dish.dishId, quantity: 2}],
            }),
        })

        expect(res.status).toBeGreaterThanOrEqual(400)
        expect(res.status).toBeLessThan(500)
        expect(await res.text()).toMatch(/đã bị huỷ/)
    })
})

test.describe('Thu ngân · bàn chưa thu được', () => {
    // Hai tình huống từng trông y hệt nhau ở quầy — "0 ₫" và nút Thanh toán bấm
    // được — dù một bên phải CHỜ bếp, một bên chỉ cần ĐÓNG BÀN.

    async function openOrder(dishCount: number) {
        const tables = await api(ACCOUNTS.waiter, '/waiter/tables')
        const free = tables.find((t: {status: string}) => t.status === 'AVAILABLE')
        expect(free, 'không còn bàn trống nào để kiểm').toBeTruthy()

        const menu = await api(ACCOUNTS.waiter, '/waiter/menu')
        const dishes = menu
            .filter((d: {available: boolean}) => d.available)
            .slice(0, dishCount)

        await api(ACCOUNTS.waiter, '/waiter/orders', {
            method: 'POST',
            body: JSON.stringify({
                tableId: free.tableId,
                items: dishes.map((d: {dishId: number}) => ({
                    dishId: d.dishId,
                    quantity: 1,
                })),
            }),
        })

        const queue = await api(ACCOUNTS.chef, '/chef/orders')
        const lines = queue.filter(
            (item: {tableNumber: string}) => item.tableNumber === free.tableNumber,
        )

        return {table: free, lines, dishes}
    }

    test('còn món đang nấu: nêu tên món và khoá nút thu tiền', async ({page}) => {
        const {table, dishes} = await openOrder(1)

        await login(page, ACCOUNTS.cashier)
        await page.goto('/cashier/payments')
        await expectRendered(page)
        await page.locator('.rk-tablecard', {hasText: table.tableNumber}).first().click()

        await expect(
            page.getByRole('status').filter({hasText: /đang nấu/i}),
        ).toContainText(dishes[0].name)
        await expect(page.getByRole('button', {name: 'Thanh toán'})).toBeDisabled()
    })

    test('mọi món đã bị huỷ: nút là "Đóng bàn", bấm thì trả bàn về trống', async ({
        page,
    }) => {
        const {table, lines} = await openOrder(1)

        for (const line of lines) {
            await api(ACCOUNTS.chef, `/chef/orders/${line.orderItemId}/cancel`, {
                method: 'PUT',
                body: JSON.stringify({reason: 'Hết nguyên liệu'}),
            })
        }

        await login(page, ACCOUNTS.cashier)
        await page.goto('/cashier/payments')
        await expectRendered(page)
        await page.locator('.rk-tablecard', {hasText: table.tableNumber}).first().click()

        await expect(page.getByText(/đã bị bếp huỷ/i)).toBeVisible()
        await page.getByRole('button', {name: 'Đóng bàn'}).click()

        // Không được mở hộp thanh toán cho một đơn đã đóng.
        await expect(page.locator('.rk-modal')).toHaveCount(0)
        await expect(page.locator('.rk-toast')).toContainText(/đã đóng bàn/i)

        await expect
            .poll(
                async () => {
                    const tables = await api(ACCOUNTS.waiter, '/waiter/tables')
                    return tables.find(
                        (t: {tableId: number}) => t.tableId === table.tableId,
                    )?.status
                },
                {timeout: 15_000, message: 'bàn không trở về trống'},
            )
            .toBe('AVAILABLE')
    })
})
