import { DataForSEOClient, TaskPostResponse, TaskGetResponse } from './client.js';
export interface KeywordTaskData {
    keywords: string[];
    location_name?: string;
    location_code?: number;
    language_name?: string;
    language_code?: string;
}
export interface KeywordData {
    keyword: string;
    location_code: number;
    language_code: string;
    search_volume: number;
    cpc: number;
    competition: number;
    competition_level: string;
    low_top_of_page_bid: number;
    high_top_of_page_bid: number;
    categories: number[];
    monthly_searches: MonthlySearch[];
}
export interface MonthlySearch {
    year: number;
    month: number;
    search_volume: number;
}
export interface TrendsData {
    keyword: string;
    location_code: number;
    language_code: string;
    type: string;
    items: TrendsItem[];
}
export interface TrendsItem {
    position: number;
    type: string;
    title: string;
    keywords: string[];
    data: TrendsDataPoint[];
}
export interface TrendsDataPoint {
    date_from: string;
    date_to: string;
    timestamp: number;
    values: number[];
}
export declare class KeywordsService {
    private client;
    constructor(client: DataForSEOClient);
    postGoogleAdsKeywordsTask(data: KeywordTaskData[]): Promise<TaskPostResponse>;
    getGoogleAdsKeywordsTasksReady(): Promise<TaskGetResponse>;
    getGoogleAdsKeywordsTaskResult(taskId: string): Promise<TaskGetResponse>;
    postGoogleTrendsTask(data: KeywordTaskData[]): Promise<TaskPostResponse>;
    getGoogleTrendsTasksReady(): Promise<TaskGetResponse>;
    getGoogleTrendsTaskResult(taskId: string): Promise<TaskGetResponse>;
    postKeywordIdeasTask(data: {
        seed_keywords: string[];
        location_name?: string;
        language_name?: string;
    }[]): Promise<TaskPostResponse>;
    getKeywordIdeasTasksReady(): Promise<TaskGetResponse>;
    getKeywordIdeasTaskResult(taskId: string): Promise<TaskGetResponse>;
    analyzeKeywordMetrics(keywords: KeywordData[]): {
        avgSearchVolume: number;
        avgCpc: number;
        competitionDistribution: {
            [key: string]: number;
        };
        topKeywords: KeywordData[];
        longTailKeywords: KeywordData[];
        lowCompetitionHighVolume: KeywordData[];
    };
    extractSeasonalTrends(keywords: KeywordData[]): {
        keyword: string;
        seasonality: 'high' | 'medium' | 'low';
        peakMonths: number[];
        trendDirection: 'increasing' | 'decreasing' | 'stable';
    }[];
}
//# sourceMappingURL=keywords.d.ts.map