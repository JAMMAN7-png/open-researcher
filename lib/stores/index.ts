/**
 * Centralized exports for all Zustand stores
 */

export {
  useResearchStore,
  useHydrateResearchStore,
  // Selector hooks
  useMessages,
  useSearchResults,
  useScreenshots,
  useIsSearching,
  useCurrentQuery,
  useCurrentScrapingUrl,
  useFirecrawlApiKey,
  useInput,
  useShowSuggestions,
  useIsTransitioning,
  useShowFullWidth,
  useHasAnimatedSuggestions,
  useUIState,
  useSearchState,
  // Types
  type Message,
  type SearchResult,
  type Screenshot,
} from './research-store'

export {
  useConfigStore,
  getEffectiveConfig,
  POPULAR_OPENROUTER_MODELS,
  ANTHROPIC_MODELS,
  type LLMProvider,
  type OpenRouterModel,
  type ConfigState,
} from './config-store'

export {
  useAuthStore,
  useIsAuthenticated,
  useAuthRequired,
  useAuthLoading,
  useAuthError,
} from './auth-store'