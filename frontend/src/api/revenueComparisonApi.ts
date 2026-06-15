import axios from "axios";

const API_URL = "http://localhost:8080/api/reports";

export interface RevenueComparisonResponse {
    revenue1: number;
    revenue2: number;

    difference: number;

    growthRate: number;

    averageRevenue1: number;
    averageRevenue2: number;
}

export const revenueComparisonApi = {

    compareRevenue: async (
        startDate1: string,
        endDate1: string,
        startDate2: string,
        endDate2: string
    ) => {

        const response = await axios.get(
            `${API_URL}/compare`,
            {
                params: {
                    startDate1,
                    endDate1,
                    startDate2,
                    endDate2,
                },
            }
        );

        return response.data;
    },

};