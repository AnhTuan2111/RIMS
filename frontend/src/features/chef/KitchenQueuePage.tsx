import {Icon} from '@/shared/components/ui/Icon'
import {ErrorState, LoadingState} from '@/shared/components/feedback'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useKitchenSocket} from '@/realtime'

import {
    getDishDetail,
    getKitchenOrders,
    getCompletedOrders,
    getCancelledOrders,
    cancelDish,
    updateOrderItemStatus,
    updateChefInternalNote,
    type CancelledOrderResponse,
    type DishDetailResponse,
    type KitchenOrderItemResponse,
} from '@/shared/api/chef'
import {ConfirmDialog, Modal, StatusBoard, type BoardColumn} from '@/shared/components/ui'
import {useToast} from '@/app/providers/useToast'
import {ORDER_ITEM_STATUS_LABELS, type OrderItemStatus} from '@/shared/types/order'

/**
 * Số phiếu đã xong và đã huỷ giữ lại trên bảng.
 *
 * <p>Hai cột đó là để bếp NGÓ LẠI việc vừa làm, không phải để tra cứu. Lịch sử
 * đầy đủ có màn riêng — Đã xong và Đã huỷ — với bảng dày và bộ lọc.
 */
const RECENT_LIMIT = 20

const NEW_ORDER_MESSAGE_DURATION_MS = 6_000

/**
 * N phiếu GẦN NHẤT, mới nhất đứng đầu.
 *
 * <p>API trả theo thứ tự TĂNG DẦN theo giờ tạo, nên `slice(0, N)` giữ lại N
 * phiếu CŨ NHẤT — đúng ngược với việc của hai cột này. Bếp ngó sang đây để xem
 * món vừa xong, chứ không phải món xong từ đầu ca.
 */
function recent<T>(list: T[]): T[] {
    return list.slice(-RECENT_LIMIT).reverse()
}

/** Cột cắt bớt thì phải nói rõ, nếu không người đọc tưởng đó là tất cả. */
function cutNote(total: number, screen: string) {
    return total > RECENT_LIMIT
        ? `Chỉ hiện ${RECENT_LIMIT} phiếu gần nhất. Xem đủ ở màn ${screen}.`
        : undefined
}

type BrowserWindow = Window & {
    webkitAudioContext?: typeof AudioContext
}

function createAudioContext(): AudioContext | null {
    const AudioContextClass =
        window.AudioContext || (window as BrowserWindow).webkitAudioContext

    return AudioContextClass ? new AudioContextClass() : null
}

type SortOrder = 'OLDEST' | 'NEWEST'

function formatTime(value?: string) {
    if (!value) {
        return '—'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function KitchenQueuePage() {
    const {notify} = useToast()

    const [items, setItems] = useState<KitchenOrderItemResponse[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [searchText, setSearchText] = useState('')
    const [selectedTable, setSelectedTable] = useState('ALL')
    const [sortOrder, setSortOrder] = useState<SortOrder>('OLDEST')
    // Hai cột phải của bảng. Chúng chỉ để ngó lại, nên không có bộ lọc và
    // không chặn màn khi tải lỗi — bếp vẫn nấu được nếu chỉ cột Đang làm về.
    const [completedItems, setCompletedItems] = useState<KitchenOrderItemResponse[]>([])
    const [cancelledItems, setCancelledItems] = useState<CancelledOrderResponse[]>([])

    const [selectedDish, setSelectedDish] = useState<DishDetailResponse | null>(null)
    const [isDetailLoading, setIsDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState<string | null>(null)

    const [completingItemId, setCompletingItemId] = useState<number | null>(null)

    // Món đang chờ người dùng xác nhận hoàn thành.
    const [pendingComplete, setPendingComplete] = useState<{
        orderItemId: number
        dishName: string
        tableNumber?: string
        quantity?: number
    } | null>(null)

    const [cancelReason, setCancelReason] = useState('')
    const [cancelError, setCancelError] = useState<string | null>(null)
    const [isCancelSubmitting, setIsCancelSubmitting] = useState(false)

    const [chefInternalNote, setChefInternalNote] = useState('')

    const [internalNoteError, setInternalNoteError] = useState<string | null>(null)

    const [isInternalNoteSubmitting, setIsInternalNoteSubmitting] = useState(false)

    const [isSoundEnabled, setIsSoundEnabled] = useState(false)

    const [newOrderMessage, setNewOrderMessage] = useState<string | null>(null)

    const audioContextRef = useRef<AudioContext | null>(null)

    const isSoundEnabledRef = useRef(false)

    const knownOrderItemIdsRef = useRef<Set<number>>(new Set())

    const hasLoadedInitialOrdersRef = useRef(false)

    const newOrderMessageTimerRef = useRef<number | null>(null)

    const originalDocumentTitleRef = useRef(document.title)

    const playNewOrderSound = useCallback(() => {
        const audioContext = audioContextRef.current

        if (
            !isSoundEnabledRef.current ||
            !audioContext ||
            audioContext.state !== 'running'
        ) {
            return
        }

        const startTime = audioContext.currentTime

        const tones = [
            {
                frequency: 880,
                startOffset: 0,
                duration: 0.14,
            },
            {
                frequency: 1175,
                startOffset: 0.18,
                duration: 0.18,
            },
            {
                frequency: 1320,
                startOffset: 0.4,
                duration: 0.22,
            },
        ]

        tones.forEach((tone) => {
            const oscillator = audioContext.createOscillator()

            const gain = audioContext.createGain()

            oscillator.type = 'sine'

            oscillator.frequency.setValueAtTime(
                tone.frequency,
                startTime + tone.startOffset,
            )

            gain.gain.setValueAtTime(0.0001, startTime + tone.startOffset)

            gain.gain.exponentialRampToValueAtTime(
                0.18,
                startTime + tone.startOffset + 0.02,
            )

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                startTime + tone.startOffset + tone.duration,
            )

            oscillator.connect(gain)
            gain.connect(audioContext.destination)

            oscillator.start(startTime + tone.startOffset)

            oscillator.stop(startTime + tone.startOffset + tone.duration)
        })
    }, [])

    const showNewOrderMessage = useCallback((newOrderCount: number) => {
        const message =
            newOrderCount === 1
                ? 'Có 1 món mới vừa được gửi vào bếp.'
                : `Có ${newOrderCount} món mới vừa được gửi vào bếp.`

        setNewOrderMessage(message)

        document.title = `${newOrderCount} món mới - ` + originalDocumentTitleRef.current

        if (newOrderMessageTimerRef.current !== null) {
            window.clearTimeout(newOrderMessageTimerRef.current)
        }

        newOrderMessageTimerRef.current = window.setTimeout(() => {
            setNewOrderMessage(null)

            document.title = originalDocumentTitleRef.current

            newOrderMessageTimerRef.current = null
        }, NEW_ORDER_MESSAGE_DURATION_MS)
    }, [])

    const fetchKitchenOrders = useCallback(
        async (showFullLoading: boolean, signal?: AbortSignal) => {
            try {
                if (showFullLoading) {
                    setIsLoading(true)
                }

                const data = await getKitchenOrders(signal)

                if (hasLoadedInitialOrdersRef.current) {
                    const newItems = data.filter(
                        (item) => !knownOrderItemIdsRef.current.has(item.orderItemId),
                    )

                    if (newItems.length > 0) {
                        playNewOrderSound()

                        showNewOrderMessage(newItems.length)
                    }
                }

                knownOrderItemIdsRef.current = new Set(
                    data.map((item) => item.orderItemId),
                )

                hasLoadedInitialOrdersRef.current = true

                setItems(data)
                setError(null)
            } catch (requestError) {
                if (signal?.aborted) {
                    return
                }

                console.error('[CHEF_KITCHEN_QUEUE_FETCH_ERROR]', requestError)

                setError(
                    'Không thể tải danh sách món cần chế biến. Hãy kiểm tra backend hoặc đăng nhập bằng tài khoản Chef.',
                )
            } finally {
                if (showFullLoading) {
                    setIsLoading(false)
                }
            }
        },
        [playNewOrderSound, showNewOrderMessage],
    )

    /**
     * Hai cột phải của bảng.
     *
     * <p>Tải RIÊNG khỏi cột Đang làm và nuốt lỗi: chúng chỉ để ngó lại. Nếu
     * chúng cũng dựng màn lỗi thì một lần mạng chập ở lịch sử sẽ chặn bếp
     * không nấu được, mà bếp chỉ cần cột trái.
     */
    const fetchRecentOrders = useCallback(async (signal?: AbortSignal) => {
        const [completed, cancelled] = await Promise.allSettled([
            getCompletedOrders(signal),
            getCancelledOrders(signal),
        ])

        if (signal?.aborted) {
            return
        }

        if (completed.status === 'fulfilled') {
            setCompletedItems(completed.value)
        } else {
            console.error('[CHEF_COMPLETED_FETCH_ERROR]', completed.reason)
        }

        if (cancelled.status === 'fulfilled') {
            setCancelledItems(cancelled.value)
        } else {
            console.error('[CHEF_CANCELLED_FETCH_ERROR]', cancelled.reason)
        }
    }, [])

    useEffect(() => {
        const originalTitle = originalDocumentTitleRef.current

        return () => {
            if (newOrderMessageTimerRef.current !== null) {
                window.clearTimeout(newOrderMessageTimerRef.current)
            }

            document.title = originalTitle

            audioContextRef.current?.close().catch((requestError) => {
                console.error('[CHEF_AUDIO_CONTEXT_CLOSE_ERROR]', requestError)
            })

            audioContextRef.current = null
        }
    }, [])

    // Initial load on mount
    useEffect(() => {
        const controller = new AbortController()

        const timer = window.setTimeout(() => {
            void fetchKitchenOrders(true)
            void fetchRecentOrders(controller.signal)
        }, 0)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [fetchKitchenOrders, fetchRecentOrders])

    // WebSocket: refresh when backend broadcasts a kitchen update
    useKitchenSocket(() => {
        void fetchKitchenOrders(false)
        void fetchRecentOrders()

        // Nếu đang mở modal chi tiết, refetch để cập nhật trạng thái ghi chú/huỷ...
        if (selectedDish) {
            getDishDetail(selectedDish.orderItemId)
                .then(setSelectedDish)
                .catch((requestError) => {
                    console.error(requestError)
                })
        }
    })

    async function loadKitchenOrders() {
        await fetchKitchenOrders(true)
        await fetchRecentOrders()
    }

    async function handleSoundToggle() {
        if (isSoundEnabled) {
            isSoundEnabledRef.current = false
            setIsSoundEnabled(false)

            await audioContextRef.current?.close()

            audioContextRef.current = null

            return
        }

        const audioContext = audioContextRef.current ?? createAudioContext()

        if (!audioContext) {
            notify('Trình duyệt này không hỗ trợ phát âm thanh.', {tone: 'alert'})

            return
        }

        audioContextRef.current = audioContext

        if (audioContext.state === 'suspended') {
            await audioContext.resume()
        }

        isSoundEnabledRef.current = true
        setIsSoundEnabled(true)

        const oscillator = audioContext.createOscillator()

        const gain = audioContext.createGain()

        oscillator.type = 'sine'
        oscillator.frequency.value = 880
        gain.gain.value = 0.08

        oscillator.connect(gain)
        gain.connect(audioContext.destination)

        oscillator.start()

        window.setTimeout(() => {
            oscillator.stop()
        }, 120)
    }

    async function openDishDetail(orderItemId: number) {
        try {
            setIsDetailLoading(true)
            setDetailError(null)
            setSelectedDish(null)
            setCancelReason('')
            setCancelError(null)

            const data = await getDishDetail(orderItemId)

            setSelectedDish(data)
            setChefInternalNote(data.chefInternalNote ?? '')
            setInternalNoteError(null)
        } catch (requestError) {
            console.error(requestError)
            setDetailError('Không thể tải chi tiết món.')
        } finally {
            setIsDetailLoading(false)
        }
    }

    function closeDishDetail() {
        setSelectedDish(null)
        setDetailError(null)
        setIsDetailLoading(false)
        setCancelReason('')
        setCancelError(null)
        setIsCancelSubmitting(false)
        setChefInternalNote('')
        setInternalNoteError(null)
        setIsInternalNoteSubmitting(false)
    }

    async function handleSaveInternalNote() {
        if (!selectedDish) {
            return
        }

        const normalizedNote = chefInternalNote.trim()

        if (normalizedNote.length > 500) {
            setInternalNoteError('Ghi chú nội bộ không được vượt quá 500 ký tự.')
            return
        }

        // Ghi chú sửa lại được bất cứ lúc nào nên không chặn để hỏi.
        try {
            setIsInternalNoteSubmitting(true)
            setInternalNoteError(null)

            const updatedDetail = await updateChefInternalNote(
                selectedDish.orderItemId,
                normalizedNote,
            )

            setSelectedDish(updatedDetail)
            setChefInternalNote(updatedDetail.chefInternalNote ?? '')

            notify(
                normalizedNote
                    ? 'Đã gửi ghi chú nội bộ cho Waiter.'
                    : 'Đã xoá ghi chú nội bộ.',
                {tone: 'alert'},
            )
        } catch (requestError) {
            console.error(requestError)
            setInternalNoteError('Không thể lưu ghi chú nội bộ.')
        } finally {
            setIsInternalNoteSubmitting(false)
        }
    }

    async function handleComplete(orderItemId: number) {
        const currentItem = items.find((item) => item.orderItemId === orderItemId)

        const dishName =
            selectedDish?.orderItemId === orderItemId
                ? selectedDish.dishName
                : (currentItem?.dishName ?? 'món này')

        const tableNumber =
            selectedDish?.orderItemId === orderItemId
                ? selectedDish.tableNumber
                : currentItem?.tableNumber

        const quantity =
            selectedDish?.orderItemId === orderItemId
                ? selectedDish.quantity
                : currentItem?.quantity

        // Hoàn thành món KHÔNG hoàn tác được: backend chặn mọi thay đổi trạng
        // thái khi món không còn ở PREPARING. Nên vẫn hỏi lại, nhưng bằng hộp
        // thoại trong trang thay vì window.confirm chặn cả trình duyệt.
        setPendingComplete({orderItemId, dishName, tableNumber, quantity})
    }

    async function confirmComplete() {
        const pending = pendingComplete

        if (!pending) {
            return
        }

        const orderItemId = pending.orderItemId

        setPendingComplete(null)
        try {
            setCompletingItemId(orderItemId)

            await updateOrderItemStatus(orderItemId, 'COMPLETED')

            setItems((currentItems) =>
                currentItems.filter((item) => item.orderItemId !== orderItemId),
            )

            // Tải lại hai cột phải. Thiếu dòng này thì phiếu BIẾN MẤT khỏi cột
            // Đang làm mà không hiện sang cột Đã xong — bếp bấm xong một món và
            // thấy nó bốc hơi, không có cách nào biết việc đã được ghi nhận hay
            // chưa cho tới khi bấm Làm mới.
            void fetchRecentOrders()

            if (selectedDish?.orderItemId === orderItemId) {
                closeDishDetail()
            }
        } catch (requestError) {
            console.error(requestError)
            notify('Không thể cập nhật trạng thái món.', {tone: 'alert'})
        } finally {
            setCompletingItemId(null)
        }
    }

    async function handleCancelDish() {
        if (!selectedDish) {
            return
        }

        const normalizedReason = cancelReason.trim()

        if (!normalizedReason) {
            setCancelError('Vui lòng nhập lý do huỷ món.')
            return
        }

        if (normalizedReason.length > 500) {
            setCancelError('Lý do huỷ không được vượt quá 500 ký tự.')
            return
        }

        // Người dùng đã phải gõ lý do huỷ trong form ngay trên, đó chính là
        // bước xác nhận — hỏi thêm một lần nữa là thừa.
        try {
            setIsCancelSubmitting(true)
            setCancelError(null)

            const cancelledOrderItemId = selectedDish.orderItemId

            await cancelDish(cancelledOrderItemId, normalizedReason)

            /*
             * Huỷ từ modal chỉ xoá đúng OrderItem
             * đang được chọn khỏi hàng đợi.
             */
            setItems((currentItems) =>
                currentItems.filter((item) => item.orderItemId !== cancelledOrderItemId),
            )

            // Như trên: cột Đã huỷ phải nhận ngay phiếu vừa huỷ.
            void fetchRecentOrders()

            closeDishDetail()
        } catch (requestError) {
            console.error(requestError)
            setCancelError('Không thể huỷ món.')
        } finally {
            setIsCancelSubmitting(false)
        }
    }

    function clearFilters() {
        setSearchText('')
        setSelectedTable('ALL')
        setSortOrder('OLDEST')
    }

    const tableNumbers = useMemo<string[]>(() => {
        return Array.from(new Set(items.map((item) => item.tableNumber))).sort(
            (firstTable, secondTable) =>
                firstTable.localeCompare(secondTable, 'vi', {numeric: true}),
        )
    }, [items])

    const filteredItems = useMemo(() => {
        const keyword = searchText.trim().toLowerCase()

        return [...items]
            .filter((item) => {
                const matchesSearch =
                    keyword === '' ||
                    item.dishName.toLowerCase().includes(keyword) ||
                    item.tableNumber.toLowerCase().includes(keyword) ||
                    String(item.orderId).includes(keyword) ||
                    String(item.orderItemId).includes(keyword)

                const matchesTable =
                    selectedTable === 'ALL' || item.tableNumber === selectedTable

                return matchesSearch && matchesTable
            })
            .sort((firstItem, secondItem) => {
                const firstTime = firstItem.createdAt
                    ? new Date(firstItem.createdAt).getTime()
                    : 0

                const secondTime = secondItem.createdAt
                    ? new Date(secondItem.createdAt).getTime()
                    : 0

                return sortOrder === 'OLDEST'
                    ? firstTime - secondTime
                    : secondTime - firstTime
            })
    }, [items, searchText, selectedTable, sortOrder])

    /**
     * Ba cột là ba giá trị của enum OrderItemStatus, không phải ba giai đoạn do
     * tôi nghĩ ra.
     *
     * <p>Lúc phỏng vấn tôi ghi dòng bếp là "Chờ → Đang nấu → Xong". Dòng đó
     * KHÔNG có trong dự án: `OrderItemStatus` chỉ có PREPARING, COMPLETED,
     * CANCELLED — món vào bếp là đã đang làm, không có bậc chờ. Ba cột lấy đúng
     * ba giá trị thật.
     *
     * <p>Bộ lọc và sắp xếp chỉ áp cho cột ĐANG LÀM. Hai cột kia là việc đã
     * xong, lọc chúng không giúp nấu nhanh hơn.
     */
    const columns = useMemo<
        BoardColumn<KitchenOrderItemResponse | CancelledOrderResponse>[]
    >(
        () => [
            {
                key: 'PREPARING',
                label: 'Đang làm',
                tone: 'busy',
                items: filteredItems,
                empty: 'Bếp trống. Chưa có món nào cần làm.',
            },
            {
                key: 'COMPLETED',
                label: 'Đã xong',
                tone: 'ok',
                items: recent(completedItems),
                total: completedItems.length,
                note: cutNote(completedItems.length, 'Đã xong'),
                empty: 'Chưa có món nào xong trong hôm nay.',
            },
            {
                key: 'CANCELLED',
                label: 'Đã huỷ',
                tone: 'alert',
                items: recent(cancelledItems),
                total: cancelledItems.length,
                note: cutNote(cancelledItems.length, 'Đã huỷ'),
                empty: 'Không có món nào bị huỷ.',
            },
        ],
        [filteredItems, completedItems, cancelledItems],
    )

    if (isLoading) {
        return (
            <LoadingState
                title="Đang tải danh sách món cần chế biến..."
                description="Hệ thống đang lấy dữ liệu mới nhất từ bếp."
            />
        )
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={() => {
                    loadKitchenOrders().catch((requestError) => {
                        console.error(requestError)
                    })
                }}
            />
        )
    }

    return (
        <div className="rk-stack">
            <section className="rk-card rk-card--pad">
                <div className="rk-card__head-inline">
                    <div>
                        <h2>Đơn cần chế biến</h2>
                        <p>Chọn món để xem chi tiết, hoàn thành món hoặc huỷ món.</p>
                    </div>

                    <div className="rk-actions">
                        <span className="rk-chip rk-chip--busy">
                            {items.length} món đang chờ làm
                        </span>

                        <button
                            type="button"
                            aria-pressed={isSoundEnabled}
                            title={
                                isSoundEnabled
                                    ? 'Tắt chuông báo món mới'
                                    : 'Bật chuông báo món mới'
                            }
                            className={isSoundEnabled ? 'rk-btn rk-btn--go' : 'rk-btn'}
                            onClick={() => {
                                handleSoundToggle().catch((requestError) => {
                                    console.error(requestError)
                                })
                            }}
                        >
                            {isSoundEnabled ? 'Âm thanh đang bật' : 'Bật âm thanh'}
                        </button>

                        <button
                            type="button"
                            className="rk-btn rk-btn--quiet"
                            onClick={() => {
                                loadKitchenOrders().catch((requestError) => {
                                    console.error(requestError)
                                })
                            }}
                        >
                            Làm mới
                        </button>
                    </div>
                </div>
            </section>

            {newOrderMessage && (
                <div className="rk-note rk-note--busy" role="status" aria-live="polite">
                    <span className="rk-icon">
                        <Icon name="bell" className="rk-icon" />
                    </span>

                    <div>
                        <strong>Đơn mới</strong>
                        <p>{newOrderMessage}</p>
                    </div>
                </div>
            )}

            <section className="rk-card rk-card--pad">
                <div className="rk-filterbar">
                    <input
                        type="search"
                        value={searchText}
                        placeholder="Tìm theo tên món, bàn hoặc mã đơn..."
                        onChange={(event) => {
                            setSearchText(event.target.value)
                        }}
                    />

                    <select
                        value={selectedTable}
                        onChange={(event) => {
                            setSelectedTable(event.target.value)
                        }}
                    >
                        <option value="ALL">Tất cả bàn</option>

                        {tableNumbers.map((tableNumber) => (
                            <option key={tableNumber} value={tableNumber}>
                                Bàn {tableNumber}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(event) => {
                            setSortOrder(event.target.value as SortOrder)
                        }}
                    >
                        <option value="OLDEST">Cũ nhất trước</option>

                        <option value="NEWEST">Mới nhất trước</option>
                    </select>

                    <button
                        type="button"
                        className="rk-btn rk-btn--quiet"
                        onClick={clearFilters}
                    >
                        Xoá bộ lọc
                    </button>
                </div>
            </section>

            <StatusBoard
                label="Món theo trạng thái"
                columns={columns}
                itemKey={(item) => item.orderItemId}
                renderItem={(item, columnKey) => {
                    const cancelled = columnKey === 'CANCELLED'
                    const done = columnKey === 'COMPLETED'

                    return (
                        <article
                            className={`rk-ticket${done ? ' rk-ticket--done' : ''}${
                                cancelled ? ' rk-ticket--void' : ''
                            }`}
                        >
                            {/* Số lượng đứng trước tên món và to gấp đôi: đầu bếp
                                nhìn từ xa cần thấy "mấy phần" trước tiên. */}
                            <div className="rk-ticket__qty">
                                <span className="rk-ticket__qty-num">
                                    {item.quantity}
                                </span>
                                <span className="rk-ticket__qty-unit">phần</span>
                            </div>

                            <div className="rk-ticket__main">
                                <h3 className="rk-ticket__dish">{item.dishName}</h3>

                                <div className="rk-ticket__meta">
                                    <span>
                                        Bàn <strong>{item.tableNumber}</strong>
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span className="rk-num">
                                        {formatTime(
                                            cancelled
                                                ? (item as CancelledOrderResponse)
                                                      .cancelledAt
                                                : (item as KitchenOrderItemResponse)
                                                      .createdAt,
                                        )}
                                    </span>
                                </div>

                                {/* Chip trạng thái BỎ ĐI ở bảng: cột đã nói trạng
                                    thái rồi, chip chỉ lặp lại cùng một tin. */}
                                {cancelled &&
                                    (item as CancelledOrderResponse).cancelReason && (
                                        <p className="rk-ticket__note rk-ticket__note--void">
                                            Lý do:{' '}
                                            {
                                                (item as CancelledOrderResponse)
                                                    .cancelReason
                                            }
                                        </p>
                                    )}

                                {!cancelled &&
                                    (item as KitchenOrderItemResponse).note && (
                                        <p className="rk-ticket__note">
                                            {(item as KitchenOrderItemResponse).note}
                                        </p>
                                    )}

                                {/* Chỉ cột ĐANG LÀM có nút. Món đã xong hoặc đã
                                    huỷ thì không còn việc gì để làm với nó. */}
                                {!cancelled && !done && (
                                    <div className="rk-ticket__actions">
                                        <button
                                            type="button"
                                            className="rk-btn rk-btn--go"
                                            disabled={
                                                completingItemId === item.orderItemId
                                            }
                                            onClick={() => {
                                                handleComplete(item.orderItemId).catch(
                                                    (requestError) => {
                                                        console.error(requestError)
                                                    },
                                                )
                                            }}
                                        >
                                            <Icon name="check" className="rk-icon" />
                                            {completingItemId === item.orderItemId
                                                ? 'Đang cập nhật...'
                                                : 'Xong món'}
                                        </button>

                                        <button
                                            type="button"
                                            className="rk-btn rk-btn--quiet"
                                            onClick={() => {
                                                openDishDetail(item.orderItemId).catch(
                                                    (requestError) => {
                                                        console.error(requestError)
                                                    },
                                                )
                                            }}
                                        >
                                            Chi tiết
                                        </button>
                                    </div>
                                )}
                            </div>
                        </article>
                    )
                }}
            />

            <Modal
                open={isDetailLoading || Boolean(detailError) || Boolean(selectedDish)}
                title={selectedDish ? selectedDish.dishName : 'Chi tiết món'}
                description={
                    selectedDish
                        ? `Bàn ${selectedDish.tableNumber} · ${selectedDish.quantity} phần`
                        : undefined
                }
                size="lg"
                onClose={closeDishDetail}
                footer={
                    selectedDish ? (
                        <>
                            <button
                                type="button"
                                className="rk-btn rk-btn--quiet"
                                onClick={closeDishDetail}
                            >
                                Quay lại
                            </button>

                            <button
                                type="button"
                                className="rk-btn rk-btn--danger"
                                disabled={isCancelSubmitting}
                                onClick={() =>
                                    handleCancelDish().catch((requestError) => {
                                        console.error(requestError)
                                    })
                                }
                            >
                                {isCancelSubmitting ? 'Đang huỷ...' : 'Huỷ món'}
                            </button>

                            <button
                                type="button"
                                className="rk-btn rk-btn--go"
                                disabled={completingItemId === selectedDish.orderItemId}
                                onClick={() =>
                                    handleComplete(selectedDish.orderItemId).catch(
                                        (requestError) => {
                                            console.error(requestError)
                                        },
                                    )
                                }
                            >
                                {completingItemId === selectedDish.orderItemId
                                    ? 'Đang cập nhật...'
                                    : 'Xong món'}
                            </button>
                        </>
                    ) : undefined
                }
            >
                {isDetailLoading && (
                    <p className="rk-modal__loading">Đang tải chi tiết món...</p>
                )}

                {detailError && <p className="rk-formerror">{detailError}</p>}

                {selectedDish && (
                    <>
                        <div>
                            <div className="rk-details">
                                <div>
                                    <span>Trạng thái</span>
                                    <strong>
                                        {ORDER_ITEM_STATUS_LABELS[
                                            selectedDish.status as OrderItemStatus
                                        ] ?? selectedDish.status}
                                    </strong>
                                </div>

                                <div>
                                    <span>Vào bếp lúc</span>
                                    <strong>{formatTime(selectedDish.createdAt)}</strong>
                                </div>

                                <div>
                                    <span>Mã món</span>
                                    <strong>#{selectedDish.orderItemId}</strong>
                                </div>
                            </div>

                            <div className="rk-stack">
                                <h3>Mô tả món</h3>
                                <p>{selectedDish.description || 'Không có mô tả.'}</p>
                            </div>

                            <div className="rk-stack">
                                <h3>Ghi chú</h3>
                                <p>{selectedDish.note || 'Không có ghi chú.'}</p>
                            </div>

                            <div className="rk-field">
                                <div className="rk-field__label">
                                    <div>
                                        <h3>Ghi chú nội bộ cho Waiter</h3>

                                        <p>
                                            Dùng để báo tình trạng bếp trước khi Waiter
                                            trao đổi với khách.
                                        </p>
                                    </div>

                                    {selectedDish.chefInternalNote && (
                                        <span
                                            className={
                                                selectedDish.chefInternalNoteAcknowledgedAt
                                                    ? 'rk-chip rk-chip--ok'
                                                    : 'rk-chip rk-chip--busy'
                                            }
                                        >
                                            {selectedDish.chefInternalNoteAcknowledgedAt
                                                ? 'Waiter đã xem'
                                                : 'Chờ Waiter xem'}
                                        </span>
                                    )}
                                </div>

                                <div className="rk-actions">
                                    {[
                                        'Hết sốt, vui lòng hỏi khách đổi lựa chọn.',
                                        'Món sẽ chậm thêm khoảng 10 phút.',
                                        'Món này hiện chỉ còn 1 phần.',
                                        'Có thể phục vụ nhưng thiếu phần trang trí.',
                                    ].map((quickNote) => (
                                        <button
                                            type="button"
                                            key={quickNote}
                                            onClick={() => {
                                                setChefInternalNote(quickNote)
                                                setInternalNoteError(null)
                                            }}
                                        >
                                            {quickNote}
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    rows={4}
                                    maxLength={500}
                                    value={chefInternalNote}
                                    placeholder="Ví dụ: Hết sốt tiêu đen, vui lòng hỏi khách đổi sang sốt nấm."
                                    onChange={(event) => {
                                        setChefInternalNote(event.target.value)
                                        setInternalNoteError(null)
                                    }}
                                />

                                <div className="rk-actions rk-actions--end">
                                    <span>{chefInternalNote.length}/500</span>

                                    <button
                                        type="button"
                                        className="rk-btn rk-btn--quiet"
                                        disabled={isInternalNoteSubmitting}
                                        onClick={() =>
                                            handleSaveInternalNote().catch(
                                                (requestError) => {
                                                    console.error(requestError)
                                                },
                                            )
                                        }
                                    >
                                        {isInternalNoteSubmitting
                                            ? 'Đang gửi...'
                                            : chefInternalNote.trim()
                                              ? 'Gửi cho Waiter'
                                              : 'Xoá ghi chú'}
                                    </button>
                                </div>

                                {internalNoteError && (
                                    <p className="rk-formerror">{internalNoteError}</p>
                                )}
                            </div>

                            <div className="rk-dangerzone">
                                <h3>Huỷ món</h3>

                                <p>
                                    Món sẽ bị huỷ ngay. Waiter chỉ nhận thông báo để báo
                                    lại với khách.
                                </p>

                                <textarea
                                    rows={4}
                                    maxLength={500}
                                    value={cancelReason}
                                    placeholder="Nhập lý do huỷ món..."
                                    onChange={(event) => {
                                        setCancelReason(event.target.value)
                                        setCancelError(null)
                                    }}
                                />

                                <div className="rk-field__hint">
                                    {cancelReason.length}/500
                                </div>

                                {cancelError && (
                                    <p className="rk-formerror">{cancelError}</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </Modal>

            <ConfirmDialog
                open={pendingComplete !== null}
                title={`Hoàn thành món "${pendingComplete?.dishName ?? ''}"?`}
                description={[
                    pendingComplete?.tableNumber
                        ? `Bàn ${pendingComplete.tableNumber}`
                        : null,
                    pendingComplete?.quantity ? `${pendingComplete.quantity} phần` : null,
                    'Món sẽ chuyển sang danh sách đã hoàn thành và không hoàn tác được.',
                ]
                    .filter(Boolean)
                    .join(' · ')}
                confirmLabel="Hoàn thành"
                busy={completingItemId !== null}
                onConfirm={() => void confirmComplete()}
                onCancel={() => setPendingComplete(null)}
            />
        </div>
    )
}
