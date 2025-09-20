"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabsService = void 0;
class LabsService {
    constructor(client) {
        this.client = client;
    }
    // Domain competitors analysis
    async postDomainCompetitorsTask(data) {
        const endpoint = '/v3/dataforseo_labs/google/competitors_domain/task_post';
        const taskData = data.map(task => ({
            target: task.target,
            location_name: task.location_name || 'United States',
            language_name: task.language_name || 'English',
            limit: task.limit || 100,
            offset: task.offset || 0,
        }));
        return this.client.postTask(endpoint, taskData);
    }
    async getDomainCompetitorsTasksReady() {
        const endpoint = '/v3/dataforseo_labs/google/competitors_domain/tasks_ready';
        return this.client.getTasksReady(endpoint);
    }
    async getDomainCompetitorsTaskResult(taskId) {
        const endpoint = `/v3/dataforseo_labs/google/competitors_domain/task_get/${taskId}`;
        return this.client.getTaskResult(taskId, endpoint);
    }
    // Ranked keywords for domain
    async postRankedKeywordsTask(data) {
        const endpoint = '/v3/dataforseo_labs/google/ranked_keywords/task_post';
        const taskData = data.map(task => ({
            target: task.target,
            location_name: task.location_name || 'United States',
            language_name: task.language_name || 'English',
            limit: task.limit || 1000,
            offset: task.offset || 0,
            filters: [
                ['search_volume', '>', 0],
                ['avg_position', '<=', 100]
            ],
        }));
        return this.client.postTask(endpoint, taskData);
    }
    async getRankedKeywordsTasksReady() {
        const endpoint = '/v3/dataforseo_labs/google/ranked_keywords/tasks_ready';
        return this.client.getTasksReady(endpoint);
    }
    async getRankedKeywordsTaskResult(taskId) {
        const endpoint = `/v3/dataforseo_labs/google/ranked_keywords/task_get/${taskId}`;
        return this.client.getTaskResult(taskId, endpoint);
    }
    // Keyword suggestions
    async postKeywordSuggestionsTask(data) {
        const endpoint = '/v3/dataforseo_labs/google/keyword_suggestions/task_post';
        const taskData = data.map(task => ({
            keyword: task.keyword,
            location_name: task.location_name || 'United States',
            language_name: task.language_name || 'English',
            limit: task.limit || 700,
            offset: 0,
            filters: [
                ['search_volume', '>', 0]
            ],
        }));
        return this.client.postTask(endpoint, taskData);
    }
    async getKeywordSuggestionsTasksReady() {
        const endpoint = '/v3/dataforseo_labs/google/keyword_suggestions/tasks_ready';
        return this.client.getTasksReady(endpoint);
    }
    async getKeywordSuggestionsTaskResult(taskId) {
        const endpoint = `/v3/dataforseo_labs/google/keyword_suggestions/task_get/${taskId}`;
        return this.client.getTaskResult(taskId, endpoint);
    }
    // Related keywords
    async postRelatedKeywordsTask(data) {
        const endpoint = '/v3/dataforseo_labs/google/related_keywords/task_post';
        const taskData = data.map(task => ({
            keyword: task.keyword,
            location_name: task.location_name || 'United States',
            language_name: task.language_name || 'English',
            limit: task.limit || 1000,
            offset: 0,
            depth: 2,
            filters: [
                ['search_volume', '>', 10]
            ],
        }));
        return this.client.postTask(endpoint, taskData);
    }
    async getRelatedKeywordsTasksReady() {
        const endpoint = '/v3/dataforseo_labs/google/related_keywords/tasks_ready';
        return this.client.getTasksReady(endpoint);
    }
    async getRelatedKeywordsTaskResult(taskId) {
        const endpoint = `/v3/dataforseo_labs/google/related_keywords/task_get/${taskId}`;
        return this.client.getTaskResult(taskId, endpoint);
    }
    // Historical SERP analysis
    async postHistoricalSerpTask(data) {
        const endpoint = '/v3/dataforseo_labs/google/historical_serps/task_post';
        const taskData = data.map(task => ({
            keyword: task.keyword,
            location_name: task.location_name || 'United States',
            language_name: task.language_name || 'English',
            date_from: '2023-01-01',
            date_to: new Date().toISOString().split('T')[0],
        }));
        return this.client.postTask(endpoint, taskData);
    }
    async getHistoricalSerpTasksReady() {
        const endpoint = '/v3/dataforseo_labs/google/historical_serps/tasks_ready';
        return this.client.getTasksReady(endpoint);
    }
    async getHistoricalSerpTaskResult(taskId) {
        const endpoint = `/v3/dataforseo_labs/google/historical_serps/task_get/${taskId}`;
        return this.client.getTaskResult(taskId, endpoint);
    }
    // Analyze competitor strengths and weaknesses
    analyzeCompetitorLandscape(competitors, targetDomain) {
        if (competitors.length === 0) {
            return {
                topCompetitors: [],
                weakerCompetitors: [],
                gapOpportunities: [],
                competitiveMetrics: {
                    avgOrganicKeywords: 0,
                    avgOrganicTraffic: 0,
                    positionDistribution: {},
                },
            };
        }
        // Sort by intersections (shared keywords) and organic traffic
        const sortedCompetitors = [...competitors].sort((a, b) => {
            const scoreA = a.intersections * 0.7 + (a.full_domain_metrics?.organic_traffic || 0) * 0.3;
            const scoreB = b.intersections * 0.7 + (b.full_domain_metrics?.organic_traffic || 0) * 0.3;
            return scoreB - scoreA;
        });
        const topCompetitors = sortedCompetitors.slice(0, 10);
        const weakerCompetitors = sortedCompetitors.filter(c => c.avg_position > 5 && c.intersections < 50);
        // Identify gap opportunities
        const gapOpportunities = competitors.map(competitor => {
            const metrics = competitor.full_domain_metrics || {};
            let strength = 'low';
            if (metrics.organic_traffic > 100000 && competitor.intersections > 200)
                strength = 'high';
            else if (metrics.organic_traffic > 10000 && competitor.intersections > 50)
                strength = 'medium';
            return {
                competitor: competitor.competitor,
                avgPosition: competitor.avg_position,
                organicKeywords: metrics.organic_keywords || 0,
                organicTraffic: metrics.organic_traffic || 0,
                strength,
            };
        }).filter(opp => opp.strength !== 'high'); // Focus on beatable competitors
        // Calculate competitive metrics
        const avgOrganicKeywords = competitors.reduce((sum, c) => sum + (c.full_domain_metrics?.organic_keywords || 0), 0) / competitors.length;
        const avgOrganicTraffic = competitors.reduce((sum, c) => sum + (c.full_domain_metrics?.organic_traffic || 0), 0) / competitors.length;
        const positionDistribution = {};
        competitors.forEach(c => {
            const range = c.avg_position <= 3 ? 'top-3' :
                c.avg_position <= 10 ? 'top-10' :
                    c.avg_position <= 20 ? 'top-20' : 'below-20';
            positionDistribution[range] = (positionDistribution[range] || 0) + 1;
        });
        return {
            topCompetitors,
            weakerCompetitors,
            gapOpportunities: gapOpportunities.slice(0, 20),
            competitiveMetrics: {
                avgOrganicKeywords: Math.round(avgOrganicKeywords),
                avgOrganicTraffic: Math.round(avgOrganicTraffic),
                positionDistribution,
            },
        };
    }
    // Analyze keyword gaps and opportunities
    analyzeKeywordOpportunities(rankedKeywords) {
        const quickWins = rankedKeywords.filter(k => k.avg_position >= 11 &&
            k.avg_position <= 20 &&
            k.search_volume >= 1000 &&
            k.competition < 0.5);
        const contentGaps = rankedKeywords.filter(k => k.avg_position > 20 &&
            k.search_volume >= 2000);
        const brandingOpportunities = rankedKeywords.filter(k => k.avg_position > 10 &&
            k.search_volume >= 5000 &&
            k.ranked_serp_element?.position <= 3);
        const seasonalKeywords = rankedKeywords.filter(k => {
            if (!k.monthly_searches || k.monthly_searches.length === 0)
                return false;
            const volumes = k.monthly_searches.map(m => m.search_volume);
            const avg = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
            const max = Math.max(...volumes);
            return max > avg * 1.5; // 50% above average indicates seasonality
        });
        return {
            quickWins: quickWins.slice(0, 50),
            contentGaps: contentGaps.slice(0, 100),
            brandingOpportunities: brandingOpportunities.slice(0, 30),
            seasonalKeywords: seasonalKeywords.slice(0, 40),
        };
    }
    // Calculate content opportunity score
    calculateContentOpportunityScore(keyword) {
        let score = 0;
        // Search volume weight (40%)
        if (keyword.search_volume >= 10000)
            score += 40;
        else if (keyword.search_volume >= 5000)
            score += 30;
        else if (keyword.search_volume >= 1000)
            score += 20;
        else if (keyword.search_volume >= 100)
            score += 10;
        // Position improvement potential (35%)
        if (keyword.avg_position > 20)
            score += 35;
        else if (keyword.avg_position > 10)
            score += 25;
        else if (keyword.avg_position > 5)
            score += 15;
        // Competition level (15%)
        if (keyword.competition < 0.3)
            score += 15;
        else if (keyword.competition < 0.6)
            score += 10;
        else
            score += 5;
        // CPC indicates commercial value (10%)
        if (keyword.cpc >= 5)
            score += 10;
        else if (keyword.cpc >= 2)
            score += 7;
        else if (keyword.cpc >= 0.5)
            score += 5;
        return Math.min(100, score);
    }
}
exports.LabsService = LabsService;
