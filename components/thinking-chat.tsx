'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Loader2, Send, Copy, AlertCircle, Check } from 'lucide-react'
import { SearchResultsDisplay } from '@/components/search-results-display'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { CitationTooltip } from '@/components/citation-tooltip'
import { announce } from '@/components/accessibility/screen-reader-announcer'
import { cn } from '@/lib/utils'
import { searchQuerySchema, sanitizeSearchQuery, type SearchQueryInput } from '@/lib/schemas'
import {
  useResearchStore,
  useMessages,
  useSearchResults,
  useScreenshots,
  useIsSearching,
  useCurrentQuery,
  useCurrentScrapingUrl,
  useShowSuggestions,
  useIsTransitioning,
  useShowFullWidth,
  useHasAnimatedSuggestions,
  type Message,
  type SearchResult,
} from '@/lib/stores'
import { useConfigStore } from '@/lib/stores/config-store'

// Import the ThinkingEvent type from thinking-display
import type { ThinkingEvent } from '@/components/thinking-display'

const SUGGESTED_QUERIES = [
  "What are the latest AI breakthroughs in 2025 and how do they compare to previous years?",
  "Find me the 2nd sentence of the 3rd and 5th blog post on firecrawl.dev and analyze their content",
  "Compare the latest features and pricing between Samsung Galaxy S24 Ultra and iPhone 15 Pro Max, including camera specs and AI capabilities"
]

interface ThinkingChatProps {
  onMessagesChange?: (hasMessages: boolean) => void
  hasFirecrawlKey?: boolean
  onApiKeyRequired?: () => void
  onBrowserClose?: () => void
}

export function ThinkingChat({ onMessagesChange, hasFirecrawlKey = false, onApiKeyRequired }: ThinkingChatProps) {
  // Use selector hooks for optimized re-renders
  const messages = useMessages()
  const searchResults = useSearchResults()
  const screenshots = useScreenshots()
  const isSearching = useIsSearching()
  const currentQuery = useCurrentQuery()
  const currentScrapingUrl = useCurrentScrapingUrl()
  const showSuggestions = useShowSuggestions()
  const isTransitioning = useIsTransitioning()
  const showFullWidth = useShowFullWidth()
  const hasAnimatedSuggestions = useHasAnimatedSuggestions()

  // Get actions from store
  const {
    addMessage,
    updateMessage,
    setSearchResults,
    setScreenshots,
    addScreenshots,
    setIsSearching,
    setCurrentQuery,
    setCurrentScrapingUrl,
    setShowSuggestions,
    setIsTransitioning,
    setShowFullWidth,
    setHasAnimatedSuggestions,
    loadFirecrawlApiKeyFromStorage,
  } = useResearchStore()

  // Local state for copied message feedback (not needed in global store)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SearchQueryInput>({
    resolver: zodResolver(searchQuerySchema),
    defaultValues: {
      query: '',
    },
    mode: 'onChange',
  })

  const watchedQuery = watch('query')

  // Hydrate store on mount (SSR compatibility)
  useEffect(() => {
    useResearchStore.persist.rehydrate()
    loadFirecrawlApiKeyFromStorage()
  }, [loadFirecrawlApiKeyFromStorage])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Notify parent when messages change
  useEffect(() => {
    onMessagesChange?.(messages.length > 0)
  }, [messages.length, onMessagesChange])

  // Mark suggestions as animated after first show
  useEffect(() => {
    if (showSuggestions && !hasAnimatedSuggestions) {
      // Set after animations complete
      const timer = setTimeout(() => {
        setHasAnimatedSuggestions(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showSuggestions, hasAnimatedSuggestions, setHasAnimatedSuggestions])

  // Copy to clipboard with feedback
  const copyToClipboard = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      announce('Response copied to clipboard')
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch {
      announce('Failed to copy to clipboard', 'assertive')
    }
  }, [])

  // Parse search results from the tool result text
  const parseSearchResults = useCallback((resultText: string): SearchResult[] => {
    const results: SearchResult[] = []
    
    // Guard against empty or invalid input
    if (!resultText || typeof resultText !== 'string') {
      console.warn('[parseSearchResults] Empty or invalid result text')
      return results
    }
    
    // Check if the response indicates no results
    if (resultText.includes('No search results found') || resultText.includes('did not match any documents')) {
      console.log('[parseSearchResults] No results found in response')
      return results
    }
    
    const lines = resultText.split('\n')
    let currentResult: Partial<SearchResult> | null = null

    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Match result entries like "[1] Title" or "[1] Title (SCRAPED)"
      // More flexible regex to handle various formats
      const titleMatch = trimmedLine.match(/^\[(\d+)\]\s*(.+)$/)
      if (titleMatch) {
        // Save previous result before starting new one
        if (currentResult && currentResult.url && currentResult.title) {
          results.push(currentResult as SearchResult)
        }
        currentResult = {
          index: parseInt(titleMatch[1]),
          title: titleMatch[2].replace(/\s*\(SCRAPED\)\s*$/i, '').trim(),
          scraped: /\(SCRAPED\)/i.test(line)
        }
        continue
      }

      // Match URL lines - handle both "URL: " and "url: " formats
      const urlMatch = trimmedLine.match(/^URL:\s*(.+)$/i)
      if (urlMatch && currentResult) {
        currentResult.url = urlMatch[1].trim()
        continue
      }

      // Match description lines
      const descMatch = trimmedLine.match(/^Description:\s*(.+)$/i)
      if (descMatch && currentResult) {
        currentResult.description = descMatch[1].trim()
        continue
      }

      // Match date lines
      const dateMatch = trimmedLine.match(/^Date:\s*(.+)$/i)
      if (dateMatch && currentResult) {
        currentResult.dateFound = dateMatch[1].trim()
        continue
      }

      // Match content preview
      const previewMatch = trimmedLine.match(/^Content preview:\s*(.+)$/i)
      if (previewMatch && currentResult) {
        currentResult.markdown = previewMatch[1].trim()
        continue
      }
    }

    // Don't forget the last result
    if (currentResult && currentResult.url && currentResult.title) {
      results.push(currentResult as SearchResult)
    }

    console.log(`[parseSearchResults] Parsed ${results.length} results from response`)
    return results
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || isSearching) return

    // Sanitize the query
    const sanitizedQuery = sanitizeSearchQuery(query)

    // Check if Firecrawl API key is available
    if (!hasFirecrawlKey && !localStorage.getItem('firecrawl_api_key')) {
      onApiKeyRequired?.()
      return
    }

    // Announce search start
    announce(`Starting research for: ${sanitizedQuery}`)

    // Start transition animation
    setIsTransitioning(true)

    // Wait for fade animation
    await new Promise(resolve => setTimeout(resolve, 300))

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: sanitizedQuery
    }

    addMessage(userMessage)
    reset() // Clear the form
    setIsSearching(true)
    setShowSuggestions(false)
    setSearchResults([]) // Clear current search results for this query
    setCurrentScrapingUrl('') // Reset scraping URL
    setScreenshots([]) // Clear screenshots
    setIsTransitioning(false)

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      searchData: {
        status: 'searching',
        events: []
      }
    }

    addMessage(assistantMessage)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }

      // Add Firecrawl API key from localStorage if available
      const firecrawlKey = localStorage.getItem('firecrawl_api_key')
      if (firecrawlKey) headers['X-Firecrawl-API-Key'] = firecrawlKey

      // Add Firecrawl base URL if using self-hosted
      const firecrawlBaseUrl = localStorage.getItem('firecrawl_base_url')
      if (firecrawlBaseUrl) headers['X-Firecrawl-Base-URL'] = firecrawlBaseUrl

      // Add LLM configuration from config store
      const configState = useConfigStore.getState()
      headers['X-LLM-Provider'] = configState.llmProvider
      headers['X-LLM-Model'] = configState.selectedModel

      // Add OpenRouter API key if using OpenRouter
      if (configState.llmProvider === 'openrouter') {
        const openRouterKey = configState.openRouterApiKey || localStorage.getItem('openrouter_api_key')
        if (openRouterKey) headers['X-OpenRouter-API-Key'] = openRouterKey
      }

      const response = await fetch('/api/open-researcher', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: sanitizedQuery })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        // API Error occurred
        throw new Error(errorData.error || errorData.message || 'Search failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response stream')

      const events: ThinkingEvent[] = []
      let finalContent = ''
      let currentSearchResults: SearchResult[] = []
      
      // Buffer for incomplete SSE data across chunks
      let sseBuffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        sseBuffer += chunk
        
        // Process complete SSE messages (data: ... followed by double newline)
        const messages = sseBuffer.split('\n\n')
        
        // Keep the last part as it might be incomplete
        sseBuffer = messages.pop() || ''

        for (const message of messages) {
          const lines = message.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

              if (data.type === 'event') {
                events.push(data.event)

                // Parse search results from tool results
                // Handle both tool names: 'web_search' (original) and 'firecrawl_search' (display name)
                const isWebSearchResult = data.event.type === 'tool_result' && 
                  (data.event.tool === 'web_search' || data.event.tool === 'firecrawl_search')
                
                if (isWebSearchResult) {
                  const resultText = data.event.result || ''
                  console.log('[ThinkingChat] Received search results, length:', resultText.length)
                  console.log('[ThinkingChat] First 500 chars:', resultText.substring(0, 500))
                  
                  const parsedResults = parseSearchResults(resultText)
                  console.log('[ThinkingChat] Parsed results count:', parsedResults.length)
                  
                  currentSearchResults = parsedResults
                  setSearchResults(parsedResults)

                  // Announce results found
                  if (parsedResults.length > 0) {
                    announce(`Found ${parsedResults.length} search results`)
                  }

                  // Extract screenshots if available
                  if (data.event.screenshots) {
                    setScreenshots(data.event.screenshots)
                  }

                  // Check if results mention scraping is happening
                  if (resultText.includes('(SCRAPED)')) {
                    // Find first scraped URL
                    const scrapedMatch = resultText.match(/URL: (https?:\/\/[^\s]+).*?\(SCRAPED\)/)
                    if (scrapedMatch) {
                      setTimeout(() => {
                        setCurrentScrapingUrl(scrapedMatch[1])
                      }, 1000) // Show search results first, then switch to scraping
                    }
                  }
                }

                // Track current scraping URL and handle web_search with scraping
                if (data.event.type === 'tool_call') {
                  if (data.event.tool === 'web_search' || data.event.tool === 'firecrawl_search') {
                    // Update the query in the URL bar immediately
                    const searchQuery = (data.event.parameters as { query?: string })?.query || ''
                    setCurrentQuery(searchQuery)
                    setCurrentScrapingUrl('')  // Clear to show search results
                  } else if (data.event.tool === 'firecrawl_scrape' || data.event.tool === 'deep_scrape') {
                    const sourceUrl = (data.event.parameters as { source_url?: string })?.source_url || ''
                    setCurrentScrapingUrl(sourceUrl)
                    try {
                      announce(`Analyzing page: ${new URL(sourceUrl).hostname}`)
                    } catch {
                      announce('Analyzing page content')
                    }
                  }
                } else if (data.event.type === 'tool_result') {
                  if (data.event.tool === 'deep_scrape' || data.event.tool === 'firecrawl_scrape' || data.event.tool === 'web_search') {
                    // Extract screenshots from results
                    // Always add new screenshots even if URL is the same (for multiple scrapes of same page)
                    if (data.event.screenshots) {
                      addScreenshots(data.event.screenshots)
                    }

                    // Don't clear scraping URL immediately - let it show the screenshot
                    // Only clear when a new tool call happens
                  }
                }

                updateMessage(assistantMessage.id, {
                  searchData: { status: 'searching', events: [...events] }
                })
              } else if (data.type === 'response') {
                finalContent = data.content
              } else if (data.type === 'done') {
                updateMessage(assistantMessage.id, {
                  content: finalContent,
                  searchData: { status: 'complete', events: events },
                  sources: currentSearchResults // Keep the sources from this specific search
                })
                // Announce completion
                announce('Research complete. Results are ready.')
              }
            } catch {
              // Error parsing SSE data
            }
          }
        }
      }
      }
    } catch (error) {
      // Search error occurred

      let errorMessage = 'Sorry, an error occurred while searching. Please try again.'

      if (error instanceof Error) {
        if (error.message.includes('ANTHROPIC_API_KEY')) {
          errorMessage = 'The Anthropic API key is not configured. Please check the Admin Panel.'
        } else if (error.message.includes('FIRECRAWL_API_KEY')) {
          errorMessage = 'The Firecrawl API key is not configured. Please check the Admin Panel.'
        } else if (error.message.includes('OpenRouter')) {
          errorMessage = 'OpenRouter API key is not configured or invalid. Please check the Admin Panel.'
        } else if (error.message.includes('model')) {
          errorMessage = 'The selected AI model is not available. Try selecting a different model in the Admin Panel.'
        } else if (error.message.includes('beta')) {
          errorMessage = 'The interleaved thinking feature requires special API access. Try using OpenRouter instead.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }

      // Announce error
      announce(`Error: ${errorMessage}`, 'assertive')

      updateMessage(assistantMessage.id, {
        content: errorMessage,
        searchData: { status: 'error', events: [] }
      })
    } finally {
      setIsSearching(false)
    }
  }, [
    isSearching,
    hasFirecrawlKey,
    onApiKeyRequired,
    addMessage,
    updateMessage,
    setIsSearching,
    setShowSuggestions,
    setSearchResults,
    setCurrentScrapingUrl,
    setScreenshots,
    setIsTransitioning,
    setCurrentQuery,
    addScreenshots,
    parseSearchResults,
    reset,
  ])

  const onFormSubmit = useCallback((data: SearchQueryInput) => {
    handleSearch(data.query)
  }, [handleSearch])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setValue('query', suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [setValue, setShowSuggestions])

  const hasMessages = messages.length > 0

  // If no messages, show input below hero section
  if (!hasMessages) {
    return (
      <div className={`w-full max-w-2xl mx-auto mt-4 lg:mt-8 px-4 lg:px-0 transition-all duration-500 ${
        isTransitioning ? 'opacity-0 transform -translate-y-4' : 'opacity-100 transform translate-y-0'
      }`}>
        <div className="space-y-4 lg:space-y-8">
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="relative"
            role="search"
            aria-label="Research query"
          >
            <div className="relative">
              <label htmlFor="search-input" className="sr-only">
                Enter your research query
              </label>
              <input
                {...register('query')}
                ref={(e) => {
                  register('query').ref(e)
                  
                  inputRef.current = e
                }}
                id="search-input"
                type="text"
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter query..."
                className={cn(
                  "w-full h-12 rounded-full border bg-white pl-5 pr-14 text-base text-zinc-900 dark:text-zinc-100 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 shadow-sm",
                  errors.query
                    ? "border-red-500 focus-visible:ring-red-500 dark:border-red-500 dark:focus-visible:ring-red-400"
                    : "border-zinc-200 focus-visible:ring-orange-500 dark:border-zinc-800 dark:focus-visible:ring-orange-400"
                )}
                disabled={isSearching}
                aria-describedby={errors.query ? "search-error search-suggestions" : showSuggestions ? "search-suggestions" : undefined}
                aria-invalid={errors.query ? "true" : "false"}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isSearching || !watchedQuery?.trim()}
                className="absolute right-2 top-2 h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                aria-label={isSearching ? "Searching in progress" : "Submit search query"}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.query && (
              <div
                id="search-error"
                className="absolute -bottom-6 left-0 flex items-center gap-1 text-sm text-red-500 dark:text-red-400"
                role="alert"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{errors.query.message}</span>
              </div>
            )}
          </form>

          {showSuggestions && !isSearching && (
            <div
              id="search-suggestions"
              className={cn("space-y-2", errors.query && "mt-4")}
              role="region"
              aria-label="Suggested queries"
            >
              <div className={cn(
                "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400",
                !hasAnimatedSuggestions && "animate-fade-up"
              )} style={{
                animationDelay: !hasAnimatedSuggestions ? '200ms' : '0ms',
                opacity: !hasAnimatedSuggestions ? 0 : 1
              }}>
                <span id="suggestions-label">Try asking:</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3",
                    !hasAnimatedSuggestions && "animate-bounce"
                  )}
                  style={{ animationDelay: !hasAnimatedSuggestions ? '500ms' : '0ms' }}
                  aria-hidden="true"
                />
              </div>
              <div
                className="space-y-2"
                role="listbox"
                aria-labelledby="suggestions-label"
              >
                {SUGGESTED_QUERIES.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-300 text-sm text-gray-700 dark:text-gray-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                      !hasAnimatedSuggestions && "animate-fade-up"
                    )}
                    style={{
                      animationDelay: !hasAnimatedSuggestions ? `${300 + idx * 80}ms` : '0ms',
                      opacity: !hasAnimatedSuggestions ? 0 : 1,
                      transform: 'translateZ(0)' // Force GPU acceleration to prevent cutoff
                    }}
                    role="option"
                    aria-selected="false"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Split layout when messages exist
  return (
    <div
      className="flex flex-col-reverse lg:flex-row gap-2 lg:gap-4 h-[calc(100vh-120px)] lg:h-[calc(100vh-200px)] animate-slide-up pt-2 lg:pt-5"
      role="region"
      aria-label="Research conversation and results"
    >
      {/* Chat interface - Bottom on mobile, Left on desktop */}
      <section
        className={cn(
          "flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden transition-all duration-700 ease-out",
          showFullWidth ? "h-full w-full" : "h-[45vh] lg:h-full lg:w-1/2" // Full height on mobile when browser closed
        )}
        aria-label="Chat conversation"
      >
        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-3 lg:space-y-4"
          role="log"
          aria-label="Conversation messages"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((message) => (
            <article
              key={message.id}
              className={cn(
                "flex animate-fade-in",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
              aria-label={message.role === 'user' ? 'Your query' : 'Research response'}
            >
              {message.role === 'user' ? (
                <div className="max-w-[85%] lg:max-w-[80%] bg-orange-500 text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg shadow-sm text-sm">
                  {message.content}
                </div>
              ) : (
                <div className="max-w-[90%] space-y-3">
                  {/* Show thinking events if available */}
                  {message.searchData?.events && message.searchData.events.length > 0 && (
                    <div
                      className="space-y-2"
                      role="status"
                      aria-label="Research progress"
                    >
                      {message.searchData.events.map((event, idx) => {
                        const colorClass = "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                        const textColorClass = "text-gray-700 dark:text-gray-300"

                        if (event.type === 'thinking') {
                          return (
                            <div
                              key={idx}
                              className={`px-3 lg:px-4 py-2 lg:py-3 rounded-lg border ${colorClass} max-w-[90%] lg:max-w-[80%]`}
                              aria-label={`Thinking block ${event.number}`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"
                                  aria-hidden="true"
                                />
                                <div className="flex-1">
                                  <div className={`text-sm font-medium ${textColorClass} mb-1`}>
                                    Thinking Block #{event.number}
                                  </div>
                                  <div className={`text-sm ${textColorClass} whitespace-pre-wrap`}>
                                    {event.content || ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        if (event.type === 'tool_call') {
                          const isWebSearch = event.tool === 'firecrawl_search' || event.tool === 'web_search'
                          const isDeepScrape = event.tool === 'firecrawl_scrape' || event.tool === 'deep_scrape'
                          const toolLabel = isWebSearch ? 'Web Search' : isDeepScrape ? 'Deep Scrape' : event.tool
                          return (
                            <div
                              key={idx}
                              className={`px-3 lg:px-4 py-2 rounded-lg border ${colorClass} max-w-[90%] lg:max-w-[80%]`}
                              aria-label={`Using tool: ${toolLabel}`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${isWebSearch ? 'bg-purple-500' : isDeepScrape ? 'bg-orange-500' : 'bg-gray-500'} mt-1.5 flex-shrink-0`}
                                  aria-hidden="true"
                                />
                                <div className="flex-1">
                                  <div className="text-sm">
                                    <span className={`font-medium ${textColorClass}`}>
                                      {toolLabel}
                                    </span>
                                  </div>
                                  {(event as { parameters?: { query?: string } }).parameters?.query && (
                                    <div className={`text-sm ${textColorClass} opacity-80 mt-1`}>
                                      &quot;{(event as { parameters?: { query?: string } }).parameters?.query}&quot;
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        }
                        if (event.type === 'tool_result' && event.result) {
                          const resultPreview = event.result.substring(0, 100)
                          return (
                            <div
                              key={idx}
                              className={`px-3 lg:px-4 py-2 rounded-lg border ${colorClass} max-w-[90%] lg:max-w-[80%]`}
                              aria-label="Results received"
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"
                                  aria-hidden="true"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className={`font-medium ${textColorClass}`}>
                                      Results Received
                                    </span>
                                    <span className={`text-xs ${textColorClass} opacity-80`}>
                                      {event.duration ? `${(event.duration / 1000).toFixed(1)}s` : ''}
                                    </span>
                                  </div>
                                  <div className={`text-xs ${textColorClass} opacity-80 mt-1 line-clamp-2`}>
                                    {resultPreview}...
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  )}

                  {/* Show final response */}
                  {message.content ? (
                    <div
                      className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg"
                      role="article"
                      aria-label="Research results"
                    >
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <MarkdownRenderer
                          content={message.content}
                          sources={message.sources || []}
                        />
                        <CitationTooltip sources={message.sources || []} />
                      </div>
                    </div>
                  ) : isSearching && message.searchData?.status === 'searching' ? (
                    <div
                      className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg animate-fade-in"
                      style={{ animationDelay: '200ms', opacity: 0 }}
                      role="status"
                      aria-live="polite"
                      aria-label="Research in progress"
                    >
                      <div className="flex items-center gap-2">
                        <Loader2
                          className="h-4 w-4 animate-spin text-orange-500"
                          aria-hidden="true"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Researching...
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Action buttons for completed responses */}
                  {message.role === 'assistant' && message.content && message.searchData?.status === 'complete' && (
                    <div className="mt-3 flex items-center">
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="ml-auto p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        aria-label={copiedMessageId === message.id ? "Copied to clipboard" : "Copy response to clipboard"}
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  )}

                </div>
              )}
            </article>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area with firesearch style */}
        <div className="p-2 lg:p-3 border-t border-gray-200 dark:border-gray-700">
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            role="search"
            aria-label="Follow-up query"
          >
            <div className="relative">
              <label htmlFor="chat-search-input" className="sr-only">
                Enter your follow-up query
              </label>
              <input
                {...register('query')}
                id="chat-search-input"
                type="text"
                placeholder="Enter query..."
                className={cn(
                  "w-full h-12 rounded-full border bg-white pl-5 pr-14 text-base text-zinc-900 dark:text-zinc-100 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 shadow-sm",
                  errors.query
                    ? "border-red-500 focus-visible:ring-red-500 dark:border-red-500 dark:focus-visible:ring-red-400"
                    : "border-zinc-200 focus-visible:ring-orange-500 dark:border-zinc-800 dark:focus-visible:ring-orange-400"
                )}
                disabled={isSearching}
                aria-describedby={errors.query ? "chat-search-error" : undefined}
                aria-invalid={errors.query ? "true" : "false"}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isSearching || !watchedQuery?.trim()}
                className="absolute right-2 top-2 h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                aria-label={isSearching ? "Searching in progress" : "Submit follow-up query"}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.query && (
              <div
                id="chat-search-error"
                className="mt-1 flex items-center gap-1 text-sm text-red-500 dark:text-red-400 pl-4"
                role="alert"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{errors.query.message}</span>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Browser/Search Results - Top on mobile, Right on desktop */}
      <aside
        className={cn(
          "transition-all duration-700 ease-out",
          showFullWidth
            ? "w-0 opacity-0 h-0 overflow-hidden"
            : "h-[45vh] lg:h-full lg:w-1/2"
        )}
        aria-label="Search results browser"
        aria-hidden={showFullWidth}
      >
        <SearchResultsDisplay
          query={currentQuery}
          results={searchResults} // Show only current search results
          isActive={isSearching}
          currentUrl={currentScrapingUrl}
          screenshots={screenshots}
          onClose={() => {
            setShowFullWidth(true)
          }}
        />
      </aside>
    </div>
  )
}
