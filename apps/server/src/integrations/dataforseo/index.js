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
exports.default = exports.DataForSEOService = void 0;
const client_js_1 = require("./client.js");
const serp_js_1 = require("./serp.js");
const keywords_js_1 = require("./keywords.js");
const labs_js_1 = require("./labs.js");
class DataForSEOService {
    constructor(options = {}) {
        this.taskQueue = new Map();
        this.client = new client_js_1.DataForSEOClient(options.credentials);
        this.serp = new serp_js_1.SerpService(this.client);
        this.keywords = new keywords_js_1.KeywordsService(this.client);
        this.labs = new labs_js_1.LabsService(this.client);
        this.rateLimiter = {
            requestsThisMinute: 0,
            requestsThisHour: 0,
            lastMinuteReset: new Date(),
            lastHourReset: new Date(),
        };
        // Set up periodic task checking
        this.startTaskMonitoring();
    }
    // Health check and account validation
    async validateConnection() {
        try {
            const isHealthy = await this.client.healthCheck();
            if (!isHealthy) {
                return { isValid: false, error: 'Connection failed' };
            }
            const accountInfo = await this.client.getAccountInfo();
            return {
                isValid: true,
                accountInfo: accountInfo.tasks?.[0]?.result?.[0] || accountInfo,
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    // Rate limiting check
    checkRateLimit() {
        const now = new Date();
        // Reset counters if needed
        if (now.getTime() - this.rateLimiter.lastMinuteReset.getTime() >= 60000) {
            this.rateLimiter.requestsThisMinute = 0;
            this.rateLimiter.lastMinuteReset = now;
        }
        if (now.getTime() - this.rateLimiter.lastHourReset.getTime() >= 3600000) {
            this.rateLimiter.requestsThisHour = 0;
            this.rateLimiter.lastHourReset = now;
        }
        // Check limits (conservative defaults)
        const maxPerMinute = 30; // DataForSEO typically allows 2000/hour
        const maxPerHour = 1500;
        if (this.rateLimiter.requestsThisMinute >= maxPerMinute ||
            this.rateLimiter.requestsThisHour >= maxPerHour) {
            return false;
        }
        this.rateLimiter.requestsThisMinute++;
        this.rateLimiter.requestsThisHour++;
        return true;
    }
    // Generic task submission with queue management
    async submitTask(taskType, data, options = {}) {
        if (!this.checkRateLimit()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        let response;
        try {
            switch (taskType) {
                case 'serp_organic':
                    response = await this.serp.postGoogleOrganicTask(data);
                    break;
                case 'serp_maps':
                    response = await this.serp.postGoogleMapsTask(data);
                    break;
                case 'keywords_volume':
                    response = await this.keywords.postGoogleAdsKeywordsTask(data);
                    break;
                case 'keywords_trends':
                    response = await this.keywords.postGoogleTrendsTask(data);
                    break;
                case 'keywords_ideas':
                    response = await this.keywords.postKeywordIdeasTask(data);
                    break;
                case 'competitors':
                    response = await this.labs.postDomainCompetitorsTask(data);
                    break;
                case 'ranked_keywords':
                    response = await this.labs.postRankedKeywordsTask(data);
                    break;
                case 'keyword_suggestions':
                    response = await this.labs.postKeywordSuggestionsTask(data);
                    break;
                default:
                    throw new Error(`Unknown task type: ${taskType}`);
            }
            // Store task in queue
            if (response.tasks && response.tasks.length > 0) {
                const task = response.tasks[0];
                const taskStatus = {
                    id: task.id,
                    status: 'pending',
                    cost: task.cost,
                    createdAt: new Date(),
                };
                this.taskQueue.set(task.id, taskStatus);
                return task.id;
            }
            throw new Error('No task ID returned from DataForSEO');
        }
        catch (error) {
            throw new Error(`Failed to submit ${taskType} task: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Get task status and results
    async getTaskStatus(taskId) {
        return this.taskQueue.get(taskId) || null;
    }
    // Get task result with automatic type detection
    async getTaskResult(taskId) {
        const taskStatus = this.taskQueue.get(taskId);
        if (!taskStatus) {
            throw new Error('Task not found');
        }
        if (taskStatus.status === 'completed' && taskStatus.result) {
            return taskStatus.result;
        }
        // Try to fetch result from various endpoints
        const endpoints = [
            () => this.serp.getGoogleOrganicTaskResult(taskId),
            () => this.serp.getGoogleMapsTaskResult(taskId),
            () => this.keywords.getGoogleAdsKeywordsTaskResult(taskId),
            () => this.keywords.getGoogleTrendsTaskResult(taskId),
            () => this.keywords.getKeywordIdeasTaskResult(taskId),
            () => this.labs.getDomainCompetitorsTaskResult(taskId),
            () => this.labs.getRankedKeywordsTaskResult(taskId),
            () => this.labs.getKeywordSuggestionsTaskResult(taskId),
        ];
        for (const getResult of endpoints) {
            try {
                const result = await getResult();
                if (result.tasks && result.tasks.length > 0) {
                    const task = result.tasks[0];
                    // Update task status
                    if (this.client.isTaskCompleted(task)) {
                        taskStatus.status = 'completed';
                        taskStatus.result = task.result;
                        taskStatus.completedAt = new Date();
                    }
                    else if (this.client.hasTaskError(task)) {
                        taskStatus.status = 'error';
                        taskStatus.error = task.status_message;
                    }
                    else {
                        taskStatus.status = 'in_progress';
                    }
                    this.taskQueue.set(taskId, taskStatus);
                    return result;
                }
            }
            catch (error) {
                // Continue to next endpoint
                continue;
            }
        }
        throw new Error('Task result not found in any endpoint');
    }
    // Monitor tasks and update their status
    startTaskMonitoring() {
        setInterval(async () => {
            const pendingTasks = Array.from(this.taskQueue.entries())
                .filter(([_, status]) => status.status === 'pending' || status.status === 'in_progress');
            for (const [taskId, status] of pendingTasks) {
                try {
                    await this.getTaskResult(taskId);
                }
                catch (error) {
                    // Task might not be ready yet, continue monitoring
                    continue;
                }
            }
        }, 30000); // Check every 30 seconds
    }
    // Bulk task management
    async submitBulkTasks(tasks) {
        const taskIds = [];
        for (const task of tasks) {
            try {
                const taskId = await this.submitTask(task.type, task.data, { priority: task.priority });
                taskIds.push(taskId);
            }
            catch (error) {
                console.error(`Failed to submit bulk task ${task.type}:`, error);
                // Continue with other tasks
            }
        }
        return taskIds;
    }
    // Wait for tasks to complete
    async waitForTasks(taskIds, options = {}) {
        const { timeout = 300000, checkInterval = 5000 } = options; // 5 minute default timeout
        const startTime = Date.now();
        const results = {};
        while (Object.keys(results).length < taskIds.length) {
            if (Date.now() - startTime > timeout) {
                throw new Error('Timeout waiting for tasks to complete');
            }
            for (const taskId of taskIds) {
                if (results[taskId])
                    continue; // Already completed
                try {
                    const result = await this.getTaskResult(taskId);
                    const taskStatus = this.taskQueue.get(taskId);
                    if (taskStatus?.status === 'completed') {
                        results[taskId] = result;
                    }
                    else if (taskStatus?.status === 'error') {
                        results[taskId] = { error: taskStatus.error };
                    }
                }
                catch (error) {
                    // Task not ready yet
                    continue;
                }
            }
            if (Object.keys(results).length < taskIds.length) {
                await new Promise(resolve => setTimeout(resolve, checkInterval));
            }
        }
        return results;
    }
    // Get usage statistics
    getUsageStats() {
        const tasks = Array.from(this.taskQueue.values());
        const now = new Date();
        return {
            tasksInQueue: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            erroredTasks: tasks.filter(t => t.status === 'error').length,
            pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
            rateLimitStatus: {
                requestsThisMinute: this.rateLimiter.requestsThisMinute,
                requestsThisHour: this.rateLimiter.requestsThisHour,
                minuteResetIn: 60000 - (now.getTime() - this.rateLimiter.lastMinuteReset.getTime()),
                hourResetIn: 3600000 - (now.getTime() - this.rateLimiter.lastHourReset.getTime()),
            },
        };
    }
    // Clean up completed tasks (memory management)
    cleanupCompletedTasks(olderThanHours = 24) {
        const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        let cleaned = 0;
        for (const [taskId, status] of this.taskQueue.entries()) {
            if (status.status === 'completed' &&
                status.completedAt &&
                status.completedAt < cutoff) {
                this.taskQueue.delete(taskId);
                cleaned++;
            }
        }
        return cleaned;
    }
}
exports.DataForSEOService = DataForSEOService;
exports.default = DataForSEOService;
// Export all types and services
__exportStar(require("./client.js"), exports);
__exportStar(require("./serp.js"), exports);
__exportStar(require("./keywords.js"), exports);
__exportStar(require("./labs.js"), exports);
