import {useNavigate} from 'react-router-dom'
import {Icon} from '@/shared/components/ui/Icon'
export function BackArrow({onClick}: {onClick?: () => void}) {
    const navigate = useNavigate()

    return (
        <button
            type="button"
            className="rk-iconbtn"
            title="Quay lại"
            onClick={onClick ?? (() => navigate(-1))}
        >
            <Icon name="back" className="rk-icon" />
        </button>
    )
}
