/**
 * Dựng ảnh banner cho README từ docs/img/banner.html.
 *
 * <p>Banner phải GIỐNG app chứ không na ná: file nguồn dùng đúng token màu và
 * bộ font trong src/styles/tokens.css. Chụp bằng trình duyệt thật nên chữ,
 * bóng đổ và viền ra đúng như khi chạy.
 *
 * Dùng: node tools/banner.mjs
 */
import {chromium} from 'playwright'
import {pathToFileURL} from 'node:url'
import {resolve} from 'node:path'

const NGUON = resolve(process.cwd(), '..', 'docs', 'img', 'banner.html')
const RA = resolve(process.cwd(), '..', 'docs', 'img', 'banner.png')

const browser = await chromium.launch({channel: 'msedge', headless: true})
const page = await browser.newPage({
    viewport: {width: 1280, height: 360},
    // Gấp đôi mật độ điểm ảnh: README hiển thị ở khoảng 880px, để 1x thì chữ rỗ.
    deviceScaleFactor: 2,
})
await page.goto(pathToFileURL(NGUON).href, {waitUntil: 'networkidle'})
// Chờ font web tải xong, nếu không banner chụp bằng font dự phòng của hệ.
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
await page.screenshot({path: RA})
await browser.close()
console.log('đã dựng', RA)
