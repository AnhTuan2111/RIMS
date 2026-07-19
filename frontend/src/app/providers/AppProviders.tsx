import type {ReactNode} from 'react'
import {BrowserRouter} from 'react-router-dom'

import {ActorProvider} from '../../context/ActorContext'

export function AppProviders({children}: {children: ReactNode}) {
    return (
        <BrowserRouter>
            <ActorProvider>
                {children}
            </ActorProvider>
        </BrowserRouter>
    )
}