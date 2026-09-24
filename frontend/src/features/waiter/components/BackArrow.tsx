import {useNavigate} from 'react-router-dom'
import {ArrowLeft} from 'lucide-react'

export function BackArrow({onClick}: {onClick?: () => void}) {
    const navigate = useNavigate()

    return (
        <button
            type="button"
            className="rk-iconbtn"
            title="Quay lại"
            onClick={onClick ?? (() => navigate(-1))}
        >
            <ArrowLeft className="rk-icon" aria-hidden="true" />
        </button>
    )
}
