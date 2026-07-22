import {Clock} from "./Clock";

export function WaiterHeader() {
    return (
        <header className="waiter-header">
            <div style={{fontWeight: 700, fontSize: '1.25rem', color: '#1e293b'}}>Ứng dụng phục vụ</div>
            <Clock/>
        </header>
    );
}
