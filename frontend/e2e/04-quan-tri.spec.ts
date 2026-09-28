import {expect, test} from '@playwright/test'

import {ACCOUNTS, PW, api, expectRendered, login} from './helpers'

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

test.describe('Quản trị · vòng đời bàn', () => {
    const number = 'KT' + String(Date.now()).slice(-4)

    test('thêm bàn, sửa số chỗ, phục vụ thấy bàn mới, rồi xoá', async ({page}) => {
        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/tables')
        await expectRendered(page)

        // THÊM
        await page
            .getByRole('button', {name: /thêm bàn/i})
            .first()
            .click()
        const modal = page.locator('.rk-modal')
        await expect(modal).toBeVisible()
        await modal.locator('#table-number').fill(number)
        await modal.locator('#table-capacity').fill('4')
        await modal.getByRole('button', {name: 'Lưu'}).click()
        await expect(modal).toHaveCount(0)

        const find = async () => {
            const tables = await api(ACCOUNTS.admin, '/admin/table/all')
            return tables.find((t: {tableNumber: string}) => t.tableNumber === number)
        }

        await expect.poll(async () => (await find())?.capacity, {timeout: 15_000}).toBe(4)

        // Bàn mới chưa có chỗ trên mặt bằng — phục vụ vẫn phải thấy nó, ở
        // hàng "Chưa xếp vào mặt bằng", không được biến mất.
        const waiterTables = await api(ACCOUNTS.waiter, '/waiter/tables')
        expect(
            waiterTables.some((t: {tableNumber: string}) => t.tableNumber === number),
            'phục vụ không thấy bàn mới',
        ).toBe(true)

        // Bảng có phân trang: bàn mới nằm ở trang cuối.
        const row = page.locator('tbody tr', {hasText: number})
        for (let i = 0; i < 5 && (await row.count()) === 0; i++) {
            await page.getByRole('button', {name: 'Trang sau'}).click()
        }
        await expect(row).toBeVisible()

        // SỬA
        await row.getByRole('button', {name: 'Sửa bàn'}).click()
        await expect(modal).toBeVisible()
        await modal.locator('#table-capacity').fill('6')
        await modal.getByRole('button', {name: 'Lưu'}).click()
        await expect.poll(async () => (await find())?.capacity, {timeout: 15_000}).toBe(6)
        await expect(row).toContainText('6')

        // XOÁ — bàn chưa từng có đơn thì xoá hẳn được, và phải hỏi lại.
        await row.getByRole('button', {name: 'Xoá bàn'}).click()
        await page.getByRole('button', {name: 'Xoá vĩnh viễn'}).click()
        await expect.poll(async () => await find(), {timeout: 15_000}).toBeUndefined()
    })
})

test.describe('Quản trị · tài khoản', () => {
    // Không có xoá tài khoản, nên bài kiểm KHÔNG tạo nhân viên mới — mỗi lần
    // chạy sẽ để lại một người lạ trong danh sách nhân sự thật. Thay vào đó:
    // đi hết biểu mẫu tạo với một tên đã có (backend phải từ chối), và khoá /
    // mở khoá một tài khoản có sẵn rồi trả nó về như cũ.

    test('tạo tài khoản trùng tên đăng nhập thì bị từ chối, và báo rõ', async ({
        page,
    }) => {
        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/users')
        await expectRendered(page)

        await page.getByRole('button', {name: /thêm nhân viên/i}).click()
        const modal = page.locator('.rk-modal')
        await modal.getByLabel(/họ tên/i).fill('Người kiểm thử')
        await modal.getByLabel(/tên đăng nhập/i).fill(ACCOUNTS.waiter)
        await modal.getByLabel(/email/i).fill('kiemthu.trung@example.com')
        await modal.getByLabel(/số điện thoại/i).fill('0900000001')
        await modal
            .getByLabel(/mật khẩu/i)
            .first()
            .fill('Rims@2026')
        await modal.getByRole('button', {name: /tạo tài khoản/i}).click()

        await expect(modal.locator('.rk-formerror')).toBeVisible({timeout: 15_000})
        await expect(modal).toBeVisible()

        const staff = await api(ACCOUNTS.admin, '/admin/user/staff?page=0&size=100')
        const list = staff.content ?? staff
        expect(
            list.filter((u: {username: string}) => u.username === ACCOUNTS.waiter),
            'tài khoản trùng đã bị tạo',
        ).toHaveLength(1)
    })

    test('khoá tài khoản phải hỏi lại; khoá rồi thì không đăng nhập được', async ({
        page,
    }) => {
        const target = 'waiter02'

        await login(page, ACCOUNTS.admin)
        await page.goto('/admin/users')
        await expectRendered(page)

        const chip = page.getByRole('button', {
            name: `Hoạt động — khoá tài khoản ${target}`,
        })
        await chip.click()

        // Hỏi lại — huỷ thì không có gì thay đổi.
        const dialog = page.getByRole('dialog')
        await expect(dialog).toContainText(target)
        await dialog
            .getByRole('button', {name: /huỷ|quay lại|không/i})
            .first()
            .click()
        await expect(chip).toBeVisible()

        try {
            await chip.click()
            await dialog
                .getByRole('button', {name: 'Khoá tài khoản', exact: true})
                .click()
            await expect(
                page.getByRole('button', {name: `Đã khoá — mở khoá tài khoản ${target}`}),
            ).toBeVisible()

            // Khoá thật ở backend: đăng nhập phải bị từ chối. Chờ bằng poll —
            // màn đổi trạng thái NGAY rồi mới gọi API, nên hỏi ngay lập tức là
            // đua với chính request khoá.
            const base = process.env.E2E_API ?? 'http://localhost:8080/rims'
            await expect
                .poll(
                    async () =>
                        (
                            await fetch(`${base}/auth/login`, {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({username: target, rawPassword: PW}),
                            })
                        ).ok,
                    {timeout: 10_000, message: 'tài khoản đã khoá vẫn đăng nhập được'},
                )
                .toBe(false)
        } finally {
            // Mở khoá — không hỏi lại, và trả tài khoản về như cũ.
            const unlock = page.getByRole('button', {
                name: `Đã khoá — mở khoá tài khoản ${target}`,
            })
            if (await unlock.isVisible()) {
                await unlock.click()
            }
            await expect(chip).toBeVisible()
        }
    })
})
