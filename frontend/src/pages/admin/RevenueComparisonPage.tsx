import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import {
    format,
    startOfWeek,
    endOfWeek,
    subWeeks,
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfYear,
    endOfYear,
    subYears,
} from "date-fns";

import {
    ArrowLeft,
    Check,
    CalendarDays,
    TrendingUp,
    BarChart3,
    User, TrendingDown,
} from "lucide-react";

import "react-datepicker/dist/react-datepicker.css";
import "./RevenueComparisonPage.css";

import {
    revenueComparisonApi,
} from "../../api/revenueComparisonApi";

import type {
    RevenueComparisonResponse,
} from "../../api/revenueComparisonApi";

export default function RevenueComparisonPage() {
    const navigate = useNavigate();

    const [comparisonType, setComparisonType] =
        useState("week");

    const [loading, setLoading] =
        useState(false);

    const [startDate1, setStartDate1] =
        useState<Date | null>(null);

    const [endDate1, setEndDate1] =
        useState<Date | null>(null);

    const [startDate2, setStartDate2] =
        useState<Date | null>(null);

    const [endDate2, setEndDate2] =
        useState<Date | null>(null);

    const [result, setResult] =
        useState<RevenueComparisonResponse | null>(
            null
        );

    useEffect(() => {
        const today = new Date();

        if (comparisonType === "week") {
            const currentWeekStart =
                startOfWeek(today, {
                    weekStartsOn: 1,
                });

            const currentWeekEnd =
                endOfWeek(today, {
                    weekStartsOn: 1,
                });

            const previousWeekStart =
                startOfWeek(
                    subWeeks(today, 1),
                    {
                        weekStartsOn: 1,
                    }
                );

            const previousWeekEnd =
                endOfWeek(
                    subWeeks(today, 1),
                    {
                        weekStartsOn: 1,
                    }
                );

            setStartDate1(currentWeekStart);
            setEndDate1(currentWeekEnd);

            setStartDate2(previousWeekStart);
            setEndDate2(previousWeekEnd);
        }

        if (comparisonType === "month") {
            const currentMonthStart =
                startOfMonth(today);

            const currentMonthEnd =
                endOfMonth(today);

            const previousMonth =
                subMonths(today, 1);

            setStartDate1(currentMonthStart);
            setEndDate1(currentMonthEnd);

            setStartDate2(
                startOfMonth(previousMonth)
            );

            setEndDate2(
                endOfMonth(previousMonth)
            );
        }

        if (comparisonType === "year") {
            const currentYearStart =
                startOfYear(today);

            const currentYearEnd =
                endOfYear(today);

            const previousYear =
                subYears(today, 1);

            setStartDate1(currentYearStart);
            setEndDate1(currentYearEnd);

            setStartDate2(
                startOfYear(previousYear)
            );

            setEndDate2(
                endOfYear(previousYear)
            );
        }

        if (comparisonType === "custom") {
            setStartDate1(null);
            setEndDate1(null);
            setStartDate2(null);
            setEndDate2(null);
        }
    }, [comparisonType]);

    const handleCompare = async () => {
        if (
            !startDate1 ||
            !endDate1 ||
            !startDate2 ||
            !endDate2
        ) {
            alert("Please select all dates");
            return;
        }

        try {
            setLoading(true);

            const response =
                await revenueComparisonApi.compareRevenue(
                    format(
                        startDate1,
                        "yyyy-MM-dd"
                    ),
                    format(
                        endDate1,
                        "yyyy-MM-dd"
                    ),
                    format(
                        startDate2,
                        "yyyy-MM-dd"
                    ),
                    format(
                        endDate2,
                        "yyyy-MM-dd"
                    )
                );

            setResult(response);
        } catch (error) {
            console.error(error);
            alert(
                "Unable to compare revenue"
            );
        } finally {
            setLoading(false);
        }
    };

    const isPositive =
        (result?.difference ?? 0) >= 0;

    const comparisonOptions = [
        {
            key: "week",
            title: "This Week vs Last Week",
            desc: "Compare weekly revenue",
        },
        {
            key: "month",
            title: "This Month vs Last Month",
            desc: "Compare monthly revenue",
        },
        {
            key: "year",
            title: "This Year vs Last Year",
            desc: "Compare yearly revenue",
        },
        {
            key: "custom",
            title: "Custom Comparison",
            desc: "Select any date range",
        },
    ];

    return (
        <div className="comparison-page">

            <div className="page-header">

                <div className="header-left">

                    <button
                        className="back-btn"
                        onClick={() =>
                            navigate(
                                "/statistics"
                            )
                        }
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <h1>
                            Revenue Comparison
                        </h1>

                        <p>
                            Compare revenue
                            performance between
                            two periods
                        </p>
                    </div>

                </div>

                <div className="manager-box">

                    <div className="manager-info">
                        <span>
                            Manager
                        </span>
                    </div>

                    <div className="manager-avatar">
                        <User size={18} />
                    </div>

                </div>

            </div>

            <div className="comparison-type-section">

                <h2>
                    Choose Comparison Type
                </h2>

                <div className="comparison-cards">

                    {comparisonOptions.map(
                        (item) => (
                            <div
                                key={item.key}
                                className={
                                    comparisonType ===
                                    item.key
                                        ? "compare-card active"
                                        : "compare-card"
                                }
                                onClick={() =>
                                    setComparisonType(
                                        item.key
                                    )
                                }
                            >
                                <CalendarDays
                                    size={22}
                                />

                                {comparisonType ===
                                    item.key && (
                                        <div className="card-check">
                                            <Check
                                                size={
                                                    16
                                                }
                                            />
                                        </div>
                                    )}

                                <h3>
                                    {
                                        item.title
                                    }
                                </h3>

                                <p>
                                    {
                                        item.desc
                                    }
                                </p>
                            </div>
                        )
                    )}

                </div>

            </div>

            <div className="period-container">

                <div className="auto-period-section">

                    <h2>
                        2. Comparison Periods (Auto-selected)
                    </h2>

                    <div className="auto-period-cards">

                        <div className="period-card">

                            <div className="period-status green">
                                ● Current Period (This {comparisonType})
                            </div>

                            <div className="period-date">
                                <CalendarDays size={16} />

                                <span>
                        {startDate1 &&
                            endDate1 &&
                            `${format(
                                startDate1,
                                "MMM d, yyyy"
                            )} - ${format(
                                endDate1,
                                "MMM d, yyyy"
                            )}`}
                    </span>
                            </div>

                            <div className="period-days">
                                {startDate1 &&
                                    endDate1 &&
                                    Math.ceil(
                                        (endDate1.getTime() -
                                            startDate1.getTime()) /
                                        (1000 *
                                            60 *
                                            60 *
                                            24)
                                    ) + 1}
                                {" "}
                                days
                            </div>

                        </div>

                        <div className="vs-circle">
                            VS
                        </div>

                        <div className="period-card">

                            <div className="period-status blue">
                                ● Previous Period
                            </div>

                            <div className="period-date">
                                <CalendarDays size={16} />

                                <span>
                        {startDate2 &&
                            endDate2 &&
                            `${format(
                                startDate2,
                                "MMM d, yyyy"
                            )} - ${format(
                                endDate2,
                                "MMM d, yyyy"
                            )}`}
                    </span>
                            </div>

                            <div className="period-days">
                                {startDate2 &&
                                    endDate2 &&
                                    Math.ceil(
                                        (endDate2.getTime() -
                                            startDate2.getTime()) /
                                        (1000 *
                                            60 *
                                            60 *
                                            24)
                                    ) + 1}
                                {" "}
                                days
                            </div>

                        </div>

                    </div>

                </div>


                <div className="custom-section">

                    <h2>
                        2. Select Custom Periods
                    </h2>

                    <div className="custom-period-wrapper">

                        {/* Period A */}

                        <div className="period-group">

                            <h4 className="period-a-title">
                                Period A
                            </h4>

                            <div className="period-row">

                                <div className="date-field">

                                    <label>
                                        Start Date
                                    </label>

                                    <DatePicker
                                        selected={startDate1}
                                        onChange={(date: Date | null) =>
                                            setStartDate1(date)
                                        }
                                        dateFormat="dd/MM/yyyy"
                                        className="date-picker"
                                    />

                                </div>

                                <div className="date-field">

                                    <label>
                                        End Date
                                    </label>

                                    <DatePicker
                                        selected={endDate1}
                                        onChange={(date: Date | null) =>
                                            setEndDate1(date)
                                        }
                                        dateFormat="dd/MM/yyyy"
                                        className="date-picker"
                                    />

                                </div>

                            </div>

                        </div>

                        <div className="period-group">

                            <h4 className="period-b-title">
                                Period B
                            </h4>

                            <div className="period-row">

                                <div className="date-field">

                                    <label>
                                        Start Date
                                    </label>

                                    <DatePicker
                                        selected={startDate2}
                                        onChange={(date: Date | null) =>
                                            setStartDate2(date)
                                        }
                                        dateFormat="dd/MM/yyyy"
                                        className="date-picker"
                                    />

                                </div>

                                <div className="date-field">

                                    <label>
                                        End Date
                                    </label>

                                    <DatePicker
                                        selected={endDate2}
                                        onChange={(date: Date | null) =>
                                            setEndDate2(date)
                                        }
                                        dateFormat="dd/MM/yyyy"
                                        className="date-picker"
                                    />

                                </div>

                            </div>

                        </div>

                    </div>

                        <button
                            className="compare-btn"
                            onClick={handleCompare}
                            disabled={loading}
                        >
                            <BarChart3 size={18} />

                            {loading
                                ? "Comparing..."
                                : "Compare Revenue"}
                        </button>

                </div>


            </div>

            {result && (
                <div className="result-section">

                    <div className="result-header">

                        <h2>
                            Comparison Results
                        </h2>

                        <div className="comparing-badge">
                            Comparing Selected
                            Periods
                        </div>

                    </div>

                    <div className="result-grid">

                        <div className="result-card">

                            <div className="result-avatar green">
                                A
                            </div>

                            <h3>Revenue Period A</h3>

                            <span className="period-subtitle">
            {startDate1 &&
                endDate1 &&
                `${format(
                    startDate1,
                    "MMM d"
                )} - ${format(
                    endDate1,
                    "MMM d, yyyy"
                )}`}
        </span>

                            <h2 className="green-text">
                                {Number(
                                    result.revenue1
                                ).toLocaleString()}
                                {" "}
                                VND
                            </h2>

                        </div>

                        <div className="result-card">

                            <div className="result-avatar blue">
                                B
                            </div>

                            <h3>Revenue Period B</h3>

                            <span className="period-subtitle">
            {startDate2 &&
                endDate2 &&
                `${format(
                    startDate2,
                    "MMM d"
                )} - ${format(
                    endDate2,
                    "MMM d, yyyy"
                )}`}
        </span>

                            <h2 className="blue-text">
                                {Number(
                                    result.revenue2
                                ).toLocaleString()}
                                {" "}
                                VND
                            </h2>

                        </div>

                        <div className="result-card">

                            <div
                                className={
                                    isPositive
                                        ? "metric-icon positive-bg"
                                        : "metric-icon negative-bg"
                                }
                            >
                                {isPositive ? (
                                    <TrendingUp />
                                ) : (
                                    <TrendingDown />
                                )}
                            </div>

                            <h3>
                                Revenue Difference
                            </h3>

                            <h2
                                className={
                                    isPositive
                                        ? "positive"
                                        : "negative"
                                }
                            >
                                {isPositive ? "+" : ""}
                                {Number(
                                    result.difference
                                ).toLocaleString()}
                                {" "}
                                VND
                            </h2>

                            <p className="compare-note">
                                vs previous period
                            </p>

                        </div>

                        <div className="result-card">

                            <div
                                className={
                                    isPositive
                                        ? "metric-icon positive-bg"
                                        : "metric-icon negative-bg"
                                }
                            >
                                {isPositive ? (
                                    <TrendingUp />
                                ) : (
                                    <TrendingDown />
                                )}
                            </div>

                            <h3>
                                Growth Rate
                            </h3>

                            <h2
                                className={
                                    isPositive
                                        ? "positive"
                                        : "negative"
                                }
                            >
                                {isPositive ? "+" : ""}
                                {result.growthRate.toFixed(2)}%
                            </h2>

                            <p className="compare-note">
                                vs previous period
                            </p>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}