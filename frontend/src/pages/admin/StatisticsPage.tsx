
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { revenueReportApi } from "../../api/revenueReportApi";

import {
    DollarSign,
    BarChart3,
    Trophy,
    CalendarDays,
    ChevronRight,
    TrendingUp,
} from "lucide-react";

import "./StatisticsPage.css";

interface BestSellingItem {
    rank: number;
    dishName: string;
    totalQuantity: number;
    totalRevenue: number;
}

export default function StatisticsPage() {
    const navigate = useNavigate();

    const [topDishes, setTopDishes] =
        useState<BestSellingItem[]>([]);

    useEffect(() => {
        loadBestSelling();
    }, []);

    const loadBestSelling = async () => {
        try {
            const response =
                await revenueReportApi.getBestSelling();

            setTopDishes(
                response.data.items || []
            );
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="statistics-page">

            <div className="statistics-header">

                <div>
                    <h1>Statistics</h1>

                    <p>
                        Overview of restaurant performance
                    </p>
                </div>

            </div>

            <div className="statistics-cards">

                <div
                    className="feature-card"
                    onClick={() =>
                        navigate("/statistics/revenue")
                    }
                >
                    <div className="card-icon">
                        <DollarSign size={20} />
                    </div>

                    <h3>Total Revenue</h3>

                    <p>
                        Revenue reports with date range filtering
                    </p>

                    <ChevronRight size={18} />
                </div>

                <div
                    className="feature-card"
                    onClick={() =>
                        navigate(
                            "/statistics/revenue-comparison"
                        )
                    }
                >
                    <div className="card-icon">
                        <BarChart3 size={20} />
                    </div>

                    <h3>Revenue Comparison</h3>

                    <p>
                        Compare revenue between two periods
                    </p>

                    <ChevronRight size={18} />
                </div>

                <div
                    className="feature-card"
                    onClick={() =>
                        navigate(
                            "/statistics/best-selling"
                        )
                    }
                >
                    <div className="card-icon">
                        <Trophy size={20} />
                    </div>

                    <h3>Best-Selling Dishes</h3>

                    <p>
                        Top dishes ranked by quantity sold
                    </p>

                    <ChevronRight size={18} />
                </div>

                <div className="feature-card">

                    <div className="card-icon">
                        <CalendarDays size={20} />
                    </div>

                    <h3>Booking Performance</h3>

                    <p>
                        Restaurant booking performance
                    </p>

                    <ChevronRight size={18} />
                </div>

            </div>

            <div className="dashboard-grid">

                <div className="dashboard-card">

                    <h2>
                        Booking Performance
                    </h2>

                    <table className="booking-table">

                        <thead>
                        <tr>
                            <th>Day</th>
                            <th>Bookings</th>
                            <th>Performance</th>
                        </tr>
                        </thead>

                        <tbody>

                        <tr>
                            <td>Monday</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>

                        <tr>
                            <td>Tuesday</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>

                        <tr>
                            <td>Wednesday</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>

                        <tr>
                            <td>Thursday</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>

                        <tr>
                            <td>Friday</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>

                        <tr>
                            <td>Saturday</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>

                        <tr>
                            <td>Sunday</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>

                        </tbody>

                    </table>

                </div>

                <div className="dashboard-card">

                    <div className="section-header">

                        <div className="section-title">

                            <div className="section-icon trophy">
                                <Trophy size={18} />
                            </div>

                            <h2>
                                Best-Selling Dishes
                            </h2>

                        </div>

                        <button
                            className="view-all-btn"
                            onClick={() =>
                                navigate("/statistics/best-selling")
                            }
                        >
                            View all
                        </button>

                    </div>

                    <div className="dish-ranking">

                        {topDishes.slice(0, 10).map((dish) => {

                            const maxQty =
                                topDishes[0]?.totalQuantity || 1;

                            const width =
                                (dish.totalQuantity / maxQty) * 100;

                            return (
                                <div
                                    key={dish.rank}
                                    className="dish-row"
                                >

                                    <div
                                        className={`rank-badge ${
                                            dish.rank === 1
                                                ? "gold"
                                                : dish.rank === 2
                                                    ? "silver"
                                                    : dish.rank === 3
                                                        ? "bronze"
                                                        : ""
                                        }`}
                                    >
                                        {dish.rank}
                                    </div>

                                    <div className="dish-name">
                                        {dish.dishName}
                                    </div>

                                    <div className="dish-bar">

                                        <div
                                            className="dish-bar-fill"
                                            style={{
                                                width: `${width}%`,
                                            }}
                                        />

                                    </div>

                                    <div className="dish-qty">
                                        {dish.totalQuantity}
                                    </div>

                                </div>
                            );
                        })}

                    </div>

                </div>

            </div>

            <div className="comparison-section">

                <div className="comparison-header">

                    <h2>
                        Comparison Results
                    </h2>

                    <div className="comparison-badge">
                        Comparing Current Period vs Previous Period
                    </div>

                </div>

                <div className="comparison-grid">

                    <div className="comparison-card">

                        <div className="comparison-avatar green">
                            A
                        </div>

                        <h3>
                            Revenue Period A
                        </h3>

                        <p>
                            Current Period
                        </p>

                        <h2 className="green-text">
                            25,430,000 VND
                        </h2>

                    </div>

                    <div className="comparison-card">

                        <div className="comparison-avatar blue">
                            B
                        </div>

                        <h3>
                            Revenue Period B
                        </h3>

                        <p>
                            Previous Period
                        </p>

                        <h2 className="blue-text">
                            22,930,000 VND
                        </h2>

                    </div>

                    <div className="comparison-card">

                        <div className="metric-icon positive-bg">
                            <TrendingUp size={20} />
                        </div>

                        <h3>
                            Revenue Difference
                        </h3>

                        <h2 className="positive">
                            +2,500,000 VND
                        </h2>

                        <p>
                            vs previous period
                        </p>

                    </div>

                    <div className="comparison-card">

                        <div className="metric-icon positive-bg">
                            <TrendingUp size={20} />
                        </div>

                        <h3>
                            Growth Rate
                        </h3>

                        <h2 className="positive">
                            +10.90%
                        </h2>

                        <p>
                            vs previous period
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

