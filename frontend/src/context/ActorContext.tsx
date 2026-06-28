import type {ReactNode} from 'react'
import {createContext, useContext, useState} from 'react'
import {RoleType} from '../types/auth'

type ActorContextType = {
    actor: RoleType
    setActor: (actor: RoleType) => void
}

const ActorContext = createContext<ActorContextType | null>(null)

const DEFAULT_ACTOR: RoleType = RoleType.ADMIN

const ALL_ROLES = Object.values(RoleType)

function isActorRole(value: string | null): value is RoleType {
    return ALL_ROLES.includes(value as RoleType)
}

export function ActorProvider({children}: { children: ReactNode }) {
    const [actor, setActorState] = useState<RoleType>(() => {
        const savedActor = localStorage.getItem('selectedActor')
        return isActorRole(savedActor) ? savedActor : DEFAULT_ACTOR
    })

    function setActor(nextActor: RoleType) {
        localStorage.setItem('selectedActor', nextActor)
        setActorState(nextActor)
    }

    return (
        <ActorContext.Provider value={{actor, setActor}}>
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
