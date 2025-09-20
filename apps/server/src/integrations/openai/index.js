"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.AIService = void 0;
const client_js_1 = require("./client.js");
const templates_js_1 = require("./templates.js");
class AIService {
    constructor(apiKey) {
        this.jobs = new Map();
        this.client = new client_js_1.OpenAIClient(apiKey);
    }
    // Generate insights using templates or direct analysis
    async generateAnalysis(userId, request, projectId) {
        const jobId = this.generateJobId();
        const job = {
            id: jobId,
            userId,
            projectId,
            type: request.templateId ? 'template_analysis' : 'insight_generation',
            status: 'pending',
            input: request,
            createdAt: new Date(),
        };
        this.jobs.set(jobId, job);
        // Process job asynchronously
        this.processJob(jobId).catch(error => {
            console.error(`Job ${jobId} failed:`, error);
            this.updateJobStatus(jobId, 'failed', undefined, error.message);
        });
        return jobId;
    }
    // Generate content brief
    async generateContentBrief(userId, keyword, serpData, keywordData, options = {}, projectId) {
        const jobId = this.generateJobId();
        const job = {
            id: jobId,
            userId,
            projectId,
            type: 'content_brief',
            status: 'pending',
            input: { keyword, serpData, keywordData, options },
            createdAt: new Date(),
        };
        this.jobs.set(jobId, job);
        this.processContentBrief(jobId).catch(error => {
            console.error(`Content brief job ${jobId} failed:`, error);
            this.updateJobStatus(jobId, 'failed', undefined, error.message);
        });
        return jobId;
    }
    // Generate technical SEO audit
    async generateTechnicalAudit(userId, siteData, performanceData, projectId) {
        const jobId = this.generateJobId();
        const job = {
            id: jobId,
            userId,
            projectId,
            type: 'technical_audit',
            status: 'pending',
            input: { siteData, performanceData },
            createdAt: new Date(),
        };
        this.jobs.set(jobId, job);
        this.processTechnicalAudit(jobId).catch(error => {
            console.error(`Technical audit job ${jobId} failed:`, error);
            this.updateJobStatus(jobId, 'failed', undefined, error.message);
        });
        return jobId;
    }
    // Get job status and results
    async getJobStatus(jobId, userId) {
        const job = this.jobs.get(jobId);
        if (!job || job.userId !== userId) {
            return null;
        }
        return job;
    }
    // Get all jobs for a user
    getUserJobs(userId, projectId) {
        return Array.from(this.jobs.values())
            .filter(job => job.userId === userId && (!projectId || job.projectId === projectId))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    // Process insight generation job
    async processJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            throw new Error('Job not found');
        this.updateJobStatus(jobId, 'processing');
        try {
            const request = job.input;
            let result;
            if (request.templateId) {
                // Use template-based analysis
                result = await this.processTemplateAnalysis(request);
            }
            else {
                // Use direct insight generation
                const aiRequest = {
                    type: request.type,
                    data: request.data,
                    context: request.context,
                    options: request.options,
                };
                result = await this.client.generateInsights(aiRequest);
            }
            this.updateJobStatus(jobId, 'completed', result);
        }
        catch (error) {
            throw error;
        }
    }
    // Process template-based analysis
    async processTemplateAnalysis(request) {
        if (!request.templateId) {
            throw new Error('Template ID required for template analysis');
        }
        const template = templates_js_1.PromptTemplateEngine.getTemplate(request.templateId);
        if (!template) {
            throw new Error(`Template ${request.templateId} not found`);
        }
        // Validate template variables
        const validation = templates_js_1.PromptTemplateEngine.validateTemplateVariables(request.templateId, request.data);
        if (!validation.isValid) {
            throw new Error(`Missing template variables: ${validation.missingVariables.join(', ')}`);
        }
        // Render the prompt
        const prompt = templates_js_1.PromptTemplateEngine.renderPrompt(request.templateId, request.data);
        // Create AI request
        const aiRequest = {
            type: request.type,
            data: { customPrompt: prompt },
            context: request.context,
            options: request.options,
        };
        return await this.client.generateInsights(aiRequest);
    }
    // Process content brief job
    async processContentBrief(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            throw new Error('Job not found');
        this.updateJobStatus(jobId, 'processing');
        try {
            const { keyword, serpData, keywordData, options } = job.input;
            const result = await this.client.generateContentBrief(keyword, serpData, keywordData, options);
            this.updateJobStatus(jobId, 'completed', result);
        }
        catch (error) {
            throw error;
        }
    }
    // Process technical audit job
    async processTechnicalAudit(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            throw new Error('Job not found');
        this.updateJobStatus(jobId, 'processing');
        try {
            const { siteData, performanceData } = job.input;
            const result = await this.client.generateTechnicalRecommendations(siteData, performanceData);
            this.updateJobStatus(jobId, 'completed', result);
        }
        catch (error) {
            throw error;
        }
    }
    // Update job status
    updateJobStatus(jobId, status, output, error) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job.status = status;
        if (output)
            job.output = output;
        if (error)
            job.error = error;
        if (status === 'completed' || status === 'failed') {
            job.completedAt = new Date();
        }
        this.jobs.set(jobId, job);
    }
    // Generate unique job ID
    generateJobId() {
        return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Batch analysis for multiple keywords/competitors
    async generateBatchAnalysis(userId, requests, projectId) {
        const jobIds = [];
        for (const request of requests) {
            try {
                const jobId = await this.generateAnalysis(userId, request, projectId);
                jobIds.push(jobId);
            }
            catch (error) {
                console.error('Failed to create batch analysis job:', error);
                // Continue with other jobs
            }
        }
        return jobIds;
    }
    // Wait for multiple jobs to complete
    async waitForJobs(jobIds, userId, options = {}) {
        const { timeout = 300000, checkInterval = 2000 } = options; // 5 minute default timeout
        const startTime = Date.now();
        const results = {};
        while (Object.keys(results).length < jobIds.length) {
            if (Date.now() - startTime > timeout) {
                throw new Error('Timeout waiting for AI analysis jobs to complete');
            }
            for (const jobId of jobIds) {
                if (results[jobId])
                    continue; // Already completed
                const job = await this.getJobStatus(jobId, userId);
                if (job && (job.status === 'completed' || job.status === 'failed')) {
                    results[jobId] = job;
                }
            }
            if (Object.keys(results).length < jobIds.length) {
                await new Promise(resolve => setTimeout(resolve, checkInterval));
            }
        }
        return results;
    }
    // Get available templates
    getAvailableTemplates() {
        return templates_js_1.PromptTemplateEngine.listTemplates();
    }
    // Validate template usage
    validateTemplate(templateId, data) {
        return templates_js_1.PromptTemplateEngine.validateTemplateVariables(templateId, data);
    }
    // Test API connection
    async testConnection() {
        return await this.client.testConnection();
    }
    // Get usage statistics
    getUsageStats() {
        const jobs = Array.from(this.jobs.values());
        const completed = jobs.filter(j => j.status === 'completed');
        const failed = jobs.filter(j => j.status === 'failed');
        const processing = jobs.filter(j => j.status === 'processing');
        const processingTimes = completed
            .filter(j => j.completedAt && j.createdAt)
            .map(j => (j.completedAt.getTime() - j.createdAt.getTime()) / 1000);
        const avgProcessingTime = processingTimes.length > 0
            ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
            : 0;
        const totalTokens = jobs.reduce((sum, j) => sum + (j.tokensUsed || 0), 0);
        const estimatedCost = jobs.reduce((sum, j) => sum + (j.cost || 0), 0);
        return {
            totalJobs: jobs.length,
            completedJobs: completed.length,
            failedJobs: failed.length,
            processingJobs: processing.length,
            averageProcessingTime: Math.round(avgProcessingTime),
            totalTokensUsed: totalTokens,
            estimatedCost: Math.round(estimatedCost * 100) / 100,
        };
    }
    // Clean up old completed jobs
    cleanupCompletedJobs(olderThanHours = 48) {
        const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        let cleaned = 0;
        for (const [jobId, job] of this.jobs.entries()) {
            if ((job.status === 'completed' || job.status === 'failed') &&
                job.completedAt &&
                job.completedAt < cutoff) {
                this.jobs.delete(jobId);
                cleaned++;
            }
        }
        return cleaned;
    }
}
exports.AIService = AIService;
exports.default = AIService;
// Export types and main service
__exportStar(require("./client.js"), exports);
__exportStar(require("./templates.js"), exports);
