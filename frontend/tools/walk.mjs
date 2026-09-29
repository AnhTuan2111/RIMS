/**
 * Walk mọi màn bằng Playwright, trên APP THẬT với BACKEND THẬT.
 *
 * <p>Thay cho tools/render-walk.mjs — công cụ đó chặn API ở tầng mạng và trả
 * dữ liệu giả, và chính vì vậy nó đã che mất một lỗi 500 thật ở /public/menu
 * suốt nhiều pha. Dữ liệu giả kiểm được bố cục; nó không kiểm được app.
 *
 * <p>Ba việc trong một lần chạy:
 *   1. Chụp từng màn ở cả hai chế độ và ba cỡ.
 *   2. Chụp thêm trạng thái RÊ CHUỘT của nút chính trên mỗi màn — hover là
 *      một nửa chữ ký của hệ (lún vào bóng của chính nó), và không ảnh tĩnh
 *      nào cho thấy nó.
 *   3. Báo màn rỗng và lỗi console ngay tại chỗ.
 *
 * Cần: backend ở :8080, frontend dev ở :5173, và dữ liệu từ seed-demo.mjs.
 *
 * Dùng:
 *   node tools/walk.mjs                     tất cả
 *   node tools/walk.mjs --group=bep         một nhóm
 *   node tools/walk.mjs --only=/chef/orders --as=chef01
 *   node tools/walk.mjs --width=1440 --scheme=sáng
 */

import {chromium} from 'playwright'
import {mkdirSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

const BASE = process.env.WALK_BASE ?? 'http://localhost:5173'
const PW = process.env.RIMS_PW ?? 'Rims@2026'
const OUT = join(process.cwd(), 'tools', 'shots')

/**
 * Mọi màn có route, kèm vai cần để vào và nút chính để rê chuột vào.
 *
 * <p>`hover` là bộ chọn của thứ đáng xem nhất khi rê chuột trên màn đó. Không
 * có thì bỏ qua bước hover.
 */
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
            // 'instant': trang đặt scroll-behavior: smooth, và cuộn mượt thì
            // ảnh bị chụp giữa lúc đang trôi — thanh trên và rail lệch xuống.
            window.scrollTo({top: y, behavior: 'instant'})
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
        window.scrollTo({top: 0, behavior: 'instant'})
    })
    await page.waitForFunction(() => window.scrollY === 0).catch(() => {})
    await page.waitForLoadState('networkidle').catch(() => {})
}

const ROUTES = [
    {g: 'cong-khai', n: '01-trang-chu', p: '/', hover: '.rk-dish'},
    {g: 'cong-khai', n: '02-dang-nhap', p: '/login', hover: 'button[type="submit"]'},
    {g: 'cong-khai', n: '03-dang-ky', p: '/register', hover: 'button[type="submit"]'},
    {g: 'cong-khai', n: '04-quen-mat-khau', p: '/forgot-password'},

    {g: 'vo', n: '05-ho-so', p: '/profile', as: 'admin', hover: '.rk-btn--primary'},

    {g: 'quan-tri', n: '06-tong-quan', p: '/admin/dashboard', as: 'admin'},
    {g: 'quan-tri', n: '07-thong-ke', p: '/admin/statistics', as: 'admin'},
    {g: 'quan-tri', n: '08-hoa-don', p: '/admin/invoices', as: 'admin'},
    {g: 'quan-tri', n: '09-menu', p: '/admin/menu', as: 'admin'},
    {g: 'quan-tri', n: '10-danh-muc', p: '/admin/categories', as: 'admin'},
    {
        g: 'quan-tri',
        n: '11-mon-an',
        p: '/admin/dishes',
        as: 'admin',
        hover: '.rk-dishcard',
    },
    {g: 'quan-tri', n: '12-nhan-su', p: '/admin/users', as: 'admin'},
    {g: 'quan-tri', n: '13-ban', p: '/admin/tables', as: 'admin'},
    {
        g: 'quan-tri',
        n: '14-mat-bang',
        p: '/admin/floor',
        as: 'admin',
        hover: '.rk-planbtn',
    },
    {g: 'quan-tri', n: '15-nha-hang', p: '/admin/restaurant', as: 'admin'},
    {g: 'quan-tri', n: '15b-chi-tiet-hoa-don', p: '/admin/invoices/1', as: 'admin'},

    {g: 'bep', n: '16-bep-tong-quan', p: '/chef/dashboard', as: 'chef01'},
    {
        g: 'bep',
        n: '17-can-che-bien',
        p: '/chef/orders',
        as: 'chef01',
        hover: '.rk-btn--go',
    },
    {g: 'bep', n: '18-gom-mon', p: '/chef/grouped-orders', as: 'chef01'},
    {g: 'bep', n: '19-bep-mon-an', p: '/chef/dishes', as: 'chef01'},
    {g: 'bep', n: '20-da-xong', p: '/chef/completed-orders', as: 'chef01'},
    {g: 'bep', n: '21-da-huy', p: '/chef/cancelled-orders', as: 'chef01'},

    {
        g: 'phuc-vu',
        n: '22-so-do-ban',
        p: '/waiter/tables',
        as: 'waiter01',
        hover: '.rk-tablecard',
    },
    {
        g: 'phuc-vu',
        n: '23-dat-mon-moi',
        p: '/waiter/tables/4/order/new',
        as: 'waiter01',
        hover: '.rk-stepper__btn',
    },
    {
        g: 'phuc-vu',
        n: '24-don-chi-tiet',
        p: '/waiter/tables/1/order/detail',
        as: 'waiter01',
    },
    {g: 'phuc-vu', n: '25-sua-don', p: '/waiter/tables/1/order/edit', as: 'waiter01'},
    {g: 'phuc-vu', n: '26-dat-ban', p: '/waiter/reservations', as: 'waiter01'},

    {
        g: 'thu-ngan',
        n: '27-thanh-toan',
        p: '/cashier/payments',
        as: 'cashier01',
        hover: '.rk-tablecard',
    },
    {g: 'thu-ngan', n: '28-thu-ngan-hoa-don', p: '/cashier/invoices', as: 'cashier01'},

    {g: 'khach', n: '29-khach-dat-ban', p: '/customer/reservations', as: 'kh001'},

    // Màn này chỉ mở được khi bàn đang ở trạng thái RESERVED — tức là có lượt
    // đặt sắp tới giờ và bộ lập lịch 60 giây đã đánh dấu. Muốn chụp thì phải
    // dựng sẵn một lượt đặt cách hiện tại dưới 30 phút cho đúng bàn này.
    {g: 'phuc-vu', n: '22b-dat-ban-cua-ban', p: '/waiter/tables/6/reservation', as: 'waiter01'},
    {g: 'phuc-vu', n: '22c-sua-dat-ban', p: '/waiter/reservations/2/edit', as: 'waiter01'},

    {g: 'thu-ngan', n: '23b-thanh-toan-ok', p: '/payment-success?invoiceId=1', as: 'cashier01'},
    {g: 'thu-ngan', n: '23c-thanh-toan-loi', p: '/payment-failed', as: 'cashier01'},

    {g: 'vo', n: '24-doi-mat-khau', p: '/change-password', as: 'admin'},

    // ── Panel và hộp thoại ────────────────────────────────────────────────
    // Tài liệu đặc tả từng thứ này như một màn riêng, nhưng trong app chúng
    // không có route: phải bấm mới hiện. Chỉ chụp ở 1440 (xem ghi chú ở
    // vòng lặp bên dưới).
    {
        g: 'quan-tri',
        n: '10b-danh-muc-them',
        p: '/admin/categories',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.getByRole('button', {name: 'THÊM DANH MỤC'}).first().click(),
    },
    {
        g: 'quan-tri',
        n: '10c-danh-muc-chi-tiet',
        p: '/admin/categories',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.locator('button[title="Xem chi tiết"]').first().click(),
    },
    {
        g: 'quan-tri',
        n: '10d-danh-muc-sua',
        p: '/admin/categories',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.locator('button[title="Chỉnh sửa"]').first().click(),
    },
    {
        g: 'quan-tri',
        n: '11b-mon-them',
        p: '/admin/dishes',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.getByRole('button', {name: 'THÊM MÓN ĂN'}).first().click(),
    },
    {
        g: 'quan-tri',
        n: '11c-mon-chi-tiet',
        p: '/admin/dishes',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.locator('button[title="Xem chi tiết"]').first().click(),
    },
    {
        g: 'quan-tri',
        n: '11d-mon-sua',
        p: '/admin/dishes',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.locator('button[title="Chỉnh sửa"]').first().click(),
    },
    {
        g: 'quan-tri',
        n: '12b-tai-khoan-chi-tiet',
        p: '/admin/users',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.locator('button[title="Xem chi tiết"]').first().click(),
    },
    {
        g: 'quan-tri',
        n: '12c-tai-khoan-sua',
        p: '/admin/users',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.locator('button[title="Chỉnh sửa"]').first().click(),
    },
    {
        g: 'quan-tri',
        n: '12d-tai-khoan-them',
        p: '/admin/users',
        as: 'admin',
        chiRong: 1440,
        // Nhãn thật là "+ THÊM NHÂN VIÊN"; khớp theo tên hiển thị không ăn,
        // nên bám vào lớp — trên màn này chỉ có đúng một nút chính.
        mo: (page) => page.locator('button.rk-btn--primary').first().click(),
    },

    // Bốn báo cáo của màn Thống kê là bốn TAB chứ không phải bốn đường dẫn,
    // nhưng tài liệu đặc tả từng cái như một màn riêng nên phải chụp riêng.
    {
        g: 'quan-tri',
        n: '07b-doanh-thu',
        p: '/admin/statistics',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.getByRole('button', {name: /Tổng doanh thu/}).first().click(),
    },
    {
        g: 'quan-tri',
        n: '07c-ban-chay-danh-muc',
        p: '/admin/statistics',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.getByRole('button', {name: /Bán chạy theo danh mục/}).first().click(),
    },
    {
        g: 'quan-tri',
        n: '07d-mon-ban-chay',
        p: '/admin/statistics',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.getByRole('button', {name: /Món bán chạy/}).first().click(),
    },
    {
        g: 'quan-tri',
        n: '07e-don-theo-ca',
        p: '/admin/statistics',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.getByRole('button', {name: /Đơn hàng theo ca/}).first().click(),
    },

    {
        g: 'vo',
        n: '05b-sua-ho-so',
        p: '/profile',
        as: 'admin',
        chiRong: 1440,
        mo: (page) => page.getByRole('button', {name: 'CHỈNH SỬA'}).first().click(),
    },

    {
        g: 'bep',
        n: '17b-chi-tiet-mon',
        p: '/chef/orders',
        as: 'chef01',
        chiRong: 1440,
        mo: (page) => page.getByRole('button', {name: 'CHI TIẾT'}).first().click(),
    },

    {
        g: 'khach',
        n: '29b-luot-dat-cua-toi',
        p: '/customer/reservations',
        as: 'kh001',
        chiRong: 1440,
        mo: (page) => page.getByRole('button', {name: 'Lượt đặt của tôi'}).first().click(),
    },
]

/** Bấm vào bàn đang phục vụ để mở panel chi tiết đơn của thu ngân. */
const moBanDangPhucVu = async (page) => {
    await page.locator('button.rk-tablecard--busy').first().click()
    await page.waitForSelector('text=Chi tiết đơn hàng', {timeout: 8000})
}

/**
 * Mở panel của một bàn THU TIỀN ĐƯỢC, không phải bàn đầu danh sách.
 *
 * <p>Nút "Thanh toán" bị khoá chừng nào bếp chưa báo xong hết món, nên bàn nào
 * còn món đang làm thì mọi bước sau đều treo. Duyệt lần lượt các bàn đang phục
 * vụ cho tới khi gặp bàn mở được nút.
 */
const moBanThanhToanDuoc = async (page) => {
    const the = page.locator('button.rk-tablecard--busy')
    const soThe = await the.count()

    for (let i = 0; i < soThe; i++) {
        await the.nth(i).click()
        await page.waitForSelector('text=Chi tiết đơn hàng', {timeout: 8000})

        const nut = page.getByRole('button', {name: 'Thanh toán'}).first()
        if (await nut.isEnabled().catch(() => false)) return nut
    }

    throw new Error('không có bàn nào thu tiền được — bếp còn món chưa xong')
}

ROUTES.push(
    {
        g: 'thu-ngan',
        n: '27b-chi-tiet-don',
        p: '/cashier/payments',
        as: 'cashier01',
        chiRong: 1440,
        mo: moBanDangPhucVu,
    },
    {
        g: 'thu-ngan',
        n: '27c-tich-diem',
        p: '/cashier/payments',
        as: 'cashier01',
        chiRong: 1440,
        mo: async (page) => {
            await moBanDangPhucVu(page)
            // Số của khách đã có trong CSDL: panel phải tìm ra và hiện điểm.
            await page.fill('input[aria-label="Số điện thoại khách hàng"]', '0901000001')
            await page.waitForTimeout(1200)
        },
    },
    {
        g: 'thu-ngan',
        n: '27d-khach-moi',
        p: '/cashier/payments',
        as: 'cashier01',
        chiRong: 1440,
        mo: async (page) => {
            await moBanDangPhucVu(page)
            // Số chưa có: panel phải chuyển sang mời đăng ký khách mới.
            await page.fill('input[aria-label="Số điện thoại khách hàng"]', '0938887766')
            await page.waitForTimeout(1200)
        },
    },
    {
        g: 'thu-ngan',
        n: '27e-chon-phuong-thuc',
        p: '/cashier/payments',
        as: 'cashier01',
        chiRong: 1440,
        mo: async (page) => {
            const nut = await moBanThanhToanDuoc(page)
            await nut.click()
            await page.waitForSelector('.rk-choicegrid', {timeout: 8000})
        },
    },
    {
        g: 'thu-ngan',
        n: '27f-tien-mat',
        p: '/cashier/payments',
        as: 'cashier01',
        chiRong: 1440,
        mo: async (page) => {
            const nut = await moBanThanhToanDuoc(page)
            await nut.click()
            await page.waitForSelector('.rk-choicegrid', {timeout: 8000})
            await page.getByRole('button', {name: /Tiền mặt/}).first().click()
            await page.waitForTimeout(500)
        },
    },
    {
        g: 'thu-ngan',
        n: '27g-vnpay',
        p: '/cashier/payments',
        as: 'cashier01',
        chiRong: 1440,
        mo: async (page) => {
            const nut = await moBanThanhToanDuoc(page)
            await nut.click()
            await page.waitForSelector('.rk-choicegrid', {timeout: 8000})
            // Backend trả phương thức là QRCODE nên nút hiện chữ "MÃ QR",
            // không phải "VNPay" như tên gọi trong tài liệu.
            await page.getByRole('button', {name: 'MÃ QR'}).first().click()
            await page.waitForTimeout(500)
        },
    },
)

const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const [k, v] = a.replace(/^--/, '').split('=')
        return [k, v ?? true]
    }),
)

const WIDTHS = args.width ? [Number(args.width)] : [1440, 768, 375]
const SCHEMES = args.scheme ? [String(args.scheme)] : ['sáng', 'tối']

const PICKED = args.only
    ? [
          {
              g: 'rieng',
              n: String(args.only).replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'root',
              p: String(args.only),
              as: args.as ? String(args.as) : undefined,
          },
      ]
    : args.group
      ? ROUTES.filter((r) => r.g === String(args.group))
      : ROUTES

mkdirSync(OUT, {recursive: true})

const browser = await chromium.launch({channel: 'msedge', headless: true})
const problems = []
let shots = 0

for (const scheme of SCHEMES) {
    for (const width of WIDTHS) {
        const context = await browser.newContext({
            viewport: {width, height: 900},
            colorScheme: scheme === 'tối' ? 'dark' : 'light',
            locale: 'vi-VN',
            deviceScaleFactor: 1,
        })

        const page = await context.newPage()

        const errors = []
        page.on('console', (m) => {
            if (m.type() === 'error') errors.push(m.text().slice(0, 140))
        })
        page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))

        let signedIn = null

        for (const route of PICKED) {
            errors.length = 0

            // Đăng nhập THẬT qua biểu mẫu. Không gieo token: backend thật sẽ
            // từ chối một token bịa ngay ở request đầu tiên.
            if (route.as !== signedIn) {
                if (signedIn) {
                    await page.goto(BASE + '/', {waitUntil: 'domcontentloaded'})
                    await page.evaluate(() => localStorage.clear())
                }

                if (route.as) {
                    await page.goto(BASE + '/login', {waitUntil: 'domcontentloaded'})
                    await page.fill('#login-username', route.as)
                    await page.fill('#login-password', PW)
                    await page.click('button[type="submit"]')
                    await page
                        .waitForURL((u) => !u.pathname.startsWith('/login'), {
                            timeout: 15000,
                        })
                        .catch(() => {
                            problems.push(`${route.as}: không đăng nhập được`)
                        })
                }

                signedIn = route.as ?? null
            }

            // Pop-up và panel chỉ chụp ở cỡ rộng: tài liệu dùng ảnh máy tính,
            // và mỗi lần mở lại là một lần đụng vào dữ liệu thật (khoá đơn,
            // tìm khách) — chạy sáu lượt thì trạng thái trôi mất.
            if (route.chiRong && width !== route.chiRong) continue

            await page.goto(BASE + route.p, {waitUntil: 'networkidle'}).catch(() => {})
            await page.waitForTimeout(700)

            // `mo` bấm vào đúng chỗ để mở panel hoặc hộp thoại trước khi chụp.
            // Hỏng thì phải kêu lên: ảnh chụp được vẫn là màn nền, nhìn qua
            // tưởng đúng mà thực ra thiếu hẳn thứ cần minh hoạ.
            if (route.mo) {
                try {
                    await route.mo(page)
                    await page.waitForTimeout(500)
                } catch (e) {
                    problems.push(`MỞ HỎNG — ${route.n} · ${String(e).slice(0, 90)}`)
                    console.log(`  ! ${route.n}  mở hỏng: ${String(e).slice(0, 60)}`)
                }
            }

            const nodes = await page
                .evaluate(
                    () =>
                        document.getElementById('root')?.querySelectorAll('*').length ??
                        -1,
                )
                .catch(() => -1)

            const tag = `${route.n} · ${scheme} · ${width}px`

            if (nodes <= 1) {
                problems.push(`TRANG RỖNG — ${tag}${errors[0] ? ' · ' + errors[0] : ''}`)
                console.log(`  ✗ ${tag}  TRANG RỖNG`)
            } else if (errors.length > 0) {
                problems.push(`LỖI CONSOLE — ${tag} · ${errors[0]}`)
                console.log(`  ! ${tag}  ${errors[0].slice(0, 70)}`)
            } else {
                console.log(`  ✓ ${tag}`)
            }

            await loadLazyImages(page)
            await page.screenshot({
                path: join(OUT, `${route.n}__${scheme}__${width}.png`),
                fullPage: true,
            })
            shots++

            // Trạng thái RÊ CHUỘT — chỉ chụp ở cỡ rộng nhất, vì hover không
            // tồn tại trên màn cảm ứng.
            if (route.hover && width === 1440) {
                const target = page.locator(route.hover).first()

                if (await target.count()) {
                    await target.scrollIntoViewIfNeeded().catch(() => {})
                    await target.hover({timeout: 4000}).catch(() => {})
                    await page.waitForTimeout(250)

                    const box = await target.boundingBox().catch(() => null)

                    if (box) {
                        await page.screenshot({
                            path: join(OUT, `${route.n}__${scheme}__hover.png`),
                            clip: {
                                x: Math.max(0, box.x - 40),
                                y: Math.max(0, box.y - 40),
                                width: Math.min(width, box.width + 80),
                                height: box.height + 80,
                            },
                        })
                        shots++
                    }
                }
            }
        }

        await context.close()
    }
}

await browser.close()

writeFileSync(join(OUT, '_ket-qua.txt'), problems.join('\n') + '\n', 'utf8')

console.log(`\n${shots} ảnh trong ${OUT}`)

if (problems.length === 0) {
    console.log('ĐẠT — không màn nào rỗng, không lỗi console.')
} else {
    console.log(`\n${problems.length} chỗ cần xem:`)
    for (const p of problems) console.log('  ' + p)
    process.exitCode = 1
}
