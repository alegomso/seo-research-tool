"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const index_js_1 = __importDefault(require("../../integrations/dataforseo/index.js"));
const index_js_2 = __importDefault(require("../../integrations/openai/index.js"));
const prisma = new client_1.PrismaClient();
const dataForSEOService = new index_js_1.default();
const aiService = new index_js_2.default();
async function competitorResearchRoutes(fastify) {
    // Start competitor research process
    fastify.post('/competitor-research', async (request, reply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ error: 'Authentication required' });
            }
            const { targetDomain, competitorDomains, location, language, analysisType, keywordFilters, contentFilters, reportDepth, projectId } = request.body;
            // Validate input
            if (!targetDomain) {
                return reply.status(400).send({ error: 'Target domain is required' });
            }
            if (!competitorDomains || competitorDomains.length === 0) {
                return reply.status(400).send({ error: 'At least one competitor domain is required' });
            }
            if (competitorDomains.length > 10) {
                return reply.status(400).send({ error: 'Maximum 10 competitor domains allowed' });
            }
            // Create query record
            const query = await prisma.query.create({
                data: {
                    userId,
                    projectId,
                    type: client_1.QueryType.COMPETITOR_RESEARCH,
                    parameters: {
                        targetDomain,
                        competitorDomains,
                        location,
                        language,
                        analysisType,
                        keywordFilters,
                        contentFilters,
                        reportDepth
                    },
                    status: client_1.TaskStatus.PENDING,
                }
            });
            // Start the competitor research process asynchronously
            processCompetitorResearch(query.id).catch(error => {
                console.error(`Competitor research failed for query ${query.id}:`, error);
                updateQueryStatus(query.id, client_1.TaskStatus.FAILED, { error: error.message });
            });
            return reply.send({
                queryId: query.id,
                status: 'started',
                message: 'Competitor research process has been started'
            });
        }
        catch (error) {
            console.error('Competitor research request error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    // Get competitor research results
    fastify.get('/competitor-research/:queryId', async (request, reply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ error: 'Authentication required' });
            }
            const { queryId } = request.params;
            const query = await prisma.query.findFirst({
                where: {
                    id: queryId,
                    userId,
                    type: client_1.QueryType.COMPETITOR_RESEARCH
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
        }
        catch (error) {
            console.error('Get competitor research error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    // Get competitor research status
    fastify.get('/competitor-research/:queryId/status', async (request, reply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ error: 'Authentication required' });
            }
            const { queryId } = request.params;
            const query = await prisma.query.findFirst({
                where: {
                    id: queryId,
                    userId,
                    type: client_1.QueryType.COMPETITOR_RESEARCH
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
        }
        catch (error) {
            console.error('Get competitor research status error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
exports.default = competitorResearchRoutes;
// Process competitor research workflow
async function processCompetitorResearch(queryId) {
    try {
        const query = await prisma.query.findUnique({
            where: { id: queryId },
            include: { user: true }
        });
        if (!query) {
            throw new Error('Query not found');
        }
        const params = query.parameters;
        await updateQueryStatus(queryId, client_1.TaskStatus.IN_PROGRESS, null, 10);
        // Step 1: Get target domain ranking keywords
        const targetKeywordsTask = await prisma.task.create({
            data: {
                queryId,
                type: 'TARGET_KEYWORDS',
                status: client_1.TaskStatus.PENDING,
                parameters: {
                    domain: params.targetDomain,
                    location: params.location,
                    language: params.language
                }
            }
        });
        const targetTaskId = await dataForSEOService.submitTask('ranked_keywords', [{
                target: params.targetDomain,
                location_name: params.location,
                language_name: params.language,
                limit: 5000
            }]);
        await updateTaskStatus(targetKeywordsTask.id, client_1.TaskStatus.IN_PROGRESS, { dataForSEOTaskId: targetTaskId });
        await updateQueryStatus(queryId, client_1.TaskStatus.IN_PROGRESS, null, 25);
        // Step 2: Get competitor domain data
        const competitorTasks = [];
        const competitorTaskIds = [];
        for (const competitorDomain of params.competitorDomains) {
            // Get competitor ranking keywords
            const competitorTask = await prisma.task.create({
                data: {
                    queryId,
                    type: 'COMPETITOR_KEYWORDS',
                    status: client_1.TaskStatus.PENDING,
                    parameters: {
                        domain: competitorDomain,
                        location: params.location,
                        language: params.language
                    }
                }
            });
            const competitorTaskId = await dataForSEOService.submitTask('ranked_keywords', [{
                    target: competitorDomain,
                    location_name: params.location,
                    language_name: params.language,
                    limit: 5000
                }]);
            competitorTasks.push(competitorTask);
            competitorTaskIds.push(competitorTaskId);
            await updateTaskStatus(competitorTask.id, client_1.TaskStatus.IN_PROGRESS, { dataForSEOTaskId: competitorTaskId });
        }
        await updateQueryStatus(queryId, client_1.TaskStatus.IN_PROGRESS, null, 50);
        // Step 3: Get domain competitors analysis
        const competitorsAnalysisTask = await prisma.task.create({
            data: {
                queryId,
                type: 'COMPETITORS_ANALYSIS',
                status: client_1.TaskStatus.PENDING,
                parameters: {
                    target: params.targetDomain,
                    location: params.location,
                    language: params.language
                }
            }
        });
        const competitorsTaskId = await dataForSEOService.submitTask('competitors', [{
                target: params.targetDomain,
                location_name: params.location,
                language_name: params.language,
                limit: 100
            }]);
        await updateTaskStatus(competitorsAnalysisTask.id, client_1.TaskStatus.IN_PROGRESS, { dataForSEOTaskId: competitorsTaskId });
        // Step 4: Wait for all DataForSEO tasks to complete
        const allTaskIds = [targetTaskId, ...competitorTaskIds, competitorsTaskId];
        const dataForSEOResults = await dataForSEOService.waitForTasks(allTaskIds, {
            timeout: 900000,
            checkInterval: 15000 // 15 seconds
        });
        await updateQueryStatus(queryId, client_1.TaskStatus.IN_PROGRESS, null, 75);
        // Step 5: Process and analyze results
        const analysisResults = await processCompetitorAnalysis(dataForSEOResults, targetTaskId, competitorTaskIds, competitorsTaskId, params);
        // Store analysis results
        const analysisDataset = await prisma.dataset.create({
            data: {
                taskId: targetKeywordsTask.id,
                type: 'COMPETITOR_ANALYSIS',
                data: analysisResults,
                metadata: {
                    targetDomain: params.targetDomain,
                    competitorDomains: params.competitorDomains,
                    analysisType: params.analysisType,
                    keywordFilters: params.keywordFilters
                }
            }
        });
        // Update task statuses
        await updateTaskStatus(targetKeywordsTask.id, client_1.TaskStatus.COMPLETED, { datasetId: analysisDataset.id });
        await updateTaskStatus(competitorsAnalysisTask.id, client_1.TaskStatus.COMPLETED);
        for (const task of competitorTasks) {
            await updateTaskStatus(task.id, client_1.TaskStatus.COMPLETED);
        }
        await updateQueryStatus(queryId, client_1.TaskStatus.IN_PROGRESS, null, 85);
        // Step 6: Generate AI insights
        if (params.reportDepth === 'detailed' || params.reportDepth === 'comprehensive') {
            const aiJobId = await aiService.generateAnalysis(query.userId, {
                type: 'competitor_analysis',
                templateId: 'competitor_gap_analysis',
                data: {
                    yourData: analysisResults.targetDomainData,
                    competitorData: analysisResults.competitorData,
                    gapAnalysis: analysisResults.gapAnalysis,
                    marketContext: {
                        location: params.location,
                        language: params.language,
                        analysisType: params.analysisType
                    }
                },
                context: {
                    targetAudience: 'SEO professionals and digital marketers',
                    businessGoals: ['outrank competitors', 'identify content gaps', 'improve market share'],
                    competitorDomains: params.competitorDomains
                },
                options: {
                    length: params.reportDepth === 'comprehensive' ? 'comprehensive' : 'detailed',
                    focus: ['keyword gaps', 'content opportunities', 'competitive advantages']
                }
            }, queryId);
            // Wait for AI analysis to complete
            const aiResult = await aiService.waitForJobs([aiJobId], query.userId, {
                timeout: 180000 // 3 minutes
            });
            if (aiResult[aiJobId] && aiResult[aiJobId].status === 'completed') {
                await prisma.brief.create({
                    data: {
                        queryId,
                        type: 'AI_INSIGHTS',
                        content: aiResult[aiJobId].output,
                        metadata: {
                            analysisType: 'competitor_research',
                            aiModel: 'gpt-4-turbo-preview',
                            templateUsed: 'competitor_gap_analysis'
                        }
                    }
                });
            }
        }
        // Complete the query
        await updateQueryStatus(queryId, client_1.TaskStatus.COMPLETED, null, 100);
    }
    catch (error) {
        console.error(`Competitor research processing error for query ${queryId}:`, error);
        await updateQueryStatus(queryId, client_1.TaskStatus.FAILED, { error: error.message });
    }
}
// Process competitor analysis results
async function processCompetitorAnalysis(dataForSEOResults, targetTaskId, competitorTaskIds, competitorsTaskId, params) {
    const analysisResults = {
        targetDomainData: null,
        competitorData: [],
        competitorsDiscovered: [],
        gapAnalysis: {
            keywordGaps: [],
            contentGaps: [],
            opportunityKeywords: [],
            competitiveAdvantages: []
        },
        marketOverview: {
            totalKeywords: 0,
            averagePosition: 0,
            marketShare: {},
            topPerformers: []
        }
    };
    // Process target domain data
    const targetResult = dataForSEOResults[targetTaskId];
    if (targetResult && targetResult.tasks?.[0]?.result?.[0]) {
        const targetData = targetResult.tasks[0].result[0];
        analysisResults.targetDomainData = {
            domain: params.targetDomain,
            totalKeywords: targetData.total_count,
            rankedKeywords: processRankedKeywords(targetData.items, params.keywordFilters),
            organicTraffic: calculateOrganicTraffic(targetData.items),
            averagePosition: calculateAveragePosition(targetData.items),
            topKeywords: getTopKeywords(targetData.items, 50)
        };
    }
    // Process competitor data
    for (let i = 0; i < competitorTaskIds.length; i++) {
        const competitorTaskId = competitorTaskIds[i];
        const competitorResult = dataForSEOResults[competitorTaskId];
        if (competitorResult && competitorResult.tasks?.[0]?.result?.[0]) {
            const competitorData = competitorResult.tasks[0].result[0];
            const processedCompetitor = {
                domain: params.competitorDomains[i],
                totalKeywords: competitorData.total_count,
                rankedKeywords: processRankedKeywords(competitorData.items, params.keywordFilters),
                organicTraffic: calculateOrganicTraffic(competitorData.items),
                averagePosition: calculateAveragePosition(competitorData.items),
                topKeywords: getTopKeywords(competitorData.items, 50),
                competitiveStrength: calculateCompetitiveStrength(competitorData.items)
            };
            analysisResults.competitorData.push(processedCompetitor);
        }
    }
    // Process competitors discovery
    const competitorsResult = dataForSEOResults[competitorsTaskId];
    if (competitorsResult && competitorsResult.tasks?.[0]?.result?.[0]) {
        const discoveredCompetitors = competitorsResult.tasks[0].result[0];
        analysisResults.competitorsDiscovered = discoveredCompetitors.items?.slice(0, 20).map((item) => ({
            domain: item.competitor,
            intersections: item.intersections,
            averagePosition: item.avg_position,
            competitiveStrength: categorizeCompetitiveStrength(item.intersections, item.avg_position),
            organicKeywords: item.full_domain_metrics?.organic_keywords || 0,
            organicTraffic: item.full_domain_metrics?.organic_traffic || 0
        })) || [];
    }
    // Perform gap analysis
    analysisResults.gapAnalysis = performGapAnalysis(analysisResults.targetDomainData, analysisResults.competitorData, params.keywordFilters);
    // Calculate market overview
    analysisResults.marketOverview = calculateMarketOverview(analysisResults.targetDomainData, analysisResults.competitorData);
    return analysisResults;
}
// Process ranked keywords with filters
function processRankedKeywords(items, filters) {
    return items?.filter(item => {
        // Apply search volume filter
        if (item.search_volume < filters.minSearchVolume)
            return false;
        // Apply position filter
        if (item.avg_position > filters.maxPosition)
            return false;
        // Apply question filter
        if (!filters.includeQuestions && isQuestionKeyword(item.keyword))
            return false;
        // Apply branded filter
        if (!filters.includeBranded && isBrandedKeyword(item.keyword))
            return false;
        return true;
    }).map(item => ({
        keyword: item.keyword,
        position: item.avg_position,
        searchVolume: item.search_volume,
        cpc: item.cpc,
        competition: item.competition,
        url: item.ranked_serp_element?.url,
        title: item.ranked_serp_element?.title,
        traffic: calculateKeywordTraffic(item.search_volume, item.avg_position)
    })) || [];
}
// Calculate organic traffic estimate
function calculateOrganicTraffic(items) {
    return items?.reduce((total, item) => {
        return total + calculateKeywordTraffic(item.search_volume, item.avg_position);
    }, 0) || 0;
}
// Calculate keyword traffic based on position
function calculateKeywordTraffic(searchVolume, position) {
    // CTR estimates by position
    const ctrByPosition = {
        1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.07,
        6: 0.05, 7: 0.04, 8: 0.03, 9: 0.03, 10: 0.02
    };
    const ctr = ctrByPosition[Math.ceil(position)] || (position <= 20 ? 0.01 : 0.005);
    return Math.round(searchVolume * ctr);
}
// Calculate average position
function calculateAveragePosition(items) {
    if (!items || items.length === 0)
        return 0;
    const totalPosition = items.reduce((sum, item) => sum + item.avg_position, 0);
    return Math.round((totalPosition / items.length) * 10) / 10;
}
// Get top keywords by traffic potential
function getTopKeywords(items, limit) {
    return items?.sort((a, b) => {
        const trafficA = calculateKeywordTraffic(a.search_volume, a.avg_position);
        const trafficB = calculateKeywordTraffic(b.search_volume, b.avg_position);
        return trafficB - trafficA;
    }).slice(0, limit).map(item => ({
        keyword: item.keyword,
        position: item.avg_position,
        searchVolume: item.search_volume,
        traffic: calculateKeywordTraffic(item.search_volume, item.avg_position)
    })) || [];
}
// Calculate competitive strength
function calculateCompetitiveStrength(items) {
    const totalTraffic = calculateOrganicTraffic(items);
    const avgPosition = calculateAveragePosition(items);
    const totalKeywords = items?.length || 0;
    if (totalTraffic > 100000 && avgPosition < 15 && totalKeywords > 1000)
        return 'Very Strong';
    if (totalTraffic > 50000 && avgPosition < 20 && totalKeywords > 500)
        return 'Strong';
    if (totalTraffic > 10000 && avgPosition < 25 && totalKeywords > 200)
        return 'Moderate';
    return 'Weak';
}
// Categorize competitive strength from Labs data
function categorizeCompetitiveStrength(intersections, avgPosition) {
    if (intersections > 1000 && avgPosition < 10)
        return 'Very Strong';
    if (intersections > 500 && avgPosition < 15)
        return 'Strong';
    if (intersections > 200 && avgPosition < 20)
        return 'Moderate';
    return 'Weak';
}
// Perform gap analysis
function performGapAnalysis(targetData, competitorData, filters) {
    const targetKeywords = new Set(targetData?.rankedKeywords?.map((k) => k.keyword) || []);
    const keywordGaps = [];
    const opportunityKeywords = [];
    const contentGaps = [];
    // Find keywords competitors rank for that target doesn't
    competitorData.forEach(competitor => {
        competitor.rankedKeywords?.forEach((keyword) => {
            if (!targetKeywords.has(keyword.keyword)) {
                // Check if multiple competitors rank for this keyword
                const competitorsRanking = competitorData.filter(comp => comp.rankedKeywords?.some((k) => k.keyword === keyword.keyword)).length;
                const gap = {
                    keyword: keyword.keyword,
                    searchVolume: keyword.searchVolume,
                    competitorPosition: keyword.position,
                    competitorDomain: competitor.domain,
                    competitorsRanking,
                    opportunity: categorizeOpportunity(keyword, competitorsRanking)
                };
                keywordGaps.push(gap);
                // High-opportunity keywords
                if (gap.opportunity === 'High' && keyword.searchVolume >= filters.minSearchVolume) {
                    opportunityKeywords.push(gap);
                }
            }
        });
    });
    // Remove duplicates and sort by opportunity
    const uniqueKeywordGaps = Array.from(new Map(keywordGaps.map(gap => [gap.keyword, gap])).values()).sort((a, b) => b.searchVolume - a.searchVolume);
    return {
        keywordGaps: uniqueKeywordGaps.slice(0, 500),
        opportunityKeywords: opportunityKeywords.slice(0, 100),
        contentGaps,
        competitiveAdvantages: findCompetitiveAdvantages(targetData, competitorData)
    };
}
// Categorize keyword opportunity
function categorizeOpportunity(keyword, competitorsRanking) {
    if (keyword.position <= 10 && competitorsRanking >= 2 && keyword.searchVolume >= 1000)
        return 'High';
    if (keyword.position <= 20 && competitorsRanking >= 1 && keyword.searchVolume >= 500)
        return 'Medium';
    return 'Low';
}
// Find competitive advantages
function findCompetitiveAdvantages(targetData, competitorData) {
    const advantages = [];
    if (targetData?.rankedKeywords) {
        targetData.rankedKeywords.forEach((keyword) => {
            // Find keywords where target ranks better than competitors
            let betterThanCompetitors = 0;
            let competitorPositions = [];
            competitorData.forEach(competitor => {
                const competitorKeyword = competitor.rankedKeywords?.find((k) => k.keyword === keyword.keyword);
                if (competitorKeyword) {
                    competitorPositions.push(competitorKeyword.position);
                    if (keyword.position < competitorKeyword.position) {
                        betterThanCompetitors++;
                    }
                }
            });
            if (betterThanCompetitors > 0 && keyword.searchVolume >= 500) {
                advantages.push({
                    keyword: keyword.keyword,
                    targetPosition: keyword.position,
                    competitorsBeat: betterThanCompetitors,
                    averageCompetitorPosition: competitorPositions.length > 0
                        ? competitorPositions.reduce((sum, pos) => sum + pos, 0) / competitorPositions.length
                        : null,
                    searchVolume: keyword.searchVolume,
                    traffic: keyword.traffic
                });
            }
        });
    }
    return advantages.sort((a, b) => b.traffic - a.traffic).slice(0, 50);
}
// Calculate market overview
function calculateMarketOverview(targetData, competitorData) {
    const allDomains = [targetData, ...competitorData].filter(Boolean);
    const totalKeywords = allDomains.reduce((sum, domain) => sum + (domain.totalKeywords || 0), 0);
    const marketShare = {};
    allDomains.forEach(domain => {
        marketShare[domain.domain] = {
            keywords: domain.totalKeywords || 0,
            traffic: domain.organicTraffic || 0,
            percentage: totalKeywords > 0 ? ((domain.totalKeywords || 0) / totalKeywords * 100) : 0
        };
    });
    const topPerformers = allDomains
        .sort((a, b) => (b.organicTraffic || 0) - (a.organicTraffic || 0))
        .slice(0, 5)
        .map(domain => ({
        domain: domain.domain,
        organicTraffic: domain.organicTraffic,
        totalKeywords: domain.totalKeywords,
        averagePosition: domain.averagePosition
    }));
    return {
        totalKeywords,
        averagePosition: allDomains.reduce((sum, d) => sum + (d.averagePosition || 0), 0) / allDomains.length,
        marketShare,
        topPerformers
    };
}
// Helper functions
function isQuestionKeyword(keyword) {
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'do', 'does', 'is', 'are'];
    return questionWords.some(word => keyword.toLowerCase().startsWith(word + ' '));
}
function isBrandedKeyword(keyword) {
    // This is simplified - in practice, you'd have a list of brand terms
    const brandTerms = ['brand', 'company', 'official', 'login', 'account'];
    return brandTerms.some(term => keyword.toLowerCase().includes(term));
}
// Update query status
async function updateQueryStatus(queryId, status, error, progress) {
    await prisma.query.update({
        where: { id: queryId },
        data: {
            status,
            progress,
            error,
            completedAt: status === client_1.TaskStatus.COMPLETED || status === client_1.TaskStatus.FAILED ? new Date() : undefined
        }
    });
}
// Update task status
async function updateTaskStatus(taskId, status, result, progress) {
    await prisma.task.update({
        where: { id: taskId },
        data: {
            status,
            progress,
            result,
            completedAt: status === client_1.TaskStatus.COMPLETED || status === client_1.TaskStatus.FAILED ? new Date() : undefined
        }
    });
}
