import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { revenueReportApi } from "../../api/revenueReportApi";
import "./BestSellingPage.css";

interface BestSellingItem {
    rank: number;
    dishName: string;
    totalQuantity: number;
    totalRevenue: number;
}

export default function BestSellingPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState<BestSellingItem[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await revenueReportApi.getBestSelling();
            setItems(response.data.items || []);
        } catch (error) {
            console.error(error);
        }
    };

    const getRankClass = (rank: number) => {
        switch (rank) {
            case 1:
                return "rank-1";
            case 2:
                return "rank-2";
            case 3:
                return "rank-3";
            default:
                return "rank-default";
        }
    };

    return (
        <div className="best-selling-page">
            <div className="header-section">
                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    ←
                </button>

                <div>
                    <h1 className="page-title">
                        Best-Selling Dishes
                    </h1>

                    <p className="page-subtitle">
                        Top 10 dishes ranked by quantity sold — all time
                    </p>
                </div>
            </div>

            <div className="table-card">
                <table>
                    <thead>
                    <tr>
                        <th>RANK</th>
                        <th>DISH NAME</th>
                        <th className="text-right">
                            QTY SOLD
                        </th>
                        <th className="text-right">
                            REVENUE GENERATED
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {items.map((item) => (
                        <tr key={item.rank}>
                            <td>
                                <div
                                    className={`rank-circle ${getRankClass(
                                        item.rank
                                    )}`}
                                >
                                    {item.rank}
                                </div>
                            </td>

                            <td>
                                <div className="dish-container">
                                        <span className="dish-name">
                                            {item.dishName}
                                        </span>

                                    {item.rank === 1 && (
                                        <span className="best-seller-badge">
                                                #1 Best Seller
                                            </span>
                                    )}
                                </div>
                            </td>

                            <td className="text-right qty">
                                {item.totalQuantity}
                            </td>

                            <td className="text-right revenue">
                                $
                                {Number(
                                    item.totalRevenue
                                ).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}