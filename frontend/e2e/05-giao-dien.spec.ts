import {expect, test, type Page} from '@playwright/test'

import {ACCOUNTS, login} from './helpers'

/**
 * Audit giao diện theo LUẬT, chạy trên mọi màn.
 *
 * <p>Soi bằng mắt từng màn thì luôn sót — và sót đúng những thứ chỉ hiện ra ở
 * một cỡ màn, một chế độ, hoặc một trạng thái dữ liệu nhất định. Những luật
 * dưới đây máy kiểm được, nên máy kiểm.
 *
 * <p>Mọi con số tương phản ở đây được ĐO trên màn đang chạy, không đọc từ bảng
 * token: bảng token nói cặp màu mà người viết ĐỊNH ghép, còn cái tới mắt người
 * dùng là cặp mà CSS thực sự ghép.
 */

const SCREENS: {name: string; path: string; as?: string}[] = [
    {name: 'trang chủ', path: '/'},
    {name: 'đăng nhập', path: '/login'},
    {name: 'đăng ký', path: '/register'},
    {name: 'hồ sơ', path: '/profile', as: ACCOUNTS.admin},
    {name: 'tổng quan quản trị', path: '/admin/dashboard', as: ACCOUNTS.admin},
    {name: 'thống kê', path: '/admin/statistics', as: ACCOUNTS.admin},
    {name: 'hoá đơn', path: '/admin/invoices', as: ACCOUNTS.admin},
    {name: 'tổng quan thực đơn', path: '/admin/menu', as: ACCOUNTS.admin},
    {name: 'danh mục', path: '/admin/categories', as: ACCOUNTS.admin},
    {name: 'món ăn', path: '/admin/dishes', as: ACCOUNTS.admin},
    {name: 'nhân sự', path: '/admin/users', as: ACCOUNTS.admin},
    {name: 'bàn', path: '/admin/tables', as: ACCOUNTS.admin},
    {name: 'mặt bằng', path: '/admin/floor', as: ACCOUNTS.admin},
    {name: 'nhà hàng', path: '/admin/restaurant', as: ACCOUNTS.admin},
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

/** Đo tương phản của MỌI phần tử tự mang chữ. */
const CONTRAST_PROBE = `(() => {
    function parse(v) {
        const m = v.match(/rgba?\\(([^)]+)\\)/)
        if (!m) return null
        const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
        return {r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1}
    }
    function lum(c) {
        const f = (v) => { const s = v/255; return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4) }
        return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b)
    }
    function over(fg, bg) {
        if (fg.a >= 1) return fg
        return {r: fg.r*fg.a + bg.r*(1-fg.a), g: fg.g*fg.a + bg.g*(1-fg.a), b: fg.b*fg.a + bg.b*(1-fg.a), a: 1}
    }
    function ratio(a, b) {
        const la = lum(a), lb = lum(b)
        return (Math.max(la,lb)+0.05) / (Math.min(la,lb)+0.05)
    }
    function backdrop(el) {
        let n = el
        while (n) {
            const bg = parse(getComputedStyle(n).backgroundColor)
            if (bg && bg.a > 0) return bg.a >= 1 ? bg : over(bg, backdrop(n.parentElement))
            n = n.parentElement
        }
        return {r:255,g:255,b:255,a:1}
    }
    const bad = []
    const seen = new Set()
    for (const el of document.querySelectorAll('body *')) {
        const own = [...el.childNodes].filter(n => n.nodeType === 3)
            .map(n => n.textContent.trim()).join(' ').trim()
        if (!own) continue
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue
        const box = el.getBoundingClientRect()
        if (box.width === 0 || box.height === 0) continue
        const size = parseFloat(cs.fontSize)
        // Chữ cỡ 0 là chữ cố ý giấu đi cho trình đọc màn hình — không đo.
        if (size === 0) continue
        const fgRaw = parse(cs.color)
        if (!fgRaw) continue
        const bg = backdrop(el)
        const fg = over(fgRaw, bg)
        const r = ratio(fg, bg)
        const weight = Number(cs.fontWeight) || 400
        const large = size >= 24 || (size >= 18.66 && weight >= 700)
        const floor = large ? 3 : 4.5
        if (r + 0.005 < floor) {
            const key = cs.color + '|' + JSON.stringify(bg) + '|' + Math.round(size)
            if (seen.has(key)) continue
            seen.add(key)
            bad.push(Math.round(r*100)/100 + ':1 (cần ' + floor + ') · ' + Math.round(size) + 'px · '
                + cs.color + ' trên rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ') · "'
                + own.slice(0, 36) + '"')
        }
    }
    return bad
})()`

/** Phần tử bị cắt chữ: nội dung rộng hơn khung mà khung không cuộn được. */
const CLIPPED_PROBE = `(() => {
    const bad = []
    for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el)
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue
        if (cs.overflow === 'auto' || cs.overflow === 'scroll') continue
        if (cs.overflowX !== 'hidden' && cs.overflow !== 'hidden') continue
        if (cs.textOverflow === 'ellipsis') continue
        const own = [...el.childNodes].filter(n => n.nodeType === 3)
            .map(n => n.textContent.trim()).join(' ').trim()
        if (!own) continue
        if (el.scrollWidth > el.clientWidth + 2) {
            bad.push(el.className + ' · "' + own.slice(0, 40) + '" (' + el.scrollWidth + '>' + el.clientWidth + ')')
        }
    }
    return bad
})()`

/** Nhãn bấm được không bao giờ xuống hai dòng — luật đã chốt. */
const TWO_LINE_PROBE = `(() => {
    const bad = []
    for (const el of document.querySelectorAll('.rk-btn, .rk-home__cat, .rk-segment__btn, .rk-tabs__btn')) {
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || cs.visibility === 'hidden') continue
        const box = el.getBoundingClientRect()
        if (box.height === 0) continue
        const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2
        const padding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
        const borders = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
        if (box.height - padding - borders > line * 1.6) {
            bad.push((el.className || el.tagName) + ' · "' + el.textContent.trim().slice(0, 34) + '"')
        }
    }
    return bad
})()`

async function visit(
    page: Page,
    screen: (typeof SCREENS)[number],
    signedIn: string | null,
) {
    if (screen.as !== signedIn) {
        await page.goto('/')
        await page.evaluate(() => localStorage.clear())

        if (screen.as) {
            await login(page, screen.as)
        }
    }

    await page.goto(screen.path, {waitUntil: 'networkidle'})
    await page.waitForTimeout(500)

    return screen.as ?? null
}

for (const scheme of ['light', 'dark'] as const) {
    test.describe(`Tương phản · chế độ ${scheme === 'dark' ? 'tối' : 'sáng'}`, () => {
        test.use({colorScheme: scheme})

        test('mọi cặp chữ/nền trên mọi màn đều qua ngưỡng AA', async ({page}) => {
            const problems: string[] = []
            let signedIn: string | null = null

            for (const screen of SCREENS) {
                signedIn = await visit(page, screen, signedIn)

                const bad = (await page.evaluate(CONTRAST_PROBE)) as string[]

                for (const line of bad) {
                    problems.push(`${screen.name}: ${line}`)
                }
            }

            expect(problems, problems.join('\n')).toHaveLength(0)
        })
    })
}

test.describe('Bố cục', () => {
    test('không màn nào tràn ngang ở 320px', async ({page}) => {
        await page.setViewportSize({width: 320, height: 800})

        const problems: string[] = []
        let signedIn: string | null = null

        for (const screen of SCREENS) {
            signedIn = await visit(page, screen, signedIn)

            const overflow = await page.evaluate(
                () =>
                    document.documentElement.scrollWidth -
                    document.documentElement.clientWidth,
            )

            if (overflow > 1) {
                problems.push(`${screen.name}: tràn ${overflow}px`)
            }
        }

        expect(problems, problems.join('\n')).toHaveLength(0)
    })

    test('không nhãn bấm được nào xuống hai dòng', async ({page}) => {
        const problems: string[] = []
        let signedIn: string | null = null

        for (const screen of SCREENS) {
            signedIn = await visit(page, screen, signedIn)

            const bad = (await page.evaluate(TWO_LINE_PROBE)) as string[]

            for (const line of bad) {
                problems.push(`${screen.name}: ${line}`)
            }
        }

        expect(problems, problems.join('\n')).toHaveLength(0)
    })

    test('không chữ nào bị cắt cụt trong khung không cuộn được', async ({page}) => {
        const problems: string[] = []
        let signedIn: string | null = null

        for (const screen of SCREENS) {
            signedIn = await visit(page, screen, signedIn)

            const bad = (await page.evaluate(CLIPPED_PROBE)) as string[]

            for (const line of bad) {
                problems.push(`${screen.name}: ${line}`)
            }
        }

        expect(problems, problems.join('\n')).toHaveLength(0)
    })
})
