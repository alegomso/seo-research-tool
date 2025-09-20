'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icons } from '@/components/ui/icons'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

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

interface QueryListResponse {
  queries: Query[]
  total: number
  hasMore: boolean
}

const QUERY_TYPE_CONFIG = {
  KEYWORD_DISCOVERY: {
    label: 'Keyword Discovery',
    icon: Icons.search,
    color: 'bg-blue-500',
    route: '/research/keyword-discovery'
  },
  SERP_ANALYSIS: {
    label: 'SERP Analysis',
    icon: Icons.target,
    color: 'bg-green-500',
    route: '/research/serp-analysis'
  },
  COMPETITOR_RESEARCH: {
    label: 'Competitor Research',
    icon: Icons.users,
    color: 'bg-purple-500',
    route: '/research/competitor-research'
  }
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', variant: 'secondary', icon: Icons.clock },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning', icon: Icons.refresh },
  COMPLETED: { label: 'Completed', variant: 'success', icon: Icons.checkCircle },
  FAILED: { label: 'Failed', variant: 'destructive', icon: Icons.alertCircle }
}

export default function ResearchHistoryPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchQueries()
    }
  }, [session, statusFilter, typeFilter, currentPage])

  const fetchQueries = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: (currentPage * ITEMS_PER_PAGE).toString()
      })

      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      if (typeFilter !== 'ALL') {
        params.append('type', typeFilter)
      }

      const response = await fetch(`/api/research/queries?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      })

      if (response.ok) {
        const data: QueryListResponse = await response.json()
        setQueries(data.queries)
        setTotal(data.total)
        setHasMore(data.hasMore)
      }

    } catch (error) {
      console.error('Failed to fetch queries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this analysis? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/research/queries/${queryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      })

      if (response.ok) {
        // Refresh the list
        await fetchQueries()
      } else {
        alert('Failed to delete analysis')
      }

    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete analysis')
    }
  }

  const filteredQueries = queries.filter(query => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()

    // Search in query parameters
    if (query.type === 'KEYWORD_DISCOVERY' && query.parameters.seedKeywords) {
      return query.parameters.seedKeywords.some((keyword: string) =>
        keyword.toLowerCase().includes(searchLower)
      )
    }

    if (query.type === 'SERP_ANALYSIS' && query.parameters.keywords) {
      return query.parameters.keywords.some((keyword: string) =>
        keyword.toLowerCase().includes(searchLower)
      )
    }

    if (query.type === 'COMPETITOR_RESEARCH') {
      return query.parameters.targetDomain?.toLowerCase().includes(searchLower) ||
             query.parameters.competitorDomains?.some((domain: string) =>
               domain.toLowerCase().includes(searchLower)
             )
    }

    return false
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getParametersSummary = (query: Query) => {
    switch (query.type) {
      case 'KEYWORD_DISCOVERY':
        const seedKeywords = query.parameters.seedKeywords || []
        return `Keywords: ${seedKeywords.slice(0, 2).join(', ')}${seedKeywords.length > 2 ? ` +${seedKeywords.length - 2}` : ''}`

      case 'SERP_ANALYSIS':
        const keywords = query.parameters.keywords || []
        return `Analyzing: ${keywords.slice(0, 2).join(', ')}${keywords.length > 2 ? ` +${keywords.length - 2}` : ''}`

      case 'COMPETITOR_RESEARCH':
        return `${query.parameters.targetDomain} vs ${query.parameters.competitorDomains?.length || 0} competitors`

      default:
        return 'Analysis'
    }
  }

  const getViewRoute = (query: Query) => {
    const baseRoute = QUERY_TYPE_CONFIG[query.type]?.route || '/dashboard'
    return `${baseRoute}?queryId=${query.id}`
  }

  if (loading && currentPage === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icons.spinner className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading research history...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Research History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your SEO research analyses
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard')}>
          <Icons.plus className="mr-2 h-4 w-4" />
          New Research
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by keywords or domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setCurrentPage(0)
                }}
                className="flex h-9 w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ALL">All Types</option>
                <option value="KEYWORD_DISCOVERY">Keyword Discovery</option>
                <option value="SERP_ANALYSIS">SERP Analysis</option>
                <option value="COMPETITOR_RESEARCH">Competitor Research</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(0)
                }}
                className="flex h-9 w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ALL">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analysis History</span>
            <span className="text-sm font-normal text-muted-foreground">
              {total} total analyses
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredQueries.length === 0 ? (
            <div className="text-center py-12">
              <Icons.search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No analyses found</h3>
              <p className="text-muted-foreground mb-4">
                {queries.length === 0
                  ? "You haven't run any analyses yet"
                  : "No analyses match your current filters"
                }
              </p>
              {queries.length === 0 && (
                <Button onClick={() => router.push('/dashboard')}>
                  Start Your First Analysis
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Parameters</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueries.map((query) => {
                  const typeConfig = QUERY_TYPE_CONFIG[query.type]
                  const statusConfig = STATUS_CONFIG[query.status]
                  const IconComponent = typeConfig.icon
                  const StatusIcon = statusConfig.icon

                  return (
                    <TableRow key={query.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${typeConfig.color}`}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{typeConfig.label}</div>
                            {query.project && (
                              <div className="text-xs text-muted-foreground">
                                {query.project.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {getParametersSummary(query)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusConfig.variant as any} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                        {query.status === 'IN_PROGRESS' && query.progress && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {query.progress}% complete
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {formatDate(query.createdAt)}
                        </div>
                        {query.completedAt && (
                          <div className="text-xs text-muted-foreground">
                            Completed {formatDate(query.completedAt)}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{query.tasksCount} tasks</div>
                          <div className="text-xs text-muted-foreground">
                            {query.briefsCount} insights
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {query.status === 'COMPLETED' && (
                            <Link href={getViewRoute(query)}>
                              <Button variant="outline" size="sm">
                                <Icons.externalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(query.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Icons.x className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {total > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {currentPage * ITEMS_PER_PAGE + 1} to {Math.min((currentPage + 1) * ITEMS_PER_PAGE, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}