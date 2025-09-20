import { DataForSEOClient, TaskPostResponse, TaskGetResponse } from './client.js';
export interface SerpTaskData {
    keyword: string;
    location_name?: string;
    location_code?: number;
    language_name?: string;
    language_code?: string;
    device?: 'desktop' | 'mobile' | 'tablet';
    os?: string;
}
export interface SerpResult {
    keyword: string;
    type: string;
    se_domain: string;
    location_code: number;
    language_code: string;
    check_url: string;
    datetime: string;
    spell: any;
    refinement_chips: any;
    item_types: string[];
    se_results_count: number;
    items_count: number;
    items: SerpItem[];
}
export interface SerpItem {
    type: string;
    rank_group: number;
    rank_absolute: number;
    position: string;
    xpath: string;
    domain: string;
    title: string;
    url: string;
    breadcrumb?: string;
    website_name?: string;
    description?: string;
    highlighted?: string[];
    extra?: any;
    about_this_result?: any;
    related_search_url?: string;
    timestamp?: string;
}
export declare class SerpService {
    private client;
    constructor(client: DataForSEOClient);
    postGoogleOrganicTask(data: SerpTaskData[]): Promise<TaskPostResponse>;
    getGoogleOrganicTasksReady(): Promise<TaskGetResponse>;
    getGoogleOrganicTaskResult(taskId: string): Promise<TaskGetResponse>;
    postGoogleMapsTask(data: SerpTaskData[]): Promise<TaskPostResponse>;
    getGoogleMapsTasksReady(): Promise<TaskGetResponse>;
    getGoogleMapsTaskResult(taskId: string): Promise<TaskGetResponse>;
    detectLocalIntent(keyword: string): boolean;
    extractSerpFeatures(items: SerpItem[]): string[];
    analyzeContentTypes(items: SerpItem[]): {
        [key: string]: number;
    };
    calculateKeywordDifficulty(items: SerpItem[]): number;
}
//# sourceMappingURL=serp.d.ts.map