import { DataForSEOClient, TaskPostResponse, TaskGetResponse } from './client.js';
export interface LabsTaskData {
    target: string;
    location_name?: string;
    location_code?: number;
    language_name?: string;
    language_code?: string;
    limit?: number;
    offset?: number;
}
export interface CompetitorData {
    se_domain: string;
    location_code: number;
    language_code: string;
    total_count: number;
    items_count: number;
    items: CompetitorItem[];
}
export interface CompetitorItem {
    se_domain: string;
    target: string;
    competitor: string;
    avg_position: number;
    sum_position: number;
    intersections: number;
    full_domain_metrics: DomainMetrics;
}
export interface DomainMetrics {
    organic_keywords: number;
    organic_traffic: number;
    organic_cost: number;
    paid_keywords: number;
    paid_traffic: number;
    paid_cost: number;
}
export interface KeywordSuggestion {
    keyword: string;
    location_code: number;
    language_code: string;
    search_volume: number;
    cpc: number;
    competition: number;
    categories: number[];
    keyword_difficulty: number;
}
export interface RankedKeyword {
    se_domain: string;
    location_code: number;
    language_code: string;
    total_count: number;
    items_count: number;
    items: RankedKeywordItem[];
}
export interface RankedKeywordItem {
    se_domain: string;
    keyword: string;
    ranked_serp_element: {
        se_domain: string;
        type: string;
        position: number;
        url: string;
        title: string;
        description: string;
        domain: string;
    };
    avg_position: number;
    sum_position: number;
    search_volume: number;
    cpc: number;
    competition: number;
    monthly_searches: Array<{
        year: number;
        month: number;
        search_volume: number;
    }>;
}
export declare class LabsService {
    private client;
    constructor(client: DataForSEOClient);
    postDomainCompetitorsTask(data: LabsTaskData[]): Promise<TaskPostResponse>;
    getDomainCompetitorsTasksReady(): Promise<TaskGetResponse>;
    getDomainCompetitorsTaskResult(taskId: string): Promise<TaskGetResponse>;
    postRankedKeywordsTask(data: LabsTaskData[]): Promise<TaskPostResponse>;
    getRankedKeywordsTasksReady(): Promise<TaskGetResponse>;
    getRankedKeywordsTaskResult(taskId: string): Promise<TaskGetResponse>;
    postKeywordSuggestionsTask(data: {
        keyword: string;
        location_name?: string;
        language_name?: string;
        limit?: number;
    }[]): Promise<TaskPostResponse>;
    getKeywordSuggestionsTasksReady(): Promise<TaskGetResponse>;
    getKeywordSuggestionsTaskResult(taskId: string): Promise<TaskGetResponse>;
    postRelatedKeywordsTask(data: {
        keyword: string;
        location_name?: string;
        language_name?: string;
        limit?: number;
    }[]): Promise<TaskPostResponse>;
    getRelatedKeywordsTasksReady(): Promise<TaskGetResponse>;
    getRelatedKeywordsTaskResult(taskId: string): Promise<TaskGetResponse>;
    postHistoricalSerpTask(data: {
        keyword: string;
        location_name?: string;
        language_name?: string;
    }[]): Promise<TaskPostResponse>;
    getHistoricalSerpTasksReady(): Promise<TaskGetResponse>;
    getHistoricalSerpTaskResult(taskId: string): Promise<TaskGetResponse>;
    analyzeCompetitorLandscape(competitors: CompetitorItem[], targetDomain: string): {
        topCompetitors: CompetitorItem[];
        weakerCompetitors: CompetitorItem[];
        gapOpportunities: {
            competitor: string;
            avgPosition: number;
            organicKeywords: number;
            organicTraffic: number;
            strength: 'high' | 'medium' | 'low';
        }[];
        competitiveMetrics: {
            avgOrganicKeywords: number;
            avgOrganicTraffic: number;
            positionDistribution: {
                [key: string]: number;
            };
        };
    };
    analyzeKeywordOpportunities(rankedKeywords: RankedKeywordItem[]): {
        quickWins: RankedKeywordItem[];
        contentGaps: RankedKeywordItem[];
        brandingOpportunities: RankedKeywordItem[];
        seasonalKeywords: RankedKeywordItem[];
    };
    calculateContentOpportunityScore(keyword: RankedKeywordItem): number;
}
//# sourceMappingURL=labs.d.ts.map