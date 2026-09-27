/**
 * Đo tương phản THẬT trên từng màn đang chạy, không đo trên bảng token.
 *
 * VÌ SAO KHÔNG ĐO TRÊN TOKEN: bảng token nói màu chữ và màu nền theo cặp mà
 * người viết ĐỊNH ghép với nhau. Cái đến được mắt người dùng là cặp mà CSS
 * thực sự ghép — sau khi kế thừa, sau khi một luật khác ghi đè, sau khi một
 * phần tử trong suốt nằm trên một nền không ai ngờ tới. Hai đợt trước đã có
 * hai lỗi đúng kiểu đó: nền `--rims-ink` đảo ngược ở chế độ tối làm nền và chữ
 * cùng sáng, và một khai báo `color:` trùng khiến đầu bảng thành chữ xám.
 *
 * Cách làm: mở từng màn, duyệt mọi phần tử CÓ CHỮ, lấy màu chữ đã tính và màu
 * nền THẬT (leo ngược cây cho tới phần tử đầu tiên có nền không trong suốt),
 * rồi tính tỉ số tương phản WCAG.
 *
 * Ngưỡng: 4.5:1 cho chữ thường, 3.0:1 cho chữ lớn (>=24px, hoặc >=18.66px và
 * đậm từ 700). Đây là ngưỡng AA, và là ngưỡng đã chốt trong design.md.
 *
 * Dùng:
 *   npx vite preview --port 4200 --strictPort &
 *   node tools/contrast-audit.mjs
 */

import {spawn} from 'node:child_process'
import {existsSync, rmSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'

import {ACTORS} from './walk-fixtures.mjs'
import {match} from './walk-fixtures.mjs'

const BASE = process.env.WALK_BASE ?? 'http://localhost:4200'
const PORT = 9224

const EDGE_CANDIDATES = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]

/** Cùng bảng màn với render-walk, nhưng chỉ cần một cỡ: màu không đổi theo bề ngang. */
const ROUTES = [
    ['/', null],
    ['/login', null],
    ['/register', null],
    ['/forgot-password', null],
    ['/profile', 'ADMIN'],
    ['/admin/dashboard', 'ADMIN'],
    ['/admin/statistics', 'ADMIN'],
    ['/admin/invoices', 'ADMIN'],
    ['/admin/invoices/901', 'ADMIN'],
    ['/admin/menu', 'ADMIN'],
    ['/admin/categories', 'ADMIN'],
    ['/admin/dishes', 'ADMIN'],
    ['/admin/users', 'ADMIN'],
    ['/admin/tables', 'ADMIN'],
    ['/admin/floor', 'ADMIN'],
    ['/admin/restaurant', 'ADMIN'],
    ['/chef/dashboard', 'CHEF'],
    ['/chef/orders', 'CHEF'],
    ['/chef/grouped-orders', 'CHEF'],
    ['/chef/dishes', 'CHEF'],
    ['/chef/completed-orders', 'CHEF'],
    ['/chef/cancelled-orders', 'CHEF'],
    ['/waiter/tables', 'WAITER'],
    ['/waiter/tables/1/order/new', 'WAITER'],
    ['/waiter/tables/2/order/detail', 'WAITER'],
    ['/waiter/tables/2/order/edit', 'WAITER'],
    ['/waiter/tables/3/reservation', 'WAITER'],
    ['/waiter/reservations', 'WAITER'],
    ['/waiter/reservations/501/edit', 'WAITER'],
    ['/cashier/payments', 'CASHIER'],
    ['/cashier/invoices', 'CASHIER'],
    ['/payment-success', 'CASHIER'],
    ['/payment-failed', 'CASHIER'],
    ['/customer/reservations', 'CUSTOMER'],
]

/** Hàm chạy TRONG trang. Mọi thứ nó cần phải nằm gọn trong thân hàm. */
const PROBE = `(() => {
    function parse(value) {
        const m = value.match(/rgba?\\(([^)]+)\\)/)
        if (!m) return null
        const parts = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
        return {r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1}
    }

    function lum(c) {
        const f = (v) => {
            const s = v / 255
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
    }

    function over(fg, bg) {
        // Chữ nửa trong suốt thì màu tới mắt là màu đã trộn với nền.
        if (fg.a >= 1) return fg
        return {
            r: fg.r * fg.a + bg.r * (1 - fg.a),
            g: fg.g * fg.a + bg.g * (1 - fg.a),
            b: fg.b * fg.a + bg.b * (1 - fg.a),
            a: 1,
        }
    }

    function ratio(a, b) {
        const la = lum(a)
        const lb = lum(b)
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
    }

    /** Nền THẬT: leo ngược cho tới phần tử đầu tiên không trong suốt. */
    function backdrop(el) {
        let node = el
        while (node) {
            const bg = parse(getComputedStyle(node).backgroundColor)
            if (bg && bg.a > 0) {
                if (bg.a >= 1) return bg
                const under = backdrop(node.parentElement)
                return over(bg, under)
            }
            node = node.parentElement
        }
        return {r: 255, g: 255, b: 255, a: 1}
    }

    const bad = []
    const seen = new Set()

    for (const el of document.querySelectorAll('body *')) {
        // Chỉ phần tử tự mang chữ, không tính chữ của con nó.
        const own = [...el.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.trim())
            .join(' ')
            .trim()

        if (!own) continue

        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue

        const box = el.getBoundingClientRect()
        if (box.width === 0 || box.height === 0) continue

        const fgRaw = parse(cs.color)
        if (!fgRaw) continue

        const bg = backdrop(el)
        const fg = over(fgRaw, bg)
        const r = ratio(fg, bg)

        const size = parseFloat(cs.fontSize)
        const weight = Number(cs.fontWeight) || 400
        const large = size >= 24 || (size >= 18.66 && weight >= 700)
        const floor = large ? 3 : 4.5

        if (r + 0.005 < floor) {
            const key = cs.color + '|' + JSON.stringify(bg) + '|' + Math.round(size)
            if (seen.has(key)) continue
            seen.add(key)

            bad.push({
                text: own.slice(0, 40),
                cls: (el.className && el.className.baseVal !== undefined
                    ? el.className.baseVal
                    : String(el.className || '')).slice(0, 60),
                color: cs.color,
                bg: 'rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ')',
                size: Math.round(size),
                weight,
                ratio: Math.round(r * 100) / 100,
                floor,
            })
        }
    }

    return JSON.stringify(bad)
})()`

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

async function waitForDevtools() {
    for (let i = 0; i < 60; i++) {
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
            if (res.ok) return (await res.json()).webSocketDebuggerUrl
        } catch {
            /* chưa lên */
        }
        await new Promise((r) => setTimeout(r, 250))
    }
    throw new Error('Trình duyệt không mở cổng gỡ lỗi trong 15 giây')
}

function jsonBody(value) {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
}

async function main() {
    const browser = EDGE_CANDIDATES.find((c) => existsSync(c))

    if (!browser) {
        console.error('Không tìm thấy Edge hoặc Chrome.')
        process.exit(1)
    }

    const profile = join(tmpdir(), `rims-audit-${Date.now()}`)

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
        {stdio: 'ignore'},
    )

    let cdp
    let failures = 0

    try {
        const ws = new WebSocket(await waitForDevtools())
        await new Promise((resolve, reject) => {
            ws.addEventListener('open', resolve, {once: true})
            ws.addEventListener('error', reject, {once: true})
        })
        cdp = new Cdp(ws)

        const {targetId} = await cdp.send('Target.createTarget', {url: 'about:blank'})
        const {sessionId} = await cdp.send('Target.attachToTarget', {
            targetId,
            flatten: true,
        })
        await cdp.send('Page.enable', {}, sessionId)
        await cdp.send('Fetch.enable', {patterns: [{urlPattern: '*/rims/*'}]}, sessionId)

        cdp.on('Fetch.requestPaused', async (params, sid) => {
            const url = new URL(params.request.url)
            const data = match(url.pathname + url.search)

            try {
                await cdp.send(
                    'Fetch.fulfillRequest',
                    {
                        requestId: params.requestId,
                        responseCode: 200,
                        responseHeaders: [
                            {name: 'Content-Type', value: 'application/json'},
                        ],
                        body: jsonBody(data === undefined ? [] : data),
                    },
                    sid,
                )
            } catch {
                /* trang đã rời đi */
            }
        })

        await cdp.send(
            'Emulation.setDeviceMetricsOverride',
            {width: 1440, height: 900, deviceScaleFactor: 1, mobile: false},
            sessionId,
        )

        for (const scheme of ['light', 'dark']) {
            await cdp.send(
                'Emulation.setEmulatedMedia',
                {features: [{name: 'prefers-color-scheme', value: scheme}]},
                sessionId,
            )

            console.log(`\n=== chế độ ${scheme} ===`)

            let seededRole = '\u0000'
            let seededId = null

            for (const [path, role] of ROUTES) {
                if (role !== seededRole) {
                    if (seededId !== null) {
                        await cdp
                            .send(
                                'Page.removeScriptToEvaluateOnNewDocument',
                                {identifier: seededId},
                                sessionId,
                            )
                            .catch(() => {})
                    }

                    const actor = role ? ACTORS[role] : null
                    const source = actor
                        ? `try{
localStorage.setItem('accessToken','audit');
localStorage.setItem('refreshToken','audit');
localStorage.setItem('currentUser',${JSON.stringify(JSON.stringify(actor))});
localStorage.setItem('selectedActor',${JSON.stringify(actor.role)});
}catch(e){}`
                        : `try{localStorage.clear()}catch(e){}`

                    const {identifier} = await cdp.send(
                        'Page.addScriptToEvaluateOnNewDocument',
                        {source},
                        sessionId,
                    )

                    seededRole = role
                    seededId = identifier
                }

                const loaded = cdp.once('Page.loadEventFired')
                await cdp.send('Page.navigate', {url: BASE + path}, sessionId)
                await Promise.race([loaded, new Promise((r) => setTimeout(r, 8000))])
                await new Promise((r) => setTimeout(r, 1000))

                const {result} = await cdp.send(
                    'Runtime.evaluate',
                    {expression: PROBE, returnByValue: true, awaitPromise: false},
                    sessionId,
                )

                const bad = JSON.parse(result.value ?? '[]')

                if (bad.length === 0) {
                    console.log(`  ✓ ${path}`)
                    continue
                }

                failures += bad.length
                console.log(`  ✗ ${path} — ${bad.length} cặp dưới ngưỡng`)

                for (const item of bad) {
                    console.log(
                        `      ${item.ratio}:1 (cần ${item.floor}) · ${item.size}px/${item.weight} · ` +
                            `${item.color} trên ${item.bg} · .${item.cls || '(không lớp)'} · "${item.text}"`,
                    )
                }
            }
        }

        console.log(
            failures === 0
                ? '\nĐẠT — mọi cặp chữ/nền trên 34 màn × 2 chế độ đều qua ngưỡng AA.'
                : `\nTRƯỢT — ${failures} cặp dưới ngưỡng.`,
        )

        process.exitCode = failures === 0 ? 0 : 1
    } finally {
        try {
            cdp?.ws.close()
        } catch {
            /* thôi */
        }
        child.kill('SIGKILL')
        try {
            rmSync(profile, {recursive: true, force: true})
        } catch {
            /* hồ sơ tạm */
        }
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
