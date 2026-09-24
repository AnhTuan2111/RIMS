import {Coins, User, X} from 'lucide-react'

import {useState} from 'react'

import * as cashierApi from '@/shared/api/cashier'
import type {OrderDetailResponse, TableDashboardResponse} from '@/shared/types/cashier'
import {isRequestCanceled} from '@/shared/utils/error'
import {formatCurrency, formatNumber} from '@/shared/utils/format'
import {useToast} from '@/app/providers/useToast'

export interface CustomerInfo {
    id: number
    fullName: string
    phone: string
    rewardPoints: number
}

interface OrderPanelProps {
    selectedTable: TableDashboardResponse
    orderDetail: OrderDetailResponse | null
    loading: boolean
    onClose: () => void
    onCheckout: () => void
    customer: CustomerInfo | null
    pointsUsed: number
    onCustomerChange: (customer: CustomerInfo | null) => void
    onPointsUsedChange: (points: number) => void
}

function getHttpStatus(error: unknown) {
    if (typeof error !== 'object' || error === null) {
        return undefined
    }

    const requestError = error as {
        response?: {
            status?: number
        }
    }

    return requestError.response?.status
}

const PHONE_REGEX = /^0[0-9]{9}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function OrderPanel({
    selectedTable,
    orderDetail,
    loading,
    onClose,
    onCheckout,
    customer,
    pointsUsed,
    onCustomerChange,
    onPointsUsedChange,
}: OrderPanelProps) {
    const {notify} = useToast()

    const itemsList = orderDetail?.orderItems ?? []

    const totalAmount = orderDetail?.finalAmount ?? 0

    const [isLocking, setIsLocking] = useState(false)

    const [lockError, setLockError] = useState<string | null>(null)

    // Đổi bàn thì lỗi khoá đơn của bàn cũ không còn ý nghĩa nữa.
    // Chỉnh state ngay trong lúc render theo hướng dẫn của React, thay vì dùng
    // useEffect — cách cũ tạo thêm một lượt render với lỗi cũ vẫn hiển thị.
    const [renderedTableId, setRenderedTableId] = useState(selectedTable.tableId)

    if (renderedTableId !== selectedTable.tableId) {
        setRenderedTableId(selectedTable.tableId)
        setLockError(null)
    }

    const [phoneSearch, setPhoneSearch] = useState('')

    const [phoneError, setPhoneError] = useState<string | null>(null)

    const [isSearching, setIsSearching] = useState(false)

    const [showCreate, setShowCreate] = useState(false)

    const [newCusName, setNewCusName] = useState('')

    const [newCusEmail, setNewCusEmail] = useState('')

    const [processingCreate, setProcessingCreate] = useState(false)

    const maxPointsAllowed = Math.floor((totalAmount * 0.5) / 1000)

    const maxPointsCanUse = customer
        ? Math.min(customer.rewardPoints, maxPointsAllowed)
        : 0

    const displayStatus =
        selectedTable.status === 'SERVING' ? 'Đang phục vụ' : 'Bàn trống'

    const isCreateFormValid =
        newCusName.trim().length > 0 &&
        PHONE_REGEX.test(phoneSearch) &&
        EMAIL_REGEX.test(newCusEmail.trim())

    function handlePhoneInputChange(raw: string) {
        // Chỉ giữ lại ký tự số
        let digitsOnly = raw.replace(/\D/g, '')

        // Giới hạn tối đa 10 số
        digitsOnly = digitsOnly.slice(0, 10)

        setPhoneSearch(digitsOnly)
        setPhoneError(null)
    }

    async function handleSearchCustomer() {
        const phone = phoneSearch.trim()

        if (!phone) {
            setPhoneError('Vui lòng nhập số điện thoại!')
            return
        }

        if (!PHONE_REGEX.test(phone)) {
            setPhoneError('Số điện thoại không hợp lệ! Phải bắt đầu bằng 0 và đủ 10 số.')
            return
        }

        setPhoneError(null)
        setIsSearching(true)
        setShowCreate(false)
        onCustomerChange(null)
        onPointsUsedChange(0)

        try {
            const response = await cashierApi.searchCustomer(phone)

            if (response?.data) {
                onCustomerChange(response.data as CustomerInfo)
            }
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            if (getHttpStatus(requestError) === 404) {
                setShowCreate(true)
                return
            }

            console.error('[CASHIER_CUSTOMER_SEARCH_ERROR]', requestError)

            notify('Lỗi tìm kiếm khách hàng!', {tone: 'alert'})
        } finally {
            setIsSearching(false)
        }
    }

    async function handleCreateCustomer() {
        const phone = phoneSearch.trim()
        const fullName = newCusName.trim()
        const email = newCusEmail.trim()

        if (!fullName) {
            notify('Vui lòng nhập tên khách hàng!', {tone: 'alert'})
            return
        }

        if (!phone || !/^0[0-9]{9}$/.test(phone)) {
            notify('Số điện thoại không hợp lệ! Phải bắt đầu bằng 0 và đủ 10 số.', {
                tone: 'alert',
            })
            return
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            notify('Vui lòng nhập email hợp lệ!', {tone: 'alert'})
            return
        }

        setProcessingCreate(true)

        try {
            const response = await cashierApi.createCustomerFast({
                fullName,
                phone,
                email,
            })

            if (response?.data) {
                onCustomerChange(response.data as CustomerInfo)

                setShowCreate(false)

                notify('Đăng ký thành viên thành công')
            }
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[CASHIER_CUSTOMER_CREATE_ERROR]', requestError)

            notify('Lỗi tạo khách hàng. Có thể số điện thoại đã tồn tại!', {
                tone: 'alert',
            })
        } finally {
            setProcessingCreate(false)
        }
    }

    function handleClearCustomer() {
        onCustomerChange(null)
        onPointsUsedChange(0)
        setPhoneSearch('')
        setShowCreate(false)
        setNewCusName('')
        setNewCusEmail('')
    }

    function handlePointsInputChange(raw: number) {
        const safeValue = Math.max(0, Math.min(raw, maxPointsCanUse))

        onPointsUsedChange(safeValue)
    }

    async function handleCheckoutClick() {
        if (!orderDetail) {
            setLockError('Chưa có thông tin đơn hàng để thanh toán!')
            return
        }

        setLockError(null)
        setIsLocking(true)

        try {
            const response = await cashierApi.processPaymentLock(orderDetail.orderId, {
                paymentMethod: 'CASH',
                amountPaid: 0,
            })

            if (response.data.success) {
                onCheckout()
                return
            }

            setLockError(
                response.data.message ??
                    'Đơn hàng còn món chưa hoàn thành hoặc chưa hủy. Hãy hoàn thành để có thể thanh toán.',
            )
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[CASHIER_PAYMENT_LOCK_ERROR]', requestError)

            setLockError(
                'Không thể thực hiện thanh toán đơn hàng.Vui lòng huỷ hoặc hoàn thành các món còn lại!',
            )
        } finally {
            setIsLocking(false)
        }
    }

    return (
        <div className="rk-card rk-card--pad">
            <button type="button" className="rk-iconbtn" onClick={onClose}>
                <X className="rk-icon" aria-hidden="true" />
            </button>

            <h2>Chi tiết đơn hàng</h2>

            <div className="rk-pagehead__desc">
                <strong>Vị trí: {selectedTable.tableNumber}</strong>

                <span className="rk-chip rk-chip--busy">{displayStatus}</span>
            </div>

            {selectedTable.status === 'SERVING' && (
                <div className="rk-card rk-card--soft rk-card--pad">
                    <h4 className="rk-sectiontitle">Tích điểm thành viên</h4>

                    <div className="rk-actions">
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Nhập Số điện thoại khách hàng…"
                            className="rk-input"
                            value={phoneSearch}
                            disabled={!!customer}
                            pattern="0[0-9]{9}"
                            onChange={(event) =>
                                handlePhoneInputChange(event.target.value)
                            }
                        />

                        {customer ? (
                            <button
                                type="button"
                                className="rk-btn rk-btn--danger"
                                onClick={handleClearCustomer}
                            >
                                Bỏ chọn
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="rk-btn rk-btn--primary"
                                disabled={!PHONE_REGEX.test(phoneSearch) || isSearching}
                                onClick={() => void handleSearchCustomer()}
                            >
                                {isSearching ? '...' : 'Tìm'}
                            </button>
                        )}
                    </div>

                    {phoneError && <div className="rk-formerror">{phoneError}</div>}

                    {showCreate && !customer && (
                        <div className="rk-card rk-card--soft rk-card--pad">
                            <p className="rk-sectiontitle">
                                Chưa có tài khoản! Đăng ký nhanh:
                            </p>

                            <div className="rk-field__hint">
                                Số điện thoại dùng để đăng ký:{' '}
                                <strong>{phoneSearch}</strong>
                            </div>

                            <input
                                type="text"
                                placeholder="Tên khách hàng (*)"
                                className="rk-input"
                                value={newCusName}
                                onChange={(event) => setNewCusName(event.target.value)}
                            />

                            <input
                                type="email"
                                placeholder="Email (*)"
                                className="rk-input"
                                value={newCusEmail}
                                onChange={(event) => setNewCusEmail(event.target.value)}
                            />

                            <button
                                type="button"
                                className="rk-btn rk-btn--primary"
                                disabled={!isCreateFormValid || processingCreate}
                                onClick={() => void handleCreateCustomer()}
                            >
                                {processingCreate ? 'Đang tạo…' : 'Tạo tài khoản'}
                            </button>
                        </div>
                    )}

                    {customer && (
                        <div className="rk-note rk-note--ok">
                            <p className="rk-rowlist__meta">
                                <User className="rk-icon" aria-hidden="true" /> Khách:{' '}
                                <strong>{customer.fullName}</strong>
                            </p>

                            <p className="rk-rowlist__meta">
                                <Coins className="rk-icon" aria-hidden="true" /> Điểm hiện
                                có:{' '}
                                <strong className="rk-num">
                                    {formatNumber(customer.rewardPoints)}
                                </strong>
                            </p>

                            {customer.rewardPoints > 0 && (
                                <label className="rk-field__label">
                                    Sử dụng điểm (Tối đa {formatNumber(maxPointsCanUse)}):
                                    <input
                                        type="number"
                                        min="0"
                                        max={maxPointsCanUse}
                                        className="rk-input"
                                        value={pointsUsed || ''}
                                        onChange={(event) =>
                                            handlePointsInputChange(
                                                Number(event.target.value),
                                            )
                                        }
                                    />
                                </label>
                            )}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <p>Đang tải thông tin đơn hàng...</p>
            ) : !orderDetail ? (
                <p className="rk-note">Chưa có thông tin đơn hàng cho bàn này.</p>
            ) : (
                <div>
                    {itemsList.length === 0 ? (
                        <p className="rk-note">
                            Bàn hiện tại chưa có món nào hoàn thành.
                        </p>
                    ) : (
                        <div className="rk-tablewrap rk-tablewrap--scroll">
                            <table className="rk-table rk-table--compact">
                                <thead>
                                    <tr>
                                        <th scope="col">Món ăn</th>
                                        <th scope="col" className="rk-th--num">
                                            SL
                                        </th>
                                        <th scope="col" className="rk-th--num">
                                            Thành tiền
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {itemsList.map((item, index) => (
                                        <tr key={`${item.dishName}-${index}`}>
                                            <td>{item.dishName}</td>
                                            <td className="rk-td--num">
                                                x{item.quantity}
                                            </td>
                                            <td className="rk-td--num">
                                                {formatCurrency(item.subTotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="rk-card rk-card--soft rk-card--pad">
                        <div className="rk-summary">
                            <div className="rk-summary__row">
                                <span>Tạm tính trước thuế:</span>
                                <span>
                                    {formatCurrency(
                                        orderDetail.totalAmountBeforeVat ?? 0,
                                    )}
                                </span>
                            </div>

                            <div className="rk-summary__row">
                                <span>Thuế VAT (10%):</span>
                                <span>{formatCurrency(orderDetail.vatAmount ?? 0)}</span>
                            </div>

                            {pointsUsed > 0 && (
                                <div className="rk-summary__row rk-summary__row--credit">
                                    <span>Giảm giá ({pointsUsed} điểm):</span>
                                    <span>-{formatCurrency(pointsUsed * 1000)}</span>
                                </div>
                            )}
                        </div>

                        <div className="rk-summary__row rk-summary__row--total">
                            <span>Tổng thanh toán:</span>
                            <strong>
                                {formatCurrency(totalAmount - pointsUsed * 1000)}
                            </strong>
                        </div>

                        {lockError && (
                            <div className="rk-note rk-note--alert"> {lockError}</div>
                        )}

                        {selectedTable.status === 'SERVING' && (
                            <button
                                type="button"
                                className="rk-btn rk-btn--primary"
                                disabled={isLocking}
                                onClick={() => void handleCheckoutClick()}
                            >
                                {isLocking ? 'Đang khóa đơn…' : 'Thanh toán'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
