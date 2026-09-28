import {useCallback, useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router-dom'

import * as waiterApi from '@/shared/api/waiter'
import type {ReservationResponse, TableDetailResponse} from '@/shared/api/waiter'
import {useWaiterSocket} from '@/realtime'
import {useToast} from '@/app/providers/useToast'
import {ConfirmDialog} from '@/shared/components/ui'
import {Icon} from '@/shared/components/ui/Icon'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'

/** Quá hạn giữ bàn 15 phút — cùng hạn với backend. */
const GRACE_MS = 15 * 60_000

function reservationIdOf(reservation: ReservationResponse) {
    return reservation.reservationId ?? reservation.id ?? 0
}

function timeOf(value: string) {
    return value.split('T')[1]?.slice(0, 5) ?? value
}

/**
 * Lượt đặt TỚI GIỜ mà chưa xếp được bàn.
 *
 * <p>30 phút trước giờ đặt, backend giữ bàn cho khách. Nếu bàn đã đặt còn
 * khách và không còn bàn trống nào đủ chỗ, trước đây lượt đặt bị HUỶ lặng lẽ —
 * khách đến nơi mới biết mình không còn lượt. Nay backend giữ lượt đặt, đánh
 * dấu, và dải này báo cho phục vụ quyết định: gọi báo khách, đổi bàn hay đổi
 * giờ, hoặc huỷ.
 *
 * <p>Tự làm mới khi có tin qua socket, và báo nổi một lần cho mỗi lượt MỚI —
 * phục vụ đang ở màn khác cũng biết có việc cần làm.
 */
export function ReservationAttention({tables}: {tables: TableDetailResponse[]}) {
    const navigate = useNavigate()
    const {notify} = useToast()

    const [items, setItems] = useState<ReservationResponse[]>([])
    const [pendingCancel, setPendingCancel] = useState<ReservationResponse | null>(null)
    const [canceling, setCanceling] = useState(false)
    // Mốc "bây giờ" lấy lúc NẠP, không lúc vẽ: vẽ phải thuần. Danh sách nạp lại
    // theo socket nên mốc này không cũ quá vài phút.
    const [loadedAt, setLoadedAt] = useState(0)

    // null = chưa nạp lần nào: lần nạp đầu không bắn thông báo nổi, vì những
    // lượt đó dải báo đã hiện rồi.
    const seenRef = useRef<Set<number> | null>(null)

    const load = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const {data} = await waiterApi.getReservationsNeedingAttention(signal)

                if (signal?.aborted) {
                    return
                }

                const list = data ?? []

                if (seenRef.current) {
                    for (const reservation of list) {
                        if (!seenRef.current.has(reservationIdOf(reservation))) {
                            notify(
                                `Lượt đặt ${timeOf(reservation.reservationTime)} của ${reservation.customerName} chưa có bàn — cần xử lý.`,
                                {tone: 'alert'},
                            )
                        }
                    }
                }

                seenRef.current = new Set(list.map(reservationIdOf))
                setLoadedAt(Date.now())
                setItems(list)
            } catch (requestError: unknown) {
                if (signal?.aborted || isRequestCanceled(requestError)) {
                    return
                }

                console.error('[WAITER_RESERVATION_ATTENTION_ERROR]', requestError)
            }
        },
        [notify],
    )

    useEffect(() => {
        const controller = new AbortController()
        const timer = window.setTimeout(() => void load(controller.signal), 0)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [load])

    useWaiterSocket(
        () => void load(),
        () => void load(),
    )

    async function confirmCancel() {
        const target = pendingCancel

        if (!target) {
            return
        }

        setCanceling(true)

        try {
            await waiterApi.cancelReservation(reservationIdOf(target))
            notify(`Đã huỷ lượt đặt của ${target.customerName}.`)
            setPendingCancel(null)
            await load()
        } catch (requestError: unknown) {
            notify(getErrorMessage(requestError, 'Huỷ lượt đặt thất bại.'), {
                tone: 'alert',
            })
        } finally {
            setCanceling(false)
        }
    }

    if (items.length === 0) {
        return null
    }

    return (
        <>
            <section
                className="rk-note rk-note--alert rk-attention"
                aria-label="Lượt đặt chưa có bàn"
            >
                <Icon name="clockAlert" className="rk-icon" />

                <div className="rk-attention__body">
                    <strong>
                        {items.length} lượt đặt tới giờ mà chưa có bàn — cần xử lý
                    </strong>

                    <p>
                        Bàn đã đặt còn khách và không còn bàn trống nào đủ chỗ. Gọi báo
                        khách, đổi bàn hay đổi giờ, hoặc huỷ lượt. Bàn trống ra thì hệ
                        thống tự giữ bàn và dải này tự tắt.
                    </p>

                    <ul className="rk-attention__list">
                        {items.map((reservation) => {
                            const table = tables.find(
                                (item) => item.tableId === reservation.tableId,
                            )
                            const late =
                                new Date(reservation.reservationTime).getTime() <
                                loadedAt - GRACE_MS

                            return (
                                <li
                                    key={reservationIdOf(reservation)}
                                    className="rk-attention__item"
                                >
                                    <span className="rk-attention__time">
                                        {timeOf(reservation.reservationTime)}
                                    </span>

                                    <span className="rk-attention__who">
                                        <strong>{reservation.customerName}</strong>
                                        <span>
                                            {table
                                                ? `Bàn ${table.tableNumber} · ${table.capacity} chỗ`
                                                : 'Chưa rõ bàn'}
                                            {late ? ' · đã quá giờ giữ bàn' : ''}
                                        </span>
                                    </span>

                                    <span className="rk-actions">
                                        <a
                                            className="rk-btn rk-btn--quiet rk-btn--sm"
                                            href={`tel:${reservation.phone}`}
                                        >
                                            Gọi {reservation.phone}
                                        </a>

                                        <button
                                            type="button"
                                            className="rk-btn rk-btn--sm"
                                            onClick={() =>
                                                navigate(
                                                    `/waiter/reservations/${reservationIdOf(reservation)}/edit`,
                                                )
                                            }
                                        >
                                            Đổi bàn / giờ
                                        </button>

                                        <button
                                            type="button"
                                            className="rk-btn rk-btn--danger rk-btn--sm"
                                            onClick={() => setPendingCancel(reservation)}
                                        >
                                            Huỷ lượt
                                        </button>
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </section>

            <ConfirmDialog
                open={pendingCancel !== null}
                title="Huỷ lượt đặt này?"
                description={
                    pendingCancel
                        ? `${pendingCancel.customerName} — ${timeOf(pendingCancel.reservationTime)}. Nhớ gọi báo khách trước khi huỷ.`
                        : undefined
                }
                confirmLabel="Huỷ lượt đặt"
                cancelLabel="Giữ lượt đặt"
                destructive
                busy={canceling}
                onConfirm={() => void confirmCancel()}
                onCancel={() => setPendingCancel(null)}
            />
        </>
    )
}
