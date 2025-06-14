import { RSSParser } from './sources/rss-parser'
import { ConfigLoader } from './config/config-loader'
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
  successfulFetches: number
  errors: string[]
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
}

/**
 * Main aggregator class that orchestrates content fetching across sources
 */
export class Aggregator {
  private rssParser: RSSParser
  private configLoader: ConfigLoader
  private lastRun?: AggregationResult
  private startTime: Date

  constructor(configDir?: string) {
    this.rssParser = new RSSParser()
    this.configLoader = new ConfigLoader(configDir)
    this.startTime = new Date()
  }

  /**
   * Fetch content from a single source
   */
  async fetchFromSource(source: SourceConfig): Promise<FetchResult> {
    const startTime = Date.now()
    
    try {
      let items: FeedItem[] = []
      
      // Route to appropriate parser based on source type
      switch (source.type) {
        case 'rss':
          items = await this.rssParser.fetchAndParse(source.url)
          break
        
        case 'twitter':
        case 'github':
        case 'reddit':
        case 'hn':
        case 'newsletter':
          // TODO: Implement other source types in Week 2
          throw new Error(`Source type ${source.type} not implemented yet`)
        
        default:
          throw new Error(`Unknown source type: ${(source as any).type}`)
      }

      const duration = Date.now() - startTime
      
      return {
        sourceId: source.id,
        success: true,
        itemCount: items.length,
        newItemCount: items.length, // TODO: Implement duplicate detection
        duration,
        timestamp: new Date()
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      return {
        sourceId: source.id,
        success: false,
        itemCount: 0,
        newItemCount: 0,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }
    }
  }

  /**
   * Fetch content from all sources in a focus profile
   */
  async fetchFromProfile(profile: FocusProfile): Promise<ProfileFetchResult> {
    try {
      const sources = await this.configLoader.getSourcesForProfile(profile.id)
      
      if (sources.length === 0) {
        return {
          profileId: profile.id,
          profileName: profile.name,
          fetchResults: [],
          totalItems: 0,
          successfulFetches: 0,
          errors: [`No enabled sources found for profile ${profile.id}`]
        }
      }

      // Fetch from all sources in parallel
      const fetchPromises = sources.map(source => this.fetchFromSource(source))
      const fetchResults = await Promise.all(fetchPromises)
      
      const totalItems = fetchResults.reduce((sum, result) => sum + result.itemCount, 0)
      const successfulFetches = fetchResults.filter(result => result.success).length
      const errors = fetchResults
        .filter(result => !result.success && result.error)
        .map(result => `${result.sourceId}: ${result.error}`)

      return {
        profileId: profile.id,
        profileName: profile.name,
        fetchResults,
        totalItems,
        successfulFetches,
        errors
      }
    } catch (error) {
      return {
        profileId: profile.id,
        profileName: profile.name,
        fetchResults: [],
        totalItems: 0,
        successfulFetches: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Fetch content from all active profiles
   */
  async fetchFromAllActiveProfiles(): Promise<AggregationResult> {
    const startTime = Date.now()
    
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

      const result: AggregationResult = {
        profiles: profileResults,
        totalFetches,
        totalItems,
        totalErrors,
        duration: Date.now() - startTime,
        timestamp: new Date()
      }

      // Store the last run result
      this.lastRun = result
      
      return result
    } catch (error) {
      const result: AggregationResult = {
        profiles: [],
        totalFetches: 0,
        totalItems: 0,
        totalErrors: 1,
        duration: Date.now() - startTime,
        timestamp: new Date()
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
      
      return {
        isReady: true,
        config: configSummary,
        lastRun: this.lastRun,
        uptime: Date.now() - this.startTime.getTime()
      }
    } catch (error) {
      return {
        isReady: false,
        config: {
          sourcesCount: 0,
          enabledSourcesCount: 0,
          profilesCount: 0,
          activeProfilesCount: 0,
          configDir: 'unknown'
        },
        uptime: Date.now() - this.startTime.getTime()
      }
    }
  }

  /**
   * Test connection to a single source
   */
  async testSource(sourceId: string): Promise<FetchResult> {
    const sources = await this.configLoader.loadSources()
    const source = sources.find(s => s.id === sourceId)
    
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
}