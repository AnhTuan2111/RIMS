export interface BestSellingItem {
    rank: number;
    dishName: string;
    totalQuantity: number;
    totalRevenue: number;
}

export interface BestSellingResponse {
    fromDate: string;
    toDate: string;
    dataRangeNote: string;
    items: BestSellingItem[];
}