/**
 * Dựng dữ liệu vận hành để XEM ĐƯỢC các màn.
 *
 * <p>data.sql cố ý không seed tài khoản nào ngoài admin, và không seed đơn
 * hàng nào. Đúng cho một kho mã nguồn — nhưng nghĩa là mọi màn vận hành đều ở
 * trạng thái rỗng, và không thể nhìn ra thiết kế đúng hay sai từ một màn rỗng.
 *
 * <p>Script này gọi ĐÚNG API thật, không chèn thẳng vào cơ sở dữ liệu: nếu một
 * endpoint hỏng thì nó hỏng ở đây, chứ không phải lúc đang chụp màn.
 *
 * Dùng:  node tools/seed-demo.mjs <mật-khẩu-admin>
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

    console.log('5 · đăng nhập phục vụ và gọi món')
    await loginReady('waiter01', INIT_PW, STAFF_PW)

    const tables = await call('GET', '/waiter/tables')
    const menu = await call('GET', '/waiter/menu')

    console.log(`   ${tables.length} bàn · ${menu.length} món trong thực đơn`)

    const free = tables.filter((t) => t.status === 'AVAILABLE')

    // Bốn đơn ở bốn bàn khác nhau, mỗi đơn vài món — đủ để màn bếp có phiếu,
    // màn thu ngân có bàn đang phục vụ, và bảng ba cột có gì để xếp.
    const plans = [
        {tableIndex: 0, picks: [0, 5, 10], note: 'Không wasabi'},
        {tableIndex: 1, picks: [11, 12, 20], note: ''},
        {tableIndex: 2, picks: [15, 16, 25, 30], note: 'Ít cay, thêm gừng'},
        {tableIndex: 4, picks: [2, 34, 38], note: ''},
    ]

    const orders = []

    for (const plan of plans) {
        const table = free[plan.tableIndex]

        if (!table) continue

        const items = plan.picks
            .map((i) => menu[i])
            .filter(Boolean)
            .map((dish, k) => ({
                dishId: dish.dishId,
                quantity: 1 + (k % 3),
                note: k === 0 ? plan.note : undefined,
            }))

        try {
            const order = await call('POST', '/waiter/orders', {
                tableId: table.tableId,
                items,
            })
            orders.push(order)
            console.log(`   + đơn bàn ${table.tableNumber}: ${items.length} món`)
        } catch (error) {
            console.log(
                '   ·',
                table.tableNumber,
                '—',
                String(error.message).slice(0, 90),
            )
        }
    }

    console.log('6 · đặt bàn trước')
    const remaining = tables.filter((t) => t.status === 'AVAILABLE').slice(-3)
    const now = new Date()

    for (const [i, table] of remaining.entries()) {
        const when = new Date(now)
        when.setDate(now.getDate() + 1)
        when.setHours(18 + i, 30, 0, 0)

        try {
            await call('POST', '/waiter/reservations', {
                customerName: ['Nguyễn Văn An', 'Trần Thị Bích', 'Đặng Quốc Cường'][
                    i % 3
                ],
                phone: `09123450${10 + i}`,
                note: i === 1 ? 'Sinh nhật, cần bánh và nến' : undefined,
                tableId: table.tableId,
                reservationTime: when.toISOString().slice(0, 19),
            })
            console.log('   + đặt bàn', table.tableNumber)
        } catch (error) {
            console.log(
                '   ·',
                table.tableNumber,
                '—',
                String(error.message).slice(0, 90),
            )
        }
    }

    console.log('7 · bếp làm xong vài món')
    await loginReady('chef01', INIT_PW, STAFF_PW)

    const queue = await call('GET', '/chef/orders')
    console.log(`   ${queue.length} món trong hàng đợi`)

    for (const item of queue.slice(0, 3)) {
        try {
            await call('PUT', `/chef/orders/${item.orderItemId}/status`, {
                status: 'COMPLETED',
            })
            console.log('   ✓', item.dishName)
        } catch (error) {
            console.log('   ·', item.dishName, '—', String(error.message).slice(0, 90))
        }
    }

    for (const item of queue.slice(3, 4)) {
        try {
            await call('PUT', `/chef/orders/${item.orderItemId}/cancel`, {
                reason: 'Hết nguyên liệu',
            })
            console.log('   ✗', item.dishName, '(huỷ)')
        } catch (error) {
            console.log('   ·', item.dishName, '—', String(error.message).slice(0, 90))
        }
    }

    console.log('8 · thu ngân thanh toán một bàn')
    await loginReady('cashier01', INIT_PW, STAFF_PW)

    const cashierTables = await call('GET', '/cashier/tables')
    const serving = cashierTables.filter((t) => t.status === 'SERVING')
    console.log(`   ${serving.length} bàn đang phục vụ`)

    if (serving.length > 0) {
        const target = serving[0]

        try {
            const detail = await call('GET', `/cashier/orders/${target.orderId}`)

            await call('POST', `/cashier/orders/${target.orderId}/payment`, {
                paymentMethod: 'CASH',
                amountPaid: Math.ceil(detail.finalAmount / 10000) * 10000,
            })
            console.log('   ✓ đã thu bàn', target.tableNumber)
        } catch (error) {
            console.log('   ·', String(error.message).slice(0, 140))
        }
    }

    console.log('\nXong. Mật khẩu mọi tài khoản:', STAFF_PW)
}

main().catch((error) => {
    console.error('LỖI:', error.message)
    process.exit(1)
})
