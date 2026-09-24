import {UtensilsCrossed} from 'lucide-react'

import {useCallback, useEffect, useMemo, useState} from 'react'
import {useNavigate, useParams, useSearchParams} from 'react-router-dom'

import * as waiterApi from '@/shared/api/waiter'
import type {
    CreateOrderRequest,
    MenuItemResponse,
    OrderItemRequest,
} from '@/shared/api/waiter'
import {BackArrow, fmtPrice, WaiterHeader} from './components'
import {Modal} from '@/shared/components/ui'
import {useWaiterSocket} from '@/realtime'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'
import {useToast} from '@/app/providers/useToast'
import {EmptyState, ErrorState, LoadingState} from '@/shared/components/feedback'
import {dungAnhThayThe} from '@/shared/utils/image'

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
            <WaiterHeader title="Tạo đơn hàng" />

            <div className="rk-stack">
                <div className="rk-card__head-inline">
                    <BackArrow onClick={() => navigate('/waiter/tables')} />

                    <h2 className="rk-sectiontitle">
                        Tạo đơn hàng - Bàn {tableIdNumber || '—'}
                    </h2>

                    <button
                        type="button"
                        className="rk-btn rk-btn--primary"
                        disabled={submitting || isLoadingMenu || !tableIdNumber}
                        onClick={openConfirm}
                    >
                        Tạo đơn hàng
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Tìm theo tên món hoặc danh mục…"
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
                    <div className="rk-cardgrid">
                        {visibleMenu.map((dish) => {
                            const draft = orderDraft[dish.dishId] ?? {
                                qty: 0,
                                note: '',
                            }

                            const isUnavailable = !dish.available

                            return (
                                <div
                                    key={dish.dishId}
                                    className={`rk-card rk-card--pad${
                                        isUnavailable ? ' is-unavailable' : ''
                                    }`}
                                >
                                    <div className="rk-media">
                                        {dish.imageUrl ? (
                                            <img
                                                src={
                                                    dish.imageUrl.startsWith('http')
                                                        ? dish.imageUrl
                                                        : `/image/${dish.imageUrl}`
                                                }
                                                alt={dish.name}
                                                className="rk-thumb"
                                                onError={dungAnhThayThe}
                                            />
                                        ) : (
                                            <span className="rk-thumb">
                                                <UtensilsCrossed
                                                    className="rk-icon"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        )}

                                        <div className="rk-rowlist__main">
                                            <h4>{dish.name}</h4>
                                            <p>{fmtPrice(dish.price)}</p>
                                            {isUnavailable && (
                                                <span className="rk-chip rk-chip--alert">
                                                    Hết hàng
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rk-stepper">
                                        <button
                                            type="button"
                                            className="rk-stepper__btn"
                                            disabled={draft.qty <= 0}
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
                                            disabled={isUnavailable}
                                            onClick={() => changeDraftQty(dish.dishId, 1)}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <input
                                        placeholder="Ghi chú"
                                        value={draft.note}
                                        disabled={isUnavailable}
                                        className="rk-input"
                                        onChange={(event) =>
                                            setDraftNote(dish.dishId, event.target.value)
                                        }
                                    />
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <Modal
                open={showConfirm}
                title="Xác nhận tạo đơn hàng"
                description={`Bàn ${tableIdNumber} — ${selectedItems.length} món, tổng tạm tính ${fmtPrice(orderTotal)}`}
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
                            {submitting ? 'Đang tạo…' : 'Gửi đơn xuống bếp'}
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
