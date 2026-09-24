import {RoleType} from '@/shared/types/auth'

/**
 * Màn đầu tiên của mỗi vai trò sau khi đăng nhập.
 *
 * <p>Dùng chung cho hai chỗ: điều hướng sau khi đăng nhập, và đưa người dùng về
 * đúng chỗ khi họ gõ tay một đường dẫn không thuộc vai trò của mình.
 */
export function getHomePathForRole(role: RoleType): string {
    switch (role) {
        case RoleType.ADMIN:
            return '/admin/dashboard'

        case RoleType.CHEF:
            return '/chef/dashboard'

        case RoleType.WAITER:
            return '/waiter/tables'

        case RoleType.CASHIER:
            return '/cashier/payments'

        case RoleType.CUSTOMER:
            return '/customer/reservations'

        default:
            return '/profile'
    }
}
