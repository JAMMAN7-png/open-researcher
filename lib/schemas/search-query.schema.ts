import { z } from 'zod'

/**
 * Search query validation schema
 * - Minimum 2 characters for meaningful searches
 * - Maximum 1000 characters to prevent abuse
 * - Sanitizes input by trimming whitespace
 */
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Please enter a search query')
    .min(2, 'Search query must be at least 2 characters')
    .max(1000, 'Search query must be less than 1000 characters')
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2, {
      message: 'Search query must be at least 2 characters after trimming',
    }),
})

export type SearchQueryInput = z.input<typeof searchQuerySchema>
export type SearchQueryOutput = z.output<typeof searchQuerySchema>

/**
 * Sanitize search query by removing potentially harmful characters
 * while preserving legitimate search operators
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    // Trim whitespace
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Remove control characters (except newlines and tabs which might be intentional)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}
