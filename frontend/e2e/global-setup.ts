/**
 * Dọn về trạng thái đã biết trước khi chạy bộ kiểm.
 *
 * <p>Các bài kiểm gọi món thật, và món đã gọi thì bàn không còn trống. Chạy
 * bộ kiểm vài lần liên tiếp là hết bàn, và từ đó mọi lần chạy sau đều đỏ vì
 * một lý do không liên quan gì tới thứ đang kiểm.
 *
 * <p>Ở đây thu tiền mọi đơn đang mở để trả bàn về trống. KHÔNG xoá dữ liệu:
 * hoá đơn sinh ra là lịch sử thật, và xoá lịch sử để bài kiểm dễ chạy là đổi
 * dữ liệu thật lấy sự tiện lợi.
 */

const API = process.env.E2E_API ?? 'http://localhost:8080/rims'
const PW = process.env.RIMS_PW ?? 'Rims@2026'

/**
 * In trạng thái dọn ra màn hình người chạy — cố ý: đọc được "còn 14/14 bàn
 * trống" trước khi bộ kiểm chạy là biết ngay lần đỏ sau đó có phải do dữ liệu.
 */
// eslint-disable-next-line no-console
const log = (message: string) => console.log(message)

/** Số bàn trống tối thiểu để cả bộ kiểm chạy trọn. */
const MIN_FREE = 6

async function token(username: string) {
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, rawPassword: PW}),
    })

    if (!res.ok) {
        throw new Error(`không đăng nhập được ${username}: ${res.status}`)
    }

    return (await res.json()).accessToken as string
}

async function call(tok: string, path: string, init?: RequestInit) {
    const res = await fetch(API + path, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tok}`,
            ...(init?.headers ?? {}),
        },
    })

    const text = await res.text()

    if (!res.ok) {
        throw new Error(
            `${init?.method ?? 'GET'} ${path} → ${res.status} ${text.slice(0, 120)}`,
        )
    }

    return text ? JSON.parse(text) : null
}

export default async function globalSetup() {
    const cashier = await token('cashier01')
    const waiter = await token('waiter01')
    const chef = await token('chef01')

    // BƯỚC 1 — bếp làm xong mọi món đang chờ.
    //
    // App từ chối thu tiền khi đơn còn món chưa hoàn thành, và đó là luật
    // đúng: thu tiền một bàn còn món trong bếp là thu tiền thứ khách chưa
    // nhận. Nên dọn phải đi đúng thứ tự của đời thật.
    const queue = await call(chef, '/chef/orders')

    for (const item of queue) {
        try {
            await call(chef, `/chef/orders/${item.orderItemId}/status`, {
                method: 'PUT',
                body: JSON.stringify({status: 'COMPLETED'}),
            })
        } catch {
            // Món đã đổi trạng thái ở nơi khác — không sao.
        }
    }

    if (queue.length > 0) {
        log(`  [dọn] bếp làm xong ${queue.length} món còn chờ`)
    }

    // BƯỚC 2 — thu tiền mọi bàn đang phục vụ.
    const tables = await call(cashier, '/cashier/tables')
    const serving = tables.filter((t: {status: string}) => t.status === 'SERVING')

    let closed = 0

    for (const table of serving) {
        try {
            const detail = await call(cashier, `/cashier/orders/${table.orderId}`)
            const amountPaid = Math.ceil(detail.finalAmount / 10000) * 10000 + 10000

            // Hai bước: /payment khoá đơn, /complete-cash mới thu tiền thật.
            await call(cashier, `/cashier/orders/${table.orderId}/payment`, {
                method: 'POST',
                body: JSON.stringify({paymentMethod: 'CASH', amountPaid}),
            })

            await call(cashier, `/cashier/orders/${table.orderId}/complete-cash`, {
                method: 'POST',
                body: JSON.stringify({paymentMethod: 'CASH', amountPaid}),
            })

            closed++
        } catch (error) {
            const message = (error as Error).message

            // Đơn mà mọi món đều đã huỷ thì app tự đóng ở bước khoá, nên bước
            // thu tiền trả 409. Đó là đúng, không phải lỗi cần kêu.
            if (!message.includes('chưa được chốt')) {
                log(`  [dọn] bàn ${table.tableNumber}: ${message}`)
            }
        }
    }

    // BƯỚC 3 — trả mặt bằng về hình dạng gốc.
    //
    // Bài kiểm "mặt bằng lưu được chỗ đứng" dời một cái bàn rồi LƯU THẬT, nên
    // chạy nhiều lần là bàn đó trôi dần sang phải và cuối cùng đè lên bàn
    // khác. Bài kiểm được phép đổi dữ liệu, nhưng lần chạy sau phải bắt đầu
    // từ một chỗ đã biết.
    const admin = await token('admin')
    const allTables = await call(admin, '/admin/table/all')

    const spots: [number, number, number, number, string][] = [
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

    await call(admin, '/admin/table/layout', {
        method: 'PUT',
        body: JSON.stringify({
            tables: allTables
                .slice(0, spots.length)
                .map((table: {id: number}, i: number) => ({
                    tableId: table.id,
                    x: spots[i][0],
                    y: spots[i][1],
                    w: spots[i][2],
                    h: spots[i][3],
                    zone: spots[i][4],
                })),
        }),
    })

    // BƯỚC 4 — huỷ các lượt đặt bàn do bộ kiểm để lại.
    //
    // Bài "phục vụ đặt bàn" đặt thật, và app buộc hai lượt trên cùng một bàn
    // cách nhau 2,5 tiếng. Không dọn thì mỗi lần chạy ăn mất một khung giờ,
    // và tới lúc nào đó mọi bàn đều kín lịch. HUỶ chứ không xoá: lượt huỷ vẫn
    // nằm trong lịch sử, chỉ trả lại khung giờ.
    let cancelled = 0
    const today = new Date()

    for (let offset = 0; offset < 3; offset++) {
        const day = new Date(today.getTime() + offset * 86_400_000)
        const iso = day.toLocaleDateString('sv-SE') // yyyy-mm-dd theo giờ máy
        const bookings = await call(waiter, `/waiter/reservations?date=${iso}`)

        for (const booking of bookings) {
            const isTest = /^khách kiểm thử$/i.test(booking.customerName?.trim() ?? '')
            const isOpen = booking.status === 'QUEUED' || booking.status === 'WAITING'

            if (isTest && isOpen) {
                await call(
                    waiter,
                    `/waiter/reservations/${booking.reservationId}/cancel`,
                    {
                        method: 'PUT',
                    },
                ).catch(() => {})
                cancelled++
            }
        }
    }

    // BƯỚC 5 — xoá món kiểm thử còn sót.
    //
    // Bài "thêm, sửa giá, rồi xoá" tự dọn khi chạy trọn; nhưng một lần chạy
    // đỏ giữa chừng vẫn để lại món, và món đó hiện ngay trên TRANG CHỦ CÔNG
    // KHAI. Món chưa từng vào đơn thì backend cho xoá hẳn.
    let removedDishes = 0
    const dishes = await call(admin, '/admin/dish/all')

    for (const dish of dishes) {
        if (/^Món kiểm thử \d+$/.test(dish.name ?? '')) {
            await call(admin, `/admin/dish/delete/${dish.id}`, {method: 'DELETE'})
                .then(() => removedDishes++)
                .catch((error) =>
                    log(`  [dọn] không xoá được ${dish.name}: ${error.message}`),
                )
        }
    }

    // BƯỚC 6 — xoá bàn thử còn sót (tên "KT" + số) từ lần chạy đỏ giữa chừng.
    let removedTables = 0

    for (const table of await call(admin, '/admin/table/all')) {
        if (/^KT\d+$/.test(table.tableNumber ?? '')) {
            await call(admin, `/admin/table/${table.id}`, {method: 'DELETE'})
                .then(() => removedTables++)
                .catch((error) =>
                    log(
                        `  [dọn] không xoá được bàn ${table.tableNumber}: ${error.message}`,
                    ),
                )
        }
    }

    // BƯỚC 7 — mở khoá tài khoản mà bài "khoá tài khoản" dùng, phòng khi lần
    // chạy trước đỏ giữa chừng và bỏ nó ở trạng thái khoá.
    const staff = await call(admin, '/admin/user/staff?page=0&size=100')

    for (const user of staff.content ?? []) {
        if (user.username === 'waiter02' && !user.isActive) {
            await call(admin, `/admin/user/${user.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({active: true}),
            })
            log('  [dọn] mở khoá waiter02')
        }
    }

    const after = await call(waiter, '/waiter/tables')
    const free = after.filter((t: {status: string}) => t.status === 'AVAILABLE').length

    log(
        `  [dọn] đã thu ${closed} đơn · huỷ ${cancelled} lượt đặt thử · xoá ${removedDishes} món thử · ${removedTables} bàn thử · còn ${free}/${after.length} bàn trống`,
    )

    if (free < MIN_FREE) {
        throw new Error(
            `chỉ còn ${free} bàn trống, cần ít nhất ${MIN_FREE}. ` +
                'Có đơn nào đang khoá mà không thu được — xem log backend.',
        )
    }
}
