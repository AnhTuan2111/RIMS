import {useEffect, useState} from 'react'

import {useRestaurant} from '@/app/providers/useRestaurant'
import {
    getPublicBestSellingDishes,
    getPublicMenu,
    type PublicBestSellingDish,
    type PublicMenuSection,
} from '@/shared/api/public'
import {duongDanAnh, dungAnhThayThe} from '@/shared/utils/image'

import {DishStrip} from './DishStrip'
import {HomeAuthPanel} from './HomeAuthPanel'

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
 *   <li><b>Thực đơn ngay</b> — khi đã có món. Món ăn chính là trang bìa: khách
 *       thấy đồ ăn và giá trước khi đọc chữ giới thiệu.</li>
 *   <li><b>Bảng hiệu</b> — khi chưa có món nào. Tên quán chiếm phần trên. Quán
 *       mới cài app chưa nhập thực đơn thì rơi vào dáng này, và nó vẫn là một
 *       trang tử tế chứ không phải một lưới rỗng.</li>
 * </ul>
 */
export default function HomePage() {
    const {profile} = useRestaurant()

    const [strip, setStrip] = useState<PublicBestSellingDish[]>([])
    const [menu, setMenu] = useState<PublicMenuSection[]>([])

    useEffect(() => {
        const controller = new AbortController()

        // Hai lời gọi độc lập: băng ảnh hỏng thì thực đơn vẫn hiện, và ngược
        // lại. Không có món nào thì trang rơi về dáng "Bảng hiệu", đó là một
        // trạng thái hợp lệ chứ không phải lỗi cần báo.
        getPublicBestSellingDishes(controller.signal)
            .then(setStrip)
            .catch(() => {})
        getPublicMenu(controller.signal)
            .then(setMenu)
            .catch(() => {})

        return () => controller.abort()
    }, [])

    const name = profile?.name ?? ''
    const tagline = profile?.tagline
    const description = profile?.description
    const initial = name.trim().charAt(0).toUpperCase()

    const coThucDon = menu.length > 0

    const contacts = [
        profile?.address && {label: 'Địa chỉ', value: profile.address},
        profile?.phone && {label: 'Điện thoại', value: profile.phone},
        profile?.openingHours && {
            label: 'Giờ mở cửa',
            value: profile.openingHours,
        },
        // Giờ mở cửa và giờ nhận đặt bàn là hai thứ khác nhau: quán có thể mở
        // tới 22:30 nhưng hệ thống chỉ nhận đặt tới 20:00. Nói rõ cả hai để
        // khách không chọn giờ rồi mới bị từ chối.
        profile?.reservationHours && {
            label: 'Nhận đặt bàn',
            value: profile.reservationHours,
        },
    ].filter(Boolean) as {label: string; value: string}[]

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

                {/* Băng danh mục DÍNH ngay dưới hàng nhận diện. Thực đơn dài hơn
                    màn hình, và khách tìm "đồ uống" không nên phải cuộn qua bốn
                    mươi món chính để tới đó. */}
                {coThucDon && (
                    <nav className="rk-home__cats" aria-label="Danh mục thực đơn">
                        {menu.map((section) => (
                            <a
                                key={section.categoryId}
                                className="rk-home__cat"
                                href={`#dm-${section.categoryId}`}
                            >
                                {section.categoryName}
                            </a>
                        ))}
                    </nav>
                )}
            </header>

            <div className="rk-home__top">
                <div className="rk-home__topmain">
                    <p className="rk-home__eyebrow">Thực đơn hôm nay</p>

                    <h1 className="rk-home__title rk-home__title--sm">{name}</h1>

                    {tagline && (
                        <p className="rk-home__lede">
                            {tagline}
                            {profile?.openingHours && ` · ${profile.openingHours}`}
                        </p>
                    )}

                    {!coThucDon && description && (
                        <p className="rk-home__desc">{description}</p>
                    )}
                </div>

                <HomeAuthPanel />
            </div>

            <DishStrip dishes={strip} />

            {menu.map((section) => (
                <section
                    className="rk-home__section"
                    id={`dm-${section.categoryId}`}
                    key={section.categoryId}
                >
                    <h2 className="rk-home__h2">{section.categoryName}</h2>

                    {section.description && (
                        <p className="rk-home__catdesc">{section.description}</p>
                    )}

                    <ul className="rk-home__dishes">
                        {section.dishes.map((dish) => (
                            <li className="rk-home__dish" key={dish.dishId}>
                                <img
                                    className="rk-home__dishimg"
                                    src={duongDanAnh(dish.imageUrl)}
                                    alt=""
                                    loading="lazy"
                                    onError={dungAnhThayThe}
                                />

                                <span className="rk-home__dishname">{dish.name}</span>

                                {dish.description && (
                                    <span className="rk-home__dishdesc">
                                        {dish.description}
                                    </span>
                                )}

                                <span className="rk-home__dishprice">
                                    {dish.price.toLocaleString('vi-VN')}đ
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            {contacts.length > 0 && (
                <section className="rk-home__section" id="lien-he">
                    <h2 className="rk-home__h2">Ghé quán</h2>

                    <dl className="rk-home__contacts">
                        {contacts.map(({label, value}) => (
                            <div className="rk-home__contact" key={label}>
                                <dt>{label}</dt>
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
