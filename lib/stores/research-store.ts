'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Import the ThinkingEvent type from thinking-display
import type { ThinkingEvent } from '@/components/thinking-display'

/**
 * Message interface representing a chat message in the research conversation
 */
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  searchData?: {
    status: 'searching' | 'complete' | 'error'
    events: ThinkingEvent[]
  }
  sources?: Array<{ url: string; title: string; description?: string }>
}

/**
 * Search result from web search operations
 */
export interface SearchResult {
  url: string
  title: string
  description?: string
  index?: number
  scraped?: boolean
  dateFound?: string
  markdown?: string
}

/**
 * Screenshot captured during scraping operations
 */
export interface Screenshot {
  url: string
  screenshot?: string
}

/**
 * Research store state interface
 */
interface ResearchState {
  // Core state
  messages: Message[]
  searchResults: SearchResult[]
  screenshots: Screenshot[]
  isSearching: boolean
  currentQuery: string
  currentScrapingUrl: string
  firecrawlApiKey: string | null

  // UI state
  input: string
  showSuggestions: boolean
  isTransitioning: boolean
  showFullWidth: boolean
  hasAnimatedSuggestions: boolean
}

/**
 * Research store actions interface
 */
interface ResearchActions {
  // Message actions
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  clearMessages: () => void

  // Search results actions
  setSearchResults: (results: SearchResult[]) => void
  clearSearchResults: () => void

  // Screenshots actions
  setScreenshots: (screenshots: Screenshot[]) => void
  addScreenshots: (screenshots: Screenshot[]) => void
  clearScreenshots: () => void

  // Search state actions
  setIsSearching: (isSearching: boolean) => void
  setCurrentQuery: (query: string) => void
  setCurrentScrapingUrl: (url: string) => void

  // API key actions
  setFirecrawlApiKey: (key: string | null) => void
  loadFirecrawlApiKeyFromStorage: () => void

  // UI state actions
  setInput: (input: string) => void
  setShowSuggestions: (show: boolean) => void
  setIsTransitioning: (transitioning: boolean) => void
  setShowFullWidth: (fullWidth: boolean) => void
  setHasAnimatedSuggestions: (animated: boolean) => void

  // Reset actions
  resetSearchState: () => void
  resetAll: () => void
}

/**
 * Combined store type
 */
type ResearchStore = ResearchState & ResearchActions

/**
 * Initial state values
 */
const initialState: ResearchState = {
  messages: [],
  searchResults: [],
  screenshots: [],
  isSearching: false,
  currentQuery: '',
  currentScrapingUrl: '',
  firecrawlApiKey: null,
  input: '',
  showSuggestions: false,
  isTransitioning: false,
  showFullWidth: false,
  hasAnimatedSuggestions: false,
}

/**
 * Check if we're in a browser environment (for SSR compatibility)
 */
const isBrowser = typeof window !== 'undefined'

/**
 * Custom storage that safely handles SSR
 */
const safeStorage = {
  getItem: (name: string): string | null => {
    if (!isBrowser) return null
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    if (!isBrowser) return
    try {
      localStorage.setItem(name, value)
    } catch {
      // Ignore storage errors
    }
  },
  removeItem: (name: string): void => {
    if (!isBrowser) return
    try {
      localStorage.removeItem(name)
    } catch {
      // Ignore storage errors
    }
  },
}

/**
 * Research store with Zustand
 *
 * Manages global state for:
 * - Chat messages and conversation history
 * - Search results from web searches
 * - Screenshots captured during scraping
 * - Search/loading states
 * - Firecrawl API key (persisted to localStorage)
 *
 * SSR Compatible: Uses custom storage that safely handles server-side rendering
 */
export const useResearchStore = create<ResearchStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Message actions
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        })),

      clearMessages: () =>
        set({
          messages: [],
          searchResults: [],
          screenshots: [],
          showFullWidth: false,
        }),

      // Search results actions
      setSearchResults: (results) =>
        set({ searchResults: results }),

      clearSearchResults: () =>
        set({ searchResults: [] }),

      // Screenshots actions
      setScreenshots: (screenshots) =>
        set({ screenshots }),

      addScreenshots: (newScreenshots) =>
        set((state) => ({
          screenshots: [...state.screenshots, ...newScreenshots],
        })),

      clearScreenshots: () =>
        set({ screenshots: [] }),

      // Search state actions
      setIsSearching: (isSearching) =>
        set({ isSearching }),

      setCurrentQuery: (query) =>
        set({ currentQuery: query }),

      setCurrentScrapingUrl: (url) =>
        set({ currentScrapingUrl: url }),

      // API key actions
      setFirecrawlApiKey: (key) => {
        set({ firecrawlApiKey: key })
        // Also sync with existing localStorage key for backward compatibility
        if (isBrowser) {
          if (key) {
            localStorage.setItem('firecrawl_api_key', key)
          } else {
            localStorage.removeItem('firecrawl_api_key')
          }
        }
      },

      loadFirecrawlApiKeyFromStorage: () => {
        if (isBrowser) {
          const key = localStorage.getItem('firecrawl_api_key')
          if (key) {
            set({ firecrawlApiKey: key })
          }
        }
      },

      // UI state actions
      setInput: (input) =>
        set({ input }),

      setShowSuggestions: (show) =>
        set({ showSuggestions: show }),

      setIsTransitioning: (transitioning) =>
        set({ isTransitioning: transitioning }),

      setShowFullWidth: (fullWidth) =>
        set({ showFullWidth: fullWidth }),

      setHasAnimatedSuggestions: (animated) =>
        set({ hasAnimatedSuggestions: animated }),

      // Reset actions
      resetSearchState: () =>
        set({
          searchResults: [],
          screenshots: [],
          currentQuery: '',
          currentScrapingUrl: '',
          isSearching: false,
        }),

      resetAll: () =>
        set({
          ...initialState,
          // Preserve the API key
          firecrawlApiKey: get().firecrawlApiKey,
        }),
    }),
    {
      name: 'research-store',
      storage: createJSONStorage(() => safeStorage),
      // Only persist specific fields to avoid hydration issues
      partialize: (state) => ({
        firecrawlApiKey: state.firecrawlApiKey,
        // Optionally persist messages for conversation history
        // messages: state.messages,
      }),
      // Skip hydration on server
      skipHydration: true,
    }
  )
)

/**
 * Hook to manually hydrate store on client side
 * Use this in a useEffect to avoid hydration mismatches
 */
export const useHydrateResearchStore = () => {
  if (isBrowser) {
    useResearchStore.persist.rehydrate()
  }
}

/**
 * Selector hooks for optimized re-renders
 * Use these instead of selecting from the full store to prevent unnecessary re-renders
 */
export const useMessages = () => useResearchStore((state) => state.messages)
export const useSearchResults = () => useResearchStore((state) => state.searchResults)
export const useScreenshots = () => useResearchStore((state) => state.screenshots)
export const useIsSearching = () => useResearchStore((state) => state.isSearching)
export const useCurrentQuery = () => useResearchStore((state) => state.currentQuery)
export const useCurrentScrapingUrl = () => useResearchStore((state) => state.currentScrapingUrl)
export const useFirecrawlApiKey = () => useResearchStore((state) => state.firecrawlApiKey)
export const useInput = () => useResearchStore((state) => state.input)
export const useShowSuggestions = () => useResearchStore((state) => state.showSuggestions)
export const useIsTransitioning = () => useResearchStore((state) => state.isTransitioning)
export const useShowFullWidth = () => useResearchStore((state) => state.showFullWidth)
export const useHasAnimatedSuggestions = () => useResearchStore((state) => state.hasAnimatedSuggestions)

/**
 * Selector hook for combined UI state
 */
export const useUIState = () =>
  useResearchStore((state) => ({
    input: state.input,
    showSuggestions: state.showSuggestions,
    isTransitioning: state.isTransitioning,
    showFullWidth: state.showFullWidth,
    hasAnimatedSuggestions: state.hasAnimatedSuggestions,
  }))

/**
 * Selector hook for search-related state
 */
export const useSearchState = () =>
  useResearchStore((state) => ({
    searchResults: state.searchResults,
    screenshots: state.screenshots,
    isSearching: state.isSearching,
    currentQuery: state.currentQuery,
    currentScrapingUrl: state.currentScrapingUrl,
  }))
