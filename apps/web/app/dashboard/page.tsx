'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DashboardStats {
  overview: {
    totalQueries: number
    recentQueries: number
    totalDatasets: number
    totalInsights: number
  }
  byType: {
    [key: string]: number
  }
  byStatus: {
    [key: string]: number
  }
}

interface Query {
  id: string
  type: 'KEYWORD_DISCOVERY' | 'SERP_ANALYSIS' | 'COMPETITOR_RESEARCH'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  progress?: number
  createdAt: string
  completedAt?: string
  project?: {
    id: string
    name: string
  }
  tasksCount: number
  briefsCount: number
  parameters: any
}

const QUERY_TYPE_CONFIG = {
  KEYWORD_DISCOVERY: {
    label: 'Keyword Discovery',
    icon: Icons.search,
    color: 'bg-blue-500',
    description: 'Find high-potential keyword opportunities'
  },
  SERP_ANALYSIS: {
    label: 'SERP Analysis',
    icon: Icons.target,
    color: 'bg-green-500',
    description: 'Analyze search results and competitors'
  },
  COMPETITOR_RESEARCH: {
    label: 'Competitor Research',
    icon: Icons.users,
    color: 'bg-purple-500',
    description: 'Identify gaps and opportunities vs competitors'
  }
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', variant: 'secondary', icon: Icons.clock },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning', icon: Icons.refresh },
  COMPLETED: { label: 'Completed', variant: 'success', icon: Icons.checkCircle },
  FAILED: { label: 'Failed', variant: 'destructive', icon: Icons.alertCircle }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentQueries, setRecentQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch('/api/research/stats', {
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          }
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        // Fetch recent queries
        const queriesResponse = await fetch('/api/research/queries?limit=10', {
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          }
        })

        if (queriesResponse.ok) {
          const queriesData = await queriesResponse.json()
          setRecentQueries(queriesData.queries)
        }

      } catch (error) {
        console.error('Dashboard data fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.accessToken) {
      fetchDashboardData()
    }
  }, [session])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getQueryTypeIcon = (type: string) => {
    const config = QUERY_TYPE_CONFIG[type as keyof typeof QUERY_TYPE_CONFIG]
    return config ? config.icon : Icons.search
  }

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icons.spinner className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Research Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session?.user?.name || 'User'}! Here's your research overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/research/keyword-discovery">
            <Button>
              <Icons.plus className="mr-2 h-4 w-4" />
              New Research
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
              <Icons.fileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalQueries}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.recentQueries} in last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Datasets Created</CardTitle>
              <Icons.chart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalDatasets}</div>
              <p className="text-xs text-muted-foreground">
                Data files generated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
              <Icons.brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalInsights}</div>
              <p className="text-xs text-muted-foreground">
                AI-powered analyses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Icons.checkCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.COMPLETED || 0}</div>
              <p className="text-xs text-muted-foreground">
                Successful analyses
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(QUERY_TYPE_CONFIG).map(([type, config]) => {
              const IconComponent = config.icon
              return (
                <Link key={type} href={`/research/${type.toLowerCase().replace('_', '-')}`}>
                  <Card className="cursor-pointer hover:bg-accent transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={cn("p-2 rounded-md", config.color)}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{config.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </p>
                        </div>
                        <Icons.arrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Queries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Research</CardTitle>
          <Link href="/research/history">
            <Button variant="outline" size="sm">
              View All
              <Icons.arrowRight className="ml-2 h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentQueries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icons.search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No research queries yet</p>
              <p className="text-sm mt-1">Start your first analysis above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentQueries.map((query) => {
                const typeConfig = QUERY_TYPE_CONFIG[query.type]
                const statusConfig = getStatusConfig(query.status)
                const IconComponent = getQueryTypeIcon(query.type)
                const StatusIcon = statusConfig.icon

                return (
                  <div
                    key={query.id}
                    className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <div className={cn("p-2 rounded-md", typeConfig.color)}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{typeConfig.label}</h4>
                        <Badge variant={statusConfig.variant as any} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {query.type === 'KEYWORD_DISCOVERY' && query.parameters.seedKeywords && (
                          <span>Keywords: {query.parameters.seedKeywords.join(', ')}</span>
                        )}
                        {query.type === 'SERP_ANALYSIS' && query.parameters.keywords && (
                          <span>Analyzing: {query.parameters.keywords.join(', ')}</span>
                        )}
                        {query.type === 'COMPETITOR_RESEARCH' && (
                          <span>
                            {query.parameters.targetDomain} vs {query.parameters.competitorCount} competitors
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Started {formatDate(query.createdAt)}
                        {query.completedAt && ` • Completed ${formatDate(query.completedAt)}`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {query.tasksCount} tasks • {query.briefsCount} insights
                      </div>
                      {query.status === 'IN_PROGRESS' && query.progress && (
                        <div className="text-xs text-muted-foreground">
                          {query.progress}% complete
                        </div>
                      )}
                    </div>

                    <Icons.chevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}