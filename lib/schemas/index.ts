/**
 * Centralized validation schemas for form validation
 * Using Zod for runtime type safety and validation
 */

export {
  searchQuerySchema,
  sanitizeSearchQuery,
  type SearchQueryInput,
  type SearchQueryOutput,
} from './search-query.schema'

export {
  firecrawlApiKeySchema,
  anthropicApiKeySchema,
  genericApiKeySchema,
  type FirecrawlApiKeyInput,
  type FirecrawlApiKeyOutput,
  type AnthropicApiKeyInput,
  type AnthropicApiKeyOutput,
  type GenericApiKeyInput,
  type GenericApiKeyOutput,
} from './api-key.schema'
