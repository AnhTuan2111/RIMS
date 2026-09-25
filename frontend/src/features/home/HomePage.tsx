import {Link} from 'react-router-dom'
import {useEffect, useState} from 'react'
import {CalendarClock, Clock, MapPin, Phone} from 'lucide-react'

import {useRestaurant} from '@/app/providers/useRestaurant'
import {getPublicBestSellingDishes, type PublicBestSellingDish} from '@/shared/api/public'
import {duongDanAnh} from '@/shared/utils/image'

/**
 * Trang công khai của nhà hàng.
 *
 * <p>Toàn bộ nội dung nhận diện đọc từ cấu hình admin, không viết cứng một chữ
 * nào. Bản cũ nhắc "Trung Hoa" 15 lần và có hai khối hoàn toàn bịa — bốn thẻ
 * "Đặc sản" đánh số và ba mục "Vì sao chọn chúng tôi" — đều là văn quảng cáo
 * về một nền ẩm thực cụ thể, sẽ sai với bất kỳ quán nào khác dùng app này.
 *
 * <p>Trang có HAI dáng, tự chọn theo dữ liệu:
 *
 * <ul>
 *   <li><b>Thực đơn ngay</b> — khi đã có món bán chạy. Món ăn chính là trang
 *       bìa: khách thấy đồ ăn và giá trước khi đọc chữ giới thiệu.</li>
 *   <li><b>Bảng hiệu</b> — khi chưa có món nào. Tên quán chiếm phần trên, hai
 *       nút. Quán mới cài app chưa nhập thực đơn thì rơi vào dáng này, và nó
 *       vẫn là một trang tử tế chứ không phải một lưới rỗng.</li>
 * </ul>
 */
export default function HomePage() {
    const {profile} = useRestaurant()

    const [dishes, setDishes] = useState<PublicBestSellingDish[]>([])

    useEffect(() => {
        const controller = new AbortController()

        getPublicBestSellingDishes(controller.signal)
            .then(setDishes)
            .catch(() => {
                // Im lặng: không có món thì trang rơi về dáng "Bảng hiệu",
                // đó là một trạng thái hợp lệ chứ không phải lỗi cần báo.
            })

        return () => controller.abort()
    }, [])

    const name = profile?.name ?? ''
    const tagline = profile?.tagline
    const description = profile?.description
    const initial = name.trim().charAt(0).toUpperCase()

    const coThucDon = dishes.length > 0

    const contacts = [
        profile?.address && {icon: MapPin, label: 'Địa chỉ', value: profile.address},
        profile?.phone && {icon: Phone, label: 'Điện thoại', value: profile.phone},
        profile?.openingHours && {
            icon: Clock,
            label: 'Giờ mở cửa',
            value: profile.openingHours,
        },
        // Giờ mở cửa và giờ nhận đặt bàn là hai thứ khác nhau: quán có thể mở
        // tới 22:30 nhưng hệ thống chỉ nhận đặt tới 20:00. Nói rõ cả hai để
        // khách không chọn giờ rồi mới bị từ chối.
        profile?.reservationHours && {
            icon: CalendarClock,
            label: 'Nhận đặt bàn',
            value: profile.reservationHours,
        },
    ].filter(Boolean) as {icon: typeof MapPin; label: string; value: string}[]

    return (
        <main className="rk-home">
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

                <Link className="rk-btn rk-btn--quiet" to="/login">
                    Đăng nhập
                </Link>
            </header>

            {coThucDon ? (
                <>
                    {/* Dáng "Thực đơn ngay": đầu trang gọn, nhường chỗ cho món. */}
                    <section className="rk-home__lead">
                        <div className="rk-home__leadtext">
                            <p className="rk-home__eyebrow">
                                Được gọi nhiều nhất tuần này
                            </p>

                            <h1 className="rk-home__title rk-home__title--sm">{name}</h1>

                            {tagline && (
                                <p className="rk-home__lede">
                                    {tagline}
                                    {profile?.openingHours &&
                                        ` · ${profile.openingHours}`}
                                </p>
                            )}
                        </div>

                        <Link className="rk-btn rk-btn--primary rk-btn--lg" to="/login">
                            Đặt bàn
                        </Link>
                    </section>

                    <section className="rk-home__section" id="thuc-don">
                        <ol className="rk-home__dishes">
                            {dishes.map((dish) => (
                                <li className="rk-home__dish" key={dish.rank}>
                                    <img
                                        className="rk-home__dishimg"
                                        src={duongDanAnh(dish.imageUrl)}
                                        alt=""
                                        loading="lazy"
                                    />

                                    <span className="rk-home__dishrank rk-num">
                                        {dish.rank}
                                    </span>

                                    <span className="rk-home__dishname">
                                        {dish.dishName}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </>
            ) : (
                /* Dáng "Bảng hiệu": chưa có món thì tên quán gánh cả trang. */
                <section className="rk-home__hero">
                    <h1 className="rk-home__title">{name}</h1>

                    {tagline && <p className="rk-home__lede">{tagline}</p>}

                    {description && <p className="rk-home__desc">{description}</p>}

                    <div className="rk-home__actions">
                        <Link className="rk-btn rk-btn--primary rk-btn--lg" to="/login">
                            Đặt bàn
                        </Link>
                    </div>
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
