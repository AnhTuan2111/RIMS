import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
    const navigate = useNavigate();

    return (
        <div style={{ padding: "40px" }}>
            <h1>Admin Dashboard</h1>

            <button
                onClick={() => navigate("/statistics")}
            >
                Statistics
            </button>
        </div>
    );
}