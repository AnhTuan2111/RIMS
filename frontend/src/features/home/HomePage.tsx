import {Link} from 'react-router-dom'
import {useEffect, useState} from 'react'
import {Clock, MapPin, Phone} from 'lucide-react'

import {useRestaurant} from '@/app/providers/useRestaurant'
import {getPublicBestSellingDishes, type PublicBestSellingDish} from '@/shared/api/public'

/**
 * Trang công khai của nhà hàng.
 *
 * <p>Toàn bộ nội dung nhận diện đọc từ cấu hình admin, không viết cứng. Bản cũ
 * nhắc "Trung Hoa" 15 lần và có hai khối hoàn toàn bịa: bốn thẻ "Đặc sản" đánh
 * số 01–04 và ba mục "Vì sao chọn chúng tôi" — đều là văn quảng cáo về một nền
 * ẩm thực cụ thể, sẽ sai với bất kỳ quán nào khác dùng app này. Thay bằng dữ
 * liệu thật: mô tả do chủ quán nhập, món bán chạy lấy từ API, và thông tin liên
 * hệ — thứ người xem trang nhà hàng thật sự cần.
 */
export default function HomePage() {
    const {profile} = useRestaurant()

    const [bestSellingDishes, setBestSellingDishes] = useState<PublicBestSellingDish[]>(
        [],
    )

    useEffect(() => {
        const controller = new AbortController()

        getPublicBestSellingDishes(controller.signal)
            .then(setBestSellingDishes)
            .catch(() => {
                // Im lặng bỏ qua: mục này chỉ đơn giản không hiện nếu API lỗi.
            })

        return () => controller.abort()
    }, [])

    const name = profile?.name ?? 'Nhà hàng'
    const tagline = profile?.tagline
    const description = profile?.description
    const initial = name.trim().charAt(0).toUpperCase()

    const contacts = [
        profile?.address && {icon: MapPin, label: 'Địa chỉ', value: profile.address},
        profile?.phone && {icon: Phone, label: 'Điện thoại', value: profile.phone},
        profile?.openingHours && {
            icon: Clock,
            label: 'Giờ mở cửa',
            value: profile.openingHours,
        },
    ].filter(Boolean) as {icon: typeof MapPin; label: string; value: string}[]

    return (
        <main className="rk-home">
            {/* Masthead: tên quán và một hành động duy nhất. Bản cũ là wordmark
                trái + 5 link + nút phải — đúng khuôn nav mà mọi trang landing
                do máy sinh đều dùng. */}
            <header className="rk-home__masthead">
                <div className="rk-home__brand">
                    {profile?.logoUrl ? (
                        <img
                            className="rk-home__logo"
                            src={profile.logoUrl}
                            alt=""
                            width={44}
                            height={44}
                        />
                    ) : (
                        <span className="rk-home__logo rk-home__logo--letter">
                            {initial}
                        </span>
                    )}

                    <span className="rk-home__brandtext">
                        <strong>{name}</strong>
                        {tagline && <span>{tagline}</span>}
                    </span>
                </div>

                <Link className="rk-btn rk-btn--primary" to="/login">
                    Đăng nhập
                </Link>
            </header>

            {/* Hero cao bằng nội dung, lệch trái. Bản cũ dùng min-height:100vh
                với hai lớp radial-gradient chồng sau chữ. */}
            <section className="rk-home__hero">
                <h1 className="rk-home__title">{name}</h1>

                {tagline && <p className="rk-home__lede">{tagline}</p>}

                {description && <p className="rk-home__desc">{description}</p>}

                <div className="rk-home__actions">
                    <Link className="rk-btn rk-btn--primary rk-btn--lg" to="/login">
                        Đặt bàn
                    </Link>

                    {bestSellingDishes.length > 0 && (
                        <a className="rk-btn rk-btn--quiet rk-btn--lg" href="#thuc-don">
                            Xem món nổi bật
                        </a>
                    )}
                </div>
            </section>

            {bestSellingDishes.length > 0 && (
                <section className="rk-home__section" id="thuc-don">
                    <h2 className="rk-home__h2">Món được gọi nhiều nhất tuần này</h2>

                    <ol className="rk-home__dishes">
                        {bestSellingDishes.map((dish) => (
                            <li className="rk-home__dish" key={dish.rank}>
                                <img
                                    className="rk-home__dishimg"
                                    src={`/image/${dish.imageUrl}`}
                                    alt=""
                                    loading="lazy"
                                />

                                <span className="rk-home__dishrank rk-num">
                                    {dish.rank}
                                </span>

                                <span className="rk-home__dishname">{dish.dishName}</span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {contacts.length > 0 && (
                <section className="rk-home__section" id="lien-he">
                    <h2 className="rk-home__h2">Ghé quán</h2>

                    <dl className="rk-home__contacts">
                        {contacts.map(({icon: Icon, label, value}) => (
                            <div className="rk-home__contact" key={label}>
                                <dt>
                                    <Icon className="rk-icon" aria-hidden="true" />
                                    {label}
                                </dt>
                                <dd>{value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}

            <footer className="rk-home__footer">
                <p>
                    © {new Date().getFullYear()} {name}
                    {profile?.email && <> · {profile.email}</>}
                </p>
            </footer>
        </main>
    )
}
