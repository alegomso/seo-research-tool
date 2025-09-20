import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, QueryType, TaskStatus } from '@prisma/client';
import DataForSEOService from '../../integrations/dataforseo/index.js';
import AIService from '../../integrations/openai/index.js';

const prisma = new PrismaClient();
const dataForSEOService = new DataForSEOService();
const aiService = new AIService();

interface KeywordDiscoveryRequest {
  seedKeywords: string[];
  location: string;
  language: string;
  includeQuestions: boolean;
  includeLongTail: boolean;
  minSearchVolume: number;
  maxKeywordDifficulty: number;
  analysisDepth: 'quick' | 'standard' | 'comprehensive';
  projectId?: string;
}

interface KeywordDiscoveryBody {
  Body: KeywordDiscoveryRequest;
}

export default async function keywordDiscoveryRoutes(fastify: FastifyInstance) {
  // Start keyword discovery process
  fastify.post<KeywordDiscoveryBody>('/keyword-discovery', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const {
        seedKeywords,
        location,
        language,
        includeQuestions,
        includeLongTail,
        minSearchVolume,
        maxKeywordDifficulty,
        analysisDepth,
        projectId
      } = request.body as KeywordDiscoveryRequest;

      // Validate input
      if (!seedKeywords || seedKeywords.length === 0) {
        return reply.status(400).send({ error: 'At least one seed keyword is required' });
      }

      if (seedKeywords.length > 5) {
        return reply.status(400).send({ error: 'Maximum 5 seed keywords allowed' });
      }

      // Create query record
      const query = await prisma.query.create({
        data: {
          userId,
          projectId,
          type: QueryType.KEYWORD_DISCOVERY,
          parameters: {
            seedKeywords,
            location,
            language,
            includeQuestions,
            includeLongTail,
            minSearchVolume,
            maxKeywordDifficulty,
            analysisDepth
          },
          status: TaskStatus.PENDING,
        }
      });

      // Start the keyword discovery process asynchronously
      processKeywordDiscovery(query.id).catch(error => {
        console.error(`Keyword discovery failed for query ${query.id}:`, error);
        updateQueryStatus(query.id, TaskStatus.FAILED, { error: error.message });
      });

      return reply.send({
        queryId: query.id,
        status: 'started',
        message: 'Keyword discovery process has been started'
      });

    } catch (error) {
      console.error('Keyword discovery request error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get keyword discovery results
  fastify.get('/keyword-discovery/:queryId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const { queryId } = request.params as { queryId: string };

      const query = await prisma.query.findFirst({
        where: {
          id: queryId,
          userId,
          type: QueryType.KEYWORD_DISCOVERY
        },
        include: {
          tasks: {
            include: {
              datasets: true
            }
          },
          briefs: true
        }
      });

      if (!query) {
        return reply.status(404).send({ error: 'Query not found' });
      }

      return reply.send({
        query: {
          id: query.id,
          status: query.status,
          parameters: query.parameters,
          createdAt: query.createdAt,
          completedAt: query.completedAt,
          error: query.error
        },
        tasks: query.tasks.map(task => ({
          id: task.id,
          type: task.type,
          status: task.status,
          progress: task.progress,
          result: task.result,
          datasets: task.datasets
        })),
        insights: query.briefs
      });

    } catch (error) {
      console.error('Get keyword discovery error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get keyword discovery status
  fastify.get('/keyword-discovery/:queryId/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const { queryId } = request.params as { queryId: string };

      const query = await prisma.query.findFirst({
        where: {
          id: queryId,
          userId,
          type: QueryType.KEYWORD_DISCOVERY
        },
        select: {
          id: true,
          status: true,
          progress: true,
          error: true,
          tasks: {
            select: {
              type: true,
              status: true,
              progress: true
            }
          }
        }
      });

      if (!query) {
        return reply.status(404).send({ error: 'Query not found' });
      }

      return reply.send(query);

    } catch (error) {
      console.error('Get keyword discovery status error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

// Process keyword discovery workflow
async function processKeywordDiscovery(queryId: string) {
  try {
    const query = await prisma.query.findUnique({
      where: { id: queryId },
      include: { user: true }
    });

    if (!query) {
      throw new Error('Query not found');
    }

    const params = query.parameters as KeywordDiscoveryRequest;
    await updateQueryStatus(queryId, TaskStatus.IN_PROGRESS, null, 10);

    // Step 1: Get keyword suggestions from DataForSEO
    const keywordIdeasTask = await prisma.task.create({
      data: {
        queryId,
        type: 'KEYWORD_IDEAS',
        status: TaskStatus.PENDING,
        parameters: {
          keywords: params.seedKeywords,
          location: params.location,
          language: params.language
        }
      }
    });

    // Submit keyword ideas task
    const keywordTaskId = await dataForSEOService.submitTask('keywords_ideas', [{
      seed_keywords: params.seedKeywords,
      location_name: params.location,
      language_name: params.language
    }]);

    await updateTaskStatus(keywordIdeasTask.id, TaskStatus.IN_PROGRESS, { dataForSEOTaskId: keywordTaskId });
    await updateQueryStatus(queryId, TaskStatus.IN_PROGRESS, null, 30);

    // Step 2: Get search volumes for seed keywords
    const volumeTask = await prisma.task.create({
      data: {
        queryId,
        type: 'SEARCH_VOLUME',
        status: TaskStatus.PENDING,
        parameters: {
          keywords: params.seedKeywords,
          location: params.location,
          language: params.language
        }
      }
    });

    const volumeTaskId = await dataForSEOService.submitTask('keywords_volume', [{
      keywords: params.seedKeywords,
      location_name: params.location,
      language_name: params.language
    }]);

    await updateTaskStatus(volumeTask.id, TaskStatus.IN_PROGRESS, { dataForSEOTaskId: volumeTaskId });
    await updateQueryStatus(queryId, TaskStatus.IN_PROGRESS, null, 50);

    // Step 3: Wait for DataForSEO tasks to complete
    const dataForSEOResults = await dataForSEOService.waitForTasks([keywordTaskId, volumeTaskId], {
      timeout: 600000, // 10 minutes
      checkInterval: 10000 // 10 seconds
    });

    // Process keyword ideas results
    const keywordIdeasResult = dataForSEOResults[keywordTaskId];
    if (keywordIdeasResult.error) {
      throw new Error(`Keyword ideas task failed: ${keywordIdeasResult.error}`);
    }

    // Process search volume results
    const volumeResult = dataForSEOResults[volumeTaskId];
    if (volumeResult.error) {
      throw new Error(`Search volume task failed: ${volumeResult.error}`);
    }

    await updateQueryStatus(queryId, TaskStatus.IN_PROGRESS, null, 70);

    // Step 4: Process and filter results
    const processedKeywords = await processKeywordResults(
      keywordIdeasResult,
      volumeResult,
      params
    );

    // Store processed results
    const dataset = await prisma.dataset.create({
      data: {
        taskId: keywordIdeasTask.id,
        type: 'KEYWORD_LIST',
        data: processedKeywords,
        metadata: {
          totalKeywords: processedKeywords.length,
          filters: {
            minSearchVolume: params.minSearchVolume,
            maxKeywordDifficulty: params.maxKeywordDifficulty,
            includeQuestions: params.includeQuestions,
            includeLongTail: params.includeLongTail
          }
        }
      }
    });

    await updateTaskStatus(keywordIdeasTask.id, TaskStatus.COMPLETED, { datasetId: dataset.id });
    await updateTaskStatus(volumeTask.id, TaskStatus.COMPLETED);
    await updateQueryStatus(queryId, TaskStatus.IN_PROGRESS, null, 85);

    // Step 5: Generate AI insights if requested
    if (params.analysisDepth === 'standard' || params.analysisDepth === 'comprehensive') {
      const aiJobId = await aiService.generateAnalysis(query.userId, {
        type: 'keyword_analysis',
        templateId: 'keyword_opportunity_analysis',
        data: {
          keywordData: processedKeywords,
          seedKeywords: params.seedKeywords,
          filters: {
            minSearchVolume: params.minSearchVolume,
            maxKeywordDifficulty: params.maxKeywordDifficulty
          }
        },
        context: {
          targetAudience: 'SEO professionals and marketers',
          businessGoals: ['increase organic traffic', 'improve search rankings']
        },
        options: {
          length: params.analysisDepth === 'comprehensive' ? 'comprehensive' : 'detailed',
          focus: ['quick wins', 'long-tail opportunities', 'content gaps']
        }
      }, queryId);

      // Wait for AI analysis to complete
      const aiResult = await aiService.waitForJobs([aiJobId], query.userId, {
        timeout: 120000 // 2 minutes
      });

      if (aiResult[aiJobId] && aiResult[aiJobId].status === 'completed') {
        await prisma.brief.create({
          data: {
            queryId,
            type: 'AI_INSIGHTS',
            content: aiResult[aiJobId].output,
            metadata: {
              analysisType: 'keyword_discovery',
              aiModel: 'gpt-4-turbo-preview',
              templateUsed: 'keyword_opportunity_analysis'
            }
          }
        });
      }
    }

    // Complete the query
    await updateQueryStatus(queryId, TaskStatus.COMPLETED, null, 100);

  } catch (error) {
    console.error(`Keyword discovery processing error for query ${queryId}:`, error);
    await updateQueryStatus(queryId, TaskStatus.FAILED, { error: error.message });
  }
}

// Process and filter keyword results
async function processKeywordResults(
  keywordIdeasResult: any,
  volumeResult: any,
  params: KeywordDiscoveryRequest
) {
  const keywords = [];

  // Extract keywords from ideas result
  if (keywordIdeasResult.tasks?.[0]?.result) {
    const ideas = keywordIdeasResult.tasks[0].result;

    for (const item of ideas) {
      if (item.keywords) {
        keywords.push(...item.keywords.map((kw: any) => ({
          keyword: kw.keyword,
          searchVolume: kw.search_volume || 0,
          cpc: kw.cpc || 0,
          competition: kw.competition || 0,
          competitionLevel: kw.competition_level || 'UNKNOWN',
          categories: kw.categories || [],
          monthlySearches: kw.monthly_searches || []
        })));
      }
    }
  }

  // Add seed keywords with volume data
  if (volumeResult.tasks?.[0]?.result) {
    const volumes = volumeResult.tasks[0].result;

    for (const item of volumes) {
      if (item.keywords) {
        keywords.push(...item.keywords.map((kw: any) => ({
          keyword: kw.keyword,
          searchVolume: kw.search_volume || 0,
          cpc: kw.cpc || 0,
          competition: kw.competition || 0,
          competitionLevel: kw.competition_level || 'UNKNOWN',
          categories: kw.categories || [],
          monthlySearches: kw.monthly_searches || [],
          isSeedKeyword: true
        })));
      }
    }
  }

  // Filter and process keywords
  const filteredKeywords = keywords.filter(keyword => {
    // Apply volume filter
    if (keyword.searchVolume < params.minSearchVolume) return false;

    // Apply difficulty filter (if available)
    if (keyword.keywordDifficulty && keyword.keywordDifficulty > params.maxKeywordDifficulty) {
      return false;
    }

    // Filter questions if not included
    if (!params.includeQuestions && isQuestionKeyword(keyword.keyword)) {
      return false;
    }

    // Filter long-tail if not included
    if (!params.includeLongTail && isLongTailKeyword(keyword.keyword)) {
      return false;
    }

    return true;
  });

  // Add analysis metadata
  return filteredKeywords.map(keyword => ({
    ...keyword,
    intent: detectIntent(keyword.keyword),
    trend: calculateTrend(keyword.monthlySearches),
    opportunity: calculateOpportunityScore(keyword, params)
  }));
}

// Helper functions
function isQuestionKeyword(keyword: string): boolean {
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'do', 'does', 'is', 'are'];
  return questionWords.some(word => keyword.toLowerCase().startsWith(word + ' '));
}

function isLongTailKeyword(keyword: string): boolean {
  return keyword.split(' ').length >= 3;
}

function detectIntent(keyword: string): string {
  const commercial = ['buy', 'purchase', 'price', 'cost', 'cheap', 'discount', 'deal'];
  const transactional = ['order', 'shop', 'store', 'cart', 'checkout', 'payment'];
  const navigational = ['login', 'account', 'dashboard', 'website', 'official'];

  const lowerKeyword = keyword.toLowerCase();

  if (commercial.some(word => lowerKeyword.includes(word))) return 'commercial';
  if (transactional.some(word => lowerKeyword.includes(word))) return 'transactional';
  if (navigational.some(word => lowerKeyword.includes(word))) return 'navigational';

  return 'informational';
}

function calculateTrend(monthlySearches?: Array<{ month: number; volume: number }>): string {
  if (!monthlySearches || monthlySearches.length < 2) return 'stable';

  const recent = monthlySearches.slice(-3);
  const earlier = monthlySearches.slice(0, 3);

  const recentAvg = recent.reduce((sum, m) => sum + m.volume, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, m) => sum + m.volume, 0) / earlier.length;

  const changePercent = (recentAvg - earlierAvg) / earlierAvg;

  if (changePercent > 0.1) return 'up';
  if (changePercent < -0.1) return 'down';
  return 'stable';
}

function calculateOpportunityScore(keyword: any, params: KeywordDiscoveryRequest): number {
  let score = 0;

  // Search volume score (0-40 points)
  if (keyword.searchVolume >= 10000) score += 40;
  else if (keyword.searchVolume >= 5000) score += 30;
  else if (keyword.searchVolume >= 1000) score += 20;
  else if (keyword.searchVolume >= 100) score += 10;

  // Competition score (0-30 points) - lower is better
  if (keyword.competitionLevel === 'LOW') score += 30;
  else if (keyword.competitionLevel === 'MEDIUM') score += 15;
  else if (keyword.competitionLevel === 'HIGH') score += 5;

  // Intent score (0-20 points)
  if (keyword.intent === 'transactional') score += 20;
  else if (keyword.intent === 'commercial') score += 15;
  else if (keyword.intent === 'informational') score += 10;

  // Trend score (0-10 points)
  if (keyword.trend === 'up') score += 10;
  else if (keyword.trend === 'stable') score += 5;

  return Math.min(100, score);
}

// Update query status
async function updateQueryStatus(queryId: string, status: TaskStatus, error?: any, progress?: number) {
  await prisma.query.update({
    where: { id: queryId },
    data: {
      status,
      progress,
      error,
      completedAt: status === TaskStatus.COMPLETED || status === TaskStatus.FAILED ? new Date() : undefined
    }
  });
}

// Update task status
async function updateTaskStatus(taskId: string, status: TaskStatus, result?: any, progress?: number) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      progress,
      result,
      completedAt: status === TaskStatus.COMPLETED || status === TaskStatus.FAILED ? new Date() : undefined
    }
  });
}