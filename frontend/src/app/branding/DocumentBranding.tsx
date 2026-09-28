import {useEffect, useSyncExternalStore} from 'react'
import {useLocation} from 'react-router-dom'

import {matchMenu} from '@/app/config/roleMenus'
import {useActor} from '@/app/providers/ActorContext'
import {useAuth} from '@/app/providers/AuthContext'
import {useRestaurant} from '@/app/providers/useRestaurant'
import {duongDanAnh} from '@/shared/utils/image'

import {getTitleBadge, subscribeTitleBadge} from './titleBadge'

/** Tên các màn không nằm trong menu của vai nào. */
const PUBLIC_LABELS: Record<string, string> = {
    '/login': 'Đăng nhập',
    '/register': 'Đăng ký',
    '/forgot-password': 'Quên mật khẩu',
    '/change-password': 'Đổi mật khẩu',
    '/profile': 'Hồ sơ',
}

/** index.html đọc khoá này TRƯỚC khi React chạy — xem đoạn script ở đó. */
const CACHE_KEY = 'rims.brand'

/**
 * Biểu tượng tab khi quản trị chưa tải logo: ô vuông màu nhấn của rail mang
 * chữ cái đầu tên quán — đúng hình cái logo ở góc trên rail, để tab và app
 * nhận ra nhau.
 */
function letterIcon(letter: string, color: string) {
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
        `<rect width="32" height="32" fill="${color}"/>` +
        `<text x="16" y="23" text-anchor="middle" font-family="Archivo, Arial, sans-serif" ` +
        `font-size="20" font-weight="800" fill="#ffffff">${letter}</text></svg>`

    return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function setFavicon(href: string) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

    if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
    }

    // Logo tải lên có thể là PNG/JPG; bỏ type cố định "image/svg+xml" đi, không
    // thì trình duyệt bỏ qua biểu tượng.
    link.removeAttribute('type')
    link.href = href
}

/**
 * Tên tab và biểu tượng tab theo HỒ SƠ NHÀ HÀNG mà quản trị đặt.
 *
 * <p>Trước đây tab ghi cố định "RIMS — Hệ thống quản lý nhà hàng" với cái nĩa
 * trên nền xanh cổ vịt — tên dự án và màu của thiết kế cũ, không phải của quán.
 * Nay trang chủ ghi "Yamazato — khẩu hiệu", còn trong app ghi "tên màn ·
 * Yamazato", để mở năm tab vẫn biết tab nào là màn nào.
 *
 * <p>Tên và biểu tượng được lưu vào localStorage; index.html đặt chúng ngay khi
 * tải trang, nên lần sau mở app không còn nháy chữ mặc định.
 */
export function DocumentBranding() {
    const {profile} = useRestaurant()
    const {actor} = useActor()
    const {isAuthenticated} = useAuth()
    const {pathname} = useLocation()
    const badge = useSyncExternalStore(subscribeTitleBadge, getTitleBadge)

    const name = profile?.name?.trim() ?? ''
    const tagline = profile?.tagline?.trim() ?? ''
    const logoUrl = profile?.logoUrl?.trim() ?? ''

    const menu = isAuthenticated ? matchMenu(actor, pathname) : null
    const label = PUBLIC_LABELS[pathname] ?? menu?.item?.label ?? menu?.entry?.label

    useEffect(() => {
        // Chưa có hồ sơ thì giữ tiêu đề đang có — index.html đã đặt nó từ bộ
        // nhớ đệm, thay bằng chữ mặc định lúc này là lùi lại.
        if (!name) {
            return
        }

        const base = label
            ? `${label} · ${name}`
            : tagline
              ? `${name} — ${tagline}`
              : name

        document.title = badge ? `(${badge}) ${base}` : base
    }, [name, tagline, label, badge])

    useEffect(() => {
        if (!name) {
            return
        }

        const accent =
            getComputedStyle(document.documentElement)
                .getPropertyValue('--rims-shell-accent')
                .trim() || '#c8271b'
        const icon = logoUrl
            ? duongDanAnh(logoUrl)
            : letterIcon(name.charAt(0).toUpperCase(), accent)

        setFavicon(icon)

        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({name, tagline, icon}))
        } catch {
            // Bị chặn lưu trữ thì lần sau chỉ nháy tên mặc định một chút — không sao.
        }
    }, [name, tagline, logoUrl])

    useEffect(() => {
        const text = profile?.description?.trim() || tagline

        if (!text) {
            return
        }

        document.querySelector('meta[name="description"]')?.setAttribute('content', text)
    }, [profile?.description, tagline])

    return null
}
