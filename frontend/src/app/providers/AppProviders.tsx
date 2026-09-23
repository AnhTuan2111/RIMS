import type {ReactNode} from 'react'
import {BrowserRouter} from 'react-router-dom'

import {ActorProvider} from '@/app/providers/ActorContext'
import {AuthProvider} from '@/app/providers/AuthContext'
import {RestaurantProvider} from '@/app/providers/RestaurantContext'
import {ToastProvider} from '@/app/providers/ToastProvider'

export function AppProviders({children}: {children: ReactNode}) {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ActorProvider>
                    {/* Thông tin nhận diện nhà hàng đọc một lần, dùng cho cả
                        trang công khai lẫn các màn bên trong. */}
                    <RestaurantProvider>
                        <ToastProvider>{children}</ToastProvider>
                    </RestaurantProvider>
                </ActorProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
