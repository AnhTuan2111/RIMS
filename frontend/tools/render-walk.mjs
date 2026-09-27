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
 * VÌ SAO KHÔNG CẦN BACKEND: mọi lời gọi `/rims/**` bị chặn ở tầng mạng (CDP
 * Fetch) và trả bằng bảng trong walk-fixtures.mjs. Hai lý do: máy dựng không
 * có Postgres, và ảnh chụp phải lặp lại được — dữ liệu thật đổi theo giờ nên
 * so hai lần chụp sẽ toàn nhiễu.
 *
 * Dùng:
 *   npm run build && npx vite preview --port 4200 --strictPort &
 *   node tools/render-walk.mjs                       # cả 34 màn, hai chế độ, ba cỡ
 *   node tools/render-walk.mjs --group=vo             # một nhóm: cong-khai|vo|quan-tri|bep|phuc-vu|thu-ngan|khach
 *   node tools/render-walk.mjs --only=/admin/dashboard --as=ADMIN
 *   node tools/render-walk.mjs --width=1440 --scheme=dark
 *   node tools/render-walk.mjs --log                  # in mọi endpoint bị gọi mà chưa có dữ liệu giả
 */

import {mkdirSync, writeFileSync, rmSync, existsSync} from 'node:fs'
import {spawn} from 'node:child_process'
import {join} from 'node:path'
import {tmpdir} from 'node:os'

import {match, ACTORS} from './walk-fixtures.mjs'

const BASE = process.env.WALK_BASE ?? 'http://localhost:4200'
const OUT = process.env.WALK_OUT ?? join(process.cwd(), 'tools', 'shots')
const PORT = 9223

const EDGE_CANDIDATES = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]

/**
 * Mọi màn có route trong AppRoutes.
 *
 * `as` là vai cần gieo vào phiên; bỏ trống nghĩa là màn công khai. Thứ tự ở
 * đây giữ nguyên thứ tự trong bản đồ màn của design.md để đọc ảnh theo thứ tự
 * là đi đúng luồng người dùng.
 */
const ALL_ROUTES = [
    // Công khai và cửa vào
    {g: 'cong-khai', n: '01-trang-chu', p: '/'},
    {g: 'cong-khai', n: '02-dang-nhap', p: '/login'},
    {g: 'cong-khai', n: '03-dang-ky', p: '/register'},
    {g: 'cong-khai', n: '04-quen-mat-khau', p: '/forgot-password'},

    // Vỏ app — màn dùng chung, có ở mọi vai
    {g: 'vo', n: '05-ho-so', p: '/profile', as: 'ADMIN'},

    // Quản trị · 10 màn gộp thành 4 nhóm rail
    {g: 'quan-tri', n: '06-tong-quan', p: '/admin/dashboard', as: 'ADMIN'},
    {g: 'quan-tri', n: '07-thong-ke', p: '/admin/statistics', as: 'ADMIN'},
    {g: 'quan-tri', n: '08-hoa-don', p: '/admin/invoices', as: 'ADMIN'},
    {g: 'quan-tri', n: '09-hoa-don-chi-tiet', p: '/admin/invoices/901', as: 'ADMIN'},
    {g: 'quan-tri', n: '10-menu', p: '/admin/menu', as: 'ADMIN'},
    {g: 'quan-tri', n: '11-danh-muc', p: '/admin/categories', as: 'ADMIN'},
    {g: 'quan-tri', n: '12-mon-an', p: '/admin/dishes', as: 'ADMIN'},
    {g: 'quan-tri', n: '13-nhan-su', p: '/admin/users', as: 'ADMIN'},
    {g: 'quan-tri', n: '14-ban', p: '/admin/tables', as: 'ADMIN'},
    {g: 'quan-tri', n: '15-mat-bang', p: '/admin/floor', as: 'ADMIN'},
    {g: 'quan-tri', n: '16-nha-hang', p: '/admin/restaurant', as: 'ADMIN'},

    // Bếp · 6 màn phẳng
    {g: 'bep', n: '17-bep-tong-quan', p: '/chef/dashboard', as: 'CHEF'},
    {g: 'bep', n: '18-can-che-bien', p: '/chef/orders', as: 'CHEF'},
    {g: 'bep', n: '19-gom-mon', p: '/chef/grouped-orders', as: 'CHEF'},
    {g: 'bep', n: '20-bep-mon-an', p: '/chef/dishes', as: 'CHEF'},
    {g: 'bep', n: '21-da-xong', p: '/chef/completed-orders', as: 'CHEF'},
    {g: 'bep', n: '22-da-huy', p: '/chef/cancelled-orders', as: 'CHEF'},

    // Phục vụ · 7 màn
    {g: 'phuc-vu', n: '23-so-do-ban', p: '/waiter/tables', as: 'WAITER'},
    {g: 'phuc-vu', n: '24-dat-mon-moi', p: '/waiter/tables/1/order/new', as: 'WAITER'},
    {
        g: 'phuc-vu',
        n: '25-don-chi-tiet',
        p: '/waiter/tables/2/order/detail',
        as: 'WAITER',
    },
    {g: 'phuc-vu', n: '26-sua-don', p: '/waiter/tables/2/order/edit', as: 'WAITER'},
    {
        g: 'phuc-vu',
        n: '27-dat-ban-chi-tiet',
        p: '/waiter/tables/3/reservation',
        as: 'WAITER',
    },
    {g: 'phuc-vu', n: '28-dat-ban', p: '/waiter/reservations', as: 'WAITER'},
    {g: 'phuc-vu', n: '29-sua-dat-ban', p: '/waiter/reservations/501/edit', as: 'WAITER'},

    // Thu ngân · 4 màn
    {g: 'thu-ngan', n: '30-thanh-toan', p: '/cashier/payments', as: 'CASHIER'},
    {g: 'thu-ngan', n: '31-thu-ngan-hoa-don', p: '/cashier/invoices', as: 'CASHIER'},
    {g: 'thu-ngan', n: '32-tra-tien-xong', p: '/payment-success', as: 'CASHIER'},
    {g: 'thu-ngan', n: '33-tra-tien-loi', p: '/payment-failed', as: 'CASHIER'},

    // Khách · 1 màn
    {g: 'khach', n: '34-khach-dat-ban', p: '/customer/reservations', as: 'CUSTOMER'},
]

const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const [k, v] = a.replace(/^--/, '').split('=')
        return [k, v ?? true]
    }),
)

const WIDTHS = args.width ? [Number(args.width)] : [1440, 768, 375]
const SCHEMES = args.scheme ? [args.scheme] : ['light', 'dark']

const ROUTES = args.only
    ? [
          {
              g: 'rieng',
              n: String(args.only).replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'root',
              p: String(args.only),
              as: args.as ? String(args.as) : undefined,
          },
      ]
    : args.group
      ? ALL_ROUTES.filter((r) => r.g === String(args.group))
      : ALL_ROUTES

/** Endpoint bị gọi mà bảng dữ liệu giả không có. Báo ở cuối để biết cần thêm gì. */
const unmatched = new Set()

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

function jsonBody(value) {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
}

/**
 * Trả lời mọi lời gọi API bằng dữ liệu giả.
 *
 * Không khớp bảng thì vẫn trả 200 với thân rỗng hợp lý — `[]` cho đường dẫn
 * số nhiều, `{}` cho còn lại. Trả 404 sẽ làm màn vẽ banner lỗi che hết giao
 * diện cần soi, mà mục đích của walk là soi giao diện chứ không phải soi API.
 */
function fulfilFor(path) {
    const data = match(path)

    if (data !== undefined) {
        return data
    }

    unmatched.add(path.replace(/^\/rims/, '').split('?')[0])

    // Không khớp thì trả mảng rỗng, không phải object rỗng: `{}.map(...)` ném
    // lỗi và React gỡ sạch cây DOM — cả màn thành trang trắng. `[].totalRevenue`
    // chỉ ra undefined, màn vẫn vẽ và chỗ thiếu vẫn nhìn thấy được.
    return []
}

async function main() {
    const browser = findBrowser()
    if (!browser) {
        console.error(
            'Không tìm thấy Edge hoặc Chrome. Đặt đường dẫn trong EDGE_CANDIDATES.',
        )
        process.exit(1)
    }

    try {
        const probe = await fetch(BASE)
        if (!probe.ok) throw new Error(String(probe.status))
    } catch (error) {
        console.error(
            `Không với được ${BASE} — chạy: npx vite preview --port 4200 --strictPort`,
        )
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
        const {sessionId} = await cdp.send('Target.attachToTarget', {
            targetId,
            flatten: true,
        })
        await cdp.send('Page.enable', {}, sessionId)
        await cdp.send('Runtime.enable', {}, sessionId)

        // Một ảnh trắng không nói được vì sao nó trắng. React gặp lỗi lúc vẽ
        // thì gỡ luôn cây DOM, và cái còn lại đúng là một trang trắng có nền.
        // Bắt lỗi ở đây để walk báo NGUYÊN NHÂN thay vì để người xem đoán.
        let pageErrors = []
        cdp.on('Runtime.exceptionThrown', (p) => {
            const d = p.exceptionDetails
            pageErrors.push(d.exception?.description ?? d.text ?? 'lỗi không rõ')
        })
        cdp.on('Runtime.consoleAPICalled', (p) => {
            if (p.type === 'error') {
                pageErrors.push(p.args.map((a) => a.description ?? a.value).join(' '))
            }
        })

        // Chặn API. Chỉ `/rims/*` — tài sản tĩnh phải đi thẳng, nếu không thì
        // chặn cả CSS và font, và ảnh chụp sẽ ra trang không định kiểu.
        await cdp.send('Fetch.enable', {patterns: [{urlPattern: '*/rims/*'}]}, sessionId)
        cdp.on('Fetch.requestPaused', async (params, sid) => {
            const path =
                new URL(params.request.url).pathname +
                (new URL(params.request.url).search ?? '')
            try {
                await cdp.send(
                    'Fetch.fulfillRequest',
                    {
                        requestId: params.requestId,
                        responseCode: 200,
                        responseHeaders: [
                            {name: 'Content-Type', value: 'application/json'},
                        ],
                        body: jsonBody(fulfilFor(path)),
                    },
                    sid,
                )
            } catch {
                /* trang đã rời đi trước khi trả lời xong — bỏ qua */
            }
        })

        let count = 0

        // Vai đang được gieo, và id của script đã gắn — cần id để BỎ script cũ
        // trước khi gắn script mới. Không bỏ thì trang cuối phải chạy 34 script
        // gieo chồng lên nhau, và vai của màn đầu sẽ ghi đè vai của màn cuối.
        let seededRole = '\u0000'
        let seededId = null

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
                    // Gieo phiên TRƯỚC khi trang chạy script: getCurrentUser()
                    // đọc `currentUser` từ localStorage trước khi gọi mạng, nên
                    // hai khoá này là đủ để ProtectedRoute cho đi qua.
                    //
                    // Chỉ gieo lại khi vai đổi — mỗi lần gieo là thêm một script
                    // chạy ở mọi lần điều hướng sau đó, gieo 34 lần thì trang
                    // cuối phải chạy 34 script giống nhau.
                    const wantRole = route.as ?? null

                    if (wantRole !== seededRole) {
                        if (seededId !== null) {
                            await cdp
                                .send(
                                    'Page.removeScriptToEvaluateOnNewDocument',
                                    {identifier: seededId},
                                    sessionId,
                                )
                                .catch(() => {})
                        }

                        const actor = wantRole ? ACTORS[wantRole] : null

                        if (!actor && wantRole) {
                            throw new Error(`Vai không có trong ACTORS: ${wantRole}`)
                        }

                        const source = actor
                            ? `try{
localStorage.setItem('accessToken','walk-token');
localStorage.setItem('refreshToken','walk-refresh');
localStorage.setItem('currentUser',${JSON.stringify(JSON.stringify(actor))});
localStorage.setItem('selectedActor',${JSON.stringify(actor.role)});
}catch(e){}`
                            : `try{localStorage.clear()}catch(e){}`

                        const {identifier} = await cdp.send(
                            'Page.addScriptToEvaluateOnNewDocument',
                            {source},
                            sessionId,
                        )

                        seededRole = wantRole
                        seededId = identifier
                    }

                    pageErrors = []
                    const loaded = cdp.once('Page.loadEventFired')
                    await cdp.send('Page.navigate', {url: BASE + route.p}, sessionId)
                    await Promise.race([loaded, new Promise((r) => setTimeout(r, 8000))])
                    // Cho React vẽ xong, dữ liệu giả về và font kịp tải.
                    await new Promise((r) => setTimeout(r, 1200))

                    const {data} = await cdp.send(
                        'Page.captureScreenshot',
                        {format: 'png', captureBeyondViewport: true},
                        sessionId,
                    )

                    const file = join(OUT, `${route.n}__${scheme}__${width}.png`)
                    writeFileSync(file, Buffer.from(data, 'base64'))

                    // Đếm node trong #root: React gỡ cây DOM khi gặp lỗi lúc
                    // vẽ, nên rỗng nghĩa là màn hỏng dù ảnh vẫn chụp ra được.
                    const {result} = await cdp.send(
                        'Runtime.evaluate',
                        {
                            expression:
                                "document.getElementById('root')?.querySelectorAll('*').length ?? -1",
                            returnByValue: true,
                        },
                        sessionId,
                    )

                    const nodes = result.value
                    const bad = nodes <= 1

                    console.log(
                        `  ${bad ? '✗' : '✓'} ${route.n} · ${scheme} · ${width}px${bad ? '  TRANG RỖNG' : ''}`,
                    )

                    if (bad || args.verbose) {
                        for (const e of [...new Set(pageErrors)].slice(0, 3)) {
                            console.log(`      ${String(e).split('\n')[0].slice(0, 160)}`)
                        }
                    }

                    count++
                }
            }
        }

        console.log(`\n${count} ảnh trong ${OUT}`)

        if (args.log && unmatched.size) {
            console.log(`\n${unmatched.size} endpoint chưa có dữ liệu giả:`)
            for (const p of [...unmatched].sort()) console.log(`  ${p}`)
        }
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
