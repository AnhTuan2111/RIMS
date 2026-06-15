import { NavLink } from 'react-router-dom'
import { ACTOR_LABELS, actorMenus } from '../../config/actorMenus'
import { useActor } from '../../context/ActorContext'

export function Sidebar() {
    const { actor } = useActor()
    const menus = actorMenus[actor]

    return (
        <aside className="app-sidebar">
            <div className="app-sidebar-brand">
                <h2>RIMS</h2>
                <p>{ACTOR_LABELS[actor]}</p>
            </div>

            <nav className="app-sidebar-nav">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        isActive ? 'app-sidebar-link active' : 'app-sidebar-link'
                    }
                >
                    Tổng quan
                </NavLink>

                <div className="app-menu-group">
                    <p className="app-menu-title">{ACTOR_LABELS[actor]}</p>

                    {menus.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                isActive ? 'app-sidebar-link active' : 'app-sidebar-link'
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </aside>
    )
}