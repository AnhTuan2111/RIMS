import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ActorRole } from '../config/actorMenus'

type ActorContextType = {
    actor: ActorRole
    setActor: (actor: ActorRole) => void
}

const ActorContext = createContext<ActorContextType | null>(null)

const DEFAULT_ACTOR: ActorRole = 'ADMIN'

function isActorRole(value: string | null): value is ActorRole {
    return value === 'ADMIN' || value === 'CHEF' || value === 'WAITER' || value === 'CASHIER'
}

export function ActorProvider({ children }: { children: ReactNode }) {
    const [actor, setActorState] = useState<ActorRole>(() => {
        const savedActor = localStorage.getItem('selectedActor')
        return isActorRole(savedActor) ? savedActor : DEFAULT_ACTOR
    })

    function setActor(nextActor: ActorRole) {
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