import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { revenueReportApi } from "../../api/revenueReportApi";
import "./RevenueReportPage.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
interface RevenueData {
    revenue: number;
    period: string;
}

export default function RevenueReportPage() {
    const navigate = useNavigate();

    const [revenue, setRevenue] = useState<RevenueData>({
        revenue: 0,
        period: "No data selected",
    });

    const [selectedPeriod, setSelectedPeriod] =
        useState("monthly");

    const [showCustom, setShowCustom] =
        useState(false);

    const [fromDate, setFromDate] =
        useState<Date | null>(null);

    const [toDate, setToDate] =
        useState<Date | null>(null);

    const loadRevenue = async (
        period: string
    ) => {
        try {
            let response;

            switch (period) {

                case "daily":
                    response =
                        await revenueReportApi
                            .getTodayRevenue();
                    break;

                case "weekly":
                    response =
                        await revenueReportApi
                            .getWeeklyRevenue();
                    break;

                case "monthly":
                    response =
                        await revenueReportApi
                            .getMonthlyRevenue();
                    break;

                case "yearly":
                    response =
                        await revenueReportApi
                            .getYearlyRevenue();
                    break;

                case "total":
                    response =
                        await revenueReportApi
                            .getTotalRevenue();
                    break;

                default:
                    return;
            }

            setRevenue(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handlePeriodChange = async (
        period: string
    ) => {
        setSelectedPeriod(period);

        if (period === "custom") {
            setShowCustom(true);
            return;
        }

        setShowCustom(false);

        await loadRevenue(period);
    };

    const handleCustom = async () => {
        if (!fromDate || !toDate) {
            alert(
                "Please select start date and end date"
            );
            return;
        }

        try {
            const formattedFrom =
                format(fromDate, "yyyy-MM-dd");

            const formattedTo =
                format(toDate, "yyyy-MM-dd");

            const response =
                await revenueReportApi.getCustomRevenue(
                    formattedFrom,
                    formattedTo
                );

            setRevenue(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const formatPeriod = (period: string) => {

        if (!period.includes(" - ")) {
            return period;
        }

        const [start, end] = period.split(" - ");

        const formattedStart =
            format(new Date(start), "dd/MM/yyyy");

        const formattedEnd =
            format(new Date(end), "dd/MM/yyyy");

        if (start === end) {
            return formattedStart;
        }

        return `${formattedStart} - ${formattedEnd}`;
    };

    return (
        <div className="revenue-page">

            <div className="page-header">

                <button
                    className="back-button"
                    onClick={() =>
                        navigate("/statistics")
                    }
                >
                    ←
                </button>

                <div>
                    <h1>
                        Revenue Report
                    </h1>

                    <p>
                        Total revenue from paid
                        orders
                    </p>
                </div>

            </div>

            <div className="filter-card">

                <div className="tabs">

                    <button
                        className={
                            selectedPeriod ===
                            "daily"
                                ? "tab active"
                                : "tab"
                        }
                        onClick={() =>
                            handlePeriodChange(
                                "daily"
                            )
                        }
                    >
                        Daily
                    </button>

                    <button
                        className={
                            selectedPeriod ===
                            "weekly"
                                ? "tab active"
                                : "tab"
                        }
                        onClick={() =>
                            handlePeriodChange(
                                "weekly"
                            )
                        }
                    >
                        Weekly
                    </button>

                    <button
                        className={
                            selectedPeriod ===
                            "monthly"
                                ? "tab active"
                                : "tab"
                        }
                        onClick={() =>
                            handlePeriodChange(
                                "monthly"
                            )
                        }
                    >
                        Monthly
                    </button>

                    <button
                        className={
                            selectedPeriod === "yearly"
                                ? "tab active"
                                : "tab"
                        }
                        onClick={() =>
                            handlePeriodChange(
                                "yearly"
                            )
                        }
                    >
                        Yearly
                    </button>

                    <button
                        className={
                            selectedPeriod ===
                            "total"
                                ? "tab active"
                                : "tab"
                        }
                        onClick={() =>
                            handlePeriodChange(
                                "total"
                            )
                        }
                    >
                        Total
                    </button>

                    <button
                        className={
                            selectedPeriod ===
                            "custom"
                                ? "tab active"
                                : "tab"
                        }
                        onClick={() =>
                            handlePeriodChange(
                                "custom"
                            )
                        }
                    >
                        Custom
                    </button>

                </div>

                <p className="filter-note">
                    Showing revenue for the
                    selected period
                </p>

                {showCustom && (
                    <div className="custom-filter">

                        <div className="input-group">
                            <label>
                                Start Date
                            </label>

                            <DatePicker
                                selected={fromDate}
                                onChange={(date: Date | null) =>
                                    setFromDate(date)
                                }
                                dateFormat="dd/MM/yyyy"
                                placeholderText="dd/MM/yyyy"
                                className="date-picker"
                                maxDate={new Date()}
                            />
                        </div>

                        <div className="input-group">
                            <label>
                                End Date
                            </label>

                            <DatePicker
                                selected={toDate}
                                onChange={(date: Date | null) =>
                                    setToDate(date)
                                }
                                dateFormat="dd/MM/yyyy"
                                placeholderText="dd/MM/yyyy"
                                className="date-picker"
                                maxDate={new Date()}
                            />
                        </div>

                        <button
                            className="apply-btn"
                            onClick={
                                handleCustom
                            }
                        >
                            Apply Filter
                        </button>

                    </div>
                )}

            </div>

            <div className="revenue-card">

                <div className="revenue-main">

        <span className="card-label">
            TOTAL REVENUE
        </span>

                    <p className="card-period">
                        {formatPeriod(revenue.period)}
                    </p>

                    <h2 className="card-value">
                        {Number(revenue.revenue).toLocaleString()}
                        {" "}
                        VND
                    </h2>


                </div>



            </div>

        </div>
    );
}