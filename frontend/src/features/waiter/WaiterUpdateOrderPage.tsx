import {Icon} from '@/shared/components/ui/Icon'
import {statusChipClass, statusLabel} from './statusChip'

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'

import * as waiterApi from '@/shared/api/waiter'
import type {
    MenuItemResponse,
    OrderDetailResponse,
    OrderItemStatus,
    UpdateOrderItemRequest,
} from '@/shared/api/waiter'
import {BackArrow, fmtPriceShort, useTableNumber} from './components'
import {Modal, OrderCart} from '@/shared/components/ui'
import {useWaiterSocket} from '@/realtime'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'
import {useToast} from '@/app/providers/useToast'
import {EmptyState, LoadingState} from '@/shared/components/feedback'
import {dungAnhThayThe, duongDanAnh} from '@/shared/utils/image'

type DraftItem = {
    qty: number
    originalQty?: number
    originalNote?: string
    note: string
    orderItemId?: number | null
    status?: OrderItemStatus
    cancelReason?: string | null
    chefInternalNote?: string | null
    chefInternalNoteCreatedAt?: string | null
    chefInternalNoteAcknowledgedAt?: string | null
}

type UpdateItemWithName = UpdateOrderItemRequest & {
    name: string
}
type ChangeKind = 'new' | 'increase' | 'decrease' | 'cancel' | 'note'

type ChangeSummaryItem = {
    dishId: number
    name: string
    kind: ChangeKind
    qty: number
    note?: string
}

function formatChefNoteTime(value?: string | null) {
    if (!value) {
        return ''
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

/**
 * Dòng nào đại diện cho một món khi món đó có NHIỀU dòng trong đơn.
 *
 * <p>Nhiều dòng là chuyện thường: gọi thêm một món đã xong thì backend tạo dòng
 * mới; món bị bếp huỷ rồi gọi lại cũng thành hai dòng. Nháp khoá theo món, nên
 * trước đây dòng nào đến SAU thì đè dòng trước — có lúc dòng bị đè lại chính là
 * dòng đang nấu, thứ duy nhất phục vụ còn sửa được. Nay dòng sửa được thắng.
 */
const LINE_PRIORITY: Record<string, number> = {PREPARING: 3, COMPLETED: 2, CANCELLED: 1}

function buildDraftFromOrders(menu: MenuItemResponse[], orders: OrderDetailResponse[]) {
    const draft: Record<number, DraftItem> = {}

    orders.forEach((order) => {
        order.orderItems.forEach((item) => {
            const dish = menu.find((menuItem) => menuItem.name === item.dishName)

            if (!dish) {
                return
            }

            const existing = draft[dish.dishId]

            if (
                existing &&
                (LINE_PRIORITY[existing.status ?? ''] ?? 0) >=
                    (LINE_PRIORITY[item.status ?? ''] ?? 0)
            ) {
                return
            }

            // Dòng ĐÃ HUỶ vào nháp với số lượng 0. Nạp số lượng gốc thì thẻ món
            // hiện viền "đã gọi" cho một món bàn không hề nhận, và bấm + sẽ
            // tăng số lượng trên CHÍNH DÒNG ĐÃ HUỶ — backend đổi con số nhưng
            // dòng vẫn huỷ, bếp không bao giờ thấy, món coi như mất. Từ 0 thì
            // bấm + đi đúng nhánh "gọi lại như món mới".
            const cancelled = item.status === 'CANCELLED'

            draft[dish.dishId] = {
                qty: cancelled ? 0 : item.quantity,
                originalQty: cancelled ? 0 : item.quantity,
                originalNote: item.note ?? '',
                note: item.note ?? '',
                orderItemId: item.orderItemId,
                status: item.status,
                cancelReason: item.cancelReason,
                chefInternalNote: item.chefInternalNote,
                chefInternalNoteCreatedAt: item.chefInternalNoteCreatedAt,
                chefInternalNoteAcknowledgedAt: item.chefInternalNoteAcknowledgedAt,
            }
        })
    })

    return draft
}

export default function WaiterUpdateOrderPage() {
    const {notify} = useToast()

    const navigate = useNavigate()
    const {tableId} = useParams()

    const tableIdNumber = Number.parseInt(tableId ?? '0', 10)

    // SỐ BÀN để hiển thị. Đường dẫn mang khoá chính, mà bàn ngoài đời
    // mang số "B01" — hai con số đó không trùng nhau.
    const tableNumber = useTableNumber(tableIdNumber)

    const [menu, setMenu] = useState<MenuItemResponse[]>([])

    const [servingOrders, setServingOrders] = useState<OrderDetailResponse[]>([])

    const [orderDraft, setOrderDraft] = useState<Record<number, DraftItem>>({})

    const [showConfirm, setShowConfirm] = useState(false)

    const [submitting, setSubmitting] = useState(false)

    const [successData, setSuccessData] = useState<{
        message: string
        itemSummary: string
    } | null>(null)

    const [activeCategory, setActiveCategory] = useState('Tất cả')

    const [searchQuery, setSearchQuery] = useState('')

    const [acknowledgingItemId, setAcknowledgingItemId] = useState<number | null>(null)

    const [isLoading, setIsLoading] = useState(true)

    const [pageError, setPageError] = useState<string | null>(null)

    const hasUserEditedDraftRef = useRef(false)

    const loadOrderData = useCallback(
        async (signal?: AbortSignal, showFullLoading = true) => {
            if (!tableIdNumber) {
                setPageError('Mã bàn không hợp lệ.')
                setIsLoading(false)
                return
            }

            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                setPageError(null)

                const [menuResponse, orderResponse] = await Promise.all([
                    waiterApi.getMenu(signal),
                    waiterApi.getServingOrders(tableIdNumber, signal),
                ])

                if (signal?.aborted) {
                    return
                }

                const nextMenu = menuResponse.data
                const nextOrders = orderResponse.data ?? []

                setMenu(nextMenu)
                setServingOrders(nextOrders)

                if (!hasUserEditedDraftRef.current && !showConfirm && !submitting) {
                    setOrderDraft(buildDraftFromOrders(nextMenu, nextOrders))
                }
            } catch (requestError: unknown) {
                if (signal?.aborted || isRequestCanceled(requestError)) {
                    return
                }

                console.error('[WAITER_UPDATE_ORDER_LOAD_ERROR]', requestError)

                setPageError('Không thể tải dữ liệu cập nhật đơn hàng.')
            } finally {
                if (showFullLoading && !signal?.aborted) {
                    setIsLoading(false)
                }
            }
        },
        [showConfirm, submitting, tableIdNumber],
    )

    // Initial load on mount
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadOrderData()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [loadOrderData])

    // WebSocket: refresh when backend broadcasts waiter or table updates
    useWaiterSocket(
        () => void loadOrderData(undefined, false),
        () => void loadOrderData(undefined, false),
    )

    function getMinQty(dishId: number) {
        const current = orderDraft[dishId]

        if (!current) {
            return 0
        }

        if (current.status === 'COMPLETED') {
            return current.originalQty ?? 0
        }

        return 0
    }

    const categories = useMemo(
        () => [
            'Tất cả',
            ...Array.from(new Set(menu.map((dish) => dish.categoryName).filter(Boolean))),
        ],
        [menu],
    )

    const visibleMenu = useMemo(
        () =>
            menu.filter((dish) => {
                const matchesCategory =
                    activeCategory === 'Tất cả' || dish.categoryName === activeCategory

                const matchesSearch = dish.name
                    .toLowerCase()
                    .includes(searchQuery.trim().toLowerCase())

                return matchesCategory && matchesSearch
            }),
        [menu, activeCategory, searchQuery],
    )

    const updateItems = useMemo<UpdateItemWithName[]>(
        () =>
            Object.entries(orderDraft)
                .filter(([, value]) => {
                    if (!value.orderItemId) {
                        return value.qty > 0
                    }

                    return true
                })
                .filter(
                    ([, value]) =>
                        value.qty > 0 ||
                        (value.orderItemId && value.status === 'PREPARING'),
                )
                .map(([dishId, value]) => {
                    const numericDishId = Number.parseInt(dishId, 10)

                    return {
                        orderItemId: value.orderItemId ?? null,

                        dishId: numericDishId,
                        quantity: value.qty,
                        note: value.note || '',
                        name:
                            menu.find((dish) => dish.dishId === numericDishId)?.name ??
                            'Món',
                    }
                }),
        [orderDraft, menu],
    )

    const changeSummary = useMemo<ChangeSummaryItem[]>(() => {
        const result: ChangeSummaryItem[] = []

        Object.entries(orderDraft).forEach(([dishId, value]) => {
            const numericDishId = Number.parseInt(dishId, 10)

            const name = menu.find((dish) => dish.dishId === numericDishId)?.name ?? 'Món'

            const isNew = !value.orderItemId

            if (isNew) {
                if (value.qty > 0) {
                    result.push({
                        dishId: numericDishId,
                        name,
                        kind: 'new',
                        qty: value.qty,
                        note: value.note || undefined,
                    })
                }
                return
            }

            const original = value.originalQty ?? 0
            const delta = value.qty - original

            if (value.qty === 0 && original > 0) {
                result.push({
                    dishId: numericDishId,
                    name,
                    kind: 'cancel',
                    qty: 0,
                })
            } else if (delta > 0) {
                result.push({
                    dishId: numericDishId,
                    name,
                    kind: 'increase',
                    qty: delta,
                    note: value.note || undefined,
                })
            } else if (delta < 0) {
                result.push({
                    dishId: numericDishId,
                    name,
                    kind: 'decrease',
                    qty: Math.abs(delta),
                    note: value.note || undefined,
                })
            } else if ((value.note || '') !== (value.originalNote || '')) {
                result.push({
                    dishId: numericDishId,
                    name,
                    kind: 'note',
                    qty: value.qty,
                    note: value.note || undefined,
                })
            }
        })

        return result
    }, [orderDraft, menu])

    function openConfirm() {
        if (!servingOrders.length) {
            notify('Không có đơn hàng đang phục vụ để cập nhật.', {tone: 'alert'})
            return
        }

        if (changeSummary.length === 0) {
            notify('Không có thay đổi nào để cập nhật.', {tone: 'alert'})
            return
        }

        setShowConfirm(true)
    }

    async function submitUpdateOrder() {
        if (!servingOrders.length) {
            return
        }

        const targetOrderId = servingOrders[0].orderId

        const items: UpdateOrderItemRequest[] = updateItems.map((item) => ({
            orderItemId: item.orderItemId,
            dishId: item.dishId,
            quantity: item.quantity,
            note: item.note,
        }))

        setSubmitting(true)

        try {
            const response = await waiterApi.updateOrder(targetOrderId, {
                items,
            })

            hasUserEditedDraftRef.current = false

            setSuccessData({
                message: response.data?.message || 'Đã cập nhật đơn',
                itemSummary: '',
            })
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[WAITER_UPDATE_ORDER_SUBMIT_ERROR]', requestError)

            notify(
                `Cập nhật thất bại: ${getErrorMessage(
                    requestError,
                    'Lỗi không xác định',
                )}`,
                {tone: 'alert'},
            )
        } finally {
            setSubmitting(false)
            setShowConfirm(false)
        }
    }

    function changeDraftQty(dishId: number, delta: number) {
        hasUserEditedDraftRef.current = true

        setOrderDraft((previous) => {
            const current = previous[dishId] ?? {
                qty: 0,
                note: '',
                orderItemId: null,
            }

            if (current.status === 'CANCELLED') {
                const qty = Math.max(0, current.qty + delta)

                if (current.qty === 0 && qty > 0) {
                    return {
                        ...previous,
                        [dishId]: {
                            qty,
                            note: current.note,
                            orderItemId: null,
                            status: undefined,
                        },
                    }
                }

                return {
                    ...previous,
                    [dishId]: {
                        ...current,
                        qty,
                    },
                }
            }

            const minQty = getMinQty(dishId)

            const qty = Math.max(minQty, current.qty + delta)

            return {
                ...previous,
                [dishId]: {
                    ...current,
                    qty,
                },
            }
        })
    }

    function setDraftNote(dishId: number, note: string) {
        hasUserEditedDraftRef.current = true

        setOrderDraft((previous) => {
            const current = previous[dishId] ?? {
                qty: 0,
                note: '',
                orderItemId: null,
            }

            return {
                ...previous,
                [dishId]: {
                    ...current,
                    note,
                },
            }
        })
    }

    async function handleAcknowledgeChefNote(dishId: number, orderItemId: number) {
        try {
            setAcknowledgingItemId(orderItemId)

            await waiterApi.acknowledgeChefInternalNote(orderItemId)

            setOrderDraft((currentDraft) => ({
                ...currentDraft,
                [dishId]: {
                    ...currentDraft[dishId],
                    chefInternalNoteAcknowledgedAt: new Date().toISOString(),
                },
            }))

            notify('Đã xác nhận ghi chú từ bếp.')
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[WAITER_UPDATE_ORDER_ACK_NOTE_ERROR]', requestError)

            notify(getErrorMessage(requestError, 'Không thể xác nhận ghi chú từ bếp.'), {
                tone: 'alert',
            })
        } finally {
            setAcknowledgingItemId(null)
        }
    }

    return (
        <div className="rk-stack">
            <div className="rk-titlerow">
                <BackArrow
                    onClick={() =>
                        navigate(`/waiter/tables/${tableIdNumber}/order/detail`)
                    }
                />

                <h2 className="rk-sectiontitle">
                    Cập nhật đơn hàng · Bàn {tableNumber ?? '—'}
                </h2>
            </div>

            <div className="rk-order">
                <div className="rk-order__menu">
                    <input
                        aria-label="Tìm theo tên món hoặc danh mục"
                        type="text"
                        placeholder="Tìm theo tên món hoặc danh mục..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="rk-input"
                    />

                    <div className="rk-segment">
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                className={`rk-segment__btn${activeCategory === category ? ' is-active' : ''}`}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {pageError && (
                        <div className="rk-formerror">
                            {pageError}

                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet rk-btn--sm"
                                onClick={() => void loadOrderData(undefined, true)}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <LoadingState
                            title="Đang tải dữ liệu đơn hàng"
                            description="Hệ thống đang lấy thực đơn và các món đã gọi."
                        />
                    ) : visibleMenu.length === 0 ? (
                        <EmptyState
                            title="Không có món nào"
                            description="Danh mục này chưa có món, hãy chọn danh mục khác."
                        />
                    ) : (
                        <div className="rk-menugrid">
                            {visibleMenu.map((dish) => {
                                const draft = orderDraft[dish.dishId] ?? {
                                    qty: 0,
                                    note: '',
                                }

                                const minQty = getMinQty(dish.dishId)

                                const hasExisting = Boolean(draft.status)

                                const noteAcknowledged = Boolean(
                                    draft.chefInternalNoteAcknowledgedAt,
                                )

                                const isUnavailable = !dish.available

                                return (
                                    <article
                                        key={dish.dishId}
                                        className={`rk-menucard${draft.qty > 0 ? ' is-picked' : ''}${
                                            isUnavailable ? ' is-unavailable' : ''
                                        }`}
                                    >
                                        <div className="rk-menucard__figure">
                                            {dish.imageUrl ? (
                                                <img
                                                    src={duongDanAnh(dish.imageUrl)}
                                                    alt={dish.name}
                                                    onError={dungAnhThayThe}
                                                />
                                            ) : (
                                                <Icon
                                                    name="kitchen"
                                                    className="rk-icon"
                                                />
                                            )}

                                            {draft.qty > 0 && (
                                                <span className="rk-menucard__count">
                                                    {draft.qty}
                                                </span>
                                            )}
                                        </div>

                                        <div className="rk-menucard__body">
                                            <div className="rk-menucard__head">
                                                <h3 className="rk-menucard__name">
                                                    {dish.name}
                                                </h3>
                                                <span className="rk-menucard__price">
                                                    {fmtPriceShort(dish.price)}
                                                </span>

                                                {hasExisting && draft.status && (
                                                    <span
                                                        className={`rk-chip ${statusChipClass(draft.status)}`}
                                                    >
                                                        {statusLabel(draft.status)}
                                                    </span>
                                                )}

                                                {!hasExisting && isUnavailable && (
                                                    <span className="rk-chip rk-chip--alert rk-chip--m-pause">
                                                        Hết hàng
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rk-menucard__foot">
                                            {draft.chefInternalNote && (
                                                <div
                                                    className={`rk-chefnote${
                                                        noteAcknowledged
                                                            ? ' is-acknowledged'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="rk-chefnote__head">
                                                        <strong> Bếp nhắn</strong>

                                                        {draft.chefInternalNoteCreatedAt && (
                                                            <span className="rk-chefnote__time">
                                                                {formatChefNoteTime(
                                                                    draft.chefInternalNoteCreatedAt,
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="rk-chefnote__body">
                                                        {draft.chefInternalNote}
                                                    </p>

                                                    {noteAcknowledged ? (
                                                        <small className="rk-chefnote__seen">
                                                            <Icon
                                                                name="check"
                                                                className="rk-icon"
                                                            />{' '}
                                                            Đã xem
                                                        </small>
                                                    ) : (
                                                        draft.orderItemId && (
                                                            <button
                                                                type="button"
                                                                className="rk-btn rk-btn--quiet rk-btn--sm"
                                                                disabled={
                                                                    acknowledgingItemId ===
                                                                    draft.orderItemId
                                                                }
                                                                onClick={() =>
                                                                    void handleAcknowledgeChefNote(
                                                                        dish.dishId,
                                                                        draft.orderItemId!,
                                                                    )
                                                                }
                                                            >
                                                                {acknowledgingItemId ===
                                                                draft.orderItemId
                                                                    ? 'Đang xác nhận...'
                                                                    : 'Xác nhận đã xem'}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            <div className="rk-stepper">
                                                <button
                                                    type="button"
                                                    className="rk-stepper__btn"
                                                    aria-label={
                                                        'Bớt một phần ' + dish.name
                                                    }
                                                    disabled={draft.qty <= minQty}
                                                    onClick={() =>
                                                        changeDraftQty(dish.dishId, -1)
                                                    }
                                                >
                                                    -
                                                </button>

                                                <span className="rk-stepper__value">
                                                    {draft.qty}
                                                </span>

                                                <button
                                                    type="button"
                                                    className="rk-stepper__btn"
                                                    aria-label={
                                                        'Thêm một phần ' + dish.name
                                                    }
                                                    disabled={isUnavailable}
                                                    onClick={() =>
                                                        changeDraftQty(dish.dishId, 1)
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Ô ghi chú chỉ hiện với món CÓ TRONG ĐƠN
                                                (đã gọi, vừa thêm, hoặc đang mang ghi
                                                chú). Trước đây nó hiện ở cả bốn mươi
                                                ba món, trong khi màn Tạo đơn chỉ hiện
                                                khi món đã được gọi — cùng một thao
                                                tác mà hai màn làm hai kiểu. */}
                                            {(draft.qty > 0 ||
                                                hasExisting ||
                                                draft.note) && (
                                                <input
                                                    placeholder="Ghi chú (ít cay, ...)"
                                                    aria-label={
                                                        'Ghi chú cho ' + dish.name
                                                    }
                                                    value={draft.note}
                                                    className="rk-input"
                                                    onChange={(event) =>
                                                        setDraftNote(
                                                            dish.dishId,
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            )}

                                            {isUnavailable && (
                                                <p className="rk-field__hint">
                                                    Món hiện đang tạm hết — không thể gọi
                                                    thêm.
                                                </p>
                                            )}

                                            {draft.status === 'COMPLETED' && (
                                                <p className="rk-field__hint">
                                                    Món đã hoàn thành — không thể giảm số
                                                    lượng dưới {minQty}.
                                                </p>
                                            )}

                                            {draft.status === 'CANCELLED' && (
                                                <>
                                                    <p className="rk-field__hint">
                                                        Món đã huỷ — nhấn + để thêm mới từ
                                                        đầu.
                                                    </p>

                                                    {draft.cancelReason && (
                                                        <p className="rk-subnote rk-subnote--alert">
                                                            Lý do huỷ:{' '}
                                                            {draft.cancelReason}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Giỏ ở màn Sửa đơn liệt kê THAY ĐỔI, không liệt kê cả đơn:
                    cả đơn đã có ở màn Chi tiết. Thứ phục vụ cần thấy trước
                    khi bấm gửi là đúng những gì sắp xuống bếp. */}
                <OrderCart
                    label="Thay đổi sắp gửi"
                    title="Thay đổi"
                    count={changeSummary.length}
                    empty="Chưa thay đổi gì. Sửa số lượng hoặc ghi chú để bắt đầu."
                    foot={
                        <button
                            type="button"
                            className="rk-btn rk-btn--go"
                            disabled={
                                isLoading ||
                                submitting ||
                                !tableIdNumber ||
                                changeSummary.length === 0
                            }
                            onClick={openConfirm}
                        >
                            Gửi cập nhật xuống bếp
                        </button>
                    }
                >
                    {changeSummary.map((item) => (
                        <div className="rk-cart__line" key={item.dishId}>
                            <span className="rk-cart__qty">
                                {item.kind === 'new' && item.qty + '×'}
                                {item.kind === 'increase' && '+' + item.qty}
                                {item.kind === 'decrease' && '−' + item.qty}
                                {item.kind === 'cancel' && '×'}
                                {item.kind === 'note' && '✎'}
                            </span>
                            <span className="rk-cart__name">{item.name}</span>
                            <span className="rk-cart__sum">
                                {item.kind === 'new' && 'Món mới'}
                                {item.kind === 'increase' && 'Gọi thêm'}
                                {item.kind === 'decrease' && 'Bớt'}
                                {item.kind === 'cancel' && 'Huỷ món'}
                                {item.kind === 'note' && 'Đổi ghi chú'}
                            </span>
                            {item.note && (
                                <span className="rk-cart__note">{item.note}</span>
                            )}
                        </div>
                    ))}
                </OrderCart>
            </div>

            <Modal
                open={showConfirm}
                title="Xác nhận cập nhật đơn hàng"
                description={`Bàn ${tableNumber ?? '—'} — bạn đang gửi yêu cầu cập nhật các món sau:`}
                onClose={() => {
                    if (!submitting) {
                        setShowConfirm(false)
                    }
                }}
                footer={
                    <>
                        <button
                            type="button"
                            className="rk-btn rk-btn--quiet"
                            disabled={submitting}
                            onClick={() => setShowConfirm(false)}
                        >
                            Quay lại
                        </button>

                        <button
                            type="button"
                            className="rk-btn rk-btn--primary"
                            disabled={submitting}
                            onClick={() => {
                                if (!submitting) {
                                    void submitUpdateOrder()
                                }
                            }}
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi cập nhật xuống bếp'}
                        </button>
                    </>
                }
            >
                <ul className="rk-rowlist">
                    {changeSummary.map((item) => (
                        <li key={item.dishId}>
                            <span>
                                {item.name}
                                {item.kind === 'new' && ` × ${item.qty} (Món mới)`}
                                {item.kind === 'increase' && ` +${item.qty}`}
                                {item.kind === 'decrease' && ` −${item.qty}`}
                                {item.kind === 'cancel' && ' (Huỷ món)'}
                                {item.kind === 'note' && ' (Cập nhật ghi chú)'}
                            </span>

                            {item.note && <small>Ghi chú: {item.note}</small>}
                        </li>
                    ))}
                </ul>
            </Modal>

            <Modal
                open={Boolean(successData)}
                title="Đã gửi cập nhật xuống bếp"
                description={successData?.message}
                size="sm"
                onClose={() => navigate('/waiter/tables')}
                footer={
                    <button
                        type="button"
                        className="rk-btn rk-btn--primary"
                        onClick={() => navigate('/waiter/tables')}
                    >
                        Về sơ đồ bàn
                    </button>
                }
            >
                <p className="rk-prose">{successData?.itemSummary}</p>
            </Modal>
        </div>
    )
}
