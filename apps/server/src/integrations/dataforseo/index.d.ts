import { DataForSEOCredentials } from './client.js';
import { SerpService } from './serp.js';
import { KeywordsService } from './keywords.js';
import { LabsService } from './labs.js';
export interface DataForSEOServiceOptions {
    credentials?: Partial<DataForSEOCredentials>;
    rateLimiting?: {
        requestsPerMinute?: number;
        requestsPerHour?: number;
    };
}
export interface TaskStatus {
    id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    progress?: number;
    error?: string;
    result?: any;
    cost?: number;
    createdAt: Date;
    completedAt?: Date;
}
export declare class DataForSEOService {
    private client;
    serp: SerpService;
    keywords: KeywordsService;
    labs: LabsService;
    private taskQueue;
    private rateLimiter;
    constructor(options?: DataForSEOServiceOptions);
    validateConnection(): Promise<{
        isValid: boolean;
        accountInfo?: any;
        error?: string;
    }>;
    private checkRateLimit;
    submitTask(taskType: 'serp_organic' | 'serp_maps' | 'keywords_volume' | 'keywords_trends' | 'keywords_ideas' | 'competitors' | 'ranked_keywords' | 'keyword_suggestions', data: any, options?: {
        priority?: 'high' | 'normal' | 'low';
    }): Promise<string>;
    getTaskStatus(taskId: string): Promise<TaskStatus | null>;
    getTaskResult(taskId: string): Promise<any>;
    private startTaskMonitoring;
    submitBulkTasks(tasks: Array<{
        type: string;
        data: any;
        priority?: 'high' | 'normal' | 'low';
    }>): Promise<string[]>;
    waitForTasks(taskIds: string[], options?: {
        timeout?: number;
        checkInterval?: number;
    }): Promise<{
        [taskId: string]: any;
    }>;
    getUsageStats(): {
        tasksInQueue: number;
        completedTasks: number;
        erroredTasks: number;
        pendingTasks: number;
        rateLimitStatus: {
            requestsThisMinute: number;
            requestsThisHour: number;
            minuteResetIn: number;
            hourResetIn: number;
        };
    };
    cleanupCompletedTasks(olderThanHours?: number): number;
}
export * from './client.js';
export * from './serp.js';
export * from './keywords.js';
export * from './labs.js';
export { DataForSEOService as default };
//# sourceMappingURL=index.d.ts.map