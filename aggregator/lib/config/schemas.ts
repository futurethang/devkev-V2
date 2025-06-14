import { z } from 'zod'

/**
 * Source type validation
 */
export const SourceTypeSchema = z.enum(['rss', 'twitter', 'github', 'reddit', 'hn', 'newsletter'])

/**
 * Source-specific configuration schema
 */
export const SourceSpecificConfigSchema = z.object({
  // RSS specific
  userAgent: z.string().optional(),
  timeout: z.number().min(1000).max(60000).optional(),
  
  // Twitter specific
  bearerToken: z.string().optional(),
  listId: z.string().optional(),
  query: z.string().optional(),
  
  // GitHub specific
  accessToken: z.string().optional(),
  language: z.string().optional(),
  since: z.string().optional(),
  
  // Reddit specific
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  subreddit: z.string().optional(),
  
  // Generic headers
  headers: z.record(z.string()).optional()
}).optional()

/**
 * Single source configuration schema
 */
export const SourceConfigSchema = z.object({
  id: z.string().min(1, 'Source ID is required'),
  name: z.string().min(1, 'Source name is required'),
  type: SourceTypeSchema,
  url: z.string().url('Must be a valid URL'),
  fetchInterval: z.number().min(1, 'Fetch interval must be at least 1 minute'),
  weight: z.number().min(0).max(1, 'Weight must be between 0 and 1'),
  config: SourceSpecificConfigSchema,
  enabled: z.boolean(),
  lastFetch: z.date().optional(),
  lastError: z.string().optional()
})

/**
 * Sources configuration file schema
 */
export const SourcesConfigSchema = z.object({
  sources: z.array(SourceConfigSchema)
})

/**
 * Keyword configuration schema
 */
export const KeywordConfigSchema = z.object({
  boost: z.object({
    high: z.array(z.string()),
    medium: z.array(z.string()),
    low: z.array(z.string())
  }),
  filter: z.object({
    exclude: z.array(z.string()),
    require: z.array(z.string())
  })
})

/**
 * Processing configuration schema
 */
export const ProcessingConfigSchema = z.object({
  generateSummary: z.boolean(),
  enhanceTags: z.boolean(),
  scoreRelevance: z.boolean(),
  checkDuplicates: z.boolean(),
  minRelevanceScore: z.number().min(0).max(1),
  maxAgeDays: z.number().min(1)
})

/**
 * Focus profile schema
 */
export const FocusProfileSchema = z.object({
  id: z.string().min(1, 'Profile ID is required'),
  name: z.string().min(1, 'Profile name is required'),
  description: z.string().min(1, 'Profile description is required'),
  weight: z.number().min(0).max(1, 'Weight must be between 0 and 1'),
  keywords: KeywordConfigSchema,
  sources: z.array(z.string()),
  processing: ProcessingConfigSchema,
  enabled: z.boolean()
})

/**
 * Feed item schema for validation
 */
export const FeedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  url: z.string().url(),
  author: z.string(),
  publishedAt: z.date(),
  source: SourceTypeSchema,
  sourceUrl: z.string().url(),
  tags: z.array(z.string()),
  relevanceScore: z.number().min(0).max(1).optional(),
  aiSummary: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
})

/**
 * Fetch result schema
 */
export const FetchResultSchema = z.object({
  sourceId: z.string(),
  success: z.boolean(),
  itemCount: z.number().min(0),
  newItemCount: z.number().min(0),
  duration: z.number().min(0),
  error: z.string().optional(),
  timestamp: z.date()
})

/**
 * Type exports for convenience
 */
export type SourceConfigInput = z.input<typeof SourceConfigSchema>
export type SourceConfigOutput = z.output<typeof SourceConfigSchema>
export type FocusProfileInput = z.input<typeof FocusProfileSchema>
export type FocusProfileOutput = z.output<typeof FocusProfileSchema>
export type FeedItemInput = z.input<typeof FeedItemSchema>
export type FeedItemOutput = z.output<typeof FeedItemSchema>