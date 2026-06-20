import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { RoleType } from '../types/auth'

type ActorContextType = {
    actor: RoleType
    setActor: (actor: RoleType) => void
}

const ActorContext = createContext<ActorContextType | null>(null)

const DEFAULT_ACTOR: RoleType = RoleType.ADMIN

function isActorRole(value: string | null): value is RoleType {
    return value === RoleType.ADMIN || value === RoleType.CHEF || value === RoleType.WAITER || value === RoleType.CASHIER
}

export function ActorProvider({ children }: { children: ReactNode }) {
    const [actor, setActorState] = useState<RoleType>(() => {
        const savedActor = localStorage.getItem('selectedActor')
        return isActorRole(savedActor) ? savedActor : DEFAULT_ACTOR
    })

    function setActor(nextActor: RoleType) {
        localStorage.setItem('selectedActor', nextActor)
        setActorState(nextActor)
    }

    return (
        <ActorContext.Provider value={{ actor, setActor }}>
            {children}
        </ActorContext.Provider>
    )
}

export function useActor() {
    const context = useContext(ActorContext)

    if (!context) {
        throw new Error('useActor must be used inside ActorProvider')
    }

    return context
}