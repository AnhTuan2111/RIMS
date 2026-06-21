import {useState, useEffect} from "react";

export function useReservationTick(intervalMs = 30000) {
    const [, setTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), intervalMs);
        return () => clearInterval(t);
    }, [intervalMs]);
}
