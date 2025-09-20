'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export interface KeywordResult {
  keyword: string
  searchVolume: number
  cpc: number
  competition: number
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  keywordDifficulty?: number
  trend: 'up' | 'down' | 'stable'
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational'
  monthlySearches?: Array<{ month: number; volume: number }>
}

interface KeywordResultsTableProps {
  keywords: KeywordResult[]
  isLoading?: boolean
  onExport?: (format: 'csv' | 'xlsx') => void
  onKeywordSelect?: (keywords: KeywordResult[]) => void
  className?: string
}

type SortField = 'keyword' | 'searchVolume' | 'cpc' | 'competition' | 'keywordDifficulty'
type SortDirection = 'asc' | 'desc'

export function KeywordResultsTable({
  keywords,
  isLoading = false,
  onExport,
  onKeywordSelect,
  className
}: KeywordResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('searchVolume')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterCompetition, setFilterCompetition] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL')
  const [filterIntent, setFilterIntent] = useState<'ALL' | KeywordResult['intent']>('ALL')

  // Filter and sort keywords
  const filteredAndSortedKeywords = useMemo(() => {
    let filtered = keywords.filter(keyword => {
      const matchesSearch = keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCompetition = filterCompetition === 'ALL' || keyword.competitionLevel === filterCompetition
      const matchesIntent = filterIntent === 'ALL' || keyword.intent === filterIntent

      return matchesSearch && matchesCompetition && matchesIntent
    })

    return filtered.sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })
  }, [keywords, searchTerm, sortField, sortDirection, filterCompetition, filterIntent])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleKeywordSelection = (keyword: string) => {
    const newSelected = new Set(selectedKeywords)
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword)
    } else {
      newSelected.add(keyword)
    }
    setSelectedKeywords(newSelected)

    if (onKeywordSelect) {
      const selectedKeywordObjects = keywords.filter(k => newSelected.has(k.keyword))
      onKeywordSelect(selectedKeywordObjects)
    }
  }

  const selectAllVisible = () => {
    const visibleKeywords = filteredAndSortedKeywords.map(k => k.keyword)
    setSelectedKeywords(new Set(visibleKeywords))

    if (onKeywordSelect) {
      onKeywordSelect(filteredAndSortedKeywords)
    }
  }

  const clearSelection = () => {
    setSelectedKeywords(new Set())
    if (onKeywordSelect) {
      onKeywordSelect([])
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'success'
      case 'MEDIUM': return 'warning'
      case 'HIGH': return 'destructive'
      default: return 'secondary'
    }
  }

  const getIntentColor = (intent: KeywordResult['intent']) => {
    switch (intent) {
      case 'commercial': return 'default'
      case 'transactional': return 'success'
      case 'informational': return 'secondary'
      case 'navigational': return 'outline'
      default: return 'secondary'
    }
  }

  const getTrendIcon = (trend: KeywordResult['trend']) => {
    switch (trend) {
      case 'up': return <Icons.arrowUp className="h-3 w-3 text-green-600" />
      case 'down': return <Icons.arrowDown className="h-3 w-3 text-red-600" />
      case 'stable': return <span className="text-gray-400">—</span>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icons.spinner className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading keyword data...</span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:max-w-xs"
          />

          <select
            value={filterCompetition}
            onChange={(e) => setFilterCompetition(e.target.value as any)}
            className="flex h-9 w-full sm:w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Competition</option>
            <option value="LOW">Low Competition</option>
            <option value="MEDIUM">Medium Competition</option>
            <option value="HIGH">High Competition</option>
          </select>

          <select
            value={filterIntent}
            onChange={(e) => setFilterIntent(e.target.value as any)}
            className="flex h-9 w-full sm:w-auto rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Intent</option>
            <option value="informational">Informational</option>
            <option value="commercial">Commercial</option>
            <option value="transactional">Transactional</option>
            <option value="navigational">Navigational</option>
          </select>
        </div>

        <div className="flex gap-2">
          {selectedKeywords.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear ({selectedKeywords.size})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={selectAllVisible}>
            Select All
          </Button>
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
              <Icons.download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedKeywords.length} of {keywords.length} keywords
        {selectedKeywords.size > 0 && ` • ${selectedKeywords.size} selected`}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input
                  type="checkbox"
                  checked={selectedKeywords.size === filteredAndSortedKeywords.length && filteredAndSortedKeywords.length > 0}
                  onChange={selectedKeywords.size === filteredAndSortedKeywords.length ? clearSelection : selectAllVisible}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('keyword')}
                >
                  Keyword
                  {sortField === 'keyword' && (
                    sortDirection === 'asc' ? <Icons.arrowUp className="ml-1 h-3 w-3" /> : <Icons.arrowDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('searchVolume')}
                >
                  Volume
                  {sortField === 'searchVolume' && (
                    sortDirection === 'asc' ? <Icons.arrowUp className="ml-1 h-3 w-3" /> : <Icons.arrowDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium"
                  onClick={() => handleSort('cpc')}
                >
                  CPC
                  {sortField === 'cpc' && (
                    sortDirection === 'asc' ? <Icons.arrowUp className="ml-1 h-3 w-3" /> : <Icons.arrowDown className="ml-1 h-3 w-3" />
                  )}
                </Button>
              </TableHead>
              <TableHead>Competition</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Trend</TableHead>
              {keywords.some(k => k.keywordDifficulty !== undefined) && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort('keywordDifficulty')}
                  >
                    Difficulty
                    {sortField === 'keywordDifficulty' && (
                      sortDirection === 'asc' ? <Icons.arrowUp className="ml-1 h-3 w-3" /> : <Icons.arrowDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedKeywords.map((keyword) => (
              <TableRow
                key={keyword.keyword}
                className={cn(
                  "cursor-pointer",
                  selectedKeywords.has(keyword.keyword) && "bg-muted/50"
                )}
                onClick={() => toggleKeywordSelection(keyword.keyword)}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedKeywords.has(keyword.keyword)}
                    onChange={() => toggleKeywordSelection(keyword.keyword)}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {keyword.keyword}
                </TableCell>
                <TableCell>
                  {formatNumber(keyword.searchVolume)}
                </TableCell>
                <TableCell>
                  ${keyword.cpc.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={getCompetitionColor(keyword.competitionLevel) as any} className="text-xs">
                    {keyword.competitionLevel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getIntentColor(keyword.intent)} className="text-xs capitalize">
                    {keyword.intent}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getTrendIcon(keyword.trend)}
                </TableCell>
                {keywords.some(k => k.keywordDifficulty !== undefined) && (
                  <TableCell>
                    {keyword.keywordDifficulty !== undefined ? (
                      <span className={cn(
                        "font-medium",
                        keyword.keywordDifficulty <= 30 ? "text-green-600" :
                        keyword.keywordDifficulty <= 60 ? "text-yellow-600" :
                        "text-red-600"
                      )}>
                        {keyword.keywordDifficulty}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAndSortedKeywords.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm || filterCompetition !== 'ALL' || filterIntent !== 'ALL'
              ? 'No keywords match your filters'
              : 'No keywords found'
            }
          </div>
        )}
      </div>
    </div>
  )
}