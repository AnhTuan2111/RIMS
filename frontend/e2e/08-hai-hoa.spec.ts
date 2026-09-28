import {expect, test, type Page} from '@playwright/test'

import {ACCOUNTS, login} from './helpers'

/**
 * Hài hoà: bố cục không vỡ, màu đúng bảng, dấu đúng nghĩa.
 *
 * <p>Ba bài dưới đây là ba bộ dò đã tìm ra lỗi thật trên app — mỗi lỗi chỉ
 * hiện ở một khổ màn hay một tình huống dữ liệu mà các bài cũ không nhìn tới:
 * tên món bị bẻ từng chữ cái ở 375px, chip "chờ" mang dấu ✕ của "đã huỷ", ô số
 * 0 tô màu báo động.
 */

const SCREENS: {name: string; path: string; as?: string}[] = [
    {name: 'trang chủ', path: '/'},
    {name: 'đăng nhập', path: '/login'},
    {name: 'hồ sơ', path: '/profile', as: ACCOUNTS.admin},
    {name: 'tổng quan', path: '/admin/dashboard', as: ACCOUNTS.admin},
    {name: 'thống kê', path: '/admin/statistics', as: ACCOUNTS.admin},
    {name: 'hoá đơn', path: '/admin/invoices', as: ACCOUNTS.admin},
    {name: 'tổng quan thực đơn', path: '/admin/menu', as: ACCOUNTS.admin},
    {name: 'danh mục', path: '/admin/categories', as: ACCOUNTS.admin},
    {name: 'món ăn', path: '/admin/dishes', as: ACCOUNTS.admin},
    {name: 'nhân sự', path: '/admin/users', as: ACCOUNTS.admin},
    {name: 'bàn', path: '/admin/tables', as: ACCOUNTS.admin},
    {name: 'mặt bằng', path: '/admin/floor', as: ACCOUNTS.admin},
    {name: 'tổng quan bếp', path: '/chef/dashboard', as: ACCOUNTS.chef},
    {name: 'cần chế biến', path: '/chef/orders', as: ACCOUNTS.chef},
    {name: 'gom món', path: '/chef/grouped-orders', as: ACCOUNTS.chef},
    {name: 'món ăn của bếp', path: '/chef/dishes', as: ACCOUNTS.chef},
    {name: 'đã xong', path: '/chef/completed-orders', as: ACCOUNTS.chef},
    {name: 'đã huỷ', path: '/chef/cancelled-orders', as: ACCOUNTS.chef},
    {name: 'sơ đồ bàn', path: '/waiter/tables', as: ACCOUNTS.waiter},
    {name: 'đặt bàn', path: '/waiter/reservations', as: ACCOUNTS.waiter},
    {name: 'thanh toán', path: '/cashier/payments', as: ACCOUNTS.cashier},
    {name: 'hoá đơn thu ngân', path: '/cashier/invoices', as: ACCOUNTS.cashier},
    {name: 'khách đặt bàn', path: '/customer/reservations', as: ACCOUNTS.customer},
]

async function eachScreen(page: Page, check: (name: string) => Promise<string[]>) {
    const problems: string[] = []
    let signedIn: string | null = null

    for (const screen of SCREENS) {
        if (screen.as !== signedIn) {
            await page.goto('/')
            await page.evaluate(() => localStorage.clear())
            if (screen.as) {
                await login(page, screen.as)
            }
            signedIn = screen.as ?? null
        }

        await page.goto(screen.path, {waitUntil: 'networkidle'})
        await page.waitForTimeout(300)

        for (const line of await check(screen.name)) {
            problems.push(`${screen.name}: ${line}`)
        }
    }

    return problems
}

/** Phần tử lòi khỏi hộp chứa, và chữ bị bẻ giữa từ. */
async function findBreaks(page: Page) {
    return page.evaluate(() => {
        const out: string[] = []
        const isBox = (el: Element) => {
            const cs = getComputedStyle(el)
            return (
                parseFloat(cs.borderLeftWidth) > 0 ||
                cs.backgroundColor !== 'rgba(0, 0, 0, 0)'
            )
        }
        const scrolls = (el: Element) =>
            /(auto|scroll|hidden|clip)/.test(getComputedStyle(el).overflowX)
        const nameOf = (el: Element) =>
            (el.className && el.className.toString().split(' ')[0]) ||
            el.tagName.toLowerCase()

        for (const el of document.querySelectorAll('body *')) {
            if (el.closest('svg, .rk-ticker, [class*="strip"]')) continue
            const b = el.getBoundingClientRect()
            if (b.width === 0 || b.height === 0) continue

            let box: Element | null = el.parentElement
            while (box && box !== document.body && !isBox(box)) {
                if (scrolls(box)) {
                    box = null
                    break
                }
                box = box.parentElement
            }

            if (box && box !== document.body && !scrolls(box)) {
                const bb = box.getBoundingClientRect()
                const over = Math.max(b.right - bb.right, bb.left - b.left)
                const pos = getComputedStyle(el).position
                if (over > 3 && pos !== 'absolute' && pos !== 'fixed') {
                    out.push(
                        `lòi ${Math.round(over)}px: ${nameOf(el)} khỏi ${nameOf(box)}`,
                    )
                }
            }
        }

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        while (walker.nextNode()) {
            const node = walker.currentNode
            const text = (node.textContent ?? '').trim()
            // Email, đường dẫn: chuỗi không dấu cách thì buộc phải ngắt.
            if (text.length < 4 || /[@/]/.test(text)) continue
            const el = node.parentElement
            if (
                !el ||
                el.closest('svg, .rk-ticker') ||
                el.getBoundingClientRect().width === 0
            )
                continue
            const range = document.createRange()
            range.selectNodeContents(node)
            const lines = new Set(
                [...range.getClientRects()].map((r) => Math.round(r.top / 4)),
            ).size
            if (lines > text.split(/\s+/).length) {
                out.push(`chữ bẻ giữa từ: «${text.slice(0, 24)}»`)
            }
        }

        return [...new Set(out)]
    })
}

for (const width of [375, 768]) {
    test(`không phần tử nào lòi khỏi hộp, không chữ nào bẻ giữa từ — ${width}px`, async ({
        page,
    }) => {
        test.setTimeout(180_000)
        await page.setViewportSize({width, height: 900})

        const problems = await eachScreen(page, () => findBreaks(page))

        expect(problems, problems.join('\n')).toHaveLength(0)
    })
}

for (const scheme of ['light', 'dark'] as const) {
    test.describe(`Bảng màu · ${scheme === 'dark' ? 'tối' : 'sáng'}`, () => {
        test.use({colorScheme: scheme})

        test('mọi màu chữ, nền, viền trên màn đều lấy từ token', async ({page}) => {
            test.setTimeout(180_000)

            const problems = await eachScreen(page, () =>
                page.evaluate(() => {
                    const probe = document.createElement('div')
                    document.body.appendChild(probe)
                    const rootCs = getComputedStyle(document.documentElement)
                    const norm = (c: string) => {
                        const m = c.match(/rgba?\(([^)]+)\)/)
                        if (!m) return null
                        return m[1]
                            .split(/[ ,/]+/)
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((v) => Math.round(Number(v)))
                            .join(',')
                    }
                    // Màu cố ý ngoài token: trắng/đen tuyệt đối, chữ tiêu đề
                    // trang chủ giữ sáng ở cả hai chế độ, nút VNPay theo màu
                    // thương hiệu của đối tác.
                    const palette = new Set([
                        '0,0,0',
                        '255,255,255',
                        '243,241,234',
                        '0,91,170',
                        '242,247,251',
                        '0,73,138',
                    ])
                    for (const sheet of document.styleSheets) {
                        let rules: CSSRuleList
                        try {
                            rules = sheet.cssRules
                        } catch {
                            continue
                        }
                        for (const rule of rules) {
                            const style = (rule as CSSStyleRule).style
                            if (!style) continue
                            for (const prop of style) {
                                if (!prop.startsWith('--rims-')) continue
                                const v = rootCs.getPropertyValue(prop).trim()
                                if (/^\d+\s+\d+\s+\d+$/.test(v))
                                    palette.add(v.split(/\s+/).join(','))
                                probe.style.color = ''
                                probe.style.color = v
                                const c =
                                    probe.style.color &&
                                    norm(getComputedStyle(probe).color)
                                if (c) palette.add(c)
                            }
                        }
                    }
                    probe.remove()

                    const out: string[] = []
                    for (const el of document.querySelectorAll('body *')) {
                        if (el.closest('svg') || el.tagName === 'IMG') continue
                        if (el.getBoundingClientRect().width === 0) continue
                        const cs = getComputedStyle(el)
                        const checks: [string, string][] = []
                        if (
                            [...el.childNodes].some(
                                (n) => n.nodeType === 3 && n.textContent?.trim(),
                            )
                        ) {
                            checks.push(['chữ', cs.color])
                        }
                        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)')
                            checks.push(['nền', cs.backgroundColor])
                        if (
                            parseFloat(cs.borderTopWidth) > 0 &&
                            cs.borderTopStyle !== 'none'
                        ) {
                            checks.push(['viền', cs.borderTopColor])
                        }
                        for (const [kind, value] of checks) {
                            const c = norm(value)
                            if (c && !palette.has(c)) out.push(`${kind} ${value}`)
                        }
                    }
                    return [...new Set(out)]
                }),
            )

            expect(problems, problems.join('\n')).toHaveLength(0)
        })
    })
}

test('mọi chip mang dấu đúng NGHĨA, không theo màu', async ({page}) => {
    // Bảng dấu đã chốt (quyết định S2): ▫ rỗng · ▸ đang chạy / chờ · ▪ đã giữ ·
    // ✓ đã xong · ✕ đã huỷ · ‖ tạm dừng / đã ẩn. Dấu từng gắn cứng vào MÀU,
    // nên chọn đỏ vì "gấp" là mang luôn ✕ — "✕ CHỜ 5 GIỜ" đọc ra thành đã huỷ.
    test.setTimeout(180_000)

    const rules: [RegExp, string][] = [
        [/đã huỷ|lỗi/i, '✕'],
        [/hoàn thành|đã trả|đã thanh toán/i, '✓'],
        [/tạm hết|tạm ngưng|tạm dừng|đã ẩn|đã khoá|đã cất|hết hàng/i, '‖'],
        [/bàn trống/i, '▫'],
        [/đặt trước|lượt/i, '▪'],
        [/đang|chờ|chưa có bàn/i, '▸'],
    ]

    const problems = await eachScreen(page, async () => {
        const chips = await page.evaluate(() =>
            [...document.querySelectorAll('.rk-chip')]
                .filter((c) => c.getBoundingClientRect().width > 0)
                .map((c) => ({
                    text: (c.textContent ?? '').trim(),
                    mark: getComputedStyle(c, '::before').content.replace(/"/g, ''),
                })),
        )

        const out: string[] = []
        for (const chip of chips) {
            if (/tiền mặt|mã qr|chuyển khoản/i.test(chip.text)) {
                out.push(
                    `«${chip.text}» là phương thức, không phải trạng thái — dùng nhãn trung tính`,
                )
                continue
            }
            const rule = rules.find(([pattern]) => pattern.test(chip.text))
            if (rule && chip.mark !== rule[1]) {
                out.push(
                    `«${chip.text}» mang ${chip.mark}, đúng nghĩa phải là ${rule[1]}`,
                )
            }
        }
        return [...new Set(out)]
    })

    expect(problems, problems.join('\n')).toHaveLength(0)
})
