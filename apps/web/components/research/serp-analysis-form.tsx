'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface SerpAnalysisFormProps {
  onSubmit: (data: SerpAnalysisData) => void
  isLoading?: boolean
  className?: string
}

export interface SerpAnalysisData {
  keywords: string[]
  location: string
  language: string
  device: 'desktop' | 'mobile' | 'tablet'
  includeAds: boolean
  includeLocal: boolean
  includeFeatured: boolean
  analysisType: 'snapshot' | 'competitor' | 'features' | 'comprehensive'
  competitorDomains?: string[]
}

const DEVICES = [
  { value: 'desktop', label: 'Desktop', icon: '🖥️' },
  { value: 'mobile', label: 'Mobile', icon: '📱' },
  { value: 'tablet', label: 'Tablet', icon: '📱' },
]

const ANALYSIS_TYPES = [
  {
    value: 'snapshot',
    label: 'SERP Snapshot',
    description: 'Quick overview of current rankings',
    features: ['Current positions', 'SERP features', 'Basic metrics']
  },
  {
    value: 'competitor',
    label: 'Competitor Analysis',
    description: 'Focus on competitor performance',
    features: ['Competitor rankings', 'Market share', 'Opportunity gaps']
  },
  {
    value: 'features',
    label: 'SERP Features',
    description: 'Analyze rich results opportunities',
    features: ['Featured snippets', 'People Also Ask', 'Local pack', 'Images/Videos']
  },
  {
    value: 'comprehensive',
    label: 'Full Analysis',
    description: 'Complete SERP analysis with AI insights',
    features: ['All above features', 'AI recommendations', 'Content strategy']
  }
]

export function SerpAnalysisForm({ onSubmit, isLoading, className }: SerpAnalysisFormProps) {
  const [formData, setFormData] = useState<SerpAnalysisData>({
    keywords: [],
    location: 'United States',
    language: 'English',
    device: 'desktop',
    includeAds: true,
    includeLocal: true,
    includeFeatured: true,
    analysisType: 'snapshot',
    competitorDomains: [],
  })

  const [keywordInput, setKeywordInput] = useState('')
  const [competitorInput, setCompetitorInput] = useState('')

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }))
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const addCompetitor = () => {
    if (competitorInput.trim() && !formData.competitorDomains?.includes(competitorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        competitorDomains: [...(prev.competitorDomains || []), competitorInput.trim()]
      }))
      setCompetitorInput('')
    }
  }

  const removeCompetitor = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      competitorDomains: prev.competitorDomains?.filter(d => d !== domain)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.keywords.length === 0) return
    onSubmit(formData)
  }

  const isCompetitorAnalysis = formData.analysisType === 'competitor' || formData.analysisType === 'comprehensive'

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.target className="h-5 w-5" />
          SERP Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Keywords */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Target Keywords *
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter a keyword to analyze"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addKeyword()
                  }
                }}
                className="flex-1"
              />
              <Button type="button" onClick={addKeyword} disabled={!keywordInput.trim()}>
                <Icons.plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-destructive"
                    >
                      <Icons.x className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Analysis Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ANALYSIS_TYPES.map((type) => (
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
                    <div className="font-medium text-sm mb-1">{type.label}</div>
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
              ))}
            </div>
          </div>

          {/* Competitor Domains (for competitor analysis) */}
          {isCompetitorAnalysis && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Competitor Domains
                {formData.analysisType === 'competitor' && ' *'}
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="example.com (without https://)"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCompetitor()
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" onClick={addCompetitor} disabled={!competitorInput.trim()}>
                  <Icons.plus className="h-4 w-4" />
                </Button>
              </div>
              {(formData.competitorDomains?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.competitorDomains?.map((domain) => (
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
              )}
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
                <option value="Spain">Spain</option>
                <option value="Brazil">Brazil</option>
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
                <option value="Portuguese">Portuguese</option>
              </select>
            </div>
          </div>

          {/* Device */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Device</label>
            <div className="flex gap-2">
              {DEVICES.map((device) => (
                <label key={device.value} className="flex-1">
                  <input
                    type="radio"
                    name="device"
                    value={device.value}
                    checked={formData.device === device.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, device: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className={cn(
                    "p-3 border rounded-lg cursor-pointer text-center transition-all",
                    formData.device === device.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}>
                    <div className="text-lg mb-1">{device.icon}</div>
                    <div className="text-sm font-medium">{device.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* SERP Feature Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Include SERP Features</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeAds}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeAds: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Paid advertisements</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeLocal}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeLocal: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Local pack results</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeFeatured}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeFeatured: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Featured snippets and rich results</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              formData.keywords.length === 0 ||
              (formData.analysisType === 'competitor' && (formData.competitorDomains?.length || 0) === 0)
            }
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Analyzing SERP...
              </>
            ) : (
              <>
                <Icons.target className="mr-2 h-4 w-4" />
                Analyze SERP
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}