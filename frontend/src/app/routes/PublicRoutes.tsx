import {Route} from 'react-router-dom'

import HomePage from '../../pages/home/HomePage'

export function renderPublicRoutes() {
    return (
        <>
            <Route path="/" element={<HomePage/>}/>
        </>
    )
}