import {X} from 'lucide-react'

import {useNavigate} from 'react-router-dom'

/**
 * Trang VNPay trả về khi giao dịch hỏng hoặc khách bấm huỷ.
 *
 * <p>Cùng khuôn với {@link PaymentSuccess}: nằm ngoài khung quản trị, chỉ một
 * thẻ ở giữa màn hình.
 */
export default function PaymentFailed() {
    const navigate = useNavigate()

    return (
        <div className="rk-result">
            <div className="rk-feedback rk-feedback--lg">
                <div className="rk-feedback__icon rk-feedback__icon--alert">
                    <X className="rk-icon" aria-hidden="true" />
                </div>

                <div>
                    <h1 className="rk-feedback__title">Giao dịch thất bại</h1>

                    <p className="rk-feedback__text">
                        Khách hàng đã huỷ giao dịch hoặc có lỗi xảy ra từ phía ngân hàng.
                        Đơn vẫn còn nguyên, có thể thanh toán lại.
                    </p>

                    <div className="rk-feedback__actions">
                        <button
                            type="button"
                            className="rk-btn rk-btn--primary"
                            onClick={() => navigate('/cashier/payments')}
                        >
                            Quay lại màn hình Thu ngân
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
