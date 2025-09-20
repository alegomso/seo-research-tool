import { AIInsightRequest } from './client.js';
export interface AIAnalysisJob {
    id: string;
    userId: string;
    projectId?: string;
    type: 'insight_generation' | 'content_brief' | 'technical_audit' | 'template_analysis';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    input: any;
    output?: any;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
    tokensUsed?: number;
    cost?: number;
}
export interface AnalysisRequest {
    type: AIInsightRequest['type'];
    data: any;
    templateId?: string;
    context?: {
        industry?: string;
        targetAudience?: string;
        businessGoals?: string[];
        competitorDomains?: string[];
        projectName?: string;
    };
    options?: {
        tone?: 'professional' | 'casual' | 'technical';
        length?: 'brief' | 'detailed' | 'comprehensive';
        focus?: string[];
        model?: 'gpt-3.5-turbo' | 'gpt-4-turbo-preview' | 'gpt-4';
    };
}
export declare class AIService {
    private client;
    private jobs;
    constructor(apiKey?: string);
    generateAnalysis(userId: string, request: AnalysisRequest, projectId?: string): Promise<string>;
    generateContentBrief(userId: string, keyword: string, serpData: any, keywordData: any, options?: {
        wordCount?: number;
        contentType?: 'blog' | 'landing' | 'product' | 'guide';
        targetAudience?: string;
    }, projectId?: string): Promise<string>;
    generateTechnicalAudit(userId: string, siteData: any, performanceData: any, projectId?: string): Promise<string>;
    getJobStatus(jobId: string, userId: string): Promise<AIAnalysisJob | null>;
    getUserJobs(userId: string, projectId?: string): AIAnalysisJob[];
    private processJob;
    private processTemplateAnalysis;
    private processContentBrief;
    private processTechnicalAudit;
    private updateJobStatus;
    private generateJobId;
    generateBatchAnalysis(userId: string, requests: AnalysisRequest[], projectId?: string): Promise<string[]>;
    waitForJobs(jobIds: string[], userId: string, options?: {
        timeout?: number;
        checkInterval?: number;
    }): Promise<{
        [jobId: string]: AIAnalysisJob;
    }>;
    getAvailableTemplates(): {
        id: string;
        name: string;
        description: string;
        category: string;
    }[];
    validateTemplate(templateId: string, data: any): {
        isValid: boolean;
        missingVariables: string[];
        extraVariables: string[];
    };
    testConnection(): Promise<boolean>;
    getUsageStats(): {
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        processingJobs: number;
        averageProcessingTime: number;
        totalTokensUsed: number;
        estimatedCost: number;
    };
    cleanupCompletedJobs(olderThanHours?: number): number;
}
export * from './client.js';
export * from './templates.js';
export { AIService as default };
//# sourceMappingURL=index.d.ts.map