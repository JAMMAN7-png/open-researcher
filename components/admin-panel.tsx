'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  SettingsIcon, 
  KeyIcon, 
  Loader2Icon, 
  ServerIcon,
  BrainIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FlameIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
  CheckIcon,
  DollarSignIcon,
  ZapIcon,
  InfoIcon
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnimatedCheckIcon, AnimatedXIcon } from '@/components/animated-status-icons'
import { cn } from '@/lib/utils'
import { 
  useConfigStore, 
  POPULAR_OPENROUTER_MODELS, 
  ANTHROPIC_MODELS,
  type LLMProvider 
} from '@/lib/stores/config-store'
import { logger } from '@/lib/logger'

interface ApiKeyStatus {
  name: string
  envKey: string
  isValid: boolean | null
  prefix: string
  canEdit: boolean
  isLoading: boolean
  error: string | null
}

interface EnvironmentStatus {
  ANTHROPIC_API_KEY: boolean
  FIRECRAWL_API_KEY: boolean
  OPENROUTER_API_KEY: boolean
  FIRECRAWL_BASE_URL: string | null
}

interface EnvCheckResponse {
  environmentStatus: EnvironmentStatus
  anthropicKeyPrefix?: string
  firecrawlKeyPrefix?: string
  openrouterKeyPrefix?: string
  firecrawlBaseUrl?: string
  isFirecrawlSelfHosted?: boolean
}

interface ModelInfo {
  id: string
  name: string
  provider: string
  contextLength: number
  maxOutput: number
  inputCost: number
  outputCost: number
  modality: string
}

interface ModelsResponse {
  anthropic: ModelInfo[]
  openrouter: ModelInfo[]
  error?: string
}

export function AdminPanel() {
  const [open, setOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Form states
  const [firecrawlKey, setFirecrawlKey] = useState('')
  const [openRouterKey, setOpenRouterKey] = useState('')
  const [firecrawlUrl, setFirecrawlUrl] = useState('')
  
  // Model selection states
  const [modelSearch, setModelSearch] = useState('')
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [dynamicModels, setDynamicModels] = useState<ModelsResponse | null>(null)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [modelLoadError, setModelLoadError] = useState<string | null>(null)
  
  // Config store
  const {
    llmProvider,
    selectedModel,
    firecrawlSelfHosted,
    setLLMProvider,
    setSelectedModel,
    setOpenRouterApiKey,
    setFirecrawlApiKey,
    setFirecrawlSelfHosted,
    setFirecrawlBaseUrl,
    setOpenRouterConnected,
    setAnthropicConnected,
    setFirecrawlConnected,
  } = useConfigStore()

  const [apiKeys, setApiKeys] = useState<ApiKeyStatus[]>([
    {
      name: 'Anthropic API Key',
      envKey: 'ANTHROPIC_API_KEY',
      isValid: null,
      prefix: '',
      canEdit: false,
      isLoading: false,
      error: null,
    },
    {
      name: 'Firecrawl API Key',
      envKey: 'FIRECRAWL_API_KEY',
      isValid: null,
      prefix: '',
      canEdit: true,
      isLoading: false,
      error: null,
    },
    {
      name: 'OpenRouter API Key',
      envKey: 'OPENROUTER_API_KEY',
      isValid: null,
      prefix: '',
      canEdit: true,
      isLoading: false,
      error: null,
    },
  ])

  // Load models from API
  const loadModels = useCallback(async (forceRefresh = false) => {
    if (isLoadingModels) return
    
    setIsLoadingModels(true)
    setModelLoadError(null)
    logger.system.info('Loading models from API')
    
    try {
      const apiKey = openRouterKey || localStorage.getItem('openrouter_api_key')
      const headers: Record<string, string> = {}
      if (apiKey) {
        headers['X-OpenRouter-API-Key'] = apiKey
      }
      
      const response = await fetch('/api/models', {
        method: 'GET',
        headers,
        cache: forceRefresh ? 'no-store' : 'default',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }
      
      const data: ModelsResponse = await response.json()
      setDynamicModels(data)
      
      if (data.error) {
        setModelLoadError(data.error)
      }
      
      logger.system.info(`Loaded ${data.anthropic.length} Anthropic and ${data.openrouter.length} OpenRouter models`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.system.error('Failed to load models', { error: errorMessage })
      setModelLoadError(errorMessage)
    } finally {
      setIsLoadingModels(false)
    }
  }, [isLoadingModels, openRouterKey])

  // Load initial status
  useEffect(() => {
    if (open) {
      loadEnvironmentStatus()
      loadModels()
      
      // Load from localStorage
      const storedFirecrawlKey = localStorage.getItem('firecrawl_api_key')
      if (storedFirecrawlKey) {
        setFirecrawlKey(storedFirecrawlKey)
      }
      
      const storedOpenRouterKey = localStorage.getItem('openrouter_api_key')
      if (storedOpenRouterKey) {
        setOpenRouterKey(storedOpenRouterKey)
      }
      
      const storedFirecrawlUrl = localStorage.getItem('firecrawl_base_url')
      if (storedFirecrawlUrl) {
        setFirecrawlUrl(storedFirecrawlUrl)
      }
    }
  }, [open, loadModels])

  // Get available models based on provider
  const availableModels = useMemo(() => {
    if (!dynamicModels) {
      // Fallback to static models
      return llmProvider === 'anthropic' ? ANTHROPIC_MODELS.map(m => ({
        id: m.id,
        name: m.name,
        provider: 'Anthropic',
        contextLength: 200000,
        maxOutput: 8192,
        inputCost: 0,
        outputCost: 0,
        modality: 'text→text',
        description: m.description,
      })) : POPULAR_OPENROUTER_MODELS.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.id.split('/')[0],
        contextLength: 128000,
        maxOutput: 8192,
        inputCost: 0,
        outputCost: 0,
        modality: 'text→text',
        description: m.description,
      }))
    }
    
    return llmProvider === 'anthropic' 
      ? dynamicModels.anthropic 
      : dynamicModels.openrouter
  }, [dynamicModels, llmProvider])

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return availableModels
    
    const search = modelSearch.toLowerCase()
    return availableModels.filter(model => 
      model.name.toLowerCase().includes(search) ||
      model.id.toLowerCase().includes(search) ||
      model.provider.toLowerCase().includes(search)
    )
  }, [availableModels, modelSearch])

  // Group models by provider
  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {}
    
    for (const model of filteredModels) {
      if (!groups[model.provider]) {
        groups[model.provider] = []
      }
      groups[model.provider].push(model)
    }
    
    // Sort providers alphabetically
    const sortedGroups: Record<string, ModelInfo[]> = {}
    const sortedKeys = Object.keys(groups).sort()
    for (const key of sortedKeys) {
      sortedGroups[key] = groups[key]
    }
    
    return sortedGroups
  }, [filteredModels])

  // Get current model info
  const currentModel = useMemo(() => {
    return availableModels.find(m => m.id === selectedModel)
  }, [availableModels, selectedModel])

  async function loadEnvironmentStatus() {
    try {
      const response = await fetch('/api/check-env')
      if (!response.ok) {
        throw new Error('Failed to check environment')
      }

      const data: EnvCheckResponse = await response.json()

      setApiKeys((prev) =>
        prev.map((key) => {
          if (key.envKey === 'ANTHROPIC_API_KEY') {
            const isValid = data.environmentStatus.ANTHROPIC_API_KEY
            setAnthropicConnected(isValid)
            return {
              ...key,
              isValid,
              prefix: data.anthropicKeyPrefix || 'NOT SET',
            }
          }
          if (key.envKey === 'FIRECRAWL_API_KEY') {
            const hasEnvKey = data.environmentStatus.FIRECRAWL_API_KEY
            const hasLocalKey = !!localStorage.getItem('firecrawl_api_key')
            const isValid = hasEnvKey || hasLocalKey
            setFirecrawlConnected(isValid)
            return {
              ...key,
              isValid,
              prefix: data.firecrawlKeyPrefix || (hasLocalKey ? 'fc-*** (localStorage)' : 'NOT SET'),
            }
          }
          if (key.envKey === 'OPENROUTER_API_KEY') {
            const hasEnvKey = data.environmentStatus.OPENROUTER_API_KEY
            const hasLocalKey = !!localStorage.getItem('openrouter_api_key')
            const isValid = hasEnvKey || hasLocalKey
            setOpenRouterConnected(isValid)
            return {
              ...key,
              isValid,
              prefix: data.openrouterKeyPrefix || (hasLocalKey ? 'sk-or-*** (localStorage)' : 'NOT SET'),
            }
          }
          return key
        })
      )
      
      // Check for self-hosted Firecrawl
      if (data.isFirecrawlSelfHosted && data.firecrawlBaseUrl) {
        setFirecrawlSelfHosted(true)
        setFirecrawlUrl(data.firecrawlBaseUrl)
      }
    } catch (error) {
      console.error('Error loading environment status:', error)
    }
  }

  async function testApiKey(keyIndex: number) {
    const key = apiKeys[keyIndex]

    setApiKeys((prev) =>
      prev.map((k, i) =>
        i === keyIndex ? { ...k, isLoading: true, error: null } : k
      )
    )

    try {
      if (key.envKey === 'FIRECRAWL_API_KEY') {
        const keyToTest = firecrawlKey || localStorage.getItem('firecrawl_api_key')
        if (!keyToTest) {
          throw new Error('No API key to test')
        }

        const response = await fetch('/api/test-firecrawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            apiKey: keyToTest,
            baseUrl: firecrawlSelfHosted ? firecrawlUrl : undefined,
            selfHosted: firecrawlSelfHosted
          }),
        })

        const data = await response.json()

        setApiKeys((prev) =>
          prev.map((k, i) =>
            i === keyIndex
              ? {
                  ...k,
                  isValid: data.success,
                  isLoading: false,
                  error: data.success ? null : data.error || 'Validation failed',
                }
              : k
          )
        )
        setFirecrawlConnected(data.success)
      } else if (key.envKey === 'OPENROUTER_API_KEY') {
        const keyToTest = openRouterKey || localStorage.getItem('openrouter_api_key')
        if (!keyToTest) {
          throw new Error('No API key to test')
        }

        const response = await fetch('/api/test-openrouter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: keyToTest }),
        })

        const data = await response.json()

        setApiKeys((prev) =>
          prev.map((k, i) =>
            i === keyIndex
              ? {
                  ...k,
                  isValid: data.success,
                  isLoading: false,
                  error: data.success ? null : data.error || 'Validation failed',
                }
              : k
          )
        )
        setOpenRouterConnected(data.success)
      } else {
        // For Anthropic key, just check if it's set
        setApiKeys((prev) =>
          prev.map((k, i) =>
            i === keyIndex
              ? {
                  ...k,
                  isLoading: false,
                  error: !k.isValid ? 'Key not configured in environment' : null,
                }
              : k
          )
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setApiKeys((prev) =>
        prev.map((k, i) =>
          i === keyIndex
            ? { ...k, isValid: false, isLoading: false, error: errorMessage }
            : k
        )
      )
    }
  }

  function saveFirecrawlKey() {
    if (!firecrawlKey.trim()) {
      alert('Please enter a valid API key')
      return
    }

    if (!firecrawlSelfHosted && !firecrawlKey.startsWith('fc-')) {
      alert('Cloud Firecrawl API keys should start with "fc-". Enable self-hosted mode for custom keys.')
      return
    }

    localStorage.setItem('firecrawl_api_key', firecrawlKey.trim())
    setFirecrawlApiKey(firecrawlKey.trim())

    if (firecrawlSelfHosted && firecrawlUrl) {
      localStorage.setItem('firecrawl_base_url', firecrawlUrl.trim())
      setFirecrawlBaseUrl(firecrawlUrl.trim())
    }

    setApiKeys((prev) =>
      prev.map((key) =>
        key.envKey === 'FIRECRAWL_API_KEY'
          ? {
              ...key,
              isValid: true,
              prefix: firecrawlSelfHosted ? '*** (self-hosted)' : 'fc-*** (localStorage)',
              error: null,
            }
          : key
      )
    )
  }

  function saveOpenRouterKey() {
    if (!openRouterKey.trim()) {
      alert('Please enter a valid API key')
      return
    }

    localStorage.setItem('openrouter_api_key', openRouterKey.trim())
    setOpenRouterApiKey(openRouterKey.trim())

    setApiKeys((prev) =>
      prev.map((key) =>
        key.envKey === 'OPENROUTER_API_KEY'
          ? {
              ...key,
              isValid: true,
              prefix: 'sk-or-*** (localStorage)',
              error: null,
            }
          : key
      )
    )
    
    // Reload models with new API key
    loadModels(true)
  }

  function getMaskedKey(prefix: string): string {
    if (!prefix || prefix === 'NOT SET') return 'Not configured'
    return prefix.includes('...') ? prefix : `${prefix}***`
  }

  const handleProviderChange = (provider: LLMProvider) => {
    setLLMProvider(provider)
    setModelSearch('')
    
    // Set default model for provider
    if (provider === 'anthropic') {
      setSelectedModel('claude-opus-4-20250514')
    } else {
      setSelectedModel('anthropic/claude-3.5-sonnet')
    }
  }

  function formatCost(cost: number): string {
    if (cost === 0) return 'Free'
    if (cost < 0.01) return '<$0.01'
    return `$${cost.toFixed(2)}`
  }

  function formatContext(length: number): string {
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`
    return length.toString()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Open admin panel"
        >
          <SettingsIcon className="size-4" />
          <span className="hidden sm:inline">Admin Panel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="size-5" />
            System Configuration
          </DialogTitle>
          <DialogDescription>
            Configure API keys, model selection, and advanced settings for Open Researcher.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* LLM Provider Selection */}
          <div className={cn(
            'rounded-lg border p-4 space-y-4',
            'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20',
            'border-purple-200 dark:border-purple-800'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainIcon className="size-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-medium text-sm">LLM Provider & Model</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadModels(true)}
                disabled={isLoadingModels}
                className="gap-1 text-xs"
              >
                <RefreshCwIcon className={cn("size-3", isLoadingModels && "animate-spin")} />
                Reload Models
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleProviderChange('anthropic')}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all text-left',
                  llmProvider === 'anthropic'
                    ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                )}
              >
                <div className="font-medium text-sm">Anthropic Direct</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Claude models with extended thinking
                </div>
              </button>
              <button
                onClick={() => handleProviderChange('openrouter')}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all text-left',
                  llmProvider === 'openrouter'
                    ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                )}
              >
                <div className="font-medium text-sm">OpenRouter</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Access 100+ models from one API
                </div>
              </button>
            </div>

            {/* Model Selection with Custom Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Select Model
                </label>
                {dynamicModels && (
                  <span className="text-xs text-gray-500">
                    {availableModels.length} models available
                  </span>
                )}
              </div>
              
              {/* Custom Searchable Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left flex items-center justify-between',
                    'bg-white dark:bg-gray-900',
                    'border-gray-200 dark:border-gray-700',
                    'hover:border-purple-400 dark:hover:border-purple-600',
                    'transition-colors',
                    showModelDropdown && 'ring-2 ring-purple-500'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    {currentModel ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{currentModel.name}</span>
                        <span className="text-xs text-gray-500 truncate">{currentModel.provider}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Select a model...</span>
                    )}
                  </div>
                  <ChevronDownIcon className={cn(
                    "size-4 text-gray-500 transition-transform",
                    showModelDropdown && "rotate-180"
                  )} />
                </button>

                {/* Dropdown Panel */}
                {showModelDropdown && (
                  <div className={cn(
                    'absolute z-50 w-full mt-2 rounded-lg border shadow-xl',
                    'bg-white dark:bg-gray-900',
                    'border-gray-200 dark:border-gray-700',
                    'max-h-[400px] overflow-hidden flex flex-col'
                  )}>
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          placeholder="Search models..."
                          value={modelSearch}
                          onChange={(e) => setModelSearch(e.target.value)}
                          className="pl-9 pr-8 h-9"
                          autoFocus
                        />
                        {modelSearch && (
                          <button
                            onClick={() => setModelSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <XIcon className="size-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Model List */}
                    <div className="overflow-y-auto flex-1">
                      {isLoadingModels ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2Icon className="size-6 animate-spin text-purple-500" />
                          <span className="ml-2 text-sm text-gray-500">Loading models...</span>
                        </div>
                      ) : Object.keys(groupedModels).length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                          No models found
                        </div>
                      ) : (
                        Object.entries(groupedModels).map(([provider, models]) => (
                          <div key={provider}>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 sticky top-0">
                              {provider} ({models.length})
                            </div>
                            {models.map((model) => (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setSelectedModel(model.id)
                                  setShowModelDropdown(false)
                                  setModelSearch('')
                                }}
                                className={cn(
                                  'w-full px-3 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20',
                                  'transition-colors',
                                  selectedModel === model.id && 'bg-purple-100 dark:bg-purple-900/30'
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm truncate">{model.name}</span>
                                      {selectedModel === model.id && (
                                        <CheckIcon className="size-4 text-purple-600" />
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{model.id}</div>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 ml-2">
                                    <span className="flex items-center gap-1" title="Context Length">
                                      <ZapIcon className="size-3" />
                                      {formatContext(model.contextLength)}
                                    </span>
                                    {model.inputCost > 0 && (
                                      <span className="flex items-center gap-1" title="Input cost per 1M tokens">
                                        <DollarSignIcon className="size-3" />
                                        {formatCost(model.inputCost)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex items-center justify-between">
                      <span>Type to search or browse categories</span>
                      <button
                        onClick={() => setShowModelDropdown(false)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Model Error */}
              {modelLoadError && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2 flex items-start gap-2">
                  <InfoIcon className="size-4 flex-shrink-0 mt-0.5" />
                  <span>{modelLoadError}</span>
                </div>
              )}

              {/* Current Model Info */}
              {currentModel && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-gray-100 dark:bg-gray-800">
                    <div className="text-gray-500">Context</div>
                    <div className="font-medium">{formatContext(currentModel.contextLength)}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-100 dark:bg-gray-800">
                    <div className="text-gray-500">Max Output</div>
                    <div className="font-medium">{formatContext(currentModel.maxOutput)}</div>
                  </div>
                  <div className="p-2 rounded bg-gray-100 dark:bg-gray-800">
                    <div className="text-gray-500">Modality</div>
                    <div className="font-medium truncate">{currentModel.modality}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Model Entry */}
            <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-800">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Or enter model ID manually
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder={llmProvider === 'anthropic' ? 'claude-opus-4-20250514' : 'provider/model-name'}
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="flex-1 text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter any model ID if it&apos;s not in the list above
              </p>
            </div>
          </div>

          {/* API Keys Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <KeyIcon className="size-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-medium text-sm">API Keys</h3>
            </div>

            {apiKeys.map((key, index) => (
              <div
                key={key.envKey}
                className={cn(
                  'rounded-lg border p-4 space-y-3',
                  'bg-white dark:bg-gray-900',
                  'border-gray-200 dark:border-gray-800'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {key.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getMaskedKey(key.prefix)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {key.isLoading ? (
                      <Loader2Icon className="size-5 animate-spin text-blue-500" />
                    ) : key.isValid === true ? (
                      <AnimatedCheckIcon />
                    ) : key.isValid === false ? (
                      <AnimatedXIcon />
                    ) : null}
                  </div>
                </div>

                {key.error && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                    {key.error}
                  </div>
                )}

                {/* Firecrawl Key Input */}
                {key.envKey === 'FIRECRAWL_API_KEY' && (
                  <div className="space-y-2">
                    <label
                      htmlFor="firecrawl-key-input"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Update API Key
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="firecrawl-key-input"
                        type="password"
                        value={firecrawlKey}
                        onChange={(e) => setFirecrawlKey(e.target.value)}
                        placeholder={firecrawlSelfHosted ? "API key..." : "fc-..."}
                        className="flex-1"
                      />
                      <Button
                        onClick={saveFirecrawlKey}
                        variant="outline"
                        size="sm"
                        disabled={!firecrawlKey.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}

                {/* OpenRouter Key Input */}
                {key.envKey === 'OPENROUTER_API_KEY' && (
                  <div className="space-y-2">
                    <label
                      htmlFor="openrouter-key-input"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Update API Key
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="openrouter-key-input"
                        type="password"
                        value={openRouterKey}
                        onChange={(e) => setOpenRouterKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="flex-1"
                      />
                      <Button
                        onClick={saveOpenRouterKey}
                        variant="outline"
                        size="sm"
                        disabled={!openRouterKey.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => testApiKey(index)}
                  variant="outline"
                  size="sm"
                  disabled={key.isLoading || (!key.isValid && !key.canEdit)}
                  className="w-full"
                >
                  {key.isLoading ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <ServerIcon className="size-4 text-gray-500" />
                <span className="text-sm font-medium">Advanced Settings</span>
              </div>
              {showAdvanced ? (
                <ChevronUpIcon className="size-4 text-gray-500" />
              ) : (
                <ChevronDownIcon className="size-4 text-gray-500" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* Self-hosted Firecrawl */}
                <div className={cn(
                  'rounded-lg border p-4 space-y-4',
                  'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
                  'border-orange-200 dark:border-orange-800'
                )}>
                  <div className="flex items-center gap-2">
                    <FlameIcon className="size-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="font-medium text-sm">Self-Hosted Firecrawl</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="self-hosted-toggle"
                      checked={firecrawlSelfHosted}
                      onChange={(e) => setFirecrawlSelfHosted(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="self-hosted-toggle" className="text-sm text-gray-700 dark:text-gray-300">
                      Use self-hosted Firecrawl instance
                    </label>
                  </div>

                  {firecrawlSelfHosted && (
                    <div className="space-y-2">
                      <label
                        htmlFor="firecrawl-url"
                        className="text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        Firecrawl Server URL
                      </label>
                      <Input
                        id="firecrawl-url"
                        type="url"
                        value={firecrawlUrl}
                        onChange={(e) => setFirecrawlUrl(e.target.value)}
                        placeholder="http://localhost:3002"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enter the full URL of your self-hosted Firecrawl instance (e.g., http://localhost:3002)
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      if (firecrawlSelfHosted && firecrawlUrl) {
                        localStorage.setItem('firecrawl_base_url', firecrawlUrl.trim())
                        setFirecrawlBaseUrl(firecrawlUrl.trim())
                        
                        // Find Firecrawl key index and test it
                        const fcKeyIndex = apiKeys.findIndex(k => k.envKey === 'FIRECRAWL_API_KEY')
                        if (fcKeyIndex !== -1) {
                          testApiKey(fcKeyIndex)
                        }
                      }
                    }}
                    variant="outline"
                    size="sm"
                    disabled={!firecrawlSelfHosted || !firecrawlUrl}
                    className="w-full"
                  >
                    Test Self-Hosted Connection
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <p>
            <strong>Anthropic:</strong> API key must be configured in environment variables (.env.local). Required for extended thinking features.
          </p>
          <p>
            <strong>OpenRouter:</strong> Access 100+ models including Claude, GPT-4, Gemini, and Llama through a single API key.
          </p>
          <p>
            <strong>Firecrawl:</strong> Can use cloud service or self-hosted instance. API keys are stored locally in your browser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
