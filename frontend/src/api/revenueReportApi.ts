import axiosClient from "./axiosClient";

export const revenueReportApi = {
    getTotalRevenue: () =>
        axiosClient.get("/reports/total"),

    getTodayRevenue: () =>
        axiosClient.get("/reports/today"),

    getWeeklyRevenue: () =>
        axiosClient.get("/reports/weekly"),

    getMonthlyRevenue: () =>
        axiosClient.get("/reports/monthly"),

    getCustomRevenue: (
        fromDate: string,
        toDate: string
    ) =>
        axiosClient.get(
            `/reports/custom?fromDate=${fromDate}&toDate=${toDate}`
        ),

    getBestSelling: () =>
        axiosClient.get("/reports/best-selling"),

};