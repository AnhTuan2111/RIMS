import {Icon} from '@/shared/components/ui/Icon'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useNavigate, useParams, useSearchParams} from 'react-router-dom'

import * as waiterApi from '@/shared/api/waiter'
import type {
    CreateOrderRequest,
    MenuItemResponse,
    OrderItemRequest,
} from '@/shared/api/waiter'
import {BackArrow, fmtPrice, fmtPriceShort, useTableNumber} from './components'
import {Modal, OrderCart} from '@/shared/components/ui'
import {useWaiterSocket} from '@/realtime'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'
import {useToast} from '@/app/providers/useToast'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {dungAnhThayThe, duongDanAnh} from '@/shared/utils/image'

type DraftItem = {
    qty: number
    note: string
}

export default function WaiterCreateOrderPage() {
    const {notify} = useToast()

    const navigate = useNavigate()
    const {tableId} = useParams()
    const [searchParams] = useSearchParams()

    const tableIdNumber = Number.parseInt(tableId ?? '0', 10)

    // SỐ BÀN để hiển thị. Đường dẫn mang khoá chính, mà bàn ngoài đời
    // mang số "B01" — hai con số đó không trùng nhau.
    const tableNumber = useTableNumber(tableIdNumber)

    const reservationIdParam = searchParams.get('reservationId')

    const reservationId = reservationIdParam
        ? Number.parseInt(reservationIdParam, 10)
        : null

    const [menu, setMenu] = useState<MenuItemResponse[]>([])

    const [orderDraft, setOrderDraft] = useState<Record<number, DraftItem>>({})

    const [showConfirm, setShowConfirm] = useState(false)

    const [submitting, setSubmitting] = useState(false)

    const [activeCategory, setActiveCategory] = useState('Tất cả')

    const [searchQuery, setSearchQuery] = useState('')

    const [successData, setSuccessData] = useState<{
        message: string
        itemSummary: string
    } | null>(null)

    const [isLoadingMenu, setIsLoadingMenu] = useState(true)

    const [menuError, setMenuError] = useState<string | null>(null)

    const loadMenu = useCallback(async (signal?: AbortSignal, showFullLoading = true) => {
        try {
            if (showFullLoading) {
                setIsLoadingMenu(true)
            }

            setMenuError(null)

            const response = await waiterApi.getMenu(signal)

            if (signal?.aborted) {
                return
            }

            setMenu(response.data)
        } catch (requestError: unknown) {
            if (signal?.aborted || isRequestCanceled(requestError)) {
                return
            }

            console.error('[WAITER_CREATE_ORDER_MENU_ERROR]', requestError)

            setMenuError('Không thể tải danh sách món.')
        } finally {
            if (showFullLoading && !signal?.aborted) {
                setIsLoadingMenu(false)
            }
        }
    }, [])

    // Initial load on mount
    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadMenu()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [loadMenu])

    // WebSocket: refresh menu when backend broadcasts a waiter update
    useWaiterSocket(
        () => void loadMenu(undefined, false),
        () => void loadMenu(undefined, false),
    )

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

    const selectedItems = useMemo(
        () =>
            menu
                .map((dish) => {
                    const draft = orderDraft[dish.dishId] ?? {
                        qty: 0,
                        note: '',
                    }

                    if (draft.qty <= 0) {
                        return null
                    }

                    return {
                        ...dish,
                        qty: draft.qty,
                        note: draft.note,
                    }
                })
                .filter(Boolean) as Array<MenuItemResponse & DraftItem>,
        [menu, orderDraft],
    )

    const orderTotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0)

    function openConfirm() {
        if (!tableIdNumber) {
            notify('Không xác định được bàn.', {tone: 'alert'})
            return
        }

        if (!selectedItems.length) {
            notify('Vui lòng chọn ít nhất 1 món', {tone: 'alert'})
            return
        }

        setShowConfirm(true)
    }

    async function submitCreateOrder() {
        if (!tableIdNumber) {
            notify('Không xác định được bàn.', {tone: 'alert'})
            return
        }

        const items: OrderItemRequest[] = selectedItems.map((item) => ({
            dishId: item.dishId,
            quantity: item.qty,
            note: item.note || '',
        }))

        const payload: CreateOrderRequest = {
            tableId: tableIdNumber,
            items,
        }

        setSubmitting(true)

        try {
            const response = reservationId
                ? await waiterApi.createOrderFromReservation(reservationId, payload)
                : await waiterApi.createOrder(payload)

            setSuccessData({
                message: response.data.message || 'Tạo đơn hàng thành công',
                itemSummary: '',
            })
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[WAITER_CREATE_ORDER_SUBMIT_ERROR]', requestError)

            notify(getErrorMessage(requestError, 'Lỗi khi tạo đơn hàng'), {tone: 'alert'})
        } finally {
            setSubmitting(false)
            setShowConfirm(false)
        }
    }

    function changeDraftQty(dishId: number, delta: number, min = 0) {
        setOrderDraft((previous) => {
            const current = previous[dishId] ?? {
                qty: 0,
                note: '',
            }

            const qty = Math.max(min, current.qty + delta)

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
        setOrderDraft((previous) => {
            const current = previous[dishId] ?? {
                qty: 0,
                note: '',
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

    return (
        <div className="rk-stack">
            {/* Nút Quay lại đứng CẠNH tiêu đề, không phải hai đầu một hàng:
                rk-card__head-inline là space-between, nên hai phần tử đơn độc
                bị đẩy ra hai mép cách nhau cả nghìn pixel. */}
            <div className="rk-titlerow">
                <BackArrow onClick={() => navigate('/waiter/tables')} />

                <h2 className="rk-sectiontitle">
                    Tạo đơn hàng · Bàn {tableNumber ?? '—'}
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

                    {isLoadingMenu ? (
                        <LoadingState
                            title="Đang tải danh sách món"
                            description="Hệ thống đang lấy thực đơn mới nhất."
                        />
                    ) : menuError ? (
                        <ErrorState
                            message={menuError}
                            onRetry={() => void loadMenu(undefined, true)}
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
                                const isUnavailable = !dish.available
                                const picked = draft.qty > 0

                                return (
                                    <article
                                        key={dish.dishId}
                                        className={`rk-menucard${picked ? ' is-picked' : ''}${
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

                                            {isUnavailable && (
                                                <span className="rk-chip rk-chip--alert rk-menucard__flag">
                                                    Hết hàng
                                                </span>
                                            )}

                                            {/* Số phần nằm ĐÈ lên ảnh: phục vụ quét
                                                mắt qua lưới để biết đã gọi những gì,
                                                chứ không đọc từng thẻ một. */}
                                            {picked && (
                                                <span className="rk-menucard__count">
                                                    {draft.qty}
                                                </span>
                                            )}
                                        </div>

                                        <div className="rk-menucard__body">
                                            <h3 className="rk-menucard__name">
                                                {dish.name}
                                            </h3>
                                            <span className="rk-menucard__price">
                                                {fmtPriceShort(dish.price)}
                                            </span>
                                        </div>

                                        <div className="rk-menucard__foot">
                                            <div className="rk-stepper">
                                                <button
                                                    type="button"
                                                    className="rk-stepper__btn"
                                                    aria-label={
                                                        'Bớt một phần ' + dish.name
                                                    }
                                                    disabled={draft.qty <= 0}
                                                    onClick={() =>
                                                        changeDraftQty(dish.dishId, -1)
                                                    }
                                                >
                                                    −
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

                                            {/* Ô ghi chú chỉ hiện khi món ĐÃ được gọi.
                                                Hiện sẵn ở cả bốn mươi món thì lưới dài
                                                gấp rưỡi vì một thứ mà chín phần mười
                                                số món không dùng tới. */}
                                            {picked && (
                                                <input
                                                    placeholder="Ghi chú"
                                                    aria-label={
                                                        'Ghi chú cho ' + dish.name
                                                    }
                                                    value={draft.note}
                                                    disabled={isUnavailable}
                                                    className="rk-input"
                                                    onChange={(event) =>
                                                        setDraftNote(
                                                            dish.dishId,
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </div>

                <OrderCart
                    label="Giỏ đơn"
                    title={`Đơn bàn ${tableNumber ?? '—'}`}
                    count={selectedItems.length}
                    empty="Chưa gọi món nào. Bấm dấu cộng trên thẻ món để thêm."
                    foot={
                        <>
                            <div className="rk-cart__total">
                                <span>Tạm tính</span>
                                <b>{fmtPrice(orderTotal)}</b>
                            </div>

                            <button
                                type="button"
                                className="rk-btn rk-btn--go"
                                disabled={
                                    submitting ||
                                    isLoadingMenu ||
                                    !tableIdNumber ||
                                    selectedItems.length === 0
                                }
                                onClick={openConfirm}
                            >
                                Gửi đơn xuống bếp
                            </button>
                        </>
                    }
                >
                    {selectedItems.map((item) => (
                        <div className="rk-cart__line" key={item.dishId}>
                            <span className="rk-cart__qty">{item.qty}×</span>
                            <span className="rk-cart__name">{item.name}</span>
                            <span className="rk-cart__sum">
                                {fmtPrice(item.price * item.qty)}
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
                title="Xác nhận tạo đơn hàng"
                description={`Bàn ${tableNumber ?? ''} — ${selectedItems.length} món, tổng tạm tính ${fmtPrice(orderTotal)}`}
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
                                    void submitCreateOrder()
                                }
                            }}
                        >
                            {submitting ? 'Đang tạo...' : 'Gửi đơn xuống bếp'}
                        </button>
                    </>
                }
            >
                <ul className="rk-rowlist">
                    {selectedItems.map((item) => (
                        <li key={item.dishId}>
                            <span>
                                {item.name} × {item.qty}
                            </span>

                            {item.note && <small>Ghi chú: {item.note}</small>}
                        </li>
                    ))}
                </ul>
            </Modal>

            <Modal
                open={Boolean(successData)}
                title="Đã gửi đơn xuống bếp"
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
