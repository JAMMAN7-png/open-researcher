'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  SearchIcon,
  XIcon,
  CheckIcon,
  ZapIcon,
  DollarSignIcon,
  ArrowUpDownIcon,
  FilterIcon,
  SparklesIcon,
  StarIcon,
  ClockIcon,
  BrainIcon,
  ImageIcon,
  CodeIcon,
  GlobeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  Loader2Icon,
  InfoIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ModelInfo {
  id: string
  name: string
  provider: string
  contextLength: number
  maxOutput: number
  inputCost: number
  outputCost: number
  modality: string
}

interface ModelSelectorProps {
  models: ModelInfo[]
  selectedModel: string
  onSelectModel: (modelId: string) => void
  isLoading?: boolean
  onReload?: () => void
  llmProvider: 'anthropic' | 'openrouter'
}

type SortField = 'name' | 'provider' | 'contextLength' | 'inputCost' | 'outputCost' | 'maxOutput'
type SortDirection = 'asc' | 'desc'

interface FilterState {
  freeOnly: boolean
  minContext: number | null
  maxCost: number | null
  modalities: string[]
  providers: string[]
}

// Provider colors for visual distinction
const PROVIDER_COLORS: Record<string, string> = {
  'anthropic': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'openai': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'google': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'meta-llama': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'mistralai': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'deepseek': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'cohere': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'default': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

// Category definitions for grouping
const MODEL_CATEGORIES = {
  'Free Models': (m: ModelInfo) => m.inputCost === 0 && m.outputCost === 0,
  'Budget Friendly': (m: ModelInfo) => m.inputCost > 0 && m.inputCost < 1,
  'Premium': (m: ModelInfo) => m.inputCost >= 1 && m.inputCost < 10,
  'Enterprise': (m: ModelInfo) => m.inputCost >= 10,
}

const CONTEXT_PRESETS = [
  { label: 'Any', value: null },
  { label: '16K+', value: 16000 },
  { label: '32K+', value: 32000 },
  { label: '128K+', value: 128000 },
  { label: '200K+', value: 200000 },
  { label: '1M+', value: 1000000 },
]

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  isLoading = false,
  onReload,
  llmProvider,
}: ModelSelectorProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grouped' | 'categories'>('grouped')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Anthropic', 'Free Models']))
  const [filters, setFilters] = useState<FilterState>({
    freeOnly: false,
    minContext: null,
    maxCost: null,
    modalities: [],
    providers: [],
  })

  // Get unique providers and modalities from models
  const { uniqueProviders, uniqueModalities } = useMemo(() => {
    const providers = new Set<string>()
    const modalities = new Set<string>()
    
    models.forEach(m => {
      if (m.provider) providers.add(m.provider)
      if (m.modality) modalities.add(m.modality)
    })
    
    return {
      uniqueProviders: Array.from(providers).sort(),
      uniqueModalities: Array.from(modalities).sort(),
    }
  }, [models])

  // Filter models
  const filteredModels = useMemo(() => {
    return models.filter(model => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch = 
          model.name?.toLowerCase().includes(searchLower) ||
          model.id?.toLowerCase().includes(searchLower) ||
          model.provider?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Free only filter
      if (filters.freeOnly && (model.inputCost > 0 || model.outputCost > 0)) {
        return false
      }

      // Min context filter
      if (filters.minContext && model.contextLength < filters.minContext) {
        return false
      }

      // Max cost filter
      if (filters.maxCost && model.inputCost > filters.maxCost) {
        return false
      }

      // Provider filter
      if (filters.providers.length > 0 && !filters.providers.includes(model.provider)) {
        return false
      }

      // Modality filter
      if (filters.modalities.length > 0) {
        const hasModality = filters.modalities.some(mod => 
          model.modality?.toLowerCase().includes(mod.toLowerCase())
        )
        if (!hasModality) return false
      }

      return true
    })
  }, [models, search, filters])

  // Sort models
  const sortedModels = useMemo(() => {
    return [...filteredModels].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '')
          break
        case 'provider':
          comparison = (a.provider || '').localeCompare(b.provider || '')
          break
        case 'contextLength':
          comparison = (a.contextLength || 0) - (b.contextLength || 0)
          break
        case 'inputCost':
          comparison = (a.inputCost || 0) - (b.inputCost || 0)
          break
        case 'outputCost':
          comparison = (a.outputCost || 0) - (b.outputCost || 0)
          break
        case 'maxOutput':
          comparison = (a.maxOutput || 0) - (b.maxOutput || 0)
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredModels, sortField, sortDirection])

  // Group models by provider
  const groupedByProvider = useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {}
    
    sortedModels.forEach(model => {
      const provider = model.provider || 'Unknown'
      if (!groups[provider]) groups[provider] = []
      groups[provider].push(model)
    })
    
    return groups
  }, [sortedModels])

  // Group models by category (for OpenRouter)
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {}
    
    // Initialize categories
    Object.keys(MODEL_CATEGORIES).forEach(cat => {
      groups[cat] = []
    })
    
    sortedModels.forEach(model => {
      for (const [category, predicate] of Object.entries(MODEL_CATEGORIES)) {
        if (predicate(model)) {
          groups[category].push(model)
          break // Only add to first matching category
        }
      }
    })
    
    // Remove empty categories
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key]
    })
    
    return groups
  }, [sortedModels])

  // Toggle sort direction or change field
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  // Toggle group expansion
  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      freeOnly: false,
      minContext: null,
      maxCost: null,
      modalities: [],
      providers: [],
    })
    setSearch('')
  }, [])

  // Get current model info
  const currentModel = useMemo(() => {
    return models.find(m => m.id === selectedModel)
  }, [models, selectedModel])

  // Format helpers
  const formatCost = (cost: number): string => {
    if (cost === 0) return 'Free'
    if (cost < 0.01) return '<$0.01'
    if (cost < 1) return `$${cost.toFixed(3)}`
    return `$${cost.toFixed(2)}`
  }

  const formatContext = (length: number): string => {
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`
    if (length >= 1000) return `${Math.round(length / 1000)}K`
    return length.toString()
  }

  const getProviderColor = (provider: string): string => {
    const lower = provider.toLowerCase()
    for (const [key, value] of Object.entries(PROVIDER_COLORS)) {
      if (lower.includes(key)) return value
    }
    return PROVIDER_COLORS.default
  }

  const getModalityIcon = (modality: string) => {
    if (modality?.includes('image')) return <ImageIcon className="size-3" />
    if (modality?.includes('code')) return <CodeIcon className="size-3" />
    return <GlobeIcon className="size-3" />
  }

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.freeOnly) count++
    if (filters.minContext) count++
    if (filters.maxCost) count++
    if (filters.modalities.length > 0) count++
    if (filters.providers.length > 0) count++
    return count
  }, [filters])

  // Expand first group on mount
  useEffect(() => {
    if (models.length > 0 && expandedGroups.size === 0) {
      const firstProvider = Object.keys(groupedByProvider)[0]
      if (firstProvider) {
        setExpandedGroups(new Set([firstProvider]))
      }
    }
  }, [models, groupedByProvider, expandedGroups.size])

  // Render a single model row
  const renderModelRow = (model: ModelInfo) => (
    <button
      key={model.id}
      onClick={() => onSelectModel(model.id)}
      className={cn(
        'w-full px-3 py-2.5 text-left transition-all',
        'hover:bg-purple-50 dark:hover:bg-purple-900/20',
        'border-b border-gray-100 dark:border-gray-800 last:border-b-0',
        selectedModel === model.id && 'bg-purple-100 dark:bg-purple-900/30 border-purple-200'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{model.name}</span>
            {selectedModel === model.id && (
              <CheckIcon className="size-4 text-purple-600 flex-shrink-0" />
            )}
            {model.inputCost === 0 && model.outputCost === 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                FREE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn(
              'px-1.5 py-0.5 text-[10px] font-medium rounded',
              getProviderColor(model.provider)
            )}>
              {model.provider}
            </span>
            <span className="text-xs text-gray-400 truncate">{model.id}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 text-xs text-gray-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1" title="Context Length">
              <ZapIcon className="size-3 text-yellow-500" />
              {formatContext(model.contextLength)}
            </span>
            {getModalityIcon(model.modality)}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1" title="Input Cost / 1M tokens">
              <DollarSignIcon className="size-3 text-green-500" />
              {formatCost(model.inputCost)}
            </span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span title="Output Cost / 1M tokens">
              {formatCost(model.outputCost)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )

  // Render grouped view
  const renderGroupedView = (groups: Record<string, ModelInfo[]>) => (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {Object.entries(groups).map(([group, groupModels]) => (
        <div key={group}>
          <button
            onClick={() => toggleGroup(group)}
            className={cn(
              'w-full px-3 py-2 flex items-center justify-between',
              'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800',
              'sticky top-0 z-10'
            )}
          >
            <div className="flex items-center gap-2">
              {expandedGroups.has(group) ? (
                <ChevronDownIcon className="size-4 text-gray-400" />
              ) : (
                <ChevronRightIcon className="size-4 text-gray-400" />
              )}
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {group}
              </span>
              <span className="text-xs text-gray-400">
                ({groupModels.length})
              </span>
            </div>
            {group === 'Free Models' && (
              <SparklesIcon className="size-4 text-green-500" />
            )}
          </button>
          
          {expandedGroups.has(group) && (
            <div>
              {groupModels.map(renderModelRow)}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Current Selection Display */}
      {currentModel && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BrainIcon className="size-4 text-purple-600" />
                <span className="font-semibold text-sm">{currentModel.name}</span>
                {currentModel.inputCost === 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded">
                    FREE
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">{currentModel.id}</div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <ZapIcon className="size-3" />
                {formatContext(currentModel.contextLength)} context
              </div>
              <div className="flex items-center gap-1 mt-1">
                <DollarSignIcon className="size-3" />
                {formatCost(currentModel.inputCost)} / {formatCost(currentModel.outputCost)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search models by name, ID, or provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <XIcon className="size-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          {onReload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReload}
              disabled={isLoading}
              className="h-9 px-3"
            >
              <RefreshCwIcon className={cn("size-4", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Filters */}
          <Button
            variant={filters.freeOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters(f => ({ ...f, freeOnly: !f.freeOnly }))}
            className="h-7 text-xs gap-1"
          >
            <SparklesIcon className="size-3" />
            Free Only
          </Button>

          {/* Context Length Filter */}
          <select
            value={filters.minContext?.toString() || ''}
            onChange={(e) => setFilters(f => ({ 
              ...f, 
              minContext: e.target.value ? parseInt(e.target.value) : null 
            }))}
            className={cn(
              'h-7 px-2 text-xs rounded-md border',
              'bg-white dark:bg-gray-900',
              'border-gray-200 dark:border-gray-700',
              filters.minContext && 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            )}
          >
            {CONTEXT_PRESETS.map(preset => (
              <option key={preset.label} value={preset.value || ''}>
                Context: {preset.label}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split('-') as [SortField, SortDirection]
              setSortField(field)
              setSortDirection(dir)
            }}
            className={cn(
              'h-7 px-2 text-xs rounded-md border',
              'bg-white dark:bg-gray-900',
              'border-gray-200 dark:border-gray-700'
            )}
          >
            <option value="name-asc">Sort: Name A-Z</option>
            <option value="name-desc">Sort: Name Z-A</option>
            <option value="provider-asc">Sort: Provider A-Z</option>
            <option value="contextLength-desc">Sort: Context ↓</option>
            <option value="contextLength-asc">Sort: Context ↑</option>
            <option value="inputCost-asc">Sort: Price ↑</option>
            <option value="inputCost-desc">Sort: Price ↓</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'h-7 px-2 text-xs',
                viewMode === 'list' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-white dark:bg-gray-900'
              )}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={cn(
                'h-7 px-2 text-xs border-x border-gray-200 dark:border-gray-700',
                viewMode === 'grouped' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-white dark:bg-gray-900'
              )}
            >
              Provider
            </button>
            {llmProvider === 'openrouter' && (
              <button
                onClick={() => setViewMode('categories')}
                className={cn(
                  'h-7 px-2 text-xs',
                  viewMode === 'categories' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-white dark:bg-gray-900'
                )}
              >
                Price Tier
              </button>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-7 text-xs gap-1 ml-auto"
          >
            <FilterIcon className="size-3" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-purple-600 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Reset */}
          {(activeFiltersCount > 0 || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-xs text-red-600 hover:text-red-700"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Provider Filter */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  Providers
                </label>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {uniqueProviders.slice(0, 10).map(provider => (
                    <button
                      key={provider}
                      onClick={() => {
                        setFilters(f => ({
                          ...f,
                          providers: f.providers.includes(provider)
                            ? f.providers.filter(p => p !== provider)
                            : [...f.providers, provider]
                        }))
                      }}
                      className={cn(
                        'px-2 py-0.5 text-[10px] rounded-full border transition-colors',
                        filters.providers.includes(provider)
                          ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300'
                          : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                      )}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Cost Filter */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  Max Input Cost (per 1M tokens)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g., 5.00"
                  value={filters.maxCost || ''}
                  onChange={(e) => setFilters(f => ({
                    ...f,
                    maxCost: e.target.value ? parseFloat(e.target.value) : null
                  }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Showing {filteredModels.length} of {models.length} models
        </span>
        {filters.freeOnly && (
          <span className="flex items-center gap-1 text-green-600">
            <SparklesIcon className="size-3" />
            Free models only
          </span>
        )}
      </div>

      {/* Model List */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2Icon className="size-8 animate-spin text-purple-500" />
            <span className="ml-3 text-gray-500">Loading models...</span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="py-12 text-center">
            <InfoIcon className="size-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No models match your filters</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="mt-2 text-purple-600"
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === 'list' ? (
          <div>
            {sortedModels.map(renderModelRow)}
          </div>
        ) : viewMode === 'grouped' ? (
          renderGroupedView(groupedByProvider)
        ) : (
          renderGroupedView(groupedByCategory)
        )}
      </div>

      {/* Quick Stats */}
      {!isLoading && models.length > 0 && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {models.filter(m => m.inputCost === 0).length}
            </div>
            <div className="text-gray-500">Free</div>
          </div>
          <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {uniqueProviders.length}
            </div>
            <div className="text-gray-500">Providers</div>
          </div>
          <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {formatContext(Math.max(...models.map(m => m.contextLength)))}
            </div>
            <div className="text-gray-500">Max Context</div>
          </div>
          <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {models.length}
            </div>
            <div className="text-gray-500">Total</div>
          </div>
        </div>
      )}

      {/* Manual Entry */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
          Or enter model ID manually
        </label>
        <Input
          placeholder={llmProvider === 'anthropic' ? 'claude-opus-4-20250514' : 'provider/model-name'}
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
          className="text-sm"
        />
      </div>
    </div>
  )
}

