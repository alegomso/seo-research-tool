export interface AIInsightRequest {
    type: 'keyword_analysis' | 'competitor_analysis' | 'content_strategy' | 'serp_analysis' | 'trend_analysis';
    data: any;
    context?: {
        industry?: string;
        targetAudience?: string;
        businessGoals?: string[];
        competitorDomains?: string[];
    };
    options?: {
        tone?: 'professional' | 'casual' | 'technical';
        length?: 'brief' | 'detailed' | 'comprehensive';
        focus?: string[];
    };
}
export interface AIInsightResponse {
    summary: string;
    insights: string[];
    recommendations: Array<{
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
        effort: 'quick' | 'moderate' | 'significant';
        impact: 'high' | 'medium' | 'low';
    }>;
    keyMetrics?: Array<{
        metric: string;
        value: string | number;
        trend?: 'up' | 'down' | 'stable';
        context: string;
    }>;
    nextSteps?: string[];
}
export declare class OpenAIClient {
    private client;
    constructor(apiKey?: string);
    generateInsights(request: AIInsightRequest): Promise<AIInsightResponse>;
    private getSystemPrompt;
    private buildPrompt;
    generateContentBrief(keyword: string, serpData: any, keywordData: any, options?: {
        wordCount?: number;
        contentType?: 'blog' | 'landing' | 'product' | 'guide';
        targetAudience?: string;
    }): Promise<{
        title: string;
        outline: Array<{
            heading: string;
            subpoints: string[];
        }>;
        wordCount: number;
        primaryKeywords: string[];
        semanticKeywords: string[];
        contentAngle: string;
        userIntent: string;
        competitiveAdvantage: string;
    }>;
    generateTechnicalRecommendations(siteData: any, performanceData: any): Promise<{
        criticalIssues: Array<{
            issue: string;
            impact: string;
            solution: string;
        }>;
        optimizations: Array<{
            area: string;
            recommendation: string;
            impact: 'high' | 'medium' | 'low';
        }>;
        technicalScore: number;
        priorityActions: string[];
    }>;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=client.d.ts.map