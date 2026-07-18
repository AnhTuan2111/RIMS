// src/pages/customer/CustomerReservations.tsx

import React, { useState, useEffect, useCallback } from 'react'
import {
    createReservation,
    cancelReservation,
    getCurrentReservation,
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

// ===== Cancel State =====
    const [cancelingId, setCancelingId] = useState<number | null>(null)
    const [cancelError, setCancelError] = useState('')
    const [cancelSuccess, setCancelSuccess] = useState<CustomerReservationResponse | null>(null)
    const [currentReservations, setCurrentReservations] = useState<CustomerReservationResponse[]>([])
    const [loadingCurrent, setLoadingCurrent] = useState(false)

// ===== Load current reservations =====
    const loadCurrentReservations = useCallback(async () => {
        setLoadingCurrent(true)
        try {
            const res = await getCurrentReservation()
            setCurrentReservations(res || [])
        } catch (err: any) {
            console.error('Failed to load current reservations:', err)
            setCurrentReservations([])
        } finally {
            setLoadingCurrent(false)
        }
    }, [])

    useEffect(() => {
        loadAvailableTables()
        loadCurrentReservations()
    }, [loadAvailableTables, loadCurrentReservations])

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
            await loadCurrentReservations()
            setActiveTab('cancel')
        } catch (err: any) {
            setBookError(err?.response?.data?.message || err?.message || 'Đặt bàn thất bại')
        } finally {
            setBookLoading(false)
        }
    }

// ===== Cancel (giờ theo từng reservation riêng) =====
    const handleCancel = async (reservationId: number) => {
        setCancelError('')
        setCancelSuccess(null)
        setCancelingId(reservationId)

        try {
            const result = await cancelReservation(reservationId)
            setCancelSuccess(result)
            await loadAvailableTables()
            await loadCurrentReservations()
        } catch (err: any) {
            setCancelError(err?.response?.data?.message || err?.message || 'Hủy đặt bàn thất bại')
        } finally {
            setCancelingId(null)
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

    // ✅ Sửa statusLabels để match với enum backend (không có CONFIRMED)
    const statusLabels: Record<string, string> = {
        QUEUED: 'Đang chờ',
        WAITING: 'Chờ xác nhận',
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
                        loadCurrentReservations()
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
                        Danh sách đặt bàn đang hoạt động của bạn
                    </p>

                    {loadingCurrent ? (
                        <div className="customer-loading">Đang tải thông tin...</div>
                    ) : currentReservations.length > 0 ? (
                        <div className="customer-current-reservation-list">
                            {currentReservations.map(r => (
                                <div key={r.id} className="customer-current-reservation">
                                    <div className="customer-current-info">
                                        <span className="customer-current-label">Đặt bàn:</span>
                                        <span>
                                Bàn <strong>{r.tableNumber}</strong> -{' '}
                                            {formatDateTime(r.reservationTime)}
                            </span>
                                        <span className={`customer-status-badge-${r.status.toLowerCase()}`}>
                                {statusLabels[r.status]}
                            </span>
                                        {r.note && (
                                            <span className="customer-current-note">
                                    Ghi chú: {r.note}
                                </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="customer-btn-danger"
                                        onClick={() => handleCancel(r.id)}
                                        disabled={cancelingId === r.id}
                                    >
                                        {cancelingId === r.id ? 'Đang xử lý...' : '🗑️ Hủy đặt bàn'}
                                    </button>
                                </div>
                            ))}
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
                            className="customer-btn-secondary"
                            onClick={() => {
                                setCancelError('')
                                setCancelSuccess(null)
                                loadCurrentReservations()
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