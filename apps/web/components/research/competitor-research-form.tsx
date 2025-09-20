'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface CompetitorResearchFormProps {
  onSubmit: (data: CompetitorResearchData) => void
  isLoading?: boolean
  className?: string
}

export interface CompetitorResearchData {
  targetDomain: string
  competitorDomains: string[]
  location: string
  language: string
  analysisType: 'keywords' | 'content' | 'backlinks' | 'comprehensive'
  keywordFilters: {
    minSearchVolume: number
    maxPosition: number
    includeQuestions: boolean
    includeBranded: boolean
  }
  contentFilters: {
    includePages: boolean
    includeTopics: boolean
    includeGaps: boolean
  }
  reportDepth: 'overview' | 'detailed' | 'comprehensive'
}

const ANALYSIS_TYPES = [
  {
    value: 'keywords',
    label: 'Keyword Gap Analysis',
    description: 'Find keywords competitors rank for that you don\'t',
    icon: Icons.search,
    features: ['Keyword opportunities', 'Ranking gaps', 'Quick wins']
  },
  {
    value: 'content',
    label: 'Content Gap Analysis',
    description: 'Identify content topics and formats competitors use',
    icon: Icons.fileText,
    features: ['Content topics', 'Page performance', 'Content formats']
  },
  {
    value: 'backlinks',
    label: 'Backlink Analysis',
    description: 'Analyze competitor link building strategies',
    icon: Icons.externalLink,
    features: ['Link opportunities', 'Authority sources', 'Link strategies']
  },
  {
    value: 'comprehensive',
    label: 'Full Competitive Analysis',
    description: 'Complete analysis with AI-powered insights',
    icon: Icons.brain,
    features: ['All analysis types', 'AI recommendations', 'Strategic insights']
  }
]

export function CompetitorResearchForm({ onSubmit, isLoading, className }: CompetitorResearchFormProps) {
  const [formData, setFormData] = useState<CompetitorResearchData>({
    targetDomain: '',
    competitorDomains: [],
    location: 'United States',
    language: 'English',
    analysisType: 'keywords',
    keywordFilters: {
      minSearchVolume: 100,
      maxPosition: 20,
      includeQuestions: true,
      includeBranded: false,
    },
    contentFilters: {
      includePages: true,
      includeTopics: true,
      includeGaps: true,
    },
    reportDepth: 'detailed',
  })

  const [competitorInput, setCompetitorInput] = useState('')
  const [domainError, setDomainError] = useState('')

  const validateDomain = (domain: string) => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
    return domainRegex.test(domain.replace(/^https?:\/\//, '').replace(/^www\./, ''))
  }

  const cleanDomain = (domain: string) => {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .toLowerCase()
  }

  const addCompetitor = () => {
    const cleanedDomain = cleanDomain(competitorInput)

    if (!cleanedDomain) return

    if (!validateDomain(cleanedDomain)) {
      setDomainError('Please enter a valid domain (e.g., example.com)')
      return
    }

    if (formData.competitorDomains.includes(cleanedDomain)) {
      setDomainError('This domain is already added')
      return
    }

    if (cleanedDomain === cleanDomain(formData.targetDomain)) {
      setDomainError('Competitor domain cannot be the same as target domain')
      return
    }

    setFormData(prev => ({
      ...prev,
      competitorDomains: [...prev.competitorDomains, cleanedDomain]
    }))
    setCompetitorInput('')
    setDomainError('')
  }

  const removeCompetitor = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      competitorDomains: prev.competitorDomains.filter(d => d !== domain)
    }))
  }

  const handleTargetDomainChange = (value: string) => {
    const cleanedDomain = cleanDomain(value)
    setFormData(prev => ({ ...prev, targetDomain: cleanedDomain }))

    if (cleanedDomain && !validateDomain(cleanedDomain)) {
      setDomainError('Please enter a valid domain')
    } else {
      setDomainError('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.targetDomain || !validateDomain(formData.targetDomain)) {
      setDomainError('Please enter a valid target domain')
      return
    }

    if (formData.competitorDomains.length === 0) {
      setDomainError('Please add at least one competitor domain')
      return
    }

    onSubmit(formData)
  }

  const selectedAnalysisType = ANALYSIS_TYPES.find(type => type.value === formData.analysisType)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.users className="h-5 w-5" />
          Competitor Research
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Domain */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Your Domain *
            </label>
            <Input
              placeholder="yourdomain.com"
              value={formData.targetDomain}
              onChange={(e) => handleTargetDomainChange(e.target.value)}
              className={cn(domainError && !formData.targetDomain ? "border-red-500" : "")}
            />
            <p className="text-xs text-muted-foreground">
              Enter your domain without https:// or www.
            </p>
          </div>

          {/* Competitor Domains */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Competitor Domains *
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="competitor.com"
                value={competitorInput}
                onChange={(e) => {
                  setCompetitorInput(e.target.value)
                  setDomainError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCompetitor()
                  }
                }}
                className={cn("flex-1", domainError ? "border-red-500" : "")}
              />
              <Button
                type="button"
                onClick={addCompetitor}
                disabled={!competitorInput.trim()}
              >
                <Icons.plus className="h-4 w-4" />
              </Button>
            </div>
            {domainError && (
              <p className="text-xs text-red-500">{domainError}</p>
            )}

            {formData.competitorDomains.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {formData.competitorDomains.map((domain) => (
                    <Badge key={domain} variant="outline" className="gap-1">
                      <Icons.globe className="h-3 w-3" />
                      {domain}
                      <button
                        type="button"
                        onClick={() => removeCompetitor(domain)}
                        className="hover:text-destructive"
                      >
                        <Icons.x className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.competitorDomains.length} competitor{formData.competitorDomains.length !== 1 ? 's' : ''} added
                </p>
              </div>
            )}
          </div>

          {/* Analysis Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Analysis Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ANALYSIS_TYPES.map((type) => {
                const IconComponent = type.icon
                return (
                  <label key={type.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="analysisType"
                      value={type.value}
                      checked={formData.analysisType === type.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, analysisType: e.target.value as any }))}
                      className="sr-only"
                    />
                    <div className={cn(
                      "p-4 border rounded-lg transition-all",
                      formData.analysisType === type.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-4 w-4" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{type.description}</div>
                      <div className="flex flex-wrap gap-1">
                        {type.features.map((feature, i) => (
                          <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Keyword Filters (for keyword analysis) */}
          {(formData.analysisType === 'keywords' || formData.analysisType === 'comprehensive') && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Keyword Filters</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Min Search Volume: {formData.keywordFilters.minSearchVolume.toLocaleString()}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={formData.keywordFilters.minSearchVolume}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      keywordFilters: { ...prev.keywordFilters, minSearchVolume: Number(e.target.value) }
                    }))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Max Competitor Position: {formData.keywordFilters.maxPosition}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={formData.keywordFilters.maxPosition}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      keywordFilters: { ...prev.keywordFilters, maxPosition: Number(e.target.value) }
                    }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.keywordFilters.includeQuestions}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      keywordFilters: { ...prev.keywordFilters, includeQuestions: e.target.checked }
                    }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Include question-based keywords</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.keywordFilters.includeBranded}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      keywordFilters: { ...prev.keywordFilters, includeBranded: e.target.checked }
                    }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Include branded keywords</span>
                </label>
              </div>
            </div>
          )}

          {/* Location & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              >
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>
          </div>

          {/* Report Depth */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Report Depth</label>
            <div className="flex gap-2">
              {[
                { value: 'overview', label: 'Overview', desc: 'Key metrics and highlights' },
                { value: 'detailed', label: 'Detailed', desc: 'Comprehensive analysis' },
                { value: 'comprehensive', label: 'Expert', desc: 'Full analysis with AI insights' },
              ].map((option) => (
                <label key={option.value} className="flex-1">
                  <input
                    type="radio"
                    name="reportDepth"
                    value={option.value}
                    checked={formData.reportDepth === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportDepth: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all text-center",
                    formData.reportDepth === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}>
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !formData.targetDomain ||
              formData.competitorDomains.length === 0 ||
              !!domainError
            }
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Competitors...
              </>
            ) : (
              <>
                {selectedAnalysisType && <selectedAnalysisType.icon className="mr-2 h-4 w-4" />}
                Start Analysis
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}