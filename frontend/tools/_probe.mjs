import {chromium} from 'playwright'

const PW = 'Rims@2026'
const browser = await chromium.launch({channel: 'msedge', headless: true})
const page = await browser.newPage({viewport: {width: 1440, height: 900}})

async function login(user) {
    await page.goto('http://localhost:5173/login')
    await page.fill('#login-username', user)
    await page.fill('#login-password', PW)
    await page.click('button[type="submit"]')
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), {timeout: 15000})
}

// --- 1 · mặt bằng: phím mũi tên có dời bàn không ---
await login('admin')
await page.goto('http://localhost:5173/admin/floor', {waitUntil: 'networkidle'})
await page.waitForTimeout(800)

const tile = page.locator('.rk-planbtn').first()
const slot = page.locator('.rk-floor__slot').first()

const boxes = await page.locator('.rk-floor__slot').evaluateAll((els) =>
    els.slice(0, 6).map((el) => {
        const b = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return {
            ten: el.textContent.trim().slice(0, 4),
            x: Math.round(b.x), y: Math.round(b.y),
            w: Math.round(b.width), h: Math.round(b.height),
            col: cs.gridColumnStart, row: cs.gridRowStart,
        }
    }),
)
console.log('HỘP BAO')
for (const b of boxes) console.log(' ', JSON.stringify(b))

const before = await slot.evaluate((el) => getComputedStyle(el).gridColumnStart)
await tile.click({force: true})
await tile.focus()

const focused = await page.evaluate(() => document.activeElement?.className ?? '(không có)')
await tile.press('ArrowRight')
await page.waitForTimeout(300)

const after = await slot.evaluate((el) => getComputedStyle(el).gridColumnStart)
const saveState = await page
    .locator('.rk-btn--go')
    .first()
    .evaluate((el) => ({text: el.textContent.trim(), disabled: el.disabled}))

console.log('MẶT BẰNG')
console.log('  focus đang ở:', focused)
console.log('  cột trước:', before, '· sau:', after)
console.log('  nút lưu:', JSON.stringify(saveState))

// --- 2 · bếp: đầu cột Đã xong ghi số gì ---
await page.goto('http://localhost:5173/')
await page.evaluate(() => localStorage.clear())
await login('chef01')
await page.goto('http://localhost:5173/chef/orders', {waitUntil: 'networkidle'})
await page.waitForTimeout(800)

const counts = await page.locator('.rk-board__count').allTextContents()
const items = await page.locator('.rk-board__col').nth(1).locator('.rk-ticket').count()

console.log('BẾP')
console.log('  ba số đầu cột:', counts.map((c) => c.trim()).join(' · '))
console.log('  số phiếu thật đang hiện ở cột Đã xong:', items)

await browser.close()
