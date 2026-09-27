import {chromium} from 'playwright'

const [, , user, oldPw, newPw] = process.argv

const browser = await chromium.launch({channel: 'msedge', headless: true})
const page = await browser.newPage()

page.on('console', (m) => {
    if (m.type() === 'error') console.log('  [console]', m.text().slice(0, 120))
})

await page.goto('http://localhost:5173/login', {waitUntil: 'domcontentloaded'})
await page.fill('#login-username', user)
await page.fill('#login-password', oldPw)
await page.click('button[type="submit"]')

await page.waitForURL('**/change-password', {timeout: 15000}).catch(() => {})

if (!page.url().includes('change-password')) {
    console.log(user, '— không bị bắt đổi mật khẩu, url:', page.url())
    await browser.close()
    process.exit(0)
}

const boxes = page.locator('input[type="password"]')
await boxes.nth(0).fill(oldPw)
await boxes.nth(1).fill(newPw)
await boxes.nth(2).fill(newPw)
await page.click('button[type="submit"]')

await page.waitForTimeout(2500)
console.log(user, '→ đổi xong, url:', page.url())

const err = await page
    .locator('.rk-formerror')
    .first()
    .textContent()
    .catch(() => null)
if (err) console.log('  lỗi:', err.trim())

await browser.close()
