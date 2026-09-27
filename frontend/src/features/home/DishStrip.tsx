import {useEffect, useRef, useState} from 'react'

import {Icon} from '@/shared/components/ui/Icon'
import {duongDanAnh} from '@/shared/utils/image'
import type {PublicBestSellingDish} from '@/shared/api/public'

/**
 * Băng ảnh món chạy ngang, 40 giây một vòng.
 *
 * <p>Dừng được bằng BỐN cách, và cả bốn đều cần:
 *
 * <ul>
 *   <li><b>Nút dừng</b> — người dùng chủ động, và đây là cách duy nhất dùng
 *       được trên màn cảm ứng.</li>
 *   <li><b>Rê chuột</b> — đang muốn đọc tên một món thì nó trôi mất.</li>
 *   <li><b>Focus bàn phím</b> — người đi bằng Tab phải có thời gian đọc.</li>
 *   <li><b>prefers-reduced-motion</b> — máy đã nói không muốn chuyển động thì
 *       băng đứng yên ngay từ đầu, không đợi ai bấm.</li>
 * </ul>
 *
 * <p>Danh sách nhân đôi để vòng lặp liền mạch: ảnh chạy hết nửa đầu thì nửa sau
 * đã ở đúng chỗ nửa đầu vừa rời đi, nên không có khoảng trống lúc quay vòng.
 * Bản sao mang aria-hidden để trình đọc màn hình không đọc mỗi món hai lần.
 */
export function DishStrip({dishes}: {dishes: PublicBestSellingDish[]}) {
    const [paused, setPaused] = useState(false)
    const reducedRef = useRef(false)

    useEffect(() => {
        // Đọc MỘT LẦN lúc gắn, rồi theo dõi: người dùng đổi cài đặt hệ thống
        // giữa chừng thì băng phải dừng ngay chứ không đợi tải lại trang.
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')

        const apply = () => {
            reducedRef.current = query.matches
            if (query.matches) {
                setPaused(true)
            }
        }

        apply()
        query.addEventListener('change', apply)

        return () => query.removeEventListener('change', apply)
    }, [])

    if (dishes.length === 0) {
        return null
    }

    const run = dishes.concat(dishes)

    return (
        <section className="rk-strip" aria-label="Món được gọi nhiều nhất tuần này">
            <div className="rk-strip__head">
                <h2 className="rk-strip__title">Được gọi nhiều nhất tuần này</h2>

                <button
                    type="button"
                    className="rk-btn rk-btn--quiet rk-btn--sm"
                    aria-pressed={paused}
                    onClick={() => setPaused((value) => !value)}
                >
                    <Icon name={paused ? 'next' : 'ban'} className="rk-icon" />
                    {paused ? 'Cho chạy tiếp' : 'Dừng băng'}
                </button>
            </div>

            <div
                className={`rk-strip__view${paused ? ' is-paused' : ''}`}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => {
                    if (!reducedRef.current) {
                        setPaused(false)
                    }
                }}
            >
                <ol className="rk-strip__run">
                    {run.map((dish, index) => (
                        <li
                            className="rk-strip__item"
                            key={`${dish.rank}-${index}`}
                            aria-hidden={index >= dishes.length}
                        >
                            <img
                                className="rk-strip__img"
                                src={duongDanAnh(dish.imageUrl)}
                                alt=""
                                loading="lazy"
                            />

                            <span className="rk-strip__rank">{dish.rank}</span>
                            <span className="rk-strip__name">{dish.dishName}</span>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    )
}
