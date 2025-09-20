import { OpenAIClient, AIInsightRequest, AIInsightResponse } from './client.js';
import { PromptTemplateEngine, PROMPT_TEMPLATES } from './templates.js';

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

export class AIService {
  private client: OpenAIClient;
  private jobs: Map<string, AIAnalysisJob> = new Map();

  constructor(apiKey?: string) {
    this.client = new OpenAIClient(apiKey);
  }

  // Generate insights using templates or direct analysis
  async generateAnalysis(
    userId: string,
    request: AnalysisRequest,
    projectId?: string
  ): Promise<string> {
    const jobId = this.generateJobId();

    const job: AIAnalysisJob = {
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
  async generateContentBrief(
    userId: string,
    keyword: string,
    serpData: any,
    keywordData: any,
    options: {
      wordCount?: number;
      contentType?: 'blog' | 'landing' | 'product' | 'guide';
      targetAudience?: string;
    } = {},
    projectId?: string
  ): Promise<string> {
    const jobId = this.generateJobId();

    const job: AIAnalysisJob = {
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
  async generateTechnicalAudit(
    userId: string,
    siteData: any,
    performanceData: any,
    projectId?: string
  ): Promise<string> {
    const jobId = this.generateJobId();

    const job: AIAnalysisJob = {
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
  async getJobStatus(jobId: string, userId: string): Promise<AIAnalysisJob | null> {
    const job = this.jobs.get(jobId);
    if (!job || job.userId !== userId) {
      return null;
    }
    return job;
  }

  // Get all jobs for a user
  getUserJobs(userId: string, projectId?: string): AIAnalysisJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId && (!projectId || job.projectId === projectId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Process insight generation job
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    this.updateJobStatus(jobId, 'processing');

    try {
      const request = job.input as AnalysisRequest;
      let result: AIInsightResponse;

      if (request.templateId) {
        // Use template-based analysis
        result = await this.processTemplateAnalysis(request);
      } else {
        // Use direct insight generation
        const aiRequest: AIInsightRequest = {
          type: request.type,
          data: request.data,
          context: request.context,
          options: request.options,
        };
        result = await this.client.generateInsights(aiRequest);
      }

      this.updateJobStatus(jobId, 'completed', result);
    } catch (error) {
      throw error;
    }
  }

  // Process template-based analysis
  private async processTemplateAnalysis(request: AnalysisRequest): Promise<AIInsightResponse> {
    if (!request.templateId) {
      throw new Error('Template ID required for template analysis');
    }

    const template = PromptTemplateEngine.getTemplate(request.templateId);
    if (!template) {
      throw new Error(`Template ${request.templateId} not found`);
    }

    // Validate template variables
    const validation = PromptTemplateEngine.validateTemplateVariables(request.templateId, request.data);
    if (!validation.isValid) {
      throw new Error(`Missing template variables: ${validation.missingVariables.join(', ')}`);
    }

    // Render the prompt
    const prompt = PromptTemplateEngine.renderPrompt(request.templateId, request.data);

    // Create AI request
    const aiRequest: AIInsightRequest = {
      type: request.type,
      data: { customPrompt: prompt },
      context: request.context,
      options: request.options,
    };

    return await this.client.generateInsights(aiRequest);
  }

  // Process content brief job
  private async processContentBrief(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    this.updateJobStatus(jobId, 'processing');

    try {
      const { keyword, serpData, keywordData, options } = job.input;
      const result = await this.client.generateContentBrief(keyword, serpData, keywordData, options);
      this.updateJobStatus(jobId, 'completed', result);
    } catch (error) {
      throw error;
    }
  }

  // Process technical audit job
  private async processTechnicalAudit(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    this.updateJobStatus(jobId, 'processing');

    try {
      const { siteData, performanceData } = job.input;
      const result = await this.client.generateTechnicalRecommendations(siteData, performanceData);
      this.updateJobStatus(jobId, 'completed', result);
    } catch (error) {
      throw error;
    }
  }

  // Update job status
  private updateJobStatus(
    jobId: string,
    status: AIAnalysisJob['status'],
    output?: any,
    error?: string
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = status;
    if (output) job.output = output;
    if (error) job.error = error;
    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date();
    }

    this.jobs.set(jobId, job);
  }

  // Generate unique job ID
  private generateJobId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Batch analysis for multiple keywords/competitors
  async generateBatchAnalysis(
    userId: string,
    requests: AnalysisRequest[],
    projectId?: string
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const request of requests) {
      try {
        const jobId = await this.generateAnalysis(userId, request, projectId);
        jobIds.push(jobId);
      } catch (error) {
        console.error('Failed to create batch analysis job:', error);
        // Continue with other jobs
      }
    }

    return jobIds;
  }

  // Wait for multiple jobs to complete
  async waitForJobs(
    jobIds: string[],
    userId: string,
    options: {
      timeout?: number; // milliseconds
      checkInterval?: number; // milliseconds
    } = {}
  ): Promise<{ [jobId: string]: AIAnalysisJob }> {
    const { timeout = 300000, checkInterval = 2000 } = options; // 5 minute default timeout
    const startTime = Date.now();
    const results: { [jobId: string]: AIAnalysisJob } = {};

    while (Object.keys(results).length < jobIds.length) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for AI analysis jobs to complete');
      }

      for (const jobId of jobIds) {
        if (results[jobId]) continue; // Already completed

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
    return PromptTemplateEngine.listTemplates();
  }

  // Validate template usage
  validateTemplate(templateId: string, data: any) {
    return PromptTemplateEngine.validateTemplateVariables(templateId, data);
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    return await this.client.testConnection();
  }

  // Get usage statistics
  getUsageStats(): {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    processingJobs: number;
    averageProcessingTime: number;
    totalTokensUsed: number;
    estimatedCost: number;
  } {
    const jobs = Array.from(this.jobs.values());
    const completed = jobs.filter(j => j.status === 'completed');
    const failed = jobs.filter(j => j.status === 'failed');
    const processing = jobs.filter(j => j.status === 'processing');

    const processingTimes = completed
      .filter(j => j.completedAt && j.createdAt)
      .map(j => (j.completedAt!.getTime() - j.createdAt.getTime()) / 1000);

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
  cleanupCompletedJobs(olderThanHours: number = 48): number {
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

// Export types and main service
export * from './client.js';
export * from './templates.js';
export { AIService as default };