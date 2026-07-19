import {
    useRef,
    useState,
    type FormEvent,
} from 'react'

import {
    cancelReservation,
    checkReservationByDate,
    createReservation,
    getAvailableTables,
    getCurrentReservation,
} from '../../api/customer'
import type {
    CustomerCreateReservationRequest,
    CustomerReservationResponse,
    RestaurantTable,
} from '../../api/customer'
import {REALTIME_CONFIG} from '../../app/config/realtime'
import {usePolling} from '../../hooks/usePolling'

const today = new Date()
const todayStr = today.toISOString().split('T')[0]

type ReservationTab =
    | 'book'
    | 'cancel'

function isRequestCanceled(error: unknown) {
    if (typeof error !== 'object' || error === null) {
        return false
    }

    const requestError = error as {
        name?: string
        code?: string
        message?: string
    }

    return (
        requestError.name === 'CanceledError'
        || requestError.code === 'ERR_CANCELED'
        || requestError.message === 'canceled'
    )
}

function getRequestErrorMessage(
    error: unknown,
    fallback: string,
) {
    if (typeof error !== 'object' || error === null) {
        return fallback
    }

    const requestError = error as {
        response?: {
            data?: string | {
                message?: string
            }
        }
        message?: string
    }

    const responseData = requestError.response?.data

    if (typeof responseData === 'string') {
        return responseData
    }

    if (responseData?.message) {
        return responseData.message
    }

    return requestError.message || fallback
}

function isNotFoundError(error: unknown) {
    if (typeof error !== 'object' || error === null) {
        return false
    }

    const requestError = error as {
        response?: {
            status?: number
        }
    }

    return requestError.response?.status === 404
}

function formatDateTime(iso: string) {
    const date = new Date(iso)

    if (Number.isNaN(date.getTime())) {
        return iso
    }

    return date.toLocaleString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const statusLabels: Record<string, string> = {
    QUEUED: 'Đang chờ',
    WAITING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
}

export default function CustomerReservations() {
    const [activeTab, setActiveTab] =
        useState<ReservationTab>('book')

    const [bookForm, setBookForm] =
        useState<CustomerCreateReservationRequest>({
            customerName: '',
            phone: '',
            reservationTime: `${todayStr}T18:00:00`,
            note: '',
            tableId: 0,
        })

    const [availableTables, setAvailableTables] =
        useState<RestaurantTable[]>([])

    const [bookLoading, setBookLoading] =
        useState(false)

    const [bookError, setBookError] =
        useState('')

    const [bookSuccess, setBookSuccess] =
        useState<CustomerReservationResponse | null>(null)

    const [loadingTables, setLoadingTables] =
        useState(true)

    const [tableError, setTableError] =
        useState<string | null>(null)

    const [cancelLoading, setCancelLoading] =
        useState(false)

    const [cancelError, setCancelError] =
        useState('')

    const [cancelSuccess, setCancelSuccess] =
        useState<CustomerReservationResponse | null>(null)

    const [currentReservation, setCurrentReservation] =
        useState<CustomerReservationResponse | null>(null)

    const [loadingCurrent, setLoadingCurrent] =
        useState(false)

    const hasLoadedInitialTablesRef =
        useRef(false)

    const hasLoadedInitialReservationRef =
        useRef(false)

    async function loadAvailableTables(
        signal?: AbortSignal,
        showFullLoading = true,
    ) {
        try {
            if (showFullLoading) {
                setLoadingTables(true)
            }

            setTableError(null)

            const tables =
                await getAvailableTables(signal)

            if (signal?.aborted) {
                return
            }

            setAvailableTables(tables ?? [])

            if (tables?.length) {
                setBookForm((previous) => {
                    if (previous.tableId !== 0) {
                        return previous
                    }

                    return {
                        ...previous,
                        tableId: tables[0].id,
                    }
                })
            }
        } catch (requestError: unknown) {
            if (
                signal?.aborted
                || isRequestCanceled(requestError)
            ) {
                return
            }

            console.error(
                '[CUSTOMER_RESERVATIONS_TABLES_ERROR]',
                requestError,
            )

            setTableError(
                getRequestErrorMessage(
                    requestError,
                    'Không thể tải danh sách bàn',
                ),
            )

            setAvailableTables([])
        } finally {
            if (
                showFullLoading
                && !signal?.aborted
            ) {
                setLoadingTables(false)
            }
        }
    }

    async function loadCurrentReservation(
        signal?: AbortSignal,
        showFullLoading = true,
    ) {
        try {
            if (showFullLoading) {
                setLoadingCurrent(true)
            }

            const reservation =
                await getCurrentReservation(signal)

            if (signal?.aborted) {
                return
            }

            setCurrentReservation(reservation)
        } catch (requestError: unknown) {
            if (
                signal?.aborted
                || isRequestCanceled(requestError)
            ) {
                return
            }

            if (!isNotFoundError(requestError)) {
                console.error(
                    '[CUSTOMER_CURRENT_RESERVATION_ERROR]',
                    requestError,
                )
            }

            setCurrentReservation(null)
        } finally {
            if (
                showFullLoading
                && !signal?.aborted
            ) {
                setLoadingCurrent(false)
            }
        }
    }

    async function loadReservationState(
        signal?: AbortSignal,
        showFullLoading = true,
    ) {
        try {
            if (showFullLoading) {
                setLoadingCurrent(true)
            }

            const hasReservation =
                await checkReservationByDate(
                    todayStr,
                    signal,
                )

            if (signal?.aborted) {
                return
            }

            if (hasReservation) {
                await loadCurrentReservation(
                    signal,
                    false,
                )
            } else {
                setCurrentReservation(null)
            }
        } catch (requestError: unknown) {
            if (
                signal?.aborted
                || isRequestCanceled(requestError)
            ) {
                return
            }

            console.error(
                '[CUSTOMER_RESERVATION_STATE_ERROR]',
                requestError,
            )

            setCurrentReservation(null)
        } finally {
            if (
                showFullLoading
                && !signal?.aborted
            ) {
                setLoadingCurrent(false)
            }
        }
    }

    usePolling(
        async (signal) => {
            const isInitialLoad =
                !hasLoadedInitialTablesRef.current

            await loadAvailableTables(
                signal,
                isInitialLoad,
            )

            hasLoadedInitialTablesRef.current = true
        },
        {
            intervalMs:
            REALTIME_CONFIG
                .customer
                .reservationIntervalMs,

            runImmediately: true,
            pauseWhenHidden: true,

            onError: (requestError) => {
                console.error(
                    '[CUSTOMER_TABLES_POLL_ERROR]',
                    requestError,
                )
            },
        },
    )

    usePolling(
        async (signal) => {
            const isInitialLoad =
                !hasLoadedInitialReservationRef.current

            await loadReservationState(
                signal,
                isInitialLoad,
            )

            hasLoadedInitialReservationRef.current = true
        },
        {
            intervalMs:
            REALTIME_CONFIG
                .customer
                .reservationIntervalMs,

            runImmediately: true,
            pauseWhenHidden: true,

            onError: (requestError) => {
                console.error(
                    '[CUSTOMER_RESERVATION_POLL_ERROR]',
                    requestError,
                )
            },
        },
    )

    async function handleBookSubmit(
        event: FormEvent,
    ) {
        event.preventDefault()

        setBookError('')
        setBookSuccess(null)
        setBookLoading(true)

        try {
            const result =
                await createReservation(bookForm)

            setBookSuccess(result)

            setBookForm((previous) => ({
                ...previous,
                customerName: '',
                phone: '',
                note: '',
                reservationTime: `${todayStr}T18:00:00`,
            }))

            await loadAvailableTables(
                undefined,
                false,
            )

            await loadReservationState(
                undefined,
                false,
            )

            setActiveTab('cancel')
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error(
                '[CUSTOMER_BOOK_RESERVATION_ERROR]',
                requestError,
            )

            setBookError(
                getRequestErrorMessage(
                    requestError,
                    'Đặt bàn thất bại',
                ),
            )
        } finally {
            setBookLoading(false)
        }
    }

    async function handleCancelSubmit(
        event: FormEvent,
    ) {
        event.preventDefault()

        setCancelError('')
        setCancelSuccess(null)
        setCancelLoading(true)

        try {
            if (!currentReservation) {
                throw new Error(
                    'Không có đặt bàn để hủy',
                )
            }

            const result =
                await cancelReservation(
                    currentReservation.id,
                )

            setCancelSuccess(result)
            setCurrentReservation(null)

            await loadAvailableTables(
                undefined,
                false,
            )

            await loadReservationState(
                undefined,
                false,
            )
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error(
                '[CUSTOMER_CANCEL_RESERVATION_ERROR]',
                requestError,
            )

            setCancelError(
                getRequestErrorMessage(
                    requestError,
                    'Hủy đặt bàn thất bại',
                ),
            )
        } finally {
            setCancelLoading(false)
        }
    }

    return (
        <div className="customer-reservations-page">
            <div className="customer-reservations-header">
                <h1 className="customer-reservations-title">
                    📋 Đặt bàn
                </h1>

                <p>
                    Quản lý đặt bàn của bạn tại nhà hàng
                </p>
            </div>

            <div className="customer-reservations-tabs">
                <button
                    type="button"
                    className={`customer-tab ${
                        activeTab === 'book'
                            ? 'active'
                            : ''
                    }`}
                    onClick={() => {
                        setActiveTab('book')
                        setBookSuccess(null)
                        setBookError('')
                    }}
                >
                    Đặt bàn mới
                </button>

                <button
                    type="button"
                    className={`customer-tab ${
                        activeTab === 'cancel'
                            ? 'active'
                            : ''
                    }`}
                    onClick={() => {
                        setActiveTab('cancel')
                        setCancelSuccess(null)
                        setCancelError('')
                        void loadCurrentReservation(
                            undefined,
                            true,
                        )
                    }}
                >
                    Hủy đặt bàn
                </button>
            </div>

            {activeTab === 'book' && (
                <div className="customer-reservation-card">
                    <h2>📝 Đặt bàn mới</h2>

                    <p className="customer-reservation-sub">
                        Mỗi khách hàng chỉ được đặt{' '}
                        <strong>1 bàn/ngày</strong>
                    </p>

                    {bookSuccess && (
                        <div className="customer-success-box">
                            <strong>
                                ✅ Đặt bàn thành công!
                            </strong>

                            <div className="customer-success-detail">
                                <span>
                                    Bàn{' '}
                                    <strong>
                                        {bookSuccess.tableNumber}
                                    </strong>
                                    {' - '}
                                    {formatDateTime(
                                        bookSuccess.reservationTime,
                                    )}
                                </span>

                                <span>
                                    Trạng thái:{' '}
                                    <strong>
                                        {statusLabels[
                                            bookSuccess.status
                                            ] ?? bookSuccess.status}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    )}

                    {bookError && (
                        <div className="customer-error-box">
                            ❌ {bookError}
                        </div>
                    )}

                    <form
                        className="customer-reservation-form"
                        onSubmit={(event) =>
                            void handleBookSubmit(event)
                        }
                    >
                        <div className="customer-form-row">
                            <div className="customer-form-group">
                                <label>
                                    Tên khách hàng{' '}
                                    <span className="required">*</span>
                                </label>

                                <input
                                    type="text"
                                    value={bookForm.customerName}
                                    placeholder="Nhập họ và tên"
                                    required
                                    maxLength={50}
                                    onChange={(event) =>
                                        setBookForm((previous) => ({
                                            ...previous,
                                            customerName:
                                            event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="customer-form-group">
                                <label>
                                    Số điện thoại{' '}
                                    <span className="required">*</span>
                                </label>

                                <input
                                    type="tel"
                                    value={bookForm.phone}
                                    placeholder="0123456789"
                                    required
                                    pattern="[0-9]{10}"
                                    onChange={(event) =>
                                        setBookForm((previous) => ({
                                            ...previous,
                                            phone:
                                                event.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 10),
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="customer-form-row">
                            <div className="customer-form-group">
                                <label>
                                    Ngày đặt{' '}
                                    <span className="required">*</span>
                                </label>

                                <input
                                    type="date"
                                    value={
                                        bookForm.reservationTime
                                            .split('T')[0]
                                    }
                                    min={todayStr}
                                    required
                                    onChange={(event) => {
                                        const time =
                                            bookForm.reservationTime
                                                .split('T')[1]
                                            || '18:00:00'

                                        setBookForm((previous) => ({
                                            ...previous,
                                            reservationTime:
                                                `${event.target.value}T${time}`,
                                        }))
                                    }}
                                />
                            </div>

                            <div className="customer-form-group">
                                <label>
                                    Giờ đặt{' '}
                                    <span className="required">*</span>
                                </label>

                                <select
                                    value={
                                        bookForm.reservationTime
                                            .split('T')[1]
                                            ?.slice(0, 5)
                                        || '18:00'
                                    }
                                    required
                                    onChange={(event) => {
                                        const date =
                                            bookForm.reservationTime
                                                .split('T')[0]
                                            || todayStr

                                        setBookForm((previous) => ({
                                            ...previous,
                                            reservationTime:
                                                `${date}T${event.target.value}:00`,
                                        }))
                                    }}
                                >
                                    {Array.from(
                                        {
                                            length: 14,
                                        },
                                        (_, index) => index + 10,
                                    ).map((hourNumber) => {
                                        const hour =
                                            String(hourNumber)
                                                .padStart(2, '0')

                                        return (
                                            <option
                                                key={hourNumber}
                                                value={`${hour}:00`}
                                            >
                                                {hour}:00
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="customer-form-row">
                            <div className="customer-form-group">
                                <label>
                                    Chọn bàn{' '}
                                    <span className="required">*</span>
                                </label>

                                <select
                                    value={bookForm.tableId}
                                    required
                                    disabled={loadingTables}
                                    onChange={(event) =>
                                        setBookForm((previous) => ({
                                            ...previous,
                                            tableId:
                                                Number(event.target.value),
                                        }))
                                    }
                                >
                                    {loadingTables ? (
                                        <option value={0}>
                                            Đang tải bàn...
                                        </option>
                                    ) : tableError ? (
                                        <option value={0}>
                                            Lỗi tải bàn
                                        </option>
                                    ) : availableTables.length === 0 ? (
                                        <option value={0}>
                                            Không có bàn trống
                                        </option>
                                    ) : (
                                        availableTables.map((table) => (
                                            <option
                                                key={table.id}
                                                value={table.id}
                                            >
                                                Bàn {table.tableNumber}
                                                {' - '}
                                                {table.capacity} chỗ
                                            </option>
                                        ))
                                    )}
                                </select>

                                {tableError && (
                                    <span className="customer-error-text">
                                        ⚠️ {tableError}
                                    </span>
                                )}

                                {!loadingTables
                                    && !tableError
                                    && availableTables.length === 0 && (
                                        <span className="customer-warning-text">
                                        ⚠️ Hiện không có bàn trống
                                    </span>
                                    )}
                            </div>

                            <div className="customer-form-group">
                                <label>Ghi chú</label>

                                <input
                                    type="text"
                                    value={bookForm.note}
                                    placeholder="Yêu cầu đặc biệt..."
                                    onChange={(event) =>
                                        setBookForm((previous) => ({
                                            ...previous,
                                            note: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="customer-form-actions">
                            <button
                                type="submit"
                                className="customer-btn-primary"
                                disabled={
                                    bookLoading
                                    || availableTables.length === 0
                                    || Boolean(tableError)
                                }
                            >
                                {bookLoading
                                    ? 'Đang xử lý...'
                                    : '📌 Lưu đặt bàn'}
                            </button>

                            <button
                                type="button"
                                className="customer-btn-secondary"
                                onClick={() => {
                                    setBookForm({
                                        customerName: '',
                                        phone: '',
                                        reservationTime:
                                            `${todayStr}T18:00:00`,
                                        note: '',
                                        tableId:
                                            availableTables[0]?.id ?? 0,
                                    })

                                    setBookError('')
                                    setBookSuccess(null)
                                }}
                            >
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'cancel' && (
                <div className="customer-reservation-card">
                    <h2>❌ Hủy đặt bàn</h2>

                    <p className="customer-reservation-sub">
                        Hủy đặt bàn hiện tại của bạn
                    </p>

                    {loadingCurrent ? (
                        <div className="customer-loading">
                            Đang tải thông tin...
                        </div>
                    ) : currentReservation ? (
                        <div className="customer-current-reservation">
                            <div className="customer-current-info">
                                <span className="customer-current-label">
                                    Đặt bàn hiện tại:
                                </span>

                                <span>
                                    Bàn{' '}
                                    <strong>
                                        {currentReservation.tableNumber}
                                    </strong>
                                    {' - '}
                                    {formatDateTime(
                                        currentReservation.reservationTime,
                                    )}
                                </span>

                                <span
                                    className={`customer-status-badge-${currentReservation.status.toLowerCase()}`}
                                >
                                    {statusLabels[
                                        currentReservation.status
                                        ] ?? currentReservation.status}
                                </span>

                                {currentReservation.note && (
                                    <span className="customer-current-note">
                                        Ghi chú:{' '}
                                        {currentReservation.note}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="customer-empty-state">
                            <span className="customer-empty-icon">
                                ✅
                            </span>

                            <p>
                                Bạn không có đặt bàn nào đang hoạt động
                            </p>
                        </div>
                    )}

                    {cancelSuccess && (
                        <div className="customer-success-box">
                            <strong>
                                ✅ Hủy đặt bàn thành công!
                            </strong>

                            <div className="customer-success-detail">
                                <span>
                                    Đã hủy bàn{' '}
                                    <strong>
                                        {cancelSuccess.tableNumber}
                                    </strong>
                                    {' - '}
                                    {formatDateTime(
                                        cancelSuccess.reservationTime,
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    {cancelError && (
                        <div className="customer-error-box">
                            ❌ {cancelError}
                        </div>
                    )}

                    <div className="customer-form-actions">
                        <button
                            type="button"
                            className="customer-btn-danger"
                            disabled={
                                cancelLoading
                                || !currentReservation
                            }
                            onClick={(event) =>
                                void handleCancelSubmit(event)
                            }
                        >
                            {cancelLoading
                                ? 'Đang xử lý...'
                                : '🗑️ Hủy đặt bàn'}
                        </button>

                        <button
                            type="button"
                            className="customer-btn-secondary"
                            onClick={() => {
                                setCancelError('')
                                setCancelSuccess(null)
                                void loadCurrentReservation(
                                    undefined,
                                    true,
                                )
                            }}
                        >
                            Làm mới
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}