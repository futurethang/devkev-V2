import { RSSParser } from './sources/rss-parser'
import { GitHubParser } from './sources/github-parser'
import { HackerNewsParser } from './sources/hn-parser'
import { DatabaseConfigLoader } from './config/database-config-loader'
import { ContentProcessor } from './processing/content-processor'
import { DatabaseService } from '../../lib/database/database-service'
import type { 
  FeedItem, 
  SourceConfig, 
  FocusProfile, 
  FetchResult,
  SourceType
} from './types/feed'

/**
 * Result of fetching from a single profile
 */
export interface ProfileFetchResult {
  profileId: string
  profileName: string
  fetchResults: FetchResult[]
  totalItems: number
  processedItems: number
  successfulFetches: number
  avgRelevanceScore: number
  duplicatesRemoved: number
  errors: string[]
  processedFeedItems?: FeedItem[] // Optional: the actual processed items
}

/**
 * Result of fetching from all active profiles
 */
export interface AggregationResult {
  profiles: ProfileFetchResult[]
  totalFetches: number
  totalItems: number
  totalErrors: number
  duration: number
  timestamp: Date
  runId?: string // Database run ID for tracking
}

/**
 * Aggregator status information
 */
export interface AggregatorStatus {
  isReady: boolean
  config: {
    sourcesCount: number
    enabledSourcesCount: number
    profilesCount: number
    activeProfilesCount: number
    configDir: string
  }
  lastRun?: AggregationResult
  uptime: number
  databaseConnected: boolean
}

/**
 * Database-backed aggregator class that orchestrates content fetching across sources
 * This version uses Supabase instead of file-based storage
 */
export class DatabaseAggregator {
  private rssParser: RSSParser
  private githubParser: GitHubParser
  private hnParser: HackerNewsParser
  private configLoader: DatabaseConfigLoader
  private contentProcessor: ContentProcessor
  private dbService: DatabaseService
  private lastRun?: AggregationResult
  private startTime: Date

  constructor(enableAI: boolean = false) {
    this.rssParser = new RSSParser()
    this.githubParser = new GitHubParser()
    this.hnParser = new HackerNewsParser()
    this.configLoader = new DatabaseConfigLoader()
    this.contentProcessor = new ContentProcessor(enableAI)
    this.dbService = new DatabaseService()
    this.startTime = new Date()
  }

  /**
   * Initialize the aggregator and ensure database connectivity
   */
  async initialize(): Promise<void> {
    try {
      // Validate database connection
      const isConnected = await this.configLoader.validateDatabaseConnection()
      if (!isConnected) {
        throw new Error('Failed to connect to Supabase database')
      }
      
      // Initialize default configuration if needed
      await this.configLoader.initializeDefaultConfig()
      
      console.log('Database aggregator initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database aggregator:', error)
      throw error
    }
  }

  /**
   * Fetch and parse content from a single source, returning both result and items
   */
  private async fetchAndParseSource(source: SourceConfig): Promise<{
    sourceId: string
    success: boolean
    items?: FeedItem[]
    duration: number
    error?: string
    timestamp: Date
  }> {
    const startTime = Date.now()
    
    try {
      let items: FeedItem[] = []
      
      // Route to appropriate parser based on source type
      switch (source.type) {
        case 'rss':
          items = await this.rssParser.fetchFromSource(source)
          break
        
        case 'github':
          items = await this.githubParser.fetchFromSource(source)
          break
        
        case 'hn':
          items = await this.hnParser.fetchFromSource(source)
          break
        
        case 'twitter':
        case 'reddit':
        case 'newsletter':
          // TODO: Implement other source types
          throw new Error(`Source type ${source.type} not implemented yet`)
        
        default:
          throw new Error(`Unknown source type: ${(source as any).type}`)
      }

      const duration = Date.now() - startTime
      
      return {
        sourceId: source.id,
        success: true,
        items,
        duration,
        timestamp: new Date()
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      return {
        sourceId: source.id,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Fetch content from a single source (public interface)
   */
  async fetchFromSource(source: SourceConfig): Promise<FetchResult> {
    const result = await this.fetchAndParseSource(source)
    
    return {
      sourceId: result.sourceId,
      success: result.success,
      itemCount: result.items?.length || 0,
      newItemCount: result.items?.length || 0, // TODO: Implement proper new item detection
      duration: result.duration,
      error: result.error,
      timestamp: result.timestamp
    }
  }

  /**
   * Fetch content from all sources in a focus profile with database storage
   */
  async fetchFromProfile(profile: FocusProfile, includeProcessedItems: boolean = false): Promise<ProfileFetchResult> {
    try {
      const sources = await this.configLoader.getSourcesForProfile(profile.id)
      
      if (sources.length === 0) {
        return {
          profileId: profile.id,
          profileName: profile.name,
          fetchResults: [],
          totalItems: 0,
          processedItems: 0,
          successfulFetches: 0,
          avgRelevanceScore: 0,
          duplicatesRemoved: 0,
          errors: [`No enabled sources found for profile ${profile.id}`]
        }
      }

      // Fetch from all sources in parallel
      const fetchPromises = sources.map(source => this.fetchAndParseSource(source))
      const sourceResults = await Promise.all(fetchPromises)
      
      // Collect all feed items from successful fetches
      const allFeedItems: FeedItem[] = []
      const fetchResults: FetchResult[] = []
      
      sourceResults.forEach(result => {
        fetchResults.push({
          sourceId: result.sourceId,
          success: result.success,
          itemCount: result.items?.length || 0,
          newItemCount: result.items?.length || 0,
          duration: result.duration,
          error: result.error,
          timestamp: result.timestamp
        })
        
        if (result.success && result.items) {
          // Add profile and source metadata to items
          const itemsWithMetadata = result.items.map(item => ({
            ...item,
            profileId: profile.id,
            sourceId: result.sourceId
          }))
          allFeedItems.push(...itemsWithMetadata)
        }
      })
      
      // Process content with the profile's configuration
      let processedItems: FeedItem[] = []
      let duplicatesRemoved = 0
      
      if (allFeedItems.length > 0) {
        // Remove duplicates first if enabled
        if (profile.processing.checkDuplicates) {
          const beforeCount = allFeedItems.length
          const deduplicatedItems = this.contentProcessor.deduplicateItems(allFeedItems)
          duplicatesRemoved = beforeCount - deduplicatedItems.length
          processedItems = this.contentProcessor.processBatch(deduplicatedItems, profile)
        } else {
          processedItems = this.contentProcessor.processBatch(allFeedItems, profile)
        }
        
        // Store items in database
        try {
          await this.dbService.bulkCreateFeedItems(processedItems)
          console.log(`Stored ${processedItems.length} items in database for profile ${profile.id}`)
        } catch (error) {
          console.error('Failed to store items in database:', error)
          // Continue processing even if database storage fails
        }
      }
      
      // Calculate metrics
      const totalItems = allFeedItems.length
      const successfulFetches = sourceResults.filter(result => result.success).length
      const avgRelevanceScore = processedItems.length > 0 
        ? processedItems.reduce((sum, item) => sum + (item.relevanceScore || 0), 0) / processedItems.length
        : 0
      
      const errors = sourceResults
        .filter(result => !result.success && result.error)
        .map(result => `${result.sourceId}: ${result.error}`)

      const result: ProfileFetchResult = {
        profileId: profile.id,
        profileName: profile.name,
        fetchResults,
        totalItems,
        processedItems: processedItems.length,
        successfulFetches,
        avgRelevanceScore: Math.round(avgRelevanceScore * 1000) / 1000,
        duplicatesRemoved,
        errors
      }
      
      if (includeProcessedItems) {
        result.processedFeedItems = processedItems
      }
      
      return result
    } catch (error) {
      return {
        profileId: profile.id,
        profileName: profile.name,
        fetchResults: [],
        totalItems: 0,
        processedItems: 0,
        successfulFetches: 0,
        avgRelevanceScore: 0,
        duplicatesRemoved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Fetch content from a profile with AI enhancement and database storage
   */
  async fetchFromProfileWithAI(profile: FocusProfile, includeProcessedItems: boolean = false): Promise<ProfileFetchResult & { aiStats?: any }> {
    try {
      const sources = await this.configLoader.getSourcesForProfile(profile.id)
      
      if (sources.length === 0) {
        return {
          profileId: profile.id,
          profileName: profile.name,
          fetchResults: [],
          totalItems: 0,
          processedItems: 0,
          successfulFetches: 0,
          avgRelevanceScore: 0,
          duplicatesRemoved: 0,
          errors: [`No enabled sources found for profile ${profile.id}`]
        }
      }

      // Fetch from all sources in parallel
      const fetchPromises = sources.map(source => this.fetchAndParseSource(source))
      const sourceResults = await Promise.all(fetchPromises)
      
      // Collect all feed items
      const allFeedItems: FeedItem[] = []
      sourceResults.forEach((result, index) => {
        if (result.success && result.items) {
          const itemsWithMetadata = result.items.map(item => ({
            ...item,
            profileId: profile.id,
            sourceId: result.sourceId
          }))
          allFeedItems.push(...itemsWithMetadata)
        }
      })
      
      // Process content with AI enhancement
      let processedItems: FeedItem[] = []
      let duplicatesRemoved = 0
      let aiStats = null
      
      if (allFeedItems.length > 0) {
        // Remove duplicates first if enabled
        let itemsToProcess = allFeedItems
        if (profile.processing.checkDuplicates) {
          const beforeCount = allFeedItems.length
          itemsToProcess = this.contentProcessor.deduplicateItems(allFeedItems)
          duplicatesRemoved = beforeCount - itemsToProcess.length
        }
        
        // Use AI-enhanced processing if available
        if (this.contentProcessor.isAIEnabled()) {
          const enhancedItems = await this.contentProcessor.processBatchWithAI(itemsToProcess, profile)
          processedItems = enhancedItems.map(item => item as FeedItem)
          aiStats = this.contentProcessor.getAIStats()
        } else {
          processedItems = this.contentProcessor.processBatch(itemsToProcess, profile)
        }
        
        // Store enhanced items in database
        try {
          await this.dbService.bulkCreateFeedItems(processedItems)
          console.log(`Stored ${processedItems.length} AI-enhanced items in database for profile ${profile.id}`)
        } catch (error) {
          console.error('Failed to store AI-enhanced items in database:', error)
        }
      }
      
      // Calculate metrics
      const totalItems = allFeedItems.length
      const successfulFetches = sourceResults.filter(result => result.success).length
      const avgRelevanceScore = processedItems.length > 0 
        ? processedItems.reduce((sum, item) => sum + (item.relevanceScore || 0), 0) / processedItems.length
        : 0
      
      const errors = sourceResults
        .filter(result => !result.success && result.error)
        .map(result => `${result.sourceId}: ${result.error}`)

      const result: ProfileFetchResult & { aiStats?: any } = {
        profileId: profile.id,
        profileName: profile.name,
        fetchResults: sourceResults.map((result, index) => ({
          sourceId: sources[index].id,
          success: result.success,
          itemCount: result.items?.length || 0,
          newItemCount: result.items?.length || 0,
          duration: result.duration,
          error: result.error,
          timestamp: result.timestamp
        })),
        totalItems,
        processedItems: processedItems.length,
        successfulFetches,
        avgRelevanceScore: Math.round(avgRelevanceScore * 1000) / 1000,
        duplicatesRemoved,
        errors,
        aiStats
      }
      
      if (includeProcessedItems) {
        result.processedFeedItems = processedItems
      }
      
      return result
    } catch (error) {
      return {
        profileId: profile.id,
        profileName: profile.name,
        fetchResults: [],
        totalItems: 0,
        processedItems: 0,
        successfulFetches: 0,
        avgRelevanceScore: 0,
        duplicatesRemoved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Fetch content from all active profiles with database tracking
   */
  async fetchFromAllActiveProfiles(): Promise<AggregationResult> {
    const startTime = Date.now()
    let runId: string | undefined
    
    try {
      const activeProfiles = await this.configLoader.getActiveProfiles()
      
      if (activeProfiles.length === 0) {
        return {
          profiles: [],
          totalFetches: 0,
          totalItems: 0,
          totalErrors: 0,
          duration: Date.now() - startTime,
          timestamp: new Date()
        }
      }

      // Create aggregation run record
      try {
        runId = await this.dbService.createAggregationRun({
          status: 'running',
          metadata: { profileCount: activeProfiles.length }
        })
      } catch (error) {
        console.warn('Failed to create aggregation run record:', error)
      }

      // Fetch from all profiles in parallel
      const profilePromises = activeProfiles.map(profile => this.fetchFromProfile(profile))
      const profileResults = await Promise.all(profilePromises)
      
      const totalFetches = profileResults.reduce((sum, result) => 
        sum + result.fetchResults.length, 0
      )
      const totalItems = profileResults.reduce((sum, result) => 
        sum + result.totalItems, 0
      )
      const totalErrors = profileResults.reduce((sum, result) => 
        sum + result.errors.length, 0
      )
      
      const duration = Date.now() - startTime

      const result: AggregationResult = {
        profiles: profileResults,
        totalFetches,
        totalItems,
        totalErrors,
        duration,
        timestamp: new Date(),
        runId
      }

      // Update aggregation run record
      if (runId) {
        try {
          await this.dbService.updateAggregationRun(runId, {
            status: 'completed',
            totalSources: totalFetches,
            successfulSources: totalFetches - totalErrors,
            totalItems,
            processedItems: profileResults.reduce((sum, result) => sum + result.processedItems, 0),
            duplicatesRemoved: profileResults.reduce((sum, result) => sum + result.duplicatesRemoved, 0),
            avgRelevanceScore: profileResults.length > 0 
              ? profileResults.reduce((sum, result) => sum + result.avgRelevanceScore, 0) / profileResults.length 
              : 0,
            durationMs: duration
          })
        } catch (error) {
          console.warn('Failed to update aggregation run record:', error)
        }
      }

      // Store the last run result
      this.lastRun = result
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Update aggregation run record with error
      if (runId) {
        try {
          await this.dbService.updateAggregationRun(runId, {
            status: 'failed',
            durationMs: duration,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
        } catch (updateError) {
          console.warn('Failed to update failed aggregation run record:', updateError)
        }
      }
      
      const result: AggregationResult = {
        profiles: [],
        totalFetches: 0,
        totalItems: 0,
        totalErrors: 1,
        duration,
        timestamp: new Date(),
        runId
      }
      
      this.lastRun = result
      throw error
    }
  }

  /**
   * Get aggregator status and configuration summary
   */
  async getStatus(): Promise<AggregatorStatus> {
    try {
      const configSummary = await this.configLoader.getConfigSummary()
      const databaseConnected = await this.configLoader.validateDatabaseConnection()
      
      return {
        isReady: databaseConnected,
        config: configSummary,
        lastRun: this.lastRun,
        uptime: Date.now() - this.startTime.getTime(),
        databaseConnected
      }
    } catch (error) {
      return {
        isReady: false,
        config: {
          sourcesCount: 0,
          enabledSourcesCount: 0,
          profilesCount: 0,
          activeProfilesCount: 0,
          configDir: 'supabase'
        },
        uptime: Date.now() - this.startTime.getTime(),
        databaseConnected: false
      }
    }
  }

  /**
   * Test connection to a single source
   */
  async testSource(sourceId: string): Promise<FetchResult> {
    const source = await this.configLoader.getSourceById(sourceId)
    
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`)
    }
    
    return this.fetchFromSource(source)
  }

  /**
   * Get aggregated metrics from the last run
   */
  getLastRunMetrics() {
    if (!this.lastRun) {
      return null
    }

    const { profiles, totalFetches, totalItems, totalErrors, duration } = this.lastRun
    
    return {
      summary: {
        totalFetches,
        totalItems,
        totalErrors,
        duration,
        avgItemsPerSource: totalFetches > 0 ? totalItems / totalFetches : 0,
        successRate: totalFetches > 0 ? (totalFetches - totalErrors) / totalFetches : 0
      },
      profiles: profiles.map(profile => ({
        id: profile.profileId,
        name: profile.profileName,
        items: profile.totalItems,
        successfulFetches: profile.successfulFetches,
        totalSources: profile.fetchResults.length,
        errors: profile.errors
      }))
    }
  }

  /**
   * Get stored feed items from database
   */
  async getStoredFeedItems(options: {
    profileId?: string
    sourceId?: string
    limit?: number
    offset?: number
  } = {}): Promise<FeedItem[]> {
    try {
      return await this.dbService.getFeedItems({
        ...options,
        processedOnly: true
      })
    } catch (error) {
      console.error('Failed to get stored feed items:', error)
      return []
    }
  }

  /**
   * Track user engagement with content
   */
  async trackEngagement(itemId: string, eventType: 'view' | 'click' | 'read' | 'like' | 'share' | 'save', metadata?: Record<string, any>): Promise<void> {
    try {
      await this.dbService.trackEngagement({
        itemId,
        eventType,
        metadata
      })
    } catch (error) {
      console.error('Failed to track engagement:', error)
      // Don't throw - engagement tracking is non-critical
    }
  }
}