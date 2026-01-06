import { z } from 'zod'

/**
 * Firecrawl API key validation schema
 * - Must start with 'fc-' prefix
 * - Must be at least 10 characters total
 * - Should not contain whitespace
 */
export const firecrawlApiKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .min(10, 'API key must be at least 10 characters')
    .refine((val) => val.startsWith('fc-'), {
      message: 'Firecrawl API key must start with "fc-"',
    })
    .refine((val) => !/\s/.test(val), {
      message: 'API key should not contain whitespace',
    }),
})

export type FirecrawlApiKeyInput = z.input<typeof firecrawlApiKeySchema>
export type FirecrawlApiKeyOutput = z.output<typeof firecrawlApiKeySchema>

/**
 * Anthropic API key validation schema
 * - Must start with 'sk-ant-' prefix
 * - Must be at least 20 characters total
 * - Should not contain whitespace
 */
export const anthropicApiKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .min(20, 'API key must be at least 20 characters')
    .refine((val) => val.startsWith('sk-ant-'), {
      message: 'Anthropic API key must start with "sk-ant-"',
    })
    .refine((val) => !/\s/.test(val), {
      message: 'API key should not contain whitespace',
    }),
})

export type AnthropicApiKeyInput = z.input<typeof anthropicApiKeySchema>
export type AnthropicApiKeyOutput = z.output<typeof anthropicApiKeySchema>

/**
 * Generic API key validation (for keys with unknown format)
 */
export const genericApiKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .min(5, 'API key seems too short')
    .max(500, 'API key seems too long')
    .refine((val) => !/\s/.test(val), {
      message: 'API key should not contain whitespace',
    }),
})

export type GenericApiKeyInput = z.input<typeof genericApiKeySchema>
export type GenericApiKeyOutput = z.output<typeof genericApiKeySchema>
