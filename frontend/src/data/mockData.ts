export const mockUsers = [
    {
        id: 1,
        fullName: 'Quản trị viên',
        username: 'admin',
        role: 'Admin',
        status: 'Đang hoạt động',
    },
    {
        id: 2,
        fullName: 'Đầu bếp',
        username: 'chef',
        role: 'Chef',
        status: 'Đang hoạt động',
    },
    {
        id: 3,
        fullName: 'Phục vụ',
        username: 'waiter',
        role: 'Waiter',
        status: 'Đang hoạt động',
    },
    {
        id: 4,
        fullName: 'Thu ngân',
        username: 'cashier',
        role: 'Cashier',
        status: 'Đang hoạt động',
    },
]

export const mockTables = [
    { id: 1, tableNumber: 'T01', capacity: 2, status: 'AVAILABLE' },
    { id: 2, tableNumber: 'T02', capacity: 2, status: 'OCCUPIED' },
    { id: 3, tableNumber: 'T03', capacity: 4, status: 'AVAILABLE' },
    { id: 4, tableNumber: 'T04', capacity: 4, status: 'OCCUPIED' },
    { id: 5, tableNumber: 'T05', capacity: 4, status: 'AVAILABLE' },
    { id: 6, tableNumber: 'T06', capacity: 8, status: 'AVAILABLE' },
]

export const mockDishes = [
    {
        id: 1,
        name: 'Fried Rice',
        category: 'Main Course',
        price: 50000,
        available: true,
    },
    {
        id: 2,
        name: 'Pho Bo',
        category: 'Main Course',
        price: 65000,
        available: true,
    },
    {
        id: 3,
        name: 'Bun Cha',
        category: 'Main Course',
        price: 60000,
        available: true,
    },
    {
        id: 4,
        name: 'Coca Cola',
        category: 'Drink',
        price: 15000,
        available: true,
    },
]

export const mockOrders = [
    {
        id: 1,
        tableNumber: 'T01',
        items: 'Fried Rice x2, Coca Cola x2',
        totalAmount: 140000,
        status: 'PREPARING',
    },
    {
        id: 2,
        tableNumber: 'T02',
        items: 'Pho Bo x1, Bun Cha x2',
        totalAmount: 200000,
        status: 'PREPARING',
    },
    {
        id: 3,
        tableNumber: 'T03',
        items: 'Fried Rice x1, Orange Juice x2',
        totalAmount: 180000,
        status: 'COMPLETED',
    },
]

export const mockInvoices = [
    {
        id: 'INV001',
        tableNumber: 'T03',
        totalAmount: 180000,
        paymentMethod: 'Cash',
        status: 'PAID',
    },
    {
        id: 'INV002',
        tableNumber: 'T04',
        totalAmount: 220000,
        paymentMethod: 'VNPay',
        status: 'PAID',
    },
]

export function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value)
}