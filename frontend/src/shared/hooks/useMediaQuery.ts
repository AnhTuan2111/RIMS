import {useEffect, useState} from 'react'

/**
 * Khung nhìn hiện có khớp một media query không, và cập nhật khi nó đổi.
 *
 * <p>Chỉ dùng khi CẤU TRÚC phải khác nhau theo cỡ màn — một nút chỉ tồn tại ở
 * màn hẹp, một thuộc tính aria chỉ đúng ở một bên. Đổi hình thức thôi thì để
 * CSS lo: giấu một nút bằng CSS mà vẫn để nó trong cây trợ năng là để trình đọc
 * màn hình đọc ra một nút không làm gì.
 */
export function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

    useEffect(() => {
        const media = window.matchMedia(query)
        const update = () => setMatches(media.matches)

        update()
        media.addEventListener('change', update)

        return () => media.removeEventListener('change', update)
    }, [query])

    return matches
}
