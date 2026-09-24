import {X} from 'lucide-react'

import {type CSSProperties} from 'react'
import {useNavigate} from 'react-router-dom'

export default function PaymentFailed() {
    const navigate = useNavigate()

    return (
        <div style={pageStyle}>
            <div className="page-card" style={cardStyle}>
                <div style={iconStyle}>
                    <X className="rk-icon" aria-hidden="true" />
                </div>

                <h1 style={titleStyle}>Giao Dịch Thất Bại</h1>

                <p style={descriptionStyle}>
                    Khách hàng đã hủy giao dịch hoặc có lỗi xảy ra từ ngân hàng.
                </p>

                <button
                    type="button"
                    style={backButtonStyle}
                    onClick={() => navigate('/cashier/payments')}
                >
                    Quay lại màn hình Thu Ngân
                </button>
            </div>
        </div>
    )
}

const pageStyle: CSSProperties = {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--rims-alert-soft)',
}

const cardStyle: CSSProperties = {
    textAlign: 'center',
    padding: '3rem',
    maxWidth: '500px',
    boxShadow: '0 10px 15px -3px rgb(var(--rims-tint-ink) / 10%)',
}

const iconStyle: CSSProperties = {
    fontSize: '5rem',
    color: 'var(--rims-alert)',
    marginBottom: '1rem',
}

const titleStyle: CSSProperties = {
    color: 'var(--rims-alert)',
    marginBottom: '1rem',
}

const descriptionStyle: CSSProperties = {
    color: 'var(--rims-ink-2)',
    marginBottom: '2rem',
}

const backButtonStyle: CSSProperties = {
    padding: '0.8rem 1.5rem',
    background: 'var(--rims-ink-3)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
}
