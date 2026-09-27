/**
 * Render walk — chụp từng màn để đối chiếu với hệ thiết kế.
 *
 * Build xanh không có nghĩa là màn đúng. Công cụ này mở từng đường dẫn trong
 * bản build tĩnh, chụp ở cỡ màn và chế độ sáng/tối yêu cầu, rồi ghi ra PNG để
 * soi bằng mắt.
 *
 * VÌ SAO KHÔNG DÙNG CỜ --screenshot CỦA EDGE: cờ đó chụp được một hai lần rồi
 * treo, không thoát, không báo lỗi. Nó không có cách nào biết trang đã vẽ xong
 * hay chưa. Ở đây nói chuyện thẳng với trình duyệt qua CDP nên chờ đúng sự kiện
 * và đóng đúng lúc.
 *
 * VÌ SAO KHÔNG DÙNG DEV SERVER: websocket HMR giữ kết nối mở nên trang không
 * bao giờ "xong". Luôn chụp từ `vite preview`.
 *
 * Dùng:
 *   npm run build && npx vite preview --port 4200 --strictPort &
 *   node tools/render-walk.mjs                     # mọi màn công khai, cả hai chế độ
 *   node tools/render-walk.mjs --only=/login       # một đường dẫn
 *   node tools/render-walk.mjs --width=320         # một cỡ màn
 */

import {mkdirSync, writeFileSync, rmSync, existsSync} from 'node:fs'
import {spawn} from 'node:child_process'
import {join} from 'node:path'
import {tmpdir} from 'node:os'

const BASE = process.env.WALK_BASE ?? 'http://localhost:4200'
const OUT = process.env.WALK_OUT ?? join(process.cwd(), 'tools', 'shots')
const PORT = 9223

const EDGE_CANDIDATES = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]

/** Đường dẫn không cần đăng nhập. Màn sau đăng nhập cần thêm token, xem --token. */
const PUBLIC_ROUTES = [
    {path: '/', name: 'trang-chu'},
    {path: '/login', name: 'dang-nhap'},
    {path: '/register', name: 'dang-ky'},
    {path: '/forgot-password', name: 'quen-mat-khau'},
]

const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const [k, v] = a.replace(/^--/, '').split('=')
        return [k, v ?? true]
    }),
)

const WIDTHS = args.width
    ? [Number(args.width)]
    : [1440, 768, 375]
const SCHEMES = args.scheme ? [args.scheme] : ['light', 'dark']
const ROUTES = args.only
    ? [{path: String(args.only), name: String(args.only).replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'root'}]
    : PUBLIC_ROUTES

function findBrowser() {
    return EDGE_CANDIDATES.find((candidate) => existsSync(candidate)) ?? null
}

async function waitForDevtools() {
    for (let i = 0; i < 60; i++) {
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
            if (res.ok) return (await res.json()).webSocketDebuggerUrl
        } catch {
            /* chưa lên, thử lại */
        }
        await new Promise((r) => setTimeout(r, 250))
    }
    throw new Error('Trình duyệt không mở cổng gỡ lỗi trong 15 giây')
}

/** Một phiên CDP tối giản: gửi lệnh, chờ đúng id trả về. */
class Cdp {
    constructor(ws) {
        this.ws = ws
        this.id = 0
        this.pending = new Map()
        this.listeners = new Map()
        ws.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data)
            if (msg.id && this.pending.has(msg.id)) {
                const {resolve, reject} = this.pending.get(msg.id)
                this.pending.delete(msg.id)
                msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
                return
            }
            const handlers = this.listeners.get(msg.method)
            if (handlers) for (const h of handlers) h(msg.params, msg.sessionId)
        })
    }

    send(method, params = {}, sessionId) {
        const id = ++this.id
        return new Promise((resolve, reject) => {
            this.pending.set(id, {resolve, reject})
            this.ws.send(JSON.stringify({id, method, params, sessionId}))
        })
    }

    on(method, handler) {
        if (!this.listeners.has(method)) this.listeners.set(method, [])
        this.listeners.get(method).push(handler)
    }

    once(method) {
        return new Promise((resolve) => {
            const handler = (params) => {
                const list = this.listeners.get(method)
                list.splice(list.indexOf(handler), 1)
                resolve(params)
            }
            this.on(method, handler)
        })
    }
}

async function main() {
    const browser = findBrowser()
    if (!browser) {
        console.error('Không tìm thấy Edge hoặc Chrome. Đặt đường dẫn trong EDGE_CANDIDATES.')
        process.exit(1)
    }

    // Kiểm máy chủ tĩnh trước, để báo lỗi rõ thay vì chụp ra trang trắng.
    try {
        const probe = await fetch(BASE)
        if (!probe.ok) throw new Error(String(probe.status))
    } catch (error) {
        console.error(`Không với được ${BASE} — chạy: npx vite preview --port 4200 --strictPort`)
        console.error(String(error))
        process.exit(1)
    }

    mkdirSync(OUT, {recursive: true})
    const profile = join(tmpdir(), `rims-walk-${Date.now()}`)

    const child = spawn(
        browser,
        [
            '--headless=new',
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-extensions',
            `--user-data-dir=${profile}`,
            `--remote-debugging-port=${PORT}`,
            'about:blank',
        ],
        {stdio: 'ignore', detached: false},
    )

    let cdp
    try {
        const wsUrl = await waitForDevtools()
        const ws = new WebSocket(wsUrl)
        await new Promise((resolve, reject) => {
            ws.addEventListener('open', resolve, {once: true})
            ws.addEventListener('error', reject, {once: true})
        })
        cdp = new Cdp(ws)

        const {targetId} = await cdp.send('Target.createTarget', {url: 'about:blank'})
        const {sessionId} = await cdp.send('Target.attachToTarget', {targetId, flatten: true})
        await cdp.send('Page.enable', {}, sessionId)

        let count = 0

        for (const scheme of SCHEMES) {
            await cdp.send(
                'Emulation.setEmulatedMedia',
                {features: [{name: 'prefers-color-scheme', value: scheme}]},
                sessionId,
            )

            for (const width of WIDTHS) {
                await cdp.send(
                    'Emulation.setDeviceMetricsOverride',
                    {width, height: 900, deviceScaleFactor: 1, mobile: width < 600},
                    sessionId,
                )

                for (const route of ROUTES) {
                    const loaded = cdp.once('Page.loadEventFired')
                    await cdp.send('Page.navigate', {url: BASE + route.path}, sessionId)
                    await Promise.race([loaded, new Promise((r) => setTimeout(r, 8000))])
                    // Cho React vẽ xong và font kịp về.
                    await new Promise((r) => setTimeout(r, 900))

                    const {data} = await cdp.send(
                        'Page.captureScreenshot',
                        {format: 'png', captureBeyondViewport: true},
                        sessionId,
                    )

                    const file = join(OUT, `${route.name}__${scheme}__${width}.png`)
                    writeFileSync(file, Buffer.from(data, 'base64'))
                    console.log(`  ✓ ${route.name} · ${scheme} · ${width}px`)
                    count++
                }
            }
        }

        console.log(`\n${count} ảnh trong ${OUT}`)
    } finally {
        try {
            cdp?.ws.close()
        } catch {
            /* đóng được thì tốt, không thì kill bên dưới */
        }
        child.kill('SIGKILL')
        try {
            rmSync(profile, {recursive: true, force: true})
        } catch {
            /* hồ sơ tạm, để lại cũng không sao */
        }
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
