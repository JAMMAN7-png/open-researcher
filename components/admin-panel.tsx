'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  SettingsIcon, 
  KeyIcon, 
  Loader2Icon, 
  ServerIcon,
  BrainIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FlameIcon,
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
import { ModelSelector, type ModelInfo } from '@/components/model-selector'
import { cn } from '@/lib/utils'
import { 
  useConfigStore, 
  POPULAR_OPENROUTER_MODELS, 
  ANTHROPIC_MODELS,
  type LLMProvider 
} from '@/lib/stores/config-store'

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
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [dynamicModels, setDynamicModels] = useState<ModelsResponse | null>(null)
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
    setIsLoadingModels(true)
    setModelLoadError(null)
    console.log('[AdminPanel] Loading models from API...')
    
    try {
      const apiKey = openRouterKey || (typeof window !== 'undefined' ? localStorage.getItem('openrouter_api_key') : null)
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
      console.log('[AdminPanel] Loaded models:', { anthropic: data.anthropic?.length, openrouter: data.openrouter?.length })
      setDynamicModels(data)
      
      if (data.error) {
        setModelLoadError(data.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[AdminPanel] Failed to load models:', errorMessage)
      setModelLoadError(errorMessage)
    } finally {
      setIsLoadingModels(false)
    }
  }, [openRouterKey])

  // Load initial status when dialog opens
  useEffect(() => {
    if (open) {
      console.log('[AdminPanel] Dialog opened, loading status and models...')
      loadEnvironmentStatus()
      
      // Load from localStorage first
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
      
      // Load models
      loadModels()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Get available models based on provider - used by ModelSelector
  const getAvailableModels = useCallback((): ModelInfo[] => {
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
      })) : POPULAR_OPENROUTER_MODELS.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.id.split('/')[0] || 'Unknown',
        contextLength: 128000,
        maxOutput: 8192,
        inputCost: 0,
        outputCost: 0,
        modality: 'text→text',
      }))
    }
    
    return llmProvider === 'anthropic' 
      ? (dynamicModels.anthropic || [])
      : (dynamicModels.openrouter || [])
  }, [dynamicModels, llmProvider])

  const availableModels = getAvailableModels()

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
    
    // Set default model for provider
    if (provider === 'anthropic') {
      setSelectedModel('claude-opus-4-20250514')
    } else {
      setSelectedModel('anthropic/claude-3.5-sonnet')
    }
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
            <div className="flex items-center gap-2">
              <BrainIcon className="size-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-medium text-sm">LLM Provider & Model</h3>
            </div>
            
            {/* Provider Toggle */}
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

            {/* Model Error */}
            {modelLoadError && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                {modelLoadError}
              </div>
            )}

            {/* Advanced Model Selector */}
            <ModelSelector
              models={availableModels}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              isLoading={isLoadingModels}
              onReload={() => loadModels(true)}
              llmProvider={llmProvider}
            />
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
