'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface KeywordDiscoveryFormProps {
  onSubmit: (data: KeywordDiscoveryData) => void
  isLoading?: boolean
  className?: string
}

export interface KeywordDiscoveryData {
  seedKeywords: string[]
  location: string
  language: string
  includeQuestions: boolean
  includeLongTail: boolean
  minSearchVolume: number
  maxKeywordDifficulty: number
  analysisDepth: 'quick' | 'standard' | 'comprehensive'
}

const LOCATIONS = [
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Brazil', label: 'Brazil' },
]

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Dutch', label: 'Dutch' },
]

export function KeywordDiscoveryForm({ onSubmit, isLoading, className }: KeywordDiscoveryFormProps) {
  const [formData, setFormData] = useState<KeywordDiscoveryData>({
    seedKeywords: [],
    location: 'United States',
    language: 'English',
    includeQuestions: true,
    includeLongTail: true,
    minSearchVolume: 100,
    maxKeywordDifficulty: 70,
    analysisDepth: 'standard',
  })

  const [keywordInput, setKeywordInput] = useState('')

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.seedKeywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        seedKeywords: [...prev.seedKeywords, keywordInput.trim()]
      }))
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seedKeywords: prev.seedKeywords.filter(k => k !== keyword)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.seedKeywords.length === 0) return
    onSubmit(formData)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.search className="h-5 w-5" />
          Keyword Discovery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seed Keywords */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Seed Keywords *
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter a keyword (e.g., 'digital marketing')"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="button" onClick={addKeyword} disabled={!keywordInput.trim()}>
                <Icons.plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.seedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.seedKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-primary/70"
                    >
                      <Icons.x className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add 1-5 seed keywords to discover related opportunities
            </p>
          </div>

          {/* Location & Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              >
                {LOCATIONS.map(location => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
              >
                {LANGUAGES.map(language => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Search Filters</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Min Search Volume: {formData.minSearchVolume.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={formData.minSearchVolume}
                  onChange={(e) => setFormData(prev => ({ ...prev, minSearchVolume: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Max Keyword Difficulty: {formData.maxKeywordDifficulty}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.maxKeywordDifficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxKeywordDifficulty: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Discovery Options</h4>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeQuestions}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeQuestions: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Include question-based keywords</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeLongTail}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeLongTail: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Include long-tail keywords (3+ words)</span>
              </label>
            </div>
          </div>

          {/* Analysis Depth */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Analysis Depth</h4>
            <div className="flex gap-2">
              {[
                { value: 'quick', label: 'Quick', desc: 'Basic keyword suggestions' },
                { value: 'standard', label: 'Standard', desc: 'Includes competition analysis' },
                { value: 'comprehensive', label: 'Comprehensive', desc: 'Full analysis with AI insights' },
              ].map((option) => (
                <label key={option.value} className="flex-1">
                  <input
                    type="radio"
                    name="analysisDepth"
                    value={option.value}
                    checked={formData.analysisDepth === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, analysisDepth: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all",
                    formData.analysisDepth === option.value
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
            disabled={isLoading || formData.seedKeywords.length === 0}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Discovering Keywords...
              </>
            ) : (
              <>
                <Icons.search className="mr-2 h-4 w-4" />
                Discover Keywords
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}