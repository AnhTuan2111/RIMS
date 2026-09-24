import {useCallback, useRef, useState} from 'react'
import type {ReactNode} from 'react'
import {AlertTriangle, Check, X} from 'lucide-react'

import {ToastContext, type ToastOptions, type ToastTone} from '@/app/providers/useToast'

interface Toast {
    id: number
    message: string
    tone: ToastTone
    action?: {label: string; onAct: () => void}
}

const DURATION_PLAIN = 4000
const DURATION_WITH_ACTION = 8000

/**
 * Thông báo trong trang, thay cho alert() của trình duyệt.
 *
 * <p>App đang dùng 40 alert() và 5 confirm(). Chúng chặn cả trang, không tùy biến
 * được, và tệ nhất là dùng cho THÀNH CÔNG — bắt người dùng bấm OK để xác nhận
 * một việc họ đã nhìn thấy kết quả.
 *
 * <p>Thông báo xếp chồng ở góc dưới phải, dùng position fixed nên không đẩy nội
 * dung trang; thông báo cũ không nhúc nhích khi có cái mới.
 */
export function ToastProvider({children}: {children: ReactNode}) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const nextId = useRef(1)
    const timers = useRef(new Map<number, number>())

    const dismiss = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id))

        const timer = timers.current.get(id)

        if (timer !== undefined) {
            window.clearTimeout(timer)
            timers.current.delete(id)
        }
    }, [])

    const notify = useCallback(
        (message: string, options?: ToastOptions) => {
            const id = nextId.current++

            setToasts((current) => [
                ...current,
                {
                    id,
                    message,
                    tone: options?.tone ?? 'ok',
                    action: options?.action,
                },
            ])

            timers.current.set(
                id,
                window.setTimeout(
                    () => dismiss(id),
                    options?.action ? DURATION_WITH_ACTION : DURATION_PLAIN,
                ),
            )
        },
        [dismiss],
    )

    return (
        <ToastContext.Provider value={{notify}}>
            {children}

            <div className="rk-toasts" aria-live="polite" aria-atomic="false">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`rk-toast rk-toast--${toast.tone}`}
                        role={toast.tone === 'alert' ? 'alert' : 'status'}
                    >
                        {toast.tone === 'alert' ? (
                            <AlertTriangle className="rk-icon" aria-hidden="true" />
                        ) : (
                            <Check className="rk-icon" aria-hidden="true" />
                        )}

                        <span className="rk-toast__msg">{toast.message}</span>

                        {toast.action && (
                            <button
                                type="button"
                                className="rk-toast__action"
                                onClick={() => {
                                    toast.action?.onAct()
                                    dismiss(toast.id)
                                }}
                            >
                                {toast.action.label}
                            </button>
                        )}

                        <button
                            type="button"
                            className="rk-toast__close"
                            aria-label="Đóng thông báo"
                            onClick={() => dismiss(toast.id)}
                        >
                            <X className="rk-icon" aria-hidden="true" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
