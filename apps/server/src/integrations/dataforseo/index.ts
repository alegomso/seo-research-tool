import { DataForSEOClient, DataForSEOCredentials } from './client.js';
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

export class DataForSEOService {
  private client: DataForSEOClient;
  public serp: SerpService;
  public keywords: KeywordsService;
  public labs: LabsService;

  private taskQueue: Map<string, TaskStatus> = new Map();
  private rateLimiter: {
    requestsThisMinute: number;
    requestsThisHour: number;
    lastMinuteReset: Date;
    lastHourReset: Date;
  };

  constructor(options: DataForSEOServiceOptions = {}) {
    this.client = new DataForSEOClient(options.credentials);
    this.serp = new SerpService(this.client);
    this.keywords = new KeywordsService(this.client);
    this.labs = new LabsService(this.client);

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
  async validateConnection(): Promise<{
    isValid: boolean;
    accountInfo?: any;
    error?: string;
  }> {
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
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Rate limiting check
  private checkRateLimit(): boolean {
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
  async submitTask(
    taskType: 'serp_organic' | 'serp_maps' | 'keywords_volume' | 'keywords_trends' |
              'keywords_ideas' | 'competitors' | 'ranked_keywords' | 'keyword_suggestions',
    data: any,
    options: { priority?: 'high' | 'normal' | 'low' } = {}
  ): Promise<string> {
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
        const taskStatus: TaskStatus = {
          id: task.id,
          status: 'pending',
          cost: task.cost,
          createdAt: new Date(),
        };

        this.taskQueue.set(task.id, taskStatus);
        return task.id;
      }

      throw new Error('No task ID returned from DataForSEO');
    } catch (error) {
      throw new Error(`Failed to submit ${taskType} task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get task status and results
  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    return this.taskQueue.get(taskId) || null;
  }

  // Get task result with automatic type detection
  async getTaskResult(taskId: string): Promise<any> {
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
          } else if (this.client.hasTaskError(task)) {
            taskStatus.status = 'error';
            taskStatus.error = task.status_message;
          } else {
            taskStatus.status = 'in_progress';
          }

          this.taskQueue.set(taskId, taskStatus);
          return result;
        }
      } catch (error) {
        // Continue to next endpoint
        continue;
      }
    }

    throw new Error('Task result not found in any endpoint');
  }

  // Monitor tasks and update their status
  private startTaskMonitoring(): void {
    setInterval(async () => {
      const pendingTasks = Array.from(this.taskQueue.entries())
        .filter(([_, status]) => status.status === 'pending' || status.status === 'in_progress');

      for (const [taskId, status] of pendingTasks) {
        try {
          await this.getTaskResult(taskId);
        } catch (error) {
          // Task might not be ready yet, continue monitoring
          continue;
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Bulk task management
  async submitBulkTasks(
    tasks: Array<{
      type: string;
      data: any;
      priority?: 'high' | 'normal' | 'low';
    }>
  ): Promise<string[]> {
    const taskIds: string[] = [];

    for (const task of tasks) {
      try {
        const taskId = await this.submitTask(task.type as any, task.data, { priority: task.priority });
        taskIds.push(taskId);
      } catch (error) {
        console.error(`Failed to submit bulk task ${task.type}:`, error);
        // Continue with other tasks
      }
    }

    return taskIds;
  }

  // Wait for tasks to complete
  async waitForTasks(
    taskIds: string[],
    options: {
      timeout?: number; // milliseconds
      checkInterval?: number; // milliseconds
    } = {}
  ): Promise<{ [taskId: string]: any }> {
    const { timeout = 300000, checkInterval = 5000 } = options; // 5 minute default timeout
    const startTime = Date.now();
    const results: { [taskId: string]: any } = {};

    while (Object.keys(results).length < taskIds.length) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for tasks to complete');
      }

      for (const taskId of taskIds) {
        if (results[taskId]) continue; // Already completed

        try {
          const result = await this.getTaskResult(taskId);
          const taskStatus = this.taskQueue.get(taskId);

          if (taskStatus?.status === 'completed') {
            results[taskId] = result;
          } else if (taskStatus?.status === 'error') {
            results[taskId] = { error: taskStatus.error };
          }
        } catch (error) {
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
  } {
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
  cleanupCompletedTasks(olderThanHours: number = 24): number {
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

// Export all types and services
export * from './client.js';
export * from './serp.js';
export * from './keywords.js';
export * from './labs.js';
export { DataForSEOService as default };