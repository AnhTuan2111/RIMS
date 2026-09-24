import {useEffect, useRef} from 'react'
import type {ReactNode} from 'react'
import {X} from 'lucide-react'

interface ModalProps {
    open: boolean
    title: string
    description?: string
    /** 'sm' cho hộp xác nhận, 'md' cho biểu mẫu, 'lg' cho bảng chi tiết. */
    size?: 'sm' | 'md' | 'lg'
    children?: ReactNode
    /** Hàng nút ở chân hộp. */
    footer?: ReactNode
    onClose: () => void
}

/**
 * Hộp thoại dùng chung.
 *
 * <p>Trước đây có 12 file tự dựng modal theo 4 họ class khác nhau: modal-*,
 * admin-dish-modal-*, waiter-modal-*, và loại dựng bằng inline style.
 *
 * <p>Xử lý sẵn những thứ mà các bản tự dựng đều thiếu: đóng bằng phím Esc, khoá
 * cuộn nền, và trả tiêu điểm về đúng chỗ khi đóng.
 */
export function Modal({
    open,
    title,
    description,
    size = 'md',
    children,
    footer,
    onClose,
}: ModalProps) {
    const panelRef = useRef<HTMLDivElement | null>(null)
    const restoreFocusRef = useRef<Element | null>(null)

    useEffect(() => {
        if (!open) {
            return
        }

        restoreFocusRef.current = document.activeElement

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        function handleKey(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKey)

        // Đưa tiêu điểm vào hộp để người dùng bàn phím không bị bỏ lại phía sau.
        panelRef.current?.focus()

        return () => {
            document.removeEventListener('keydown', handleKey)
            document.body.style.overflow = previousOverflow
            ;(restoreFocusRef.current as HTMLElement | null)?.focus?.()
        }
    }, [open, onClose])

    if (!open) {
        return null
    }

    return (
        <div className="rk-modal" onMouseDown={onClose}>
            <div
                ref={panelRef}
                className={`rk-modal__panel rk-modal__panel--${size}`}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="rk-modal__head">
                    <div>
                        <h2 className="rk-modal__title">{title}</h2>
                        {description && <p className="rk-modal__desc">{description}</p>}
                    </div>

                    <button
                        type="button"
                        className="rk-modal__close"
                        aria-label="Đóng"
                        onClick={onClose}
                    >
                        <X className="rk-icon" aria-hidden="true" />
                    </button>
                </header>

                {children && <div className="rk-modal__body">{children}</div>}

                {footer && <footer className="rk-modal__foot">{footer}</footer>}
            </div>
        </div>
    )
}

interface ConfirmDialogProps {
    open: boolean
    title: string
    /** Nói rõ điều gì sẽ xảy ra, nhất là khi không hoàn tác được. */
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    /** true khi hành động phá huỷ hoặc không hoàn tác được. */
    destructive?: boolean
    busy?: boolean
    onConfirm: () => void
    onCancel: () => void
}

/**
 * Hộp xác nhận.
 *
 * <p>Chỉ dùng cho việc KHÔNG hoàn tác được. Việc hoàn tác được thì cứ làm rồi
 * cho người dùng một nút hoàn tác trong thông báo — đừng chặn họ lại để hỏi.
 */
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Huỷ bỏ',
    destructive = false,
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            title={title}
            description={description}
            size="sm"
            onClose={onCancel}
            footer={
                <>
                    <button
                        type="button"
                        className="rk-btn rk-btn--quiet"
                        disabled={busy}
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        className={`rk-btn ${
                            destructive ? 'rk-btn--danger-solid' : 'rk-btn--primary'
                        }`}
                        disabled={busy}
                        onClick={onConfirm}
                    >
                        {busy ? 'Đang xử lý…' : confirmLabel}
                    </button>
                </>
            }
        />
    )
}
