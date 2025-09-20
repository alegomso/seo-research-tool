'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CompetitorResearchForm, CompetitorResearchData } from '@/components/research/competitor-research-form'
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

interface CompetitorAnalysisResult {
  targetDomainData: {
    domain: string
    totalKeywords: number
    organicTraffic: number
    averagePosition: number
    topKeywords: Array<{
      keyword: string
      position: number
      searchVolume: number
      traffic: number
    }>
  }
  competitorData: Array<{
    domain: string
    totalKeywords: number
    organicTraffic: number
    averagePosition: number
    competitiveStrength: string
  }>
  gapAnalysis: {
    keywordGaps: Array<{
      keyword: string
      searchVolume: number
      competitorPosition: number
      competitorDomain: string
      opportunity: string
    }>
    opportunityKeywords: Array<{
      keyword: string
      searchVolume: number
      opportunity: string
    }>
  }
  marketOverview: {
    totalKeywords: number
    averagePosition: number
    marketShare: { [domain: string]: { percentage: number; traffic: number } }
    topPerformers: Array<{
      domain: string
      organicTraffic: number
      totalKeywords: number
    }>
  }
}

interface QueryResult {
  query: {
    id: string
    status: string
    parameters: CompetitorResearchData
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

export default function CompetitorResearchPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuery, setCurrentQuery] = useState<QueryStatus | null>(null)
  const [results, setResults] = useState<QueryResult | null>(null)
  const [analysisData, setAnalysisData] = useState<CompetitorAnalysisResult | null>(null)

  const handleSubmit = async (data: CompetitorResearchData) => {
    if (!session?.user?.accessToken) {
      router.push('/auth/signin')
      return
    }

    setIsLoading(true)
    setCurrentQuery(null)
    setResults(null)
    setAnalysisData(null)

    try {
      const response = await fetch('/api/research/competitor-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to start competitor research')
      }

      const { queryId } = await response.json()
      pollQueryStatus(queryId)

    } catch (error) {
      console.error('Competitor research error:', error)
      setIsLoading(false)
    }
  }

  const pollQueryStatus = async (queryId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/research/competitor-research/${queryId}/status`, {
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

          const resultsResponse = await fetch(`/api/research/competitor-research/${queryId}`, {
            headers: {
              'Authorization': `Bearer ${session?.user?.accessToken}`
            }
          })

          if (resultsResponse.ok) {
            const resultsData: QueryResult = await resultsResponse.json()
            setResults(resultsData)
            processCompetitorResults(resultsData)
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
    }, 5000) // Poll every 5 seconds for competitor research (slower process)

    setTimeout(() => {
      clearInterval(pollInterval)
      if (isLoading) setIsLoading(false)
    }, 900000) // 15 minutes timeout
  }

  const processCompetitorResults = (resultsData: QueryResult) => {
    const analysisDataset = resultsData.tasks
      .flatMap(task => task.datasets)
      .find(dataset => dataset.type === 'COMPETITOR_ANALYSIS')

    if (analysisDataset?.data) {
      setAnalysisData(analysisDataset.data)
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

  const getCompetitiveStrengthColor = (strength: string) => {
    switch (strength.toLowerCase()) {
      case 'very strong': return 'destructive'
      case 'strong': return 'warning'
      case 'moderate': return 'secondary'
      case 'weak': return 'success'
      default: return 'secondary'
    }
  }

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity.toLowerCase()) {
      case 'high': return 'success'
      case 'medium': return 'warning'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competitor Research</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your competitors' SEO strategies and discover keyword opportunities
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CompetitorResearchForm
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

                  {currentQuery.status === 'IN_PROGRESS' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        This analysis may take 10-15 minutes as we analyze multiple domains and thousands of keywords.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {results && analysisData && (
            <div className="space-y-6">
              {/* Market Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.chart className="h-5 w-5" />
                    Market Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysisData.marketOverview.totalKeywords.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Keywords</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysisData.marketOverview.averagePosition.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Avg Position</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysisData.competitorData.length + 1}</div>
                      <div className="text-sm text-muted-foreground">Domains Analyzed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysisData.gapAnalysis.opportunityKeywords.length}</div>
                      <div className="text-sm text-muted-foreground">Opportunities</div>
                    </div>
                  </div>

                  {/* Market Share Chart */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Market Share by Traffic</h4>
                    {Object.entries(analysisData.marketOverview.marketShare)
                      .sort(([,a], [,b]) => b.traffic - a.traffic)
                      .map(([domain, data]) => (
                        <div key={domain} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">
                              {domain === analysisData?.targetDomainData.domain ? `${domain} (You)` : domain}
                            </span>
                            <span>{data.percentage.toFixed(1)}% ({data.traffic.toLocaleString()} traffic)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                domain === analysisData?.targetDomainData.domain ? 'bg-primary' : 'bg-gray-400'
                              }`}
                              style={{ width: `${Math.max(data.percentage, 2)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Competitor Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.users className="h-5 w-5" />
                    Competitor Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Total Keywords</TableHead>
                        <TableHead>Organic Traffic</TableHead>
                        <TableHead>Avg Position</TableHead>
                        <TableHead>Strength</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Your domain first */}
                      <TableRow className="bg-primary/5">
                        <TableCell className="font-medium">
                          {analysisData.targetDomainData.domain}
                          <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                        </TableCell>
                        <TableCell>{analysisData.targetDomainData.totalKeywords.toLocaleString()}</TableCell>
                        <TableCell>{analysisData.targetDomainData.organicTraffic.toLocaleString()}</TableCell>
                        <TableCell>{analysisData.targetDomainData.averagePosition.toFixed(1)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Target</Badge>
                        </TableCell>
                      </TableRow>

                      {/* Competitors */}
                      {analysisData.competitorData
                        .sort((a, b) => b.organicTraffic - a.organicTraffic)
                        .map((competitor, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{competitor.domain}</TableCell>
                            <TableCell>{competitor.totalKeywords.toLocaleString()}</TableCell>
                            <TableCell>{competitor.organicTraffic.toLocaleString()}</TableCell>
                            <TableCell>{competitor.averagePosition.toFixed(1)}</TableCell>
                            <TableCell>
                              <Badge variant={getCompetitiveStrengthColor(competitor.competitiveStrength) as any}>
                                {competitor.competitiveStrength}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Keyword Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.target className="h-5 w-5" />
                    Keyword Gap Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Keywords your competitors rank for that you don't. Sorted by opportunity level.
                    </p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keyword</TableHead>
                        <TableHead>Search Volume</TableHead>
                        <TableHead>Competitor Domain</TableHead>
                        <TableHead>Their Position</TableHead>
                        <TableHead>Opportunity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisData.gapAnalysis.keywordGaps
                        .sort((a, b) => {
                          const opportunityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                          return (opportunityOrder[b.opportunity as keyof typeof opportunityOrder] || 0) -
                                 (opportunityOrder[a.opportunity as keyof typeof opportunityOrder] || 0);
                        })
                        .slice(0, 20)
                        .map((gap, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{gap.keyword}</TableCell>
                            <TableCell>{gap.searchVolume.toLocaleString()}</TableCell>
                            <TableCell>{gap.competitorDomain}</TableCell>
                            <TableCell>#{gap.competitorPosition}</TableCell>
                            <TableCell>
                              <Badge variant={getOpportunityColor(gap.opportunity) as any}>
                                {gap.opportunity}
                              </Badge>
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
                      Strategic Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.insights.map((insight, index) => (
                      <div key={index} className="space-y-4">
                        {insight.content.summary && (
                          <div>
                            <h4 className="font-medium mb-2">Executive Summary</h4>
                            <p className="text-sm text-muted-foreground">{insight.content.summary}</p>
                          </div>
                        )}

                        {insight.content.recommendations && (
                          <div>
                            <h4 className="font-medium mb-2">Strategic Actions</h4>
                            <div className="space-y-3">
                              {insight.content.recommendations.slice(0, 5).map((rec: any, i: number) => (
                                <div key={i} className="p-4 border rounded-lg">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-medium">{rec.title}</h5>
                                    <div className="flex gap-2">
                                      <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'warning' : 'secondary'}>
                                        {rec.priority}
                                      </Badge>
                                      <Badge variant="outline">
                                        {rec.effort}
                                      </Badge>
                                      <Badge variant={rec.impact === 'high' ? 'success' : rec.impact === 'medium' ? 'warning' : 'secondary'}>
                                        {rec.impact} impact
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{rec.description}</p>
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
                  <Icons.users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start Competitor Research</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter your domain and competitor domains to analyze keyword gaps and opportunities
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This comprehensive analysis will show you where your competitors are winning
                    and reveal untapped keyword opportunities for your SEO strategy.
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