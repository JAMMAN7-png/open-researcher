'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Github, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { ThinkingChat } from '@/components/thinking-chat'
import { AdminPanel } from '@/components/admin-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { firecrawlApiKeySchema, type FirecrawlApiKeyInput } from '@/lib/schemas'

export default function OpenResearcherContent() {
  const [hasMessages, setHasMessages] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false)
  const [hasFirecrawlKey, setHasFirecrawlKey] = useState(false)

  // Initialize react-hook-form with zod validation for API key
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<FirecrawlApiKeyInput>({
    resolver: zodResolver(firecrawlApiKeySchema),
    defaultValues: {
      apiKey: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    // Check for Firecrawl API key on mount
    fetch('/api/check-env')
      .then(res => res.json())
      .then(data => {
        const hasEnvFirecrawlKey = data.environmentStatus.FIRECRAWL_API_KEY
        setHasFirecrawlKey(hasEnvFirecrawlKey)

        // Check localStorage for saved key if not in env
        if (!hasEnvFirecrawlKey) {
          const savedFirecrawlKey = localStorage.getItem('firecrawl_api_key')
          if (savedFirecrawlKey) {
            setValue('apiKey', savedFirecrawlKey)
            setHasFirecrawlKey(true)
          }
        }
      })
      .catch(() => {
        // Fallback to checking localStorage
        const savedFirecrawlKey = localStorage.getItem('firecrawl_api_key')
        if (savedFirecrawlKey) {
          setValue('apiKey', savedFirecrawlKey)
          setHasFirecrawlKey(true)
        }
      })
  }, [setValue])

  // Reset form when modal is closed
  useEffect(() => {
    if (!showApiKeyModal) {
      // Only reset if we don't have a saved key
      const savedKey = localStorage.getItem('firecrawl_api_key')
      if (!savedKey) {
        reset()
      }
    }
  }, [showApiKeyModal, reset])

  const onApiKeySubmit = async (data: FirecrawlApiKeyInput) => {
    setIsValidatingApiKey(true)

    try {
      // Test the Firecrawl API key
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Firecrawl-API-Key': data.apiKey,
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Invalid Firecrawl API key')
      }

      // Save the API key to localStorage
      localStorage.setItem('firecrawl_api_key', data.apiKey)
      setHasFirecrawlKey(true)
      toast.success('API key saved successfully!')
      setShowApiKeyModal(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid API key. Please check and try again.'
      toast.error(message)
    } finally {
      setIsValidatingApiKey(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with navigation landmark */}
      <header className="py-4" role="banner">
        <nav
          aria-label="Main navigation"
          className={`px-4 sm:px-6 lg:px-8 transition-all duration-700 ease-in-out ${hasMessages ? 'max-w-[1400px]' : 'max-w-4xl'
            } mx-auto`}
        >
          <div className="flex items-center justify-between">
            <Link
              href="https://firecrawl.dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Firecrawl - Visit homepage (opens in new tab)"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/firecrawl-logo-with-fire.png"
                alt="Firecrawl Logo"
                width={113}
                height={24}
                className="w-[113px] h-auto"
              />
            </Link>
            <div className="flex items-center gap-2">
              <AdminPanel />
              <Button
                variant="code"
                asChild
              >
                <Link
                  href="https://github.com/mendableai/open-researcher"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                  aria-label="Use this template on GitHub (opens in new tab)"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  <span>Use this template</span>
                </Link>
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div
        className={`px-4 sm:px-6 lg:px-8 transition-all duration-700 ease-in-out ${hasMessages
            ? 'pt-0 pb-0 opacity-0 max-h-0 overflow-hidden'
            : 'pt-8 pb-2 opacity-100 max-h-96'
          }`}
        aria-hidden={hasMessages}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-[2.5rem] lg:text-[3.8rem] text-[#36322F] dark:text-white font-semibold tracking-tight leading-[1.1] opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:200ms] [animation-fill-mode:forwards]">
            <span className="relative px-1 text-transparent bg-clip-text bg-gradient-to-tr from-red-600 to-yellow-500 inline-flex justify-center items-center">
              Open Researcher
            </span>
          </h1>
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:600ms] [animation-fill-mode:forwards]">
            Firecrawl-powered search, scrape, and agentic reasoning
          </p>
        </div>
      </div>

      {/* Main Content - Full width split layout */}
      <main
        id="main-content"
        className="flex-1 px-4 sm:px-6 lg:px-8"
        role="main"
        aria-label="Research interface"
      >
        <div className="h-full max-w-[1400px] mx-auto">
          <ThinkingChat
            onMessagesChange={setHasMessages}
            hasFirecrawlKey={hasFirecrawlKey}
            onApiKeyRequired={() => setShowApiKeyModal(true)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 lg:px-8 py-8 mt-auto"
        role="contentinfo"
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Powered by{' '}
            <Link
              href="https://firecrawl.dev"
              className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
              target="_blank"
              rel="noopener noreferrer"
            >
              Firecrawl
            </Link>
          </p>
        </div>
      </footer>

      {/* API Key Modal */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent
          className="sm:max-w-md bg-white dark:bg-zinc-900"
          aria-describedby="api-key-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Firecrawl API Key Required</DialogTitle>
            <DialogDescription id="api-key-dialog-description">
              This tool requires a Firecrawl API key to search and analyze web content.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onApiKeySubmit)}>
            <div className="flex flex-col gap-4 py-4">
              <Button
                type="button"
                onClick={() => window.open('https://www.firecrawl.dev', '_blank')}
                variant="code"
                className="flex items-center justify-center gap-2"
                aria-label="Get Firecrawl API Key (opens in new tab)"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span>Get Firecrawl API Key</span>
              </Button>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="firecrawl-key"
                  className="text-sm font-medium"
                >
                  Firecrawl API Key
                </label>
                <Input
                  {...register('apiKey')}
                  id="firecrawl-key"
                  type="password"
                  placeholder="fc-..."
                  className={errors.apiKey ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  disabled={isValidatingApiKey}
                  aria-describedby={errors.apiKey ? 'api-key-error api-key-hint' : 'api-key-hint'}
                  aria-invalid={errors.apiKey ? 'true' : 'false'}
                  autoComplete="off"
                />
                {errors.apiKey && (
                  <div
                    id="api-key-error"
                    className="flex items-center gap-1 text-sm text-red-500 dark:text-red-400"
                    role="alert"
                  >
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{errors.apiKey.message}</span>
                  </div>
                )}
                <p id="api-key-hint" className="text-xs text-gray-500 dark:text-gray-400">
                  Your API key should start with &quot;fc-&quot; and be at least 10 characters long. It is stored locally in your browser.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isValidatingApiKey || !isValid}
                variant="orange"
                className="w-full"
                aria-busy={isValidatingApiKey}
              >
                {isValidatingApiKey ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Validating...</span>
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
