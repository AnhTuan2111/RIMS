import {expect, type Page} from '@playwright/test'

/** Mọi tài khoản trong bộ dữ liệu nền dùng chung một mật khẩu. */
export const PW = process.env.RIMS_PW ?? 'Rims@2026'

export const ACCOUNTS = {
    admin: 'admin',
    chef: 'chef01',
    waiter: 'waiter01',
    cashier: 'cashier01',
    customer: 'kh001',
} as const

/**
 * Đăng nhập THẬT qua biểu mẫu, không gieo token.
 *
 * <p>Gieo token vào localStorage nhanh hơn, nhưng nó bỏ qua đúng thứ cần kiểm:
 * biểu mẫu có gửi đi không, backend có nhận không, và app có đưa người dùng về
 * đúng màn của vai đó không.
 */
export async function login(page: Page, username: string) {
    await page.goto('/login')
    await page.fill('#login-username', username)
    await page.fill('#login-password', PW)
    await page.click('button[type="submit"]')

    await expect(page).not.toHaveURL(/\/login/, {timeout: 15_000})
}

export async function logout(page: Page) {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
}

/**
 * Gọi thẳng API với quyền của một vai.
 *
 * <p>Dùng để DỰNG tiền đề và để ĐỐI CHIẾU kết quả — không dùng để thay cho
 * thao tác đang kiểm. Ví dụ: bài kiểm "phục vụ gọi món" phải bấm qua giao
 * diện, nhưng việc tìm một cái bàn còn trống thì hỏi thẳng API cho nhanh.
 */
export async function api(username: string, path: string, init?: RequestInit) {
    const base = process.env.E2E_API ?? 'http://localhost:8080/rims'

    const auth = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, rawPassword: PW}),
    })

    if (!auth.ok) {
        throw new Error(`không đăng nhập được ${username}: ${auth.status}`)
    }

    const {accessToken} = await auth.json()

    const res = await fetch(base + path, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            ...(init?.headers ?? {}),
        },
    })

    const text = await res.text()

    if (!res.ok) {
        throw new Error(
            `${init?.method ?? 'GET'} ${path} → ${res.status} ${text.slice(0, 160)}`,
        )
    }

    return text ? JSON.parse(text) : null
}

/** Không màn nào được phép rỗng: React gỡ sạch cây DOM khi gặp lỗi lúc vẽ. */
export async function expectRendered(page: Page) {
    const count = await page.evaluate(
        () => document.getElementById('root')?.querySelectorAll('*').length ?? 0,
    )

    expect(count, 'màn vẽ ra rỗng').toBeGreaterThan(20)
}
