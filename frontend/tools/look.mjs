/**
 * Mở một màn thật bằng Playwright và chụp lại — kể cả trạng thái hover.
 *
 * Dùng:
 *   node tools/look.mjs <đường-dẫn> [vai] [sáng|tối] [rộng] [#selector-hover]
 *
 * Ví dụ:
 *   node tools/look.mjs /                       công khai, sáng, 1440
 *   node tools/look.mjs /chef/orders chef01 tối 1440
 *   node tools/look.mjs /admin/dishes admin sáng 1440 ".rk-btn--primary"
 */

import {chromium} from 'playwright'
import {mkdirSync} from 'node:fs'
import {join} from 'node:path'

const [, , path = '/', who = '', scheme = 'sáng', widthArg = '1440', hover = ''] =
    process.argv

/**
 * Cuộn hết trang rồi về đầu, để ảnh tải lười (loading="lazy") kịp tải.
 *
 * <p>Chụp cả trang mà không cuộn thì mọi ảnh dưới màn đầu tiên hiện thành ô
 * xám trống — trông y hệt ảnh hỏng, và đã có lúc bị đọc nhầm là lỗi app.
 */
async function loadLazyImages(page) {
    await page.evaluate(async () => {
        const step = window.innerHeight
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            window.scrollTo(0, y)
            await new Promise((resolve) => setTimeout(resolve, 120))
        }
        // Chờ mọi ảnh ĐÃ BẮT ĐẦU tải xong, tối đa 5 giây. networkidle thôi
        // chưa đủ: ảnh tải xong vẫn còn phải giải mã mới vẽ lên được.
        const pending = [...document.images].filter(
            (img) => img.loading !== 'lazy' || img.getBoundingClientRect().top < 1e6,
        )
        await Promise.race([
            Promise.all(pending.map((img) => img.decode().catch(() => {}))),
            new Promise((resolve) => setTimeout(resolve, 5000)),
        ])
        window.scrollTo(0, 0)
    })
    await page.waitForLoadState('networkidle').catch(() => {})
}

const width = Number(widthArg)
const OUT = join(process.cwd(), 'tools', 'look')
mkdirSync(OUT, {recursive: true})

const browser = await chromium.launch({channel: 'msedge', headless: true})

const context = await browser.newContext({
    viewport: {width, height: 900},
    colorScheme: scheme === 'tối' ? 'dark' : 'light',
    locale: 'vi-VN',
    deviceScaleFactor: 1,
})

const page = await context.newPage()

page.on('console', (msg) => {
    if (msg.type() === 'error') {
        console.log('  [lỗi console]', msg.text().slice(0, 160))
    }
})

page.on('pageerror', (err) => console.log('  [lỗi trang]', String(err).slice(0, 160)))

// Đăng nhập THẬT qua biểu mẫu, không gieo token: đây là backend thật, và một
// token bịa sẽ bị chặn ở request đầu tiên.
if (who) {
    await page.goto('http://localhost:5173/login', {waitUntil: 'domcontentloaded'})
    await page.fill('#login-username', who)
    await page.fill('#login-password', process.env.RIMS_PW || '123456')
    await page.click('button[type="submit"]')
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), {timeout: 15000})
}

await page.goto('http://localhost:5173' + path, {waitUntil: 'networkidle'})
await page.waitForTimeout(900)

let name = (path.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'root') + '__' + scheme

if (hover) {
    const target = page.locator(hover).first()
    await target.scrollIntoViewIfNeeded().catch(() => {})
    await target
        .hover({timeout: 5000})
        .catch(() => console.log('  (không rê được vào', hover, ')'))
    await page.waitForTimeout(300)
    name += '__hover'
}

const file = join(OUT, `${name}__${width}.png`)
if (!hover) {
    await loadLazyImages(page)
}

await page.screenshot({path: file, fullPage: !hover})

console.log('ảnh:', file)

await browser.close()
