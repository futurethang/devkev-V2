/**
 * Core feed item type - normalized structure for all content sources
 */
export interface FeedItem {
  /** Unique identifier for the item (usually the URL or GUID) */
  id: string
  
  /** Title of the content */
  title: string
  
  /** Full content or description */
  content: string
  
  /** URL to the full content */
  url: string
  
  /** Author name */
  author: string
  
  /** Publication date */
  publishedAt: Date
  
  /** Source type (rss, twitter, github, reddit, etc.) */
  source: SourceType
  
  /** Human-readable source name (e.g. "Hacker News", "Indie Hackers") */
  sourceName?: string
  
  /** Original source URL (feed URL, API endpoint, etc.) */
  sourceUrl: string
  
  /** Tags/categories associated with the content */
  tags: string[]
  
  /** AI-generated relevance score (0-1) */
  relevanceScore?: number
  
  /** AI-generated summary */
  aiSummary?: string | any
  
  /** Raw metadata from the original source */
  metadata?: Record<string, unknown>
}

/**
 * Supported content source types
 */
export type SourceType = 'rss' | 'twitter' | 'github' | 'reddit' | 'hn' | 'newsletter'

/**
 * Configuration for a single data source
 */
export interface SourceConfig {
  /** Unique identifier for this source */
  id: string
  
  /** Human-readable name */
  name: string
  
  /** Source type */
  type: SourceType
  
  /** URL or endpoint to fetch from */
  url: string
  
  /** How often to check this source (in minutes) */
  fetchInterval: number
  
  /** Weight for relevance scoring (0-1) */
  weight: number
  
  /** Source-specific configuration */
  config?: SourceSpecificConfig
  
  /** Whether this source is currently active */
  enabled: boolean
  
  /** Last successful fetch timestamp */
  lastFetch?: Date
  
  /** Last error message if any */
  lastError?: string
}

/**
 * Source-specific configuration options
 */
export interface SourceSpecificConfig {
  // RSS specific
  userAgent?: string
  timeout?: number
  
  // Twitter specific
  bearerToken?: string
  listId?: string
  query?: string
  
  // GitHub specific
  accessToken?: string
  language?: string
  since?: string
  
  // Reddit specific
  clientId?: string
  clientSecret?: string
  subreddit?: string
  
  // Generic headers for any HTTP requests
  headers?: Record<string, string>
}

/**
 * Focus profile for filtering and scoring content
 */
export interface FocusProfile {
  /** Unique identifier */
  id: string
  
  /** Human-readable name */
  name: string
  
  /** Description of this profile's focus */
  description: string
  
  /** Weight when blending multiple profiles (0-1) */
  weight: number
  
  /** Keyword configuration for relevance scoring */
  keywords: KeywordConfig
  
  /** Sources to use with this profile */
  sources: string[] // source IDs
  
  /** Processing configuration */
  processing: ProcessingConfig
  
  /** Whether this profile is currently active */
  enabled: boolean
}

/**
 * Keyword configuration for relevance scoring
 */
export interface KeywordConfig {
  /** Keywords that boost relevance scores */
  boost: {
    /** High-value keywords (+3 points) */
    high: string[]
    /** Medium-value keywords (+1 point) */
    medium: string[]
    /** Low-value keywords (+0.5 points) */
    low: string[]
  }
  
  /** Keywords for filtering */
  filter: {
    /** Keywords that exclude content completely */
    exclude: string[]
    /** Content must contain at least one of these */
    require: string[]
  }
}

/**
 * Processing configuration for AI analysis
 */
export interface ProcessingConfig {
  /** Whether to generate AI summaries */
  generateSummary: boolean
  
  /** Whether to extract and enhance tags */
  enhanceTags: boolean
  
  /** Whether to perform relevance scoring */
  scoreRelevance: boolean
  
  /** Whether to check for duplicates */
  checkDuplicates: boolean
  
  /** Minimum relevance score to keep (0-1) */
  minRelevanceScore: number
  
  /** Maximum age of content to process (in days) */
  maxAgeDays: number
}

/**
 * Result of a source fetch operation
 */
export interface FetchResult {
  /** Source that was fetched */
  sourceId: string
  
  /** Whether the fetch was successful */
  success: boolean
  
  /** Number of items fetched */
  itemCount: number
  
  /** Number of new items (not duplicates) */
  newItemCount: number
  
  /** Fetch duration in milliseconds */
  duration: number
  
  /** Error message if fetch failed */
  error?: string
  
  /** Timestamp of the fetch */
  timestamp: Date
}

/**
 * Aggregated metrics for dashboard
 */
export interface AggregatorMetrics {
  /** Total items processed today */
  itemsToday: number
  
  /** Total items processed this week */
  itemsThisWeek: number
  
  /** Average relevance score today */
  avgRelevanceToday: number
  
  /** Top sources by item count */
  topSources: Array<{
    sourceId: string
    name: string
    itemCount: number
  }>
  
  /** Top tags by frequency */
  topTags: Array<{
    tag: string
    count: number
  }>
  
  /** Processing time metrics */
  processingMetrics: {
    avgFetchTime: number
    avgAiProcessingTime: number
    totalProcessingTime: number
  }
  
  /** Error rates by source */
  errorRates: Array<{
    sourceId: string
    errorRate: number
    lastError?: string
  }>
}