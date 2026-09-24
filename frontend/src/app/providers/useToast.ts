import {createContext, useContext} from 'react'

export type ToastTone = 'ok' | 'alert'

export interface ToastAction {
    label: string
    onAct: () => void
}

export interface ToastOptions {
    tone?: ToastTone
    /** Nút hoàn tác. Có nút này thì thông báo giữ lâu hơn. */
    action?: ToastAction
}

export interface ToastContextValue {
    /**
     * Hiện một thông báo ở góc màn hình.
     *
     * <p>Dùng cho việc người dùng KHÔNG tự nhìn thấy kết quả, hoặc cho lỗi.
     * Việc đã thấy rõ kết quả trên màn hình thì im lặng, đừng báo.
     */
    notify: (message: string, options?: ToastOptions) => void
}

export const ToastContext = createContext<ToastContextValue>({
    notify: () => {},
})

export function useToast() {
    return useContext(ToastContext)
}
