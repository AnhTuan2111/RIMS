/**
 * Dữ liệu giả cho render walk.
 *
 * VÌ SAO CÓ FILE NÀY: máy dựng thiết kế không có Postgres và Docker Desktop
 * không khởi động được, nên không có backend thật để chụp màn sau đăng nhập.
 * Nhưng ngay cả khi có backend, walk vẫn nên dùng dữ liệu cố định: ảnh chụp
 * phải LẶP LẠI ĐƯỢC để so hai lần chụp với nhau. Một cơ sở dữ liệu thật đổi
 * theo giờ, theo ca, theo người vừa bấm gì — so ảnh sẽ toàn nhiễu.
 *
 * MỌI HÌNH DẠNG Ở ĐÂY CHÉP TỪ TYPE THẬT, không đoán. Nguồn:
 *   shared/types/{admin,order,table,cashier,auth}.ts
 *   shared/api/{chef,waiter,cashier,customer,restaurant,public}.ts
 * Lần đầu tôi đoán tên endpoint và hình dạng, kết quả là 10 ảnh trắng: màn
 * gọi `.map` trên một object rỗng rồi React gỡ sạch cây DOM.
 *
 * NGUYÊN TẮC DỰNG SỐ LIỆU: mỗi danh sách phải có ít nhất một dòng cho MỖI
 * trạng thái mà màn đó vẽ khác nhau — một danh sách toàn "đang chế biến" thì
 * không kiểm được màu chip "đã huỷ". Và phải có một dòng dài quá khổ, vì tràn
 * chữ là lỗi giao diện hay gặp nhất mà dữ liệu đẹp không bao giờ lộ ra.
 */

const NOW = '2026-09-27'

const DISH_NAMES = [
    'Phở bò tái lăn',
    'Bún chả cá Nha Trang',
    'Cơm tấm sườn bì chả',
    'Gỏi cuốn tôm thịt',
    'Canh chua cá lóc',
    'Bò lúc lắc khoai tây',
    'Chả cá Lã Vọng ăn kèm bánh đa nướng, rau thơm và mắm tôm pha sẵn',
    'Nem cua bể Hải Phòng',
    'Cà phê sữa đá',
    'Trà sen vàng',
]

const CATEGORY_NAMES = ['Món chính', 'Khai vị', 'Canh', 'Đồ uống', 'Tráng miệng']

const PRICE = (i) => 45000 + i * 15000

/** admin.ts · CategoryResponse */
const CATEGORIES = CATEGORY_NAMES.map((name, i) => ({
    id: i + 1,
    name,
    description: i === 4 ? 'Nhóm đang tạm ẩn khỏi thực đơn trong mùa này.' : 'Nhóm món trong thực đơn.',
    isAvailable: i !== 4,
    createdAt: `${NOW}T08:00:00`,
    updatedAt: `${NOW}T08:00:00`,
    dishCount: 4 + i,
}))

/** admin.ts · DishResponse — có đủ ba trạng thái: bán, tạm dừng, ẩn. */
const DISHES = DISH_NAMES.map((name, i) => ({
    id: i + 1,
    name,
    description: 'Món nấu theo lối truyền thống, phục vụ nóng.',
    price: PRICE(i),
    imageUrl: '',
    isAvailable: i % 4 !== 3,
    isHidden: i === 7,
    categoryName: CATEGORY_NAMES[i % CATEGORY_NAMES.length],
    createdAt: `${NOW}T08:00:00`,
    updatedAt: `${NOW}T08:00:00`,
}))

/** admin.ts · DishSummary */
const DISH_SUMMARIES = DISHES.map((d, i) => ({
    id: d.id,
    name: d.name,
    categoryName: d.categoryName,
    price: d.price,
    imageUrl: '',
    status: d.isHidden ? 'HIDDEN' : d.isAvailable ? 'AVAILABLE' : 'PAUSED',
}))

/** table.ts · TableDetailResponse — TableStatus chỉ có ba giá trị, không có "đang dọn". */
const TABLE_STATUSES = ['AVAILABLE', 'SERVING', 'RESERVED']

const TABLES = Array.from({length: 12}, (_, i) => ({
    tableId: i + 1,
    tableNumber: String(i + 1),
    capacity: [2, 4, 4, 6, 8][i % 5],
    status: TABLE_STATUSES[i % 3],
    upcomingReservationTime: i % 3 === 2 ? `${NOW}T19:30:00` : undefined,
    upcomingCustomerName: i % 3 === 2 ? 'Trần Thị Bích' : undefined,
}))

/** Gắn toạ độ mặt bằng vào danh sách bàn của Phục vụ. */
function withFloor(list) {
    return list.map((t, i) => {
        const slot = FLOOR_SLOTS[i]

        return {
            ...t,
            layoutX: slot ? slot[0] : null,
            layoutY: slot ? slot[1] : null,
            layoutW: slot ? slot[2] : null,
            layoutH: slot ? slot[3] : null,
            zone: slot ? slot[4] : null,
        }
    })
}

/**
 * admin.ts · AdminTable — hình dạng của màn Quản lý bàn và màn Mặt bằng.
 *
 * <p>Chín bàn đầu đã có chỗ trên mặt bằng, chia hai khu; ba bàn cuối để trống
 * toạ độ, để walk chụp được cả hàng "Chưa xếp vào mặt bằng".
 */
const FLOOR_SLOTS = [
    [0, 0, 3, 2, 'Tầng 1'],
    [4, 0, 3, 2, 'Tầng 1'],
    [8, 0, 3, 2, 'Tầng 1'],
    [0, 3, 3, 2, 'Tầng 1'],
    [4, 3, 4, 3, 'Tầng 1'],
    [9, 3, 2, 2, 'Tầng 1'],
    [0, 0, 3, 2, 'Sân vườn'],
    [4, 0, 3, 2, 'Sân vườn'],
    [8, 0, 5, 2, 'Sân vườn'],
]

const ADMIN_TABLES = TABLES.map((t, i) => {
    const slot = FLOOR_SLOTS[i]

    return {
        id: t.tableId,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        status: t.status,
        active: true,
        orderCount: i % 3,
        reservationCount: i % 2,
        deletable: i % 3 === 0 && i % 2 === 0,
        layoutX: slot ? slot[0] : null,
        layoutY: slot ? slot[1] : null,
        layoutW: slot ? slot[2] : null,
        layoutH: slot ? slot[3] : null,
        zone: slot ? slot[4] : null,
    }
})

/** order.ts · OrderItemStatus */
const ITEM_STATUSES = ['PREPARING', 'COMPLETED', 'CANCELLED']

/** order.ts · OrderItemResponse */
function orderItems(seed, n) {
    return Array.from({length: n}, (_, k) => {
        const i = (seed + k) % DISHES.length
        const quantity = 1 + ((seed + k) % 3)
        return {
            orderItemId: seed * 100 + k,
            dishName: DISHES[i].name,
            status: ITEM_STATUSES[(seed + k) % 3],
            quantity,
            unitPrice: PRICE(i),
            subTotal: PRICE(i) * quantity,
            note: k === 0 ? 'Không hành, ít cay' : null,
            cancelReason: ITEM_STATUSES[(seed + k) % 3] === 'CANCELLED' ? 'Hết nguyên liệu' : null,
            chefInternalNote: k === 1 ? 'Bếp đã đổi sang cá basa, đã báo phục vụ.' : null,
            chefInternalNoteCreatedAt: k === 1 ? `${NOW}T11:42:00` : null,
            chefInternalNoteAcknowledgedAt: null,
        }
    })
}

/** order.ts · OrderDetailResponse */
function orderDetail(orderId, tableNumber, seed) {
    const items = orderItems(seed, 2 + (seed % 3))
    const before = items.reduce((s, it) => s + it.subTotal, 0)
    const vat = Math.round(before * 0.08)
    return {
        orderId,
        tableNumber: String(tableNumber),
        tableName: `Bàn ${tableNumber}`,
        createdAt: `${NOW}T${String(9 + (seed % 10)).padStart(2, '0')}:24:00`,
        orderItems: items,
        totalAmountBeforeVat: before,
        vatAmount: vat,
        finalAmount: before + vat,
    }
}

/** order.ts · KitchenOrderItemResponse — phiếu bếp. */
const KITCHEN_ITEMS = Array.from({length: 9}, (_, i) => ({
    orderItemId: 700 + i,
    orderId: 101 + (i % 5),
    tableNumber: String((i % 12) + 1),
    dishName: DISHES[i % DISHES.length].name,
    quantity: 1 + (i % 4),
    note: i % 3 === 0 ? 'Không hành, ít cay, thêm một bát nước dùng' : undefined,
    status: ITEM_STATUSES[i % 3],
    createdAt: `${NOW}T${String(10 + (i % 8)).padStart(2, '0')}:${String(5 + i * 6).padStart(2, '0')}:00`,
}))

/** chef.ts · CancelledOrderResponse */
const CANCELLED = Array.from({length: 5}, (_, i) => ({
    orderItemId: 800 + i,
    orderId: 101 + i,
    tableNumber: String((i % 12) + 1),
    dishName: DISHES[(i + 3) % DISHES.length].name,
    quantity: 1 + (i % 2),
    cancelReason: ['Hết nguyên liệu', 'Khách đổi ý', 'Gọi nhầm món', 'Bếp báo quá tải', 'Khách huỷ bàn'][i],
    cancelledAt: `${NOW}T${String(12 + i).padStart(2, '0')}:18:00`,
}))

/** chef.ts · GroupedKitchenOrderResponse */
const GROUPED = Array.from({length: 6}, (_, i) => ({
    groupKey: `dish-${i + 1}-${i % 2 === 0 ? 'nonote' : 'note'}`,
    dishId: i + 1,
    dishName: DISHES[i].name,
    note: i % 2 === 1 ? 'Không hành' : undefined,
    hasNote: i % 2 === 1,
    totalQuantity: 3 + i * 2,
    earliestCreatedAt: `${NOW}T${String(10 + i).padStart(2, '0')}:12:00`,
    items: Array.from({length: 2 + (i % 3)}, (_, k) => ({
        orderItemId: 900 + i * 10 + k,
        orderId: 101 + k,
        tableNumber: String(((i + k) % 12) + 1),
        quantity: 1 + (k % 2),
        createdAt: `${NOW}T${String(10 + i).padStart(2, '0')}:${String(12 + k * 7).padStart(2, '0')}:00`,
    })),
}))

/** chef.ts · DishListResponse */
const CHEF_DISHES = DISHES.map((d, i) => ({
    dishId: d.id,
    dishName: d.name,
    category: d.categoryName,
    price: d.price,
    available: d.isAvailable,
}))

/** waiter.ts · MenuItemResponse */
const MENU_ITEMS = DISHES.map((d) => ({
    dishId: d.id,
    name: d.name,
    description: d.description,
    price: d.price,
    imageUrl: '',
    categoryName: d.categoryName,
    available: d.isAvailable,
}))

/** waiter.ts · ReservationResponse — đủ bốn trạng thái ReservationStatus. */
const RESERVATION_STATUSES = ['QUEUED', 'WAITING', 'COMPLETED', 'CANCELLED']

const RESERVATIONS = Array.from({length: 6}, (_, i) => ({
    id: 501 + i,
    reservationId: 501 + i,
    customerName: ['Nguyễn Văn An', 'Trần Thị Bích', 'Đặng Quốc Cường Hoàng Gia Bảo'][i % 3],
    phone: `090${1234567 + i}`,
    note: i === 1 ? 'Sinh nhật, cần bánh và nến' : null,
    tableId: i + 1,
    tableNumber: String(i + 1),
    reservationTime: `2026-09-28T${String(18 + (i % 4)).padStart(2, '0')}:30:00`,
    status: RESERVATION_STATUSES[i % 4],
}))

/** customer.ts · CustomerReservationResponse */
const CUSTOMER_RESERVATIONS = RESERVATIONS.map((r, i) => ({
    id: r.id,
    customerName: r.customerName,
    phone: r.phone,
    reservationTime: r.reservationTime,
    note: r.note,
    status: ['QUEUED', 'WAITING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'][i % 5],
    tableNumber: r.tableNumber,
    capacity: [2, 4, 6][i % 3],
    tableStatus: TABLE_STATUSES[i % 3],
    createdAt: `${NOW}T09:00:00`,
    updatedAt: `${NOW}T09:00:00`,
}))

/** cashier.ts · TableDashboardResponse */
const CASHIER_TABLES = TABLES.map((t, i) => ({
    tableId: t.tableId,
    tableNumber: t.tableNumber,
    status: t.status,
    orderId: t.status === 'SERVING' ? 101 + i : null,
    totalAmount: t.status === 'SERVING' ? 285000 + i * 96000 : null,
}))

/** cashier.ts · InvoiceSummary */
const INVOICE_SUMMARIES = Array.from({length: 8}, (_, i) => ({
    invoiceId: 901 + i,
    tableNumber: String((i % 12) + 1),
    invoiceDate: `${NOW}T${String(11 + i).padStart(2, '0')}:05:00`,
    finalAmount: 285000 + i * 120000,
    customerName: [null, 'Nguyễn Văn An', 'Trần Thị Bích'][i % 3],
    paymentMethod: ['CASH', 'QRCODE'][i % 2],
    pointsUsed: i % 3 === 1 ? 50 : null,
    pointsEarned: i % 3 === 1 ? 28 : null,
}))

/** cashier.ts · InvoiceDetail */
function invoiceDetail(invoiceId) {
    const d = orderDetail(101, 4, 2)
    return {
        invoiceId,
        tableNumber: '4',
        invoiceDate: `${NOW}T12:05:00`,
        items: d.orderItems.map((it) => ({
            dishName: it.dishName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subTotal: it.subTotal,
        })),
        totalBeforeVat: d.totalAmountBeforeVat,
        vatAmount: d.vatAmount,
        finalAmount: d.finalAmount,
        paymentMethod: 'CASH',
        amountPaid: 500000,
        excessAmount: 500000 - d.finalAmount,
        customerName: 'Nguyễn Văn An',
        pointsUsed: 50,
        pointsEarned: 28,
    }
}

/** admin.ts · UserProfileResponse */
const USERS = [
    ['ADMIN', 'Quản trị viên hệ thống', 'admin'],
    ['CHEF', 'Hoàng Văn Bếp', 'chef01'],
    ['CHEF', 'Nguyễn Thị Hương', 'chef02'],
    ['WAITER', 'Phạm Thu Hà', 'waiter01'],
    ['WAITER', 'Lê Minh Tuấn', 'waiter02'],
    ['CASHIER', 'Vũ Minh Khoa', 'cashier01'],
    ['CUSTOMER', 'Nguyễn Văn An', 'kh001'],
    ['CUSTOMER', 'Trần Thị Bích Ngọc Hoàng Yến', 'kh002'],
].map(([role, fullName, username], i) => ({
    userId: i + 1,
    username,
    fullName,
    phone: `098${7654321 - i}`,
    email: `nguoidung${i + 1}@rims.vn`,
    role,
    active: i !== 4,
    isActive: i !== 4,
    rewardPoints: role === 'CUSTOMER' ? 120 + i * 45 : undefined,
}))

/** admin.ts · PageResponse<T> */
function page(content) {
    return {
        content,
        page: 0,
        size: 20,
        totalElements: content.length,
        totalPages: 1,
        first: true,
        last: true,
    }
}

/** restaurant.ts · RestaurantProfile */
const RESTAURANT = {
    name: 'Quán Gạo Mới',
    tagline: 'Cơm Việt nấu bếp than',
    description:
        'Quán mở từ 2019, nấu cơm Việt trên bếp than, thực đơn đổi theo mùa và theo chợ sáng.',
    logoUrl: null,
    heroImageUrl: null,
    address: 'Số 8 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội',
    phone: '0243 869 1234',
    email: 'lienhe@gaomoi.vn',
    openingHours: '08:00 - 22:00 mỗi ngày',
    reservationWindow: '08:00 - 20:00',
}

/** admin.ts · DailyRevenueItem */
const DAILY_ITEMS = Array.from({length: 7}, (_, i) => ({
    dayLabel: ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'][i],
    date: `2026-09-${String(21 + i).padStart(2, '0')}`,
    revenue: 4_200_000 + Math.round(Math.sin(i) * 1_800_000) + i * 320_000,
}))

/** admin.ts · BestSellingReportResponse */
const BEST_SELLING = {
    fromDate: '2026-09-01',
    toDate: NOW,
    dataRangeNote: 'Số liệu tính từ 01/09 tới hôm nay.',
    items: DISHES.slice(0, 5).map((d, i) => ({
        rank: i + 1,
        dishName: d.name,
        imageUrl: null,
        totalQuantity: 142 - i * 18,
        totalRevenue: (142 - i * 18) * d.price,
    })),
}

/** admin.ts · OrderShiftReportResponse — bốn ca khớp enum OrderShift. */
const SHIFTS = [
    ['MORNING', 'Ca sáng', '08:00', '11:00', 61],
    ['NOON', 'Ca trưa', '11:00', '14:00', 158],
    ['AFTERNOON', 'Ca chiều', '14:00', '17:00', 54],
    ['EVENING', 'Ca tối', '17:00', '22:00', 139],
].map(([shiftName, displayName, startTime, endTime, orderCount]) => ({
    shiftName,
    displayName,
    startTime,
    endTime,
    orderCount,
    percentage: Math.round((orderCount / 412) * 1000) / 10,
}))

const ORDER_SHIFTS = {
    startDate: '2026-09-01',
    endDate: NOW,
    totalPaidOrders: 412,
    averageOrdersPerDay: 15.3,
    highestOrderShift: SHIFTS[1],
    shifts: SHIFTS,
}

/**
 * Bảng khớp. Khoá là đường dẫn sau `/rims`, khớp theo THỨ TỰ từ trên xuống —
 * mẫu cụ thể phải đặt trước mẫu chung. `:x` khớp một đoạn, `*` khớp phần còn lại.
 */
export const FIXTURES = [
    ['/auth/me', () => USERS[0]],
    ['/me/profile', () => USERS[0]],

    ['/public/restaurant', () => RESTAURANT],
    ['/public/menu/best-selling', () =>
        DISHES.slice(0, 6).map((d, i) => ({rank: i + 1, dishName: d.name, imageUrl: ''}))],
    // Thực đơn công khai đã gom sẵn theo danh mục ở backend.
    ['/public/menu', () =>
        CATEGORIES.filter((c) => c.isAvailable).map((c) => ({
            categoryId: c.id,
            categoryName: c.name,
            description: c.description,
            dishes: DISHES.filter((d) => d.categoryName === c.name && !d.isHidden && d.isAvailable).map((d) => ({
                dishId: d.id,
                name: d.name,
                description: d.description,
                price: d.price,
                imageUrl: d.imageUrl || null,
            })),
        })).filter((s) => s.dishes.length > 0)],

    ['/admin/restaurant', () => RESTAURANT],
    ['/admin/revenue/today', () => ({revenue: 5_840_000, period: 'Hôm nay'})],
    ['/admin/revenue/total', () => ({revenue: 68_430_000, period: 'Tất cả'})],
    ['/admin/revenue/daily', () => ({revenue: 5_840_000, period: NOW})],
    ['/admin/revenue/weekly', () => ({fromDate: '2026-09-21', toDate: '2026-09-27', items: DAILY_ITEMS})],
    ['/admin/revenue/monthly', () => ({revenue: 68_430_000, period: 'Tháng 9/2026'})],
    ['/admin/revenue/yearly', () => ({revenue: 742_100_000, period: 'Năm 2026'})],
    ['/admin/revenue/custom', () => ({fromDate: '2026-09-21', toDate: '2026-09-27', items: DAILY_ITEMS})],
    ['/admin/revenue/best-selling', () => BEST_SELLING],
    ['/admin/revenue/order-shifts', () => ORDER_SHIFTS],

    ['/admin/invoice/history', () => ({
        items: INVOICE_SUMMARIES.map((s, i) => ({
            invoiceId: s.invoiceId,
            orderId: 101 + i,
            tableNumber: s.tableNumber,
            paymentMethod: s.paymentMethod,
            amount: s.finalAmount,
            paymentDate: s.invoiceDate,
        })),
        page: 0,
        pageSize: 20,
        totalItems: INVOICE_SUMMARIES.length,
        totalPages: 1,
    })],
    ['/admin/invoice/:id', (m) => {
        const d = invoiceDetail(Number(m[0]))
        return {
            invoiceId: d.invoiceId,
            orderId: 101,
            tableNumber: d.tableNumber,
            paymentMethod: d.paymentMethod,
            totalBeforeVat: d.totalBeforeVat,
            vatAmount: d.vatAmount,
            finalAmount: d.finalAmount,
            amountPaid: d.amountPaid,
            excessAmount: d.excessAmount,
            invoiceDate: d.invoiceDate,
            items: d.items.map((it) => ({
                dishName: it.dishName,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                amount: it.subTotal,
            })),
        }
    }],

    ['/admin/user/staff', () => page(USERS.filter((u) => u.role !== 'CUSTOMER'))],
    ['/admin/user/customer', () => page(USERS.filter((u) => u.role === 'CUSTOMER'))],
    ['/admin/user/:id', (m) => USERS[Number(m[0]) - 1] ?? USERS[0]],

    ['/admin/category/all', () => CATEGORIES],
    ['/admin/category/:id', (m) => CATEGORIES[Number(m[0]) - 1] ?? CATEGORIES[0]],
    ['/admin/dish/all', () => DISHES],
    ['/admin/menu', () => ({
        totalDishes: DISHES.length,
        totalCategories: CATEGORIES.length,
        totalPausedDishes: DISH_SUMMARIES.filter((d) => d.status === 'PAUSED').length,
        totalHiddenDishes: DISH_SUMMARIES.filter((d) => d.status === 'HIDDEN').length,
        latestDishes: DISH_SUMMARIES.slice(0, 5),
        categoryStats: CATEGORIES.map((c) => ({
            categoryName: c.name,
            status: c.isAvailable ? 'ACTIVE' : 'HIDDEN',
            dishCount: c.dishCount,
        })),
        allPausedDishesList: DISH_SUMMARIES.filter((d) => d.status === 'PAUSED'),
    })],
    // AdminTable KHÁC TableDetailResponse: khoá là `id`, và có active,
    // orderCount, reservationCount, deletable. Bản đầu tôi trả TableDetail ở
    // đây nên màn Mặt bằng lọc `active` ra rỗng và vẽ một sơ đồ trống.
    ['/admin/table/all', () => ADMIN_TABLES],
    ['/admin/table/:id', (m) => ADMIN_TABLES[Number(m[0]) - 1] ?? ADMIN_TABLES[0]],

    ['/chef/dashboard', () => ({
        preparingCount: 7,
        completedCount: 96,
        cancelledCount: 2,
        unavailableDishCount: 3,
    })],
    ['/chef/orders/grouped', () => GROUPED],
    ['/chef/orders/completed', () =>
        KITCHEN_ITEMS.map((it) => ({...it, status: 'COMPLETED'}))],
    ['/chef/orders/cancelled', () => CANCELLED],
    ['/chef/orders', () => KITCHEN_ITEMS],
    ['/chef/dishes', () => CHEF_DISHES],

    ['/waiter/tables/:id/blocked-slots', () => [
        {start: '2026-09-28T12:00:00', end: '2026-09-28T13:30:00'},
        {start: '2026-09-28T19:00:00', end: '2026-09-28T20:30:00'},
    ]],
    ['/waiter/tables', () => withFloor(TABLES)],
    ['/waiter/menu', () => MENU_ITEMS],
    // MẢNG, không phải một đơn: một bàn có thể có nhiều đơn đang phục vụ, và
    // màn Chi tiết đơn gộp chúng bằng flatMap.
    ['/waiter/detail/:tableId', (m) => [
        orderDetail(101, m[0], Number(m[0])),
        orderDetail(102, m[0], Number(m[0]) + 4),
    ]],
    ['/waiter/orders/:id', (m) => orderDetail(Number(m[0]), 2, 2)],
    ['/waiter/reservation/detail/:tableId', (m) =>
        RESERVATIONS.find((r) => String(r.tableId) === m[0]) ?? RESERVATIONS[0]],
    ['/waiter/reservation/:tableId/:date', () => RESERVATIONS.slice(0, 3)],
    ['/waiter/reservations/:id/orders', () => [orderDetail(101, 2, 2)]],
    ['/waiter/reservations/:id', (m) =>
        RESERVATIONS.find((r) => String(r.id) === m[0]) ?? RESERVATIONS[0]],
    ['/waiter/reservations', () => RESERVATIONS],

    ['/cashier/tables', () => CASHIER_TABLES],
    ['/cashier/payment-methods', () => ['CASH', 'QRCODE']],
    ['/cashier/customers/search', () => USERS.filter((u) => u.role === 'CUSTOMER')],
    ['/cashier/invoices/today', () => ({
        content: INVOICE_SUMMARIES,
        page: 0,
        size: 20,
        totalElements: INVOICE_SUMMARIES.length,
        totalPages: 1,
    })],
    ['/cashier/invoices/:id', (m) => invoiceDetail(Number(m[0]))],
    ['/cashier/orders/:id', (m) => orderDetail(Number(m[0]), 4, 2)],

    ['/customer/reservations/current', () => CUSTOMER_RESERVATIONS[0]],
    ['/customer/reservations', () => CUSTOMER_RESERVATIONS],
    ['/customer/tables/available', () =>
        TABLES.map((t) => ({
            id: t.tableId,
            tableNumber: t.tableNumber,
            capacity: t.capacity,
            status: t.status === 'SERVING' ? 'OCCUPIED' : t.status,
        }))],
    ['/customer/tables/:id/blocked-slots', () => [
        {start: '2026-09-28T12:00:00', end: '2026-09-28T13:30:00'},
    ]],
]

/** Khớp một đường dẫn với bảng trên. Trả về dữ liệu, hoặc `undefined` nếu không khớp. */
export function match(path) {
    const clean = path.replace(/^\/rims/, '').split('?')[0].replace(/\/$/, '') || '/'

    for (const [pattern, build] of FIXTURES) {
        const parts = pattern.split('/')
        const actual = clean.split('/')
        const captured = []
        let ok = true

        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === '*') {
                captured.push(actual.slice(i).join('/'))
                return build(captured)
            }
            if (actual[i] === undefined) {
                ok = false
                break
            }
            if (parts[i].startsWith(':')) {
                captured.push(actual[i])
                continue
            }
            if (parts[i] !== actual[i]) {
                ok = false
                break
            }
        }

        if (ok && parts.length === actual.length) {
            return build(captured)
        }
    }

    return undefined
}

/**
 * Người dùng giả theo vai. Gieo vào localStorage để ProtectedRoute cho đi qua.
 *
 * getCurrentUser() đọc `currentUser` từ localStorage TRƯỚC khi gọi mạng, nên
 * chỉ cần hai khoá đó là phiên coi như đã khôi phục — không cần backend.
 */
export const ACTORS = {
    ADMIN: USERS[0],
    CHEF: USERS[1],
    WAITER: USERS[3],
    CASHIER: USERS[5],
    CUSTOMER: USERS[6],
}
