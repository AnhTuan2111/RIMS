import {useState} from 'react'
import {useNavigate} from 'react-router-dom'

import {useActor} from '@/app/providers/ActorContext'
import {useAuth} from '@/app/providers/AuthContext'
import {getHomePathForRole} from '@/app/routes/homePath'
import type {RoleType} from '@/shared/types/auth'
import {getErrorMessage, isRequestCanceled} from '@/shared/utils/error'

/**
 * Một lần đăng nhập, dùng chung cho màn /login và ô đăng nhập ở trang chủ.
 *
 * <p>Hai chỗ đăng nhập thì chỉ được có MỘT đoạn mã làm việc đó. Chép đôi ra là
 * mở đường cho chúng lệch nhau: chỗ này nhớ đặt `selectedActor`, chỗ kia quên;
 * chỗ này biết chuyển sang màn đổi mật khẩu bắt buộc, chỗ kia đẩy thẳng vào màn
 * làm việc rồi người dùng chỉ thấy một màn lỗi vì backend chặn hết.
 */
export function useLoginSubmit() {
    const {login} = useAuth()
    const {setActor} = useActor()
    const navigate = useNavigate()

    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function submit(username: string, rawPassword: string) {
        setIsLoading(true)
        setError(null)

        try {
            const user = await login({username, rawPassword})

            const role = user.role as RoleType

            setActor(role)

            localStorage.setItem('selectedActor', role)

            // Tài khoản còn dùng mật khẩu do người khác đặt thì đi thẳng màn đổi
            // mật khẩu. Vào màn làm việc trước cũng chỉ thấy một màn lỗi, vì
            // backend chặn hết các endpoint khác.
            navigate(
                user.mustChangePassword ? '/change-password' : getHomePathForRole(role),
                {replace: true},
            )
        } catch (requestError: unknown) {
            if (isRequestCanceled(requestError)) {
                return
            }

            console.error('[LOGIN_ERROR]', requestError)

            setError(
                getErrorMessage(requestError) ||
                    'Đăng nhập thất bại. Vui lòng kiểm tra tài khoản hoặc mật khẩu.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    return {submit, error, isLoading, clearError: () => setError(null)}
}
