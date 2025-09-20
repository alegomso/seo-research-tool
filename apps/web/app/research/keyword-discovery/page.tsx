'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { KeywordDiscoveryForm, KeywordDiscoveryData } from '@/components/research/keyword-discovery-form'
import { KeywordResultsTable, KeywordResult } from '@/components/results/keyword-results-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface QueryStatus {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  progress?: number
  error?: any
  tasks: Array<{
    type: string
    status: string
    progress?: number
  }>
}

interface QueryResult {
  query: {
    id: string
    status: string
    parameters: KeywordDiscoveryData
    createdAt: string
    completedAt?: string
    error?: any
  }
  tasks: Array<{
    id: string
    type: string
    status: string
    datasets: Array<{
      id: string
      type: string
      data: any
      metadata: any
    }>
  }>
  insights: Array<{
    id: string
    type: string
    content: any
    metadata: any
  }>
}

export default function KeywordDiscoveryPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuery, setCurrentQuery] = useState<QueryStatus | null>(null)
  const [results, setResults] = useState<QueryResult | null>(null)
  const [keywords, setKeywords] = useState<KeywordResult[]>([])

  const handleSubmit = async (data: KeywordDiscoveryData) => {
    if (!session?.user?.accessToken) {
      router.push('/auth/signin')
      return
    }

    setIsLoading(true)
    setCurrentQuery(null)
    setResults(null)
    setKeywords([])

    try {
      // Submit keyword discovery request
      const response = await fetch('/api/research/keyword-discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to start keyword discovery')
      }

      const { queryId } = await response.json()

      // Poll for status updates
      pollQueryStatus(queryId)

    } catch (error) {
      console.error('Keyword discovery error:', error)
      setIsLoading(false)
    }
  }

  const pollQueryStatus = async (queryId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/research/keyword-discovery/${queryId}/status`, {
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to get query status')
        }

        const status: QueryStatus = await response.json()
        setCurrentQuery(status)

        if (status.status === 'COMPLETED') {
          clearInterval(pollInterval)
          setIsLoading(false)

          // Fetch full results
          const resultsResponse = await fetch(`/api/research/keyword-discovery/${queryId}`, {
            headers: {
              'Authorization': `Bearer ${session?.user?.accessToken}`
            }
          })

          if (resultsResponse.ok) {
            const resultsData: QueryResult = await resultsResponse.json()
            setResults(resultsData)
            processKeywordResults(resultsData)
          }
        }

        if (status.status === 'FAILED') {
          clearInterval(pollInterval)
          setIsLoading(false)
        }

      } catch (error) {
        console.error('Status polling error:', error)
        clearInterval(pollInterval)
        setIsLoading(false)
      }
    }, 3000) // Poll every 3 seconds

    // Clear interval after 10 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval)
      if (isLoading) {
        setIsLoading(false)
      }
    }, 600000)
  }

  const processKeywordResults = (resultsData: QueryResult) => {
    // Find keyword dataset
    const keywordDataset = resultsData.tasks
      .flatMap(task => task.datasets)
      .find(dataset => dataset.type === 'KEYWORD_LIST')

    if (keywordDataset?.data) {
      const processedKeywords: KeywordResult[] = keywordDataset.data.map((kw: any) => ({
        keyword: kw.keyword,
        searchVolume: kw.searchVolume || 0,
        cpc: kw.cpc || 0,
        competition: kw.competition || 0,
        competitionLevel: kw.competitionLevel || 'UNKNOWN',
        keywordDifficulty: kw.keywordDifficulty,
        trend: kw.trend || 'stable',
        intent: kw.intent || 'informational',
        monthlySearches: kw.monthlySearches
      }))

      setKeywords(processedKeywords)
    }
  }

  const handleExport = (format: 'csv' | 'xlsx') => {
    // Implementation for exporting keywords
    console.log('Exporting keywords as', format)
  }

  const handleKeywordSelect = (selectedKeywords: KeywordResult[]) => {
    console.log('Selected keywords:', selectedKeywords)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Icons.clock className="h-4 w-4" />
      case 'IN_PROGRESS': return <Icons.refresh className="h-4 w-4 animate-spin" />
      case 'COMPLETED': return <Icons.checkCircle className="h-4 w-4 text-green-600" />
      case 'FAILED': return <Icons.alertCircle className="h-4 w-4 text-red-600" />
      default: return <Icons.clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary'
      case 'IN_PROGRESS': return 'warning'
      case 'COMPLETED': return 'success'
      case 'FAILED': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Keyword Discovery</h1>
          <p className="text-muted-foreground mt-1">
            Find high-potential keyword opportunities for your SEO strategy
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <KeywordDiscoveryForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Display */}
          {currentQuery && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(currentQuery.status)}
                  Analysis Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Progress</span>
                    <Badge variant={getStatusColor(currentQuery.status) as any}>
                      {currentQuery.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {currentQuery.progress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{currentQuery.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${currentQuery.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {currentQuery.tasks && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Tasks</h4>
                      {currentQuery.tasks.map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="capitalize">
                            {task.type.replace('_', ' ').toLowerCase()}
                          </span>
                          <div className="flex items-center gap-2">
                            {task.progress && <span>{task.progress}%</span>}
                            <Badge variant={getStatusColor(task.status) as any} className="text-xs">
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentQuery.status === 'FAILED' && currentQuery.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        Error: {currentQuery.error.error || 'Analysis failed'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {results && keywords.length > 0 && (
            <div className="space-y-6">
              {/* Results Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.chart className="h-5 w-5" />
                    Results Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{keywords.length}</div>
                      <div className="text-sm text-muted-foreground">Keywords Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(keywords.reduce((sum, k) => sum + k.searchVolume, 0) / keywords.length).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg. Volume</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {keywords.filter(k => k.competitionLevel === 'LOW').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Low Competition</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {keywords.filter(k => k.intent === 'commercial' || k.intent === 'transactional').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Commercial Intent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              {results.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.brain className="h-5 w-5" />
                      AI-Powered Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.insights.map((insight, index) => (
                      <div key={index} className="space-y-4">
                        {insight.content.summary && (
                          <div>
                            <h4 className="font-medium mb-2">Summary</h4>
                            <p className="text-sm text-muted-foreground">{insight.content.summary}</p>
                          </div>
                        )}

                        {insight.content.insights && insight.content.insights.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Key Insights</h4>
                            <ul className="space-y-1">
                              {insight.content.insights.slice(0, 3).map((item: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <Icons.arrowRight className="h-3 w-3 mt-0.5 text-primary" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Keywords Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.search className="h-5 w-5" />
                    Keyword Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <KeywordResultsTable
                    keywords={keywords}
                    onExport={handleExport}
                    onKeywordSelect={handleKeywordSelect}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!currentQuery && !results && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Icons.search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start Your Keyword Discovery</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter your seed keywords in the form to discover new opportunities
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Our AI-powered analysis will identify high-potential keywords,
                    analyze competition levels, and provide actionable insights.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}