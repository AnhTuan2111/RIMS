import {useEffect, useMemo, useState} from 'react'
import {Link} from 'react-router-dom'

import {useRestaurant} from '@/app/providers/useRestaurant'
import {
    getPublicBestSellingDishes,
    getPublicMenu,
    type PublicBestSellingDish,
    type PublicMenuSection,
} from '@/shared/api/public'
import {Icon} from '@/shared/components/ui/Icon'
import {formatCurrencyShort} from '@/shared/utils/format'
import {duongDanAnh, dungAnhThayThe} from '@/shared/utils/image'

import {DishStrip, type StripDish} from './DishStrip'
import {HomeAuthPanel} from './HomeAuthPanel'

/**
 * Trang công khai của nhà hàng.
 *
 * <p>Toàn bộ nội dung nhận diện đọc từ cấu hình admin, không viết cứng một chữ
 * nào. Bản cũ nhắc "Trung Hoa" 15 lần và có hai khối hoàn toàn bịa — bốn thẻ
 * "Đặc sản" đánh số và ba mục "Vì sao chọn chúng tôi" — đều là văn quảng cáo
 * về một nền ẩm thực cụ thể, sẽ sai với bất kỳ quán nào khác dùng app này.
 *
 * <p>Đây là màn được dùng CẢ SÁU thủ pháp retro (bảng cho phép ở design.md):
 * băng chữ chạy, chữ nét đôi, tia starburst, chấm halftone, sọc kẻ chéo và số
 * kiểu bảng tỉ số. Màn vận hành chỉ được ba thủ pháp không tốn màu; ở đây thì
 * trang được phép ồn, vì đây là cái biển hiệu.
 */
export default function HomePage() {
    const {profile} = useRestaurant()

    const [best, setBest] = useState<PublicBestSellingDish[]>([])
    const [menu, setMenu] = useState<PublicMenuSection[]>([])

    useEffect(() => {
        const controller = new AbortController()

        // Hai lời gọi độc lập: băng ảnh hỏng thì thực đơn vẫn hiện, và ngược
        // lại. Không có món nào thì trang rơi về dáng "Bảng hiệu", đó là một
        // trạng thái hợp lệ chứ không phải lỗi cần báo.
        getPublicBestSellingDishes(controller.signal)
            .then(setBest)
            .catch(() => {})
        getPublicMenu(controller.signal)
            .then(setMenu)
            .catch(() => {})

        return () => controller.abort()
    }, [])

    const dishes = useMemo(() => menu.flatMap((section) => section.dishes), [menu])

    /**
     * Món cho băng ảnh.
     *
     * <p>Ưu tiên bảng bán chạy. Nhưng bảng đó tính từ hoá đơn ĐÃ THANH TOÁN,
     * nên một quán vừa cài app chưa bán đồng nào sẽ nhận về danh sách rỗng —
     * và băng ảnh, thứ đã chốt là thành phần cố định của trang, biến mất.
     * Không có số bán thì lấy thẳng món trong thực đơn: băng vẫn là băng ảnh
     * món, chỉ không còn xếp hạng.
     */
    const stripDishes = useMemo<StripDish[]>(() => {
        if (best.length > 0) {
            return best.map((item) => {
                const found = dishes.find((dish) => dish.name === item.dishName)

                return {
                    dishId: found?.dishId ?? item.rank,
                    name: item.dishName,
                    imageUrl: item.imageUrl || (found?.imageUrl ?? null),
                    price: found?.price ?? 0,
                    rank: item.rank,
                }
            })
        }

        return dishes.slice(0, 10).map((dish) => ({
            dishId: dish.dishId,
            name: dish.name,
            imageUrl: dish.imageUrl,
            price: dish.price,
        }))
    }, [best, dishes])

    const name = profile?.name ?? ''
    const tagline = profile?.tagline
    const description = profile?.description
    const initial = name.trim().charAt(0).toUpperCase()

    const coThucDon = menu.length > 0

    const contacts = [
        profile?.address && {label: 'Địa chỉ', value: profile.address},
        profile?.phone && {label: 'Điện thoại', value: profile.phone},
        profile?.openingHours && {label: 'Giờ mở cửa', value: profile.openingHours},
        // Giờ mở cửa và giờ nhận đặt bàn là hai thứ khác nhau: quán có thể mở
        // tới 22:30 nhưng hệ thống chỉ nhận đặt tới 20:00. Nói rõ cả hai để
        // khách không chọn giờ rồi mới bị từ chối.
        profile?.reservationHours && {
            label: 'Nhận đặt bàn',
            value: profile.reservationHours,
        },
    ].filter(Boolean) as {label: string; value: string}[]

    // Băng chữ chạy: chỉ nói những thứ CÓ THẬT trong dữ liệu. Không có thì
    // không bịa ra một dòng quảng cáo để lấp chỗ.
    const tickerItems = [
        tagline,
        profile?.openingHours && `Mở cửa ${profile.openingHours}`,
        profile?.reservationHours && `Nhận đặt bàn ${profile.reservationHours}`,
        coThucDon && `${dishes.length} món trong thực đơn`,
        coThucDon && `${menu.length} nhóm món`,
        profile?.phone && `Gọi ${profile.phone}`,
    ].filter(Boolean) as string[]

    return (
        <main className="rk-home">
            <header className="rk-home__masthead">
                <div className="rk-home__bar">
                    <Link className="rk-home__brand" to="/">
                        {profile?.logoUrl ? (
                            <img
                                className="rk-home__logo"
                                src={profile.logoUrl}
                                alt=""
                                width={48}
                                height={48}
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
                    </Link>

                    <HomeAuthPanel />
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
                                <span className="rk-home__catn">
                                    {section.dishes.length}
                                </span>
                            </a>
                        ))}
                    </nav>
                )}
            </header>

            {tickerItems.length > 0 && (
                <div className="rk-ticker" aria-label="Thông tin quán">
                    {/* Hai bản sao: bản sau lấp đúng chỗ bản trước vừa rời đi,
                        nên vòng lặp không có khe hở. */}
                    <div className="rk-ticker__run">
                        {tickerItems.map((text) => (
                            <span key={text}>{text}</span>
                        ))}
                    </div>
                    <div className="rk-ticker__run" aria-hidden="true">
                        {tickerItems.map((text) => (
                            <span key={text}>{text}</span>
                        ))}
                    </div>
                </div>
            )}

            <section className="rk-hero">
                <div className="rk-hero__main">
                    <p className="rk-hero__eyebrow">Thực đơn hôm nay</p>

                    {/* Chữ nét đôi — thủ pháp retro số 2, chỉ được dùng ở tiêu
                        đề lớn của trang công khai. */}
                    <h1 className="rk-hero__title rk-outline">{name}</h1>

                    {description && <p className="rk-hero__desc">{description}</p>}

                    <div className="rk-hero__actions">
                        <Link className="rk-btn rk-btn--go rk-btn--lg" to="/login">
                            <Icon name="booking" className="rk-icon" />
                            Đặt bàn
                        </Link>

                        {coThucDon && (
                            <a
                                className="rk-btn rk-btn--quiet rk-btn--lg"
                                href={`#dm-${menu[0].categoryId}`}
                            >
                                Xem thực đơn
                            </a>
                        )}
                    </div>
                </div>

                {/* Tia starburst — thủ pháp retro số 5, TỐI ĐA MỘT CÁI mỗi màn.
                    Con số là số món có thật, đếm từ thực đơn. */}
                {coThucDon && (
                    <div className="rk-hero__side">
                        <div className="rk-burst" aria-hidden="true">
                            <span>
                                <b>{dishes.length}</b>
                                món
                            </span>
                        </div>
                    </div>
                )}

                {/* Chấm halftone — thủ pháp retro số 4, chỉ trên khối lớn. */}
                <div className="rk-hero__dots rk-halftone" aria-hidden="true" />
            </section>

            <DishStrip dishes={stripDishes} />

            {menu.map((section) => (
                <section
                    className="rk-home__section"
                    id={`dm-${section.categoryId}`}
                    key={section.categoryId}
                >
                    <div className="rk-home__h2row">
                        <h2 className="rk-home__h2">{section.categoryName}</h2>
                        <span className="rk-home__count">
                            {section.dishes.length} món
                        </span>
                        <span className="rk-home__rule rk-stripe" aria-hidden="true" />
                    </div>

                    {section.description && (
                        <p className="rk-home__catdesc">{section.description}</p>
                    )}

                    <ul className="rk-home__dishes">
                        {section.dishes.map((dish) => (
                            <li
                                className="rk-dish"
                                id={`mon-${dish.dishId}`}
                                key={dish.dishId}
                            >
                                <div className="rk-dish__figure">
                                    <img
                                        className="rk-dish__img"
                                        src={duongDanAnh(dish.imageUrl)}
                                        alt=""
                                        loading="lazy"
                                        onError={dungAnhThayThe}
                                    />

                                    {/* Giá RÚT GỌN trên thẻ, đúng luật tiền: thẻ
                                        là chỗ hẹp, và ở đó con số phải đọc được
                                        từ xa hơn là chính xác tới từng đồng. */}
                                    <span className="rk-dish__price">
                                        {formatCurrencyShort(dish.price)}
                                    </span>
                                </div>

                                <div className="rk-dish__body">
                                    <h3 className="rk-dish__name">{dish.name}</h3>

                                    {dish.description && (
                                        <p className="rk-dish__desc">
                                            {dish.description}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            {contacts.length > 0 && (
                <section className="rk-home__section" id="lien-he">
                    <div className="rk-home__h2row">
                        <h2 className="rk-home__h2">Ghé quán</h2>
                        <span className="rk-home__rule rk-stripe" aria-hidden="true" />
                    </div>

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
