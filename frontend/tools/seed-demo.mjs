/**
 * Dựng những thứ data.sql cố ý không dựng: TÀI KHOẢN và SƠ ĐỒ MẶT BẰNG.
 *
 * <p>Phân công rõ ràng:
 * <ul>
 *   <li>data.sql lo dữ liệu danh mục — 14 bàn, 9 danh mục, 43 món. Nó chạy tự
 *       động lúc khởi động nên không cần ai gọi.</li>
 *   <li>Script này lo phần còn lại: tài khoản nhân viên, tài khoản khách, và
 *       toạ độ các bàn trên sơ đồ.</li>
 * </ul>
 *
 * <p>VÌ SAO data.sql KHÔNG SEED TÀI KHOẢN: commit một chuỗi băm mật khẩu vào
 * kho mã nguồn nghĩa là ai đọc được repo cũng đăng nhập được trước chủ quán.
 * Tài khoản quản trị đầu tiên do BootstrapAdmin tạo từ biến môi trường, còn
 * nhân viên thì tạo qua đúng API thật ở đây.
 *
 * <p>KHÔNG dựng đơn hàng, lượt đặt bàn hay hoá đơn. Trước đây script này có
 * thêm bốn bước làm những việc đó cho đẹp màn hình lúc chụp ảnh, nhưng chạy
 * nó lên một bản cài thật là bẩn dữ liệu ngay — mà gỡ ra thì phải xoá tay
 * từng bảng theo đúng thứ tự khoá ngoại. Muốn có dữ liệu vận hành để xem thì
 * thao tác trên giao diện như người dùng thật.
 *
 * <p>Gọi ĐÚNG API thật chứ không chèn thẳng vào cơ sở dữ liệu: nếu một endpoint
 * hỏng thì nó hỏng ở đây, chứ không phải lúc đang demo.
 *
 * Dùng:
 *   node tools/seed-demo.mjs <mật-khẩu-admin>
 *   RIMS_API=https://yamazato.onrender.com/rims node tools/seed-demo.mjs <mk>
 */

const API = process.env.RIMS_API ?? 'http://localhost:8080/rims'
const PW = process.argv[2] ?? 'Rims@2026'
const STAFF_PW = 'Rims@2026'
const INIT_PW = 'Khoitao@123'

let token = ''

async function call(method, path, body) {
    const res = await fetch(API + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    })

    const text = await res.text()
    let data = null

    try {
        data = text ? JSON.parse(text) : null
    } catch {
        data = text
    }

    if (!res.ok) {
        throw new Error(`${method} ${path} → ${res.status} ${String(text).slice(0, 200)}`)
    }

    return data
}

async function login(username, rawPassword) {
    const data = await call('POST', '/auth/login', {username, rawPassword})
    token = data.accessToken
    return data
}

/**
 * Đăng nhập, và nếu tài khoản còn dùng mật khẩu do người khác đặt thì đổi
 * ngay rồi đăng nhập lại.
 *
 * <p>Backend chặn MỌI endpoint khác bằng MustChangePasswordFilter cho tới khi
 * đổi xong — kể cả GET. Tài khoản admin vừa tạo cho nhân viên rơi đúng vào
 * trường hợp đó, nên không có bước này thì script chết ở lời gọi đầu tiên.
 */
/**
 * Đăng nhập, thử cả mật khẩu khởi tạo lẫn mật khẩu cuối.
 *
 * <p>Script chạy lại được nhiều lần: lần đầu tài khoản còn mật khẩu khởi tạo,
 * từ lần sau nó đã là mật khẩu cuối.
 *
 * <p>Tài khoản do admin tạo bị backend bắt đổi mật khẩu trước khi gọi được bất
 * kỳ endpoint nào. Gỡ cờ đó bằng một câu UPDATE trên CSDL cục bộ:
 *
 *   UPDATE users SET must_change_password = false WHERE username <> 'admin';
 *
 * Cố ý KHÔNG làm trong script này: script chỉ gọi API, và một công cụ dựng dữ
 * liệu xem-màn không nên có quyền ghi thẳng vào cơ sở dữ liệu.
 */
async function loginReady(username, initialPassword, finalPassword) {
    try {
        return await login(username, initialPassword)
    } catch {
        return await login(username, finalPassword)
    }
}

async function main() {
    console.log('1 · đăng nhập admin')
    await login('admin', PW)

    console.log('2 · tạo nhân sự')
    const staff = [
        {
            username: 'chef01',
            fullName: 'Hoàng Văn Bếp',
            role: 'CHEF',
            phone: '0987654001',
        },
        {
            username: 'chef02',
            fullName: 'Nguyễn Thị Hương',
            role: 'CHEF',
            phone: '0987654002',
        },
        {
            username: 'waiter01',
            fullName: 'Phạm Thu Hà',
            role: 'WAITER',
            phone: '0987654003',
        },
        {
            username: 'waiter02',
            fullName: 'Lê Minh Tuấn',
            role: 'WAITER',
            phone: '0987654004',
        },
        {
            username: 'cashier01',
            fullName: 'Vũ Minh Khoa',
            role: 'CASHIER',
            phone: '0987654005',
        },
    ]

    for (const person of staff) {
        try {
            await call('POST', '/admin/user/staff/new', {
                ...person,
                email: `${person.username}@yamazato.vn`,
                password: INIT_PW,
            })
            console.log('   +', person.username, person.role)
        } catch (error) {
            console.log('   ·', person.username, '—', String(error.message).slice(0, 90))
        }
    }

    console.log('3 · tạo khách hàng')
    for (const c of [
        {username: 'kh001', fullName: 'Nguyễn Văn An', phone: '0912345001'},
        {username: 'kh002', fullName: 'Trần Thị Bích Ngọc', phone: '0912345002'},
    ]) {
        try {
            await call('POST', '/admin/user/customer/new', {
                ...c,
                email: `${c.username}@khach.vn`,
                password: INIT_PW,
            })
            console.log('   +', c.username)
        } catch (error) {
            console.log('   ·', c.username, '—', String(error.message).slice(0, 90))
        }
    }

    console.log('4 · vẽ mặt bằng')
    const allTables = await call('GET', '/admin/table/all')

    // Hai khu, xếp như một quán thật: dãy bàn đôi sát tường bên trái, bàn bốn
    // ở giữa, bàn sáu ngoài sân. KHÔNG xếp thành lưới đều — một mặt bằng đều
    // tăm tắp thì nó lại chỉ là cái lưới cũ, và cả điểm của sơ đồ là nó giống
    // cái quán ngoài đời.
    const spots = [
        [0, 0, 2, 2, 'Trong nhà'],
        [0, 3, 2, 2, 'Trong nhà'],
        [0, 6, 2, 2, 'Trong nhà'],
        [0, 9, 2, 2, 'Trong nhà'],
        [4, 0, 3, 3, 'Trong nhà'],
        [8, 0, 3, 3, 'Trong nhà'],
        [4, 4, 3, 3, 'Trong nhà'],
        [8, 4, 3, 3, 'Trong nhà'],
        [4, 8, 3, 3, 'Trong nhà'],
        [8, 8, 3, 3, 'Trong nhà'],
        [0, 0, 4, 3, 'Sân vườn'],
        [5, 0, 4, 3, 'Sân vườn'],
        [0, 4, 4, 3, 'Sân vườn'],
        [5, 4, 4, 3, 'Sân vườn'],
    ]

    try {
        await call('PUT', '/admin/table/layout', {
            tables: allTables.slice(0, spots.length).map((table, i) => ({
                tableId: table.id,
                x: spots[i][0],
                y: spots[i][1],
                w: spots[i][2],
                h: spots[i][3],
                zone: spots[i][4],
            })),
        })
        console.log(`   + xếp chỗ cho ${Math.min(allTables.length, spots.length)} bàn`)
    } catch (error) {
        console.log('   ·', String(error.message).slice(0, 120))
    }

    console.log('\nXong. Mật khẩu mọi tài khoản:', STAFF_PW)
    console.log('Bàn, danh mục và món ăn do data.sql lo — script này không đụng tới.')
}

main().catch((error) => {
    console.error('LỖI:', error.message)
    process.exit(1)
})