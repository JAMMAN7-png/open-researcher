'use client'

import { useState, useEffect } from 'react'
import { SettingsIcon, KeyIcon, Loader2Icon } from 'lucide-react'
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
}

interface EnvCheckResponse {
  environmentStatus: EnvironmentStatus
  anthropicKeyPrefix?: string
  firecrawlKeyPrefix?: string
}

export function AdminPanel() {
  const [open, setOpen] = useState(false)
  const [firecrawlKey, setFirecrawlKey] = useState('')
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
  ])

  // Load initial status and localStorage key
  useEffect(() => {
    if (open) {
      loadEnvironmentStatus()
      const storedKey = localStorage.getItem('firecrawl_api_key')
      if (storedKey) {
        setFirecrawlKey(storedKey)
      }
    }
  }, [open])

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
            return {
              ...key,
              isValid: data.environmentStatus.ANTHROPIC_API_KEY,
              prefix: data.anthropicKeyPrefix || 'NOT SET',
            }
          }
          if (key.envKey === 'FIRECRAWL_API_KEY') {
            // Check both environment and localStorage
            const hasEnvKey = data.environmentStatus.FIRECRAWL_API_KEY
            const hasLocalKey = !!localStorage.getItem('firecrawl_api_key')
            return {
              ...key,
              isValid: hasEnvKey || hasLocalKey,
              prefix: data.firecrawlKeyPrefix || (hasLocalKey ? 'fc-*** (localStorage)' : 'NOT SET'),
            }
          }
          return key
        })
      )
    } catch (error) {
      console.error('Error loading environment status:', error)
    }
  }

  async function testApiKey(keyIndex: number) {
    const key = apiKeys[keyIndex]

    // Update loading state
    setApiKeys((prev) =>
      prev.map((k, i) =>
        i === keyIndex ? { ...k, isLoading: true, error: null } : k
      )
    )

    try {
      // For Firecrawl key, use the validate-key endpoint
      if (key.envKey === 'FIRECRAWL_API_KEY') {
        const keyToTest = firecrawlKey || localStorage.getItem('firecrawl_api_key')
        if (!keyToTest) {
          throw new Error('No API key to test')
        }

        const response = await fetch('/api/validate-key', {
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
                  isValid: data.valid,
                  isLoading: false,
                  error: data.valid ? null : data.error || 'Validation failed',
                }
              : k
          )
        )
      } else {
        // For Anthropic key, just check if it's set
        // (We can't easily test it without making an actual API call)
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

    if (!firecrawlKey.startsWith('fc-')) {
      alert('Firecrawl API keys should start with "fc-"')
      return
    }

    localStorage.setItem('firecrawl_api_key', firecrawlKey.trim())

    // Update the status
    setApiKeys((prev) =>
      prev.map((key) =>
        key.envKey === 'FIRECRAWL_API_KEY'
          ? {
              ...key,
              isValid: true,
              prefix: 'fc-*** (localStorage)',
              error: null,
            }
          : key
      )
    )

    alert('Firecrawl API key saved to localStorage')
  }

  function getMaskedKey(prefix: string): string {
    if (!prefix || prefix === 'NOT SET') return 'Not configured'
    // Show first 10 chars then ***
    return prefix.includes('...') ? prefix : `${prefix}***`
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyIcon className="size-5" />
            API Key Management
          </DialogTitle>
          <DialogDescription>
            Manage and validate your API keys for Open Researcher.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {apiKeys.map((key, index) => (
            <div
              key={key.envKey}
              className={cn(
                'rounded-lg border p-4 space-y-3',
                'bg-white dark:bg-gray-900',
                'border-gray-200 dark:border-gray-800'
              )}
            >
              {/* Key Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {key.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {getMaskedKey(key.prefix)}
                  </p>
                </div>

                {/* Status Icon */}
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

              {/* Error Message */}
              {key.error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                  {key.error}
                </div>
              )}

              {/* Editable Input for Firecrawl */}
              {key.canEdit && (
                <div className="space-y-2">
                  <label
                    htmlFor={`${key.envKey}-input`}
                    className="text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Update API Key
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id={`${key.envKey}-input`}
                      type="password"
                      value={firecrawlKey}
                      onChange={(e) => setFirecrawlKey(e.target.value)}
                      placeholder="fc-..."
                      className="flex-1"
                      aria-label={`Enter ${key.name}`}
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

              {/* Test Button */}
              <Button
                onClick={() => testApiKey(index)}
                variant="outline"
                size="sm"
                disabled={key.isLoading || (!key.isValid && !key.canEdit)}
                className="w-full"
                aria-label={`Test ${key.name}`}
              >
                {key.isLoading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Key'
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p>
            <strong>Note:</strong> The Anthropic API key must be configured in
            your environment variables (.env.local). The Firecrawl API key can be
            stored in localStorage via this panel.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
