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
async function serpAnalysisRoutes(fastify) {
    // Start SERP analysis process
    fastify.post('/serp-analysis', async (request, reply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ error: 'Authentication required' });
            }
            const { keywords, location, language, device, includeAds, includeLocal, includeFeatured, analysisType, competitorDomains, projectId } = request.body;
            // Validate input
            if (!keywords || keywords.length === 0) {
                return reply.status(400).send({ error: 'At least one keyword is required' });
            }
            if (keywords.length > 10) {
                return reply.status(400).send({ error: 'Maximum 10 keywords allowed' });
            }
            if (analysisType === 'competitor' && (!competitorDomains || competitorDomains.length === 0)) {
                return reply.status(400).send({ error: 'Competitor domains required for competitor analysis' });
            }
            // Create query record
            const query = await prisma.query.create({
                data: {
                    userId,
                    projectId,
                    type: client_1.QueryType.SERP_ANALYSIS,
                    parameters: {
                        keywords,
                        location,
                        language,
                        device,
                        includeAds,
                        includeLocal,
                        includeFeatured,
                        analysisType,
                        competitorDomains: competitorDomains || []
                    },
                    status: client_1.TaskStatus.PENDING,
                }
            });
            // Start the SERP analysis process asynchronously
            processSerpAnalysis(query.id).catch(error => {
                console.error(`SERP analysis failed for query ${query.id}:`, error);
                updateQueryStatus(query.id, client_1.TaskStatus.FAILED, { error: error.message });
            });
            return reply.send({
                queryId: query.id,
                status: 'started',
                message: 'SERP analysis process has been started'
            });
        }
        catch (error) {
            console.error('SERP analysis request error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    // Get SERP analysis results
    fastify.get('/serp-analysis/:queryId', async (request, reply) => {
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
                    type: client_1.QueryType.SERP_ANALYSIS
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
            console.error('Get SERP analysis error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    // Get SERP analysis status
    fastify.get('/serp-analysis/:queryId/status', async (request, reply) => {
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
                    type: client_1.QueryType.SERP_ANALYSIS
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
            console.error('Get SERP analysis status error:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
exports.default = serpAnalysisRoutes;
// Process SERP analysis workflow
async function processSerpAnalysis(queryId) {
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
        // Step 1: Get SERP data for organic results
        const organicTask = await prisma.task.create({
            data: {
                queryId,
                type: 'SERP_ORGANIC',
                status: client_1.TaskStatus.PENDING,
                parameters: {
                    keywords: params.keywords,
                    location: params.location,
                    language: params.language,
                    device: params.device
                }
            }
        });
        // Submit organic SERP tasks
        const organicTaskIds = [];
        for (const keyword of params.keywords) {
            const taskId = await dataForSEOService.submitTask('serp_organic', [{
                    keyword,
                    location_name: params.location,
                    language_name: params.language,
                    device: params.device,
                    os: params.device === 'mobile' ? 'android' : 'windows'
                }]);
            organicTaskIds.push(taskId);
        }
        await updateTaskStatus(organicTask.id, client_1.TaskStatus.IN_PROGRESS, { dataForSEOTaskIds: organicTaskIds });
        await updateQueryStatus(queryId, client_1.TaskStatus.IN_PROGRESS, null, 30);
        // Step 2: Get local SERP data if requested
        let localTask;
        let localTaskIds = [];
        if (params.includeLocal) {
            localTask = await prisma.task.create({
                data: {
                    queryId,
                    type: 'SERP_LOCAL',
                    status: client_1.TaskStatus.PENDING,
                    parameters: {
                        keywords: params.keywords,
                        location: params.location,
                        language: params.language,
                        device: params.device
                    }
                }
            });
            for (const keyword of params.keywords) {
                // Check if keyword has local intent before submitting
                if (dataForSEOService.serp.detectLocalIntent(keyword)) {
                    const taskId = await dataForSEOService.submitTask('serp_maps', [{
                            keyword,
                            location_name: params.location,
                            language_name: params.language,
                            device: params.device
                        }]);
                    localTaskIds.push(taskId);
                }
            }
            if (localTaskIds.length > 0) {
                await updateTaskStatus(localTask.id, client_1.TaskStatus.IN_PROGRESS, { dataForSEOTaskIds: localTaskIds });
            }
            else {
                await updateTaskStatus(localTask.id, client_1.TaskStatus.COMPLETED, { message: 'No keywords with local intent found' });
            }
        }
        await updateQueryStatus(queryId, client_1.TaskStatus.IN_PROGRESS, null, 50);
        // Step 3: Wait for DataForSEO tasks to complete
        const allTaskIds = [...organicTaskIds, ...localTaskIds];
        const dataForSEOResults = await dataForSEOService.waitForTasks(allTaskIds, {
            timeout: 600000,
            checkInterval: 10000 // 10 seconds
        });
        await updateQueryStatus(queryId, client_1.TaskStatus.IN_PROGRESS, null, 70);
        // Step 4: Process SERP results
        const serpData = await processSerpResults(dataForSEOResults, organicTaskIds, localTaskIds, params);
        // Store processed SERP results
        const serpDataset = await prisma.dataset.create({
            data: {
                taskId: organicTask.id,
                type: 'SERP_DATA',
                data: serpData,
                metadata: {
                    keywordsAnalyzed: params.keywords.length,
                    totalResults: serpData.reduce((sum, result) => sum + result.items?.length || 0, 0),
                    serpFeatures: extractSerpFeatures(serpData),
                    analysisType: params.analysisType
                }
            }
        });
        await updateTaskStatus(organicTask.id, client_1.TaskStatus.COMPLETED, { datasetId: serpDataset.id });
        if (localTask) {
            await updateTaskStatus(localTask.id, client_1.TaskStatus.COMPLETED);
        }
        await updateQueryStatus(queryId, client_1.TaskStatus.IN_PROGRESS, null, 85);
        // Step 5: Generate AI insights based on analysis type
        if (params.analysisType === 'features' || params.analysisType === 'comprehensive') {
            const templateId = params.analysisType === 'features'
                ? 'serp_feature_optimization'
                : 'comprehensive'; // Use a generic template for comprehensive
            const aiJobId = await aiService.generateAnalysis(query.userId, {
                type: 'serp_analysis',
                templateId: params.analysisType === 'features' ? templateId : undefined,
                data: {
                    serpData: serpData,
                    keywords: params.keywords,
                    competitorDomains: params.competitorDomains || [],
                    serpFeatures: extractSerpFeatures(serpData)
                },
                context: {
                    targetAudience: 'SEO professionals',
                    businessGoals: ['improve SERP visibility', 'capture featured snippets', 'outrank competitors']
                },
                options: {
                    length: params.analysisType === 'comprehensive' ? 'comprehensive' : 'detailed',
                    focus: params.analysisType === 'features'
                        ? ['featured snippets', 'SERP features', 'optimization opportunities']
                        : ['ranking opportunities', 'competitor analysis', 'content strategy']
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
                            analysisType: 'serp_analysis',
                            aiModel: 'gpt-4-turbo-preview',
                            templateUsed: templateId || 'generic'
                        }
                    }
                });
            }
        }
        // Step 6: Generate competitor analysis if requested
        if (params.analysisType === 'competitor' || params.analysisType === 'comprehensive') {
            const competitorAnalysis = analyzeCompetitorPerformance(serpData, params.competitorDomains || []);
            await prisma.dataset.create({
                data: {
                    taskId: organicTask.id,
                    type: 'COMPETITOR_ANALYSIS',
                    data: competitorAnalysis,
                    metadata: {
                        competitorDomains: params.competitorDomains,
                        analysisType: 'serp_competitor'
                    }
                }
            });
        }
        // Complete the query
        await updateQueryStatus(queryId, client_1.TaskStatus.COMPLETED, null, 100);
    }
    catch (error) {
        console.error(`SERP analysis processing error for query ${queryId}:`, error);
        await updateQueryStatus(queryId, client_1.TaskStatus.FAILED, { error: error.message });
    }
}
// Process SERP results from DataForSEO
async function processSerpResults(dataForSEOResults, organicTaskIds, localTaskIds, params) {
    const serpData = [];
    // Process organic results
    for (const taskId of organicTaskIds) {
        const result = dataForSEOResults[taskId];
        if (result && result.tasks && result.tasks.length > 0) {
            const task = result.tasks[0];
            if (task.result && task.result.length > 0) {
                const serpResult = task.result[0];
                // Extract and process SERP data
                const processedResult = {
                    keyword: serpResult.keyword,
                    type: 'organic',
                    location: serpResult.location_code,
                    language: serpResult.language_code,
                    device: params.device,
                    totalResults: serpResult.se_results_count,
                    items: serpResult.items?.map((item) => ({
                        type: item.type,
                        position: item.rank_absolute,
                        title: item.title,
                        url: item.url,
                        domain: item.domain,
                        description: item.description,
                        xpath: item.xpath,
                        serpFeatures: extractItemFeatures(item)
                    })) || [],
                    serpFeatures: dataForSEOService.serp.extractSerpFeatures(serpResult.items || []),
                    contentTypes: dataForSEOService.serp.analyzeContentTypes(serpResult.items || []),
                    keywordDifficulty: dataForSEOService.serp.calculateKeywordDifficulty(serpResult.items || [])
                };
                serpData.push(processedResult);
            }
        }
    }
    // Process local results if any
    for (const taskId of localTaskIds) {
        const result = dataForSEOResults[taskId];
        if (result && result.tasks && result.tasks.length > 0) {
            const task = result.tasks[0];
            if (task.result && task.result.length > 0) {
                const localResult = task.result[0];
                const processedLocalResult = {
                    keyword: localResult.keyword,
                    type: 'local',
                    location: localResult.location_code,
                    language: localResult.language_code,
                    device: params.device,
                    totalResults: localResult.se_results_count,
                    items: localResult.items?.map((item) => ({
                        type: item.type,
                        position: item.rank_absolute,
                        title: item.title,
                        url: item.url,
                        domain: item.domain,
                        address: item.address,
                        phone: item.phone,
                        rating: item.rating,
                        reviews: item.reviews_count,
                        workingHours: item.work_hours
                    })) || []
                };
                serpData.push(processedLocalResult);
            }
        }
    }
    return serpData;
}
// Extract SERP features from all results
function extractSerpFeatures(serpData) {
    const allFeatures = new Set();
    serpData.forEach(result => {
        if (result.serpFeatures) {
            result.serpFeatures.forEach((feature) => allFeatures.add(feature));
        }
    });
    return Array.from(allFeatures);
}
// Extract features from individual SERP items
function extractItemFeatures(item) {
    const features = [];
    if (item.type)
        features.push(item.type);
    if (item.featured_snippet)
        features.push('featured_snippet');
    if (item.people_also_ask)
        features.push('people_also_ask');
    if (item.related_searches)
        features.push('related_searches');
    if (item.images)
        features.push('images');
    if (item.videos)
        features.push('videos');
    if (item.reviews)
        features.push('reviews');
    if (item.shopping)
        features.push('shopping');
    if (item.local_pack)
        features.push('local_pack');
    return features;
}
// Analyze competitor performance in SERP
function analyzeCompetitorPerformance(serpData, competitorDomains) {
    const competitorAnalysis = {
        overview: {
            totalKeywords: serpData.length,
            competitorDomains: competitorDomains.length,
            averageCompetitorVisibility: 0
        },
        competitorPerformance: [],
        keywordOpportunities: [],
        serpFeatureOpportunities: []
    };
    // Analyze each competitor
    competitorDomains.forEach(domain => {
        const domainPerformance = {
            domain,
            totalAppearances: 0,
            averagePosition: 0,
            topPositions: 0,
            featuredSnippets: 0,
            keywordsCovered: [],
            missedOpportunities: []
        };
        let totalPosition = 0;
        serpData.forEach(result => {
            const domainItems = result.items?.filter((item) => item.domain && item.domain.toLowerCase().includes(domain.toLowerCase())) || [];
            if (domainItems.length > 0) {
                domainPerformance.totalAppearances++;
                domainPerformance.keywordsCovered.push(result.keyword);
                domainItems.forEach((item) => {
                    totalPosition += item.position;
                    if (item.position <= 3)
                        domainPerformance.topPositions++;
                    if (item.serpFeatures?.includes('featured_snippet')) {
                        domainPerformance.featuredSnippets++;
                    }
                });
            }
            else {
                domainPerformance.missedOpportunities.push(result.keyword);
            }
        });
        if (domainPerformance.totalAppearances > 0) {
            domainPerformance.averagePosition = totalPosition / domainPerformance.totalAppearances;
        }
        competitorAnalysis.competitorPerformance.push(domainPerformance);
    });
    // Calculate opportunities
    serpData.forEach(result => {
        const topResults = result.items?.slice(0, 10) || [];
        const competitorInTop10 = topResults.some((item) => competitorDomains.some(domain => item.domain && item.domain.toLowerCase().includes(domain.toLowerCase())));
        if (!competitorInTop10) {
            competitorAnalysis.keywordOpportunities.push({
                keyword: result.keyword,
                difficulty: result.keywordDifficulty || 'unknown',
                contentTypes: result.contentTypes,
                serpFeatures: result.serpFeatures
            });
        }
        // SERP feature opportunities
        if (result.serpFeatures) {
            result.serpFeatures.forEach((feature) => {
                const existingFeature = competitorAnalysis.serpFeatureOpportunities.find(f => f.feature === feature);
                if (existingFeature) {
                    existingFeature.keywords.push(result.keyword);
                }
                else {
                    competitorAnalysis.serpFeatureOpportunities.push({
                        feature,
                        keywords: [result.keyword],
                        opportunity: 'medium' // This could be calculated based on competition
                    });
                }
            });
        }
    });
    return competitorAnalysis;
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
