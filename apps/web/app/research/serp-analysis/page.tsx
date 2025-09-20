'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { SerpAnalysisForm, SerpAnalysisData } from '@/components/research/serp-analysis-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

interface SerpResult {
  keyword: string
  type: 'organic' | 'local'
  totalResults: number
  items: Array<{
    type: string
    position: number
    title: string
    url: string
    domain: string
    description?: string
    serpFeatures: string[]
  }>
  serpFeatures: string[]
  contentTypes: { [key: string]: number }
  keywordDifficulty: number
}

interface QueryResult {
  query: {
    id: string
    status: string
    parameters: SerpAnalysisData
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

export default function SerpAnalysisPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuery, setCurrentQuery] = useState<QueryStatus | null>(null)
  const [results, setResults] = useState<QueryResult | null>(null)
  const [serpResults, setSerpResults] = useState<SerpResult[]>([])

  const handleSubmit = async (data: SerpAnalysisData) => {
    if (!session?.user?.accessToken) {
      router.push('/auth/signin')
      return
    }

    setIsLoading(true)
    setCurrentQuery(null)
    setResults(null)
    setSerpResults([])

    try {
      const response = await fetch('/api/research/serp-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to start SERP analysis')
      }

      const { queryId } = await response.json()
      pollQueryStatus(queryId)

    } catch (error) {
      console.error('SERP analysis error:', error)
      setIsLoading(false)
    }
  }

  const pollQueryStatus = async (queryId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/research/serp-analysis/${queryId}/status`, {
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

          const resultsResponse = await fetch(`/api/research/serp-analysis/${queryId}`, {
            headers: {
              'Authorization': `Bearer ${session?.user?.accessToken}`
            }
          })

          if (resultsResponse.ok) {
            const resultsData: QueryResult = await resultsResponse.json()
            setResults(resultsData)
            processSerpResults(resultsData)
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
    }, 3000)

    setTimeout(() => {
      clearInterval(pollInterval)
      if (isLoading) setIsLoading(false)
    }, 600000)
  }

  const processSerpResults = (resultsData: QueryResult) => {
    const serpDataset = resultsData.tasks
      .flatMap(task => task.datasets)
      .find(dataset => dataset.type === 'SERP_DATA')

    if (serpDataset?.data) {
      setSerpResults(serpDataset.data)
    }
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

  const getSerpFeatureBadgeColor = (feature: string) => {
    const colorMap: { [key: string]: string } = {
      'featured_snippet': 'bg-blue-100 text-blue-800',
      'people_also_ask': 'bg-green-100 text-green-800',
      'local_pack': 'bg-purple-100 text-purple-800',
      'images': 'bg-orange-100 text-orange-800',
      'videos': 'bg-red-100 text-red-800',
      'shopping': 'bg-yellow-100 text-yellow-800'
    }
    return colorMap[feature] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SERP Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Analyze search results, competitors, and SERP features for your target keywords
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SerpAnalysisForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>

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
                          <Badge variant={getStatusColor(task.status) as any} className="text-xs">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SERP Results */}
          {results && serpResults.length > 0 && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.target className="h-5 w-5" />
                    SERP Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{serpResults.length}</div>
                      <div className="text-sm text-muted-foreground">Keywords Analyzed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(serpResults.reduce((sum, r) => sum + r.totalResults, 0) / serpResults.length).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg. Results</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {Array.from(new Set(serpResults.flatMap(r => r.serpFeatures))).length}
                      </div>
                      <div className="text-sm text-muted-foreground">SERP Features</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(serpResults.reduce((sum, r) => sum + r.keywordDifficulty, 0) / serpResults.length)}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg. Difficulty</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SERP Features Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.zap className="h-5 w-5" />
                    SERP Features Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(serpResults.flatMap(r => r.serpFeatures))).map(feature => (
                      <Badge
                        key={feature}
                        className={getSerpFeatureBadgeColor(feature)}
                        variant="secondary"
                      >
                        {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Results Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.fileText className="h-5 w-5" />
                    Keyword Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Results</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>SERP Features</TableHead>
                        <TableHead>Top Domain</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serpResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{result.keyword}</TableCell>
                          <TableCell>
                            <Badge variant={result.type === 'organic' ? 'default' : 'secondary'}>
                              {result.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{result.totalResults.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                result.keywordDifficulty <= 30 ? 'text-green-600' :
                                result.keywordDifficulty <= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {result.keywordDifficulty}
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    result.keywordDifficulty <= 30 ? 'bg-green-500' :
                                    result.keywordDifficulty <= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${result.keywordDifficulty}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {result.serpFeatures.slice(0, 3).map(feature => (
                                <Badge key={feature} variant="outline" className="text-xs">
                                  {feature.replace('_', ' ')}
                                </Badge>
                              ))}
                              {result.serpFeatures.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{result.serpFeatures.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {result.items.find(item => item.position === 1)?.domain || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* AI Insights */}
              {results.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.brain className="h-5 w-5" />
                      AI Analysis & Recommendations
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

                        {insight.content.recommendations && (
                          <div>
                            <h4 className="font-medium mb-2">Key Recommendations</h4>
                            <div className="space-y-2">
                              {insight.content.recommendations.slice(0, 5).map((rec: any, i: number) => (
                                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-start justify-between mb-1">
                                    <h5 className="font-medium text-sm">{rec.title}</h5>
                                    <div className="flex gap-1">
                                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'warning' : 'secondary'} className="text-xs">
                                        {rec.priority}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {rec.effort}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Empty State */}
          {!currentQuery && !results && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Icons.target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start Your SERP Analysis</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter your target keywords to analyze search results and competition
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Get insights on SERP features, ranking opportunities, and competitor analysis
                    to improve your search visibility.
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