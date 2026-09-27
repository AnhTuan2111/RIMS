import {ACTORS, match} from './walk-fixtures.mjs'

/**
 * Chạy app KHÔNG CẦN BACKEND, để xem giao diện.
 *
 * <p>Bật bằng <code>npm run dev:mock</code>, tức <code>vite --mode mock</code>.
 * Ở mọi mode khác plugin này không gắn gì cả và dev server proxy sang backend
 * thật như cũ. `apply: 'serve'` chặn nốt đường còn lại: nó không bao giờ chạy
 * lúc build.
 *
 * <p>Dùng CHUNG bảng dữ liệu với render walk (<code>walk-fixtures.mjs</code>),
 * nên thứ nhìn thấy trên màn đúng bằng thứ công cụ chụp ảnh nhìn thấy. Hai
 * bảng riêng là hai thứ sẽ lệch nhau.
 *
 * <p>ĐÂY KHÔNG PHẢI BACKEND. Nó chỉ đọc: mọi lời gọi ghi đều được trả lời
 * bằng chính dữ liệu cũ, nên bấm "Lưu" sẽ không lưu gì. Đủ để xem và đi lại
 * giữa các màn, không đủ để kiểm nghiệp vụ.
 */
export function mockApi(enabled) {
    if (!enabled) {
        return {name: 'rims-mock-api'}
    }

    return {
        name: 'rims-mock-api',
        apply: 'serve',

        configureServer(server) {
            server.middlewares.use('/rims', (req, res, next) => {
                const url = new URL(req.url ?? '/', 'http://localhost')
                const path = '/rims' + url.pathname + url.search

                // Đăng nhập: nhận mọi mật khẩu, trả vai theo tên đăng nhập.
                if (url.pathname === '/auth/login' && req.method === 'POST') {
                    readBody(req, (body) => {
                        const username = String(body?.username ?? '').toLowerCase()

                        const role = username.startsWith('chef')
                            ? 'CHEF'
                            : username.startsWith('waiter')
                              ? 'WAITER'
                              : username.startsWith('cashier')
                                ? 'CASHIER'
                                : username.startsWith('kh')
                                  ? 'CUSTOMER'
                                  : 'ADMIN'

                        // Lấy đúng NGƯỜI của vai đó, không lấy người đầu bảng
                        // rồi dán vai lên: dán vai thì đăng nhập chef01 vẫn
                        // hiện tên "Quản trị viên hệ thống".
                        const user = ACTORS[role]

                        send(res, {
                            accessToken: 'mock',
                            refreshToken: 'mock',
                            ...user,
                            username: username || user.username,
                        })
                    })
                    return
                }

                if (url.pathname === '/auth/logout') {
                    send(res, {})
                    return
                }

                const data = match(path)

                if (data !== undefined) {
                    send(res, data)
                    return
                }

                // Không có trong bảng: trả mảng rỗng, KHÔNG trả 404.
                // `{}.map(...)` ném lỗi và React gỡ sạch cây DOM — cả màn
                // thành trang trắng. `[].totalRevenue` chỉ ra undefined.
                if (req.method === 'GET') {
                    console.log(`[mock] chưa có dữ liệu cho ${path} — trả []`)
                    send(res, [])
                    return
                }

                // Lời gọi ghi: nhận rồi im lặng. Màn sẽ tải lại và thấy đúng
                // dữ liệu cũ, vì đây không phải backend.
                console.log(`[mock] ${req.method} ${path} — nhận, không lưu`)
                send(res, {})
            })

            server.httpServer?.once('listening', () => {
                console.log(
                    '\n  \u001b[33m[mock]\u001b[0m Chạy KHÔNG CẦN BACKEND, dữ liệu giả cố định.' +
                        '\n  \u001b[33m[mock]\u001b[0m Đăng nhập: mật khẩu bất kỳ. Tên đăng nhập quyết định vai —' +
                        '\n  \u001b[33m[mock]\u001b[0m admin · chef01 · waiter01 · cashier01 · kh001\n',
                )
            })
        },
    }
}

function send(res, value) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(value))
}

function readBody(req, done) {
    let raw = ''
    req.on('data', (chunk) => {
        raw += chunk
    })
    req.on('end', () => {
        try {
            done(JSON.parse(raw || '{}'))
        } catch {
            done({})
        }
    })
}
