import { FastifyInstance } from 'fastify';
import keywordDiscoveryRoutes from './keyword-discovery.js';
import serpAnalysisRoutes from './serp-analysis.js';
import competitorResearchRoutes from './competitor-research.js';

export default async function researchRoutes(fastify: FastifyInstance) {
  // Register all research routes under /api/research
  await fastify.register(keywordDiscoveryRoutes);
  await fastify.register(serpAnalysisRoutes);
  await fastify.register(competitorResearchRoutes);

  // Get all user queries (dashboard endpoint)
  fastify.get('/queries', async (request, reply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const { projectId, status, type, limit = 50, offset = 0 } = request.query as any;

      const queries = await fastify.prisma.query.findMany({
        where: {
          userId,
          ...(projectId && { projectId }),
          ...(status && { status }),
          ...(type && { type })
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              tasks: true,
              briefs: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: Number(limit),
        skip: Number(offset)
      });

      const total = await fastify.prisma.query.count({
        where: {
          userId,
          ...(projectId && { projectId }),
          ...(status && { status }),
          ...(type && { type })
        }
      });

      return reply.send({
        queries: queries.map(query => ({
          id: query.id,
          type: query.type,
          status: query.status,
          progress: query.progress,
          createdAt: query.createdAt,
          completedAt: query.completedAt,
          project: query.project,
          tasksCount: query._count.tasks,
          briefsCount: query._count.briefs,
          parameters: {
            // Only include summary parameters for list view
            ...(query.type === 'KEYWORD_DISCOVERY' && {
              seedKeywords: (query.parameters as any)?.seedKeywords?.slice(0, 3)
            }),
            ...(query.type === 'SERP_ANALYSIS' && {
              keywords: (query.parameters as any)?.keywords?.slice(0, 3)
            }),
            ...(query.type === 'COMPETITOR_RESEARCH' && {
              targetDomain: (query.parameters as any)?.targetDomain,
              competitorCount: (query.parameters as any)?.competitorDomains?.length
            })
          }
        })),
        total,
        hasMore: offset + queries.length < total
      });

    } catch (error) {
      console.error('Get queries error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete a query
  fastify.delete('/queries/:queryId', async (request, reply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const { queryId } = request.params as { queryId: string };

      // Verify ownership
      const query = await fastify.prisma.query.findFirst({
        where: {
          id: queryId,
          userId
        }
      });

      if (!query) {
        return reply.status(404).send({ error: 'Query not found' });
      }

      // Delete related data (cascading delete should handle this, but being explicit)
      await fastify.prisma.$transaction([
        fastify.prisma.dataset.deleteMany({ where: { task: { queryId } } }),
        fastify.prisma.task.deleteMany({ where: { queryId } }),
        fastify.prisma.brief.deleteMany({ where: { queryId } }),
        fastify.prisma.query.delete({ where: { id: queryId } })
      ]);

      return reply.send({ message: 'Query deleted successfully' });

    } catch (error) {
      console.error('Delete query error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get research statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Authentication required' });
      }

      const { projectId } = request.query as { projectId?: string };

      // Get query counts by type and status
      const queryStats = await fastify.prisma.query.groupBy({
        by: ['type', 'status'],
        where: {
          userId,
          ...(projectId && { projectId })
        },
        _count: true
      });

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentQueries = await fastify.prisma.query.count({
        where: {
          userId,
          createdAt: {
            gte: thirtyDaysAgo
          },
          ...(projectId && { projectId })
        }
      });

      // Get total datasets created
      const totalDatasets = await fastify.prisma.dataset.count({
        where: {
          task: {
            query: {
              userId,
              ...(projectId && { projectId })
            }
          }
        }
      });

      // Get AI insights generated
      const totalInsights = await fastify.prisma.brief.count({
        where: {
          query: {
            userId,
            ...(projectId && { projectId })
          },
          type: 'AI_INSIGHTS'
        }
      });

      // Process stats
      const statsByType: any = {};
      const statsByStatus: any = {};

      queryStats.forEach(stat => {
        if (!statsByType[stat.type]) {
          statsByType[stat.type] = 0;
        }
        if (!statsByStatus[stat.status]) {
          statsByStatus[stat.status] = 0;
        }

        statsByType[stat.type] += stat._count;
        statsByStatus[stat.status] += stat._count;
      });

      return reply.send({
        overview: {
          totalQueries: Object.values(statsByType).reduce((sum: number, count) => sum + (count as number), 0),
          recentQueries,
          totalDatasets,
          totalInsights
        },
        byType: statsByType,
        byStatus: statsByStatus,
        recentActivity: {
          period: '30 days',
          queries: recentQueries
        }
      });

    } catch (error) {
      console.error('Get research stats error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Health check for research services
  fastify.get('/health', async (request, reply) => {
    try {
      // Check DataForSEO connection
      const dataForSEOHealth = await fastify.dataForSEO?.healthCheck() || false;

      // Check OpenAI connection
      const openAIHealth = await fastify.openAI?.testConnection() || false;

      // Check database connection
      let dbHealth = false;
      try {
        await fastify.prisma.user.findFirst();
        dbHealth = true;
      } catch (error) {
        dbHealth = false;
      }

      const overallHealth = dataForSEOHealth && openAIHealth && dbHealth;

      return reply.status(overallHealth ? 200 : 503).send({
        status: overallHealth ? 'healthy' : 'unhealthy',
        services: {
          database: dbHealth ? 'healthy' : 'unhealthy',
          dataForSEO: dataForSEOHealth ? 'healthy' : 'unhealthy',
          openAI: openAIHealth ? 'healthy' : 'unhealthy'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Health check error:', error);
      return reply.status(503).send({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });
}