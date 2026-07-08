// src/pages/customer/CustomerReservations.tsx

import React, { useState, useEffect, useCallback } from 'react'
import {
    createReservation,
    cancelCurrentReservation,
    getCurrentReservation,
    checkReservationByDate,
    getAvailableTables,
} from '../../api/customer'
import type {
    CustomerReservationResponse,
    RestaurantTable,
    CustomerCreateReservationRequest,
} from '../../api/customer'

const today = new Date()
const todayStr = today.toISOString().split('T')[0]

export default function CustomerReservations() {
    const [activeTab, setActiveTab] = useState<'book' | 'cancel'>('book')

    // ===== Book State =====
    const [bookForm, setBookForm] = useState<CustomerCreateReservationRequest>({
        customerName: '',
        phone: '',
        reservationTime: `${todayStr}T18:00:00`,
        note: '',
        tableId: 0,
    })
    const [availableTables, setAvailableTables] = useState<RestaurantTable[]>([])
    const [bookLoading, setBookLoading] = useState(false)
    const [bookError, setBookError] = useState('')
    const [bookSuccess, setBookSuccess] = useState<CustomerReservationResponse | null>(null)
    const [loadingTables, setLoadingTables] = useState(true)
    const [tableError, setTableError] = useState<string | null>(null)

    // ===== Cancel State =====
    const [cancelLoading, setCancelLoading] = useState(false)
    const [cancelError, setCancelError] = useState('')
    const [cancelSuccess, setCancelSuccess] = useState<CustomerReservationResponse | null>(null)
    const [currentReservation, setCurrentReservation] = useState<CustomerReservationResponse | null>(null)
    const [loadingCurrent, setLoadingCurrent] = useState(false)

    // ===== Load available tables =====
    const loadAvailableTables = useCallback(async () => {
        setLoadingTables(true)
        setTableError(null)
        try {
            const tables = await getAvailableTables()
            setAvailableTables(tables || [])
            if (tables && tables.length > 0 && bookForm.tableId === 0) {
                setBookForm(prev => ({ ...prev, tableId: tables[0].id }))
            }
        } catch (err: any) {
            console.error('Failed to load tables:', err)
            setTableError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách bàn')
            setAvailableTables([])
        } finally {
            setLoadingTables(false)
        }
    }, [])

    // ===== Load current reservation =====
    const loadCurrentReservation = useCallback(async () => {
        setLoadingCurrent(true)
        try {
            const res = await getCurrentReservation()
            setCurrentReservation(res)
        } catch (err: any) {
            if (err?.response?.status === 404) {
                setCurrentReservation(null)
            } else {
                console.error('Failed to load current reservation:', err)
                setCurrentReservation(null)
            }
        } finally {
            setLoadingCurrent(false)
        }
    }, [])

    // ===== Check if has reservation today =====
    const checkTodayReservation = useCallback(async () => {
        try {
            const hasRes = await checkReservationByDate(todayStr)
            if (hasRes) {
                await loadCurrentReservation()
            } else {
                setCurrentReservation(null)
            }
        } catch (err) {
            console.error('Check reservation error:', err)
            setCurrentReservation(null)
        }
    }, [loadCurrentReservation])

    useEffect(() => {
        loadAvailableTables()
        checkTodayReservation()
    }, [loadAvailableTables, checkTodayReservation])

    // ===== Book =====
    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setBookError('')
        setBookSuccess(null)
        setBookLoading(true)

        try {
            const result = await createReservation(bookForm)
            setBookSuccess(result)
            setBookForm(prev => ({
                ...prev,
                customerName: '',
                phone: '',
                note: '',
                reservationTime: `${todayStr}T18:00:00`,
            }))
            await loadAvailableTables()
            await checkTodayReservation()
            setActiveTab('cancel')
        } catch (err: any) {
            setBookError(err?.response?.data?.message || err?.message || 'Đặt bàn thất bại')
        } finally {
            setBookLoading(false)
        }
    }

    // ===== Cancel =====
    const handleCancelSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCancelError('')
        setCancelSuccess(null)
        setCancelLoading(true)

        try {
            const result = await cancelCurrentReservation()
            setCancelSuccess(result)
            setCurrentReservation(null)
            await loadAvailableTables()
            await checkTodayReservation()
        } catch (err: any) {
            setCancelError(err?.response?.data?.message || err?.message || 'Hủy đặt bàn thất bại')
        } finally {
            setCancelLoading(false)
        }
    }

    // ===== Format functions =====
    const formatDateTime = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleString('vi-VN', {
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

    return (
        <div className="customer-reservations-page">
            <div className="customer-reservations-header">
                <h1 className="customer-reservations-title">📋 Đặt bàn</h1>
                <p>Quản lý đặt bàn của bạn tại nhà hàng</p>
            </div>

            {/* Tabs */}
            <div className="customer-reservations-tabs">
                <button
                    className={`customer-tab ${activeTab === 'book' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('book')
                        setBookSuccess(null)
                        setBookError('')
                    }}
                >
                    Đặt bàn mới
                </button>
                <button
                    className={`customer-tab ${activeTab === 'cancel' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('cancel')
                        setCancelSuccess(null)
                        setCancelError('')
                        loadCurrentReservation()
                    }}
                >
                    Hủy đặt bàn
                </button>
            </div>

            {/* ===== BOOK TAB ===== */}
            {activeTab === 'book' && (
                <div className="customer-reservation-card">
                    <h2>📝 Đặt bàn mới</h2>
                    <p className="customer-reservation-sub">
                        Mỗi khách hàng chỉ được đặt <strong>1 bàn/ngày</strong>
                    </p>

                    {bookSuccess && (
                        <div className="customer-success-box">
                            <strong>✅ Đặt bàn thành công!</strong>
                            <div className="customer-success-detail">
                                <span>
                                    Bàn <strong>{bookSuccess.tableNumber}</strong> -{' '}
                                    {formatDateTime(bookSuccess.reservationTime)}
                                </span>
                                <span>
                                    Trạng thái: <strong>{statusLabels[bookSuccess.status]}</strong>
                                </span>
                            </div>
                        </div>
                    )}

                    {bookError && (
                        <div className="customer-error-box">
                            ❌ {bookError}
                        </div>
                    )}

                    <form onSubmit={handleBookSubmit} className="customer-reservation-form">
                        <div className="customer-form-row">
                            <div className="customer-form-group">
                                <label>Tên khách hàng <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={bookForm.customerName}
                                    onChange={e => setBookForm(prev => ({ ...prev, customerName: e.target.value }))}
                                    placeholder="Nhập họ và tên"
                                    required
                                    maxLength={50}
                                />
                            </div>
                            <div className="customer-form-group">
                                <label>Số điện thoại <span className="required">*</span></label>
                                <input
                                    type="tel"
                                    value={bookForm.phone}
                                    onChange={e => setBookForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                    placeholder="0123456789"
                                    required
                                    pattern="[0-9]{10}"
                                />
                            </div>
                        </div>

                        <div className="customer-form-row">
                            <div className="customer-form-group">
                                <label>Ngày đặt <span className="required">*</span></label>
                                <input
                                    type="date"
                                    value={bookForm.reservationTime.split('T')[0]}
                                    onChange={e => {
                                        const time = bookForm.reservationTime.split('T')[1] || '18:00:00'
                                        setBookForm(prev => ({
                                            ...prev,
                                            reservationTime: `${e.target.value}T${time}`
                                        }))
                                    }}
                                    min={todayStr}
                                    required
                                />
                            </div>
                            <div className="customer-form-group">
                                <label>Giờ đặt <span className="required">*</span></label>
                                <select
                                    value={bookForm.reservationTime.split('T')[1]?.slice(0, 5) || '18:00'}
                                    onChange={e => {
                                        const date = bookForm.reservationTime.split('T')[0] || todayStr
                                        setBookForm(prev => ({
                                            ...prev,
                                            reservationTime: `${date}T${e.target.value}:00`
                                        }))
                                    }}
                                    required
                                >
                                    {Array.from({ length: 14 }, (_, i) => i + 10).map(h => {
                                        const hour = String(h).padStart(2, '0')
                                        return (
                                            <option key={h} value={`${hour}:00`}>
                                                {hour}:00
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="customer-form-row">
                            <div className="customer-form-group">
                                <label>Chọn bàn <span className="required">*</span></label>
                                <select
                                    value={bookForm.tableId}
                                    onChange={e => setBookForm(prev => ({ ...prev, tableId: Number(e.target.value) }))}
                                    required
                                    disabled={loadingTables}
                                >
                                    {loadingTables ? (
                                        <option value={0}>Đang tải bàn...</option>
                                    ) : tableError ? (
                                        <option value={0}>Lỗi tải bàn</option>
                                    ) : availableTables.length === 0 ? (
                                        <option value={0}>Không có bàn trống</option>
                                    ) : (
                                        availableTables.map(table => (
                                            <option key={table.id} value={table.id}>
                                                Bàn {table.tableNumber} - {table.capacity} chỗ
                                            </option>
                                        ))
                                    )}
                                </select>
                                {tableError && (
                                    <span className="customer-error-text">
                                        ⚠️ {tableError}
                                    </span>
                                )}
                                {!loadingTables && !tableError && availableTables.length === 0 && (
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
                                    onChange={e => setBookForm(prev => ({ ...prev, note: e.target.value }))}
                                    placeholder="Yêu cầu đặc biệt..."
                                />
                            </div>
                        </div>

                        <div className="customer-form-actions">
                            <button
                                type="submit"
                                className="customer-btn-primary"
                                disabled={bookLoading || availableTables.length === 0 || !!tableError}
                            >
                                {bookLoading ? 'Đang xử lý...' : '📌 Lưu đặt bàn'}
                            </button>
                            <button
                                type="button"
                                className="customer-btn-secondary"
                                onClick={() => {
                                    setBookForm({
                                        customerName: '',
                                        phone: '',
                                        reservationTime: `${todayStr}T18:00:00`,
                                        note: '',
                                        tableId: availableTables[0]?.id || 0,
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

            {/* ===== CANCEL TAB ===== */}
            {activeTab === 'cancel' && (
                <div className="customer-reservation-card">
                    <h2>❌ Hủy đặt bàn</h2>
                    <p className="customer-reservation-sub">
                        Hủy đặt bàn hiện tại của bạn
                    </p>

                    {loadingCurrent ? (
                        <div className="customer-loading">Đang tải thông tin...</div>
                    ) : currentReservation ? (
                        <div className="customer-current-reservation">
                            <div className="customer-current-info">
                                <span className="customer-current-label">Đặt bàn hiện tại:</span>
                                <span>
                                    Bàn <strong>{currentReservation.tableNumber}</strong> -{' '}
                                    {formatDateTime(currentReservation.reservationTime)}
                                </span>
                                <span className={`customer-status-badge-${currentReservation.status.toLowerCase()}`}>
                                    {statusLabels[currentReservation.status]}
                                </span>
                                {currentReservation.note && (
                                    <span className="customer-current-note">
                                        Ghi chú: {currentReservation.note}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="customer-empty-state">
                            <span className="customer-empty-icon">✅</span>
                            <p>Bạn không có đặt bàn nào đang hoạt động</p>
                        </div>
                    )}

                    {cancelSuccess && (
                        <div className="customer-success-box">
                            <strong>✅ Hủy đặt bàn thành công!</strong>
                            <div className="customer-success-detail">
                                <span>
                                    Đã hủy bàn <strong>{cancelSuccess.tableNumber}</strong> -{' '}
                                    {formatDateTime(cancelSuccess.reservationTime)}
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
                            onClick={handleCancelSubmit}
                            disabled={cancelLoading || !currentReservation}
                        >
                            {cancelLoading ? 'Đang xử lý...' : '🗑️ Hủy đặt bàn'}
                        </button>
                        <button
                            type="button"
                            className="customer-btn-secondary"
                            onClick={() => {
                                setCancelError('')
                                setCancelSuccess(null)
                                loadCurrentReservation()
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