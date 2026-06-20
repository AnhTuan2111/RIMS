import {useState, useEffect, type ReactNode} from "react";
import {useNavigate} from "react-router-dom";

export function Clock() {
    const [nowMs, setNowMs] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNowMs(Date.now()), 60000);
        return () => clearInterval(t);
    }, []);
    const d = new Date(nowMs);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en", {month: "short"});
    return (
        <span className="waiter-clock">
            {h}h{m} {day}-{mon}-{d.getFullYear()}
        </span>
    );
}

export function BackArrow({onClick}: { onClick?: () => void }) {
    const navigate = useNavigate();
    return (
        <button onClick={onClick || (() => navigate(-1))} className="waiter-back-btn">
            <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
        </button>
    );
}

export function WaiterHeader() {
    return (
        <header className="waiter-header">
            <div style={{fontWeight: 700, fontSize: '1.25rem', color: '#1e293b'}}>Waiter App</div>
            <Clock/>
        </header>
    );
}

export function WaiterToast({toast}: { toast: { msg: string; type: string } | null }) {
    if (!toast) return null;
    return (
        <div className={`waiter-toast waiter-toast-${toast.type}`}>
            {toast.msg}
        </div>
    );
}

export function ConfirmModal({
    title,
    message,
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy",
    onConfirm,
    onCancel,
    children,
}: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    children?: ReactNode;
}) {
    return (
        <div className="waiter-modal-overlay" onClick={onCancel}>
            <div className="waiter-modal" onClick={(e) => e.stopPropagation()}>
                <h3>{title}</h3>
                {message && <p>{message}</p>}
                {children}
                <div className="waiter-modal-actions">
                    <button onClick={onCancel} className="waiter-btn-outline">{cancelLabel}</button>
                    <button onClick={onConfirm} className="waiter-btn-primary">{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

export function fmtPrice(p: number | null | undefined) {
    return (p ?? 0).toLocaleString("vi-VN") + " ₫";
}

export function toMs(date: string, time: string) {
    return new Date(`${date}T${time}:00`).getTime();
}

export function useReservationTick(intervalMs = 30000) {
    const [, setTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), intervalMs);
        return () => clearInterval(t);
    }, [intervalMs]);
}
