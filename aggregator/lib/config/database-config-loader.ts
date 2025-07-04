import { DatabaseService } from '../../../lib/database/database-service'
import type { SourceConfig, FocusProfile } from '../types/feed'

/**
 * Database-backed configuration loader for the aggregator system
 * This replaces the file-based ConfigLoader with Supabase integration
 */
export class DatabaseConfigLoader {
  private dbService: DatabaseService
  
  constructor() {
    this.dbService = new DatabaseService()
  }
  
  /**
   * Load all sources from Supabase
   */
  async loadSources(): Promise<SourceConfig[]> {
    try {
      return await this.dbService.getSources()
    } catch (error) {
      console.error('Failed to load sources from database:', error)
      throw new Error(`Database configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Load all focus profiles from Supabase
   */
  async getAllProfiles(): Promise<FocusProfile[]> {
    try {
      return await this.dbService.getProfiles()
    } catch (error) {
      console.error('Failed to load profiles from database:', error)
      throw new Error(`Database configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Load only active/enabled focus profiles from Supabase
   */
  async getActiveProfiles(): Promise<FocusProfile[]> {
    try {
      return await this.dbService.getActiveProfiles()
    } catch (error) {
      console.error('Failed to load active profiles from database:', error)
      throw new Error(`Database configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Get sources for a specific profile
   */
  async getSourcesForProfile(profileId: string): Promise<SourceConfig[]> {
    try {
      const profile = await this.dbService.getProfileById(profileId)
      if (!profile) {
        throw new Error(`Profile not found: ${profileId}`)
      }
      
      const allSources = await this.dbService.getActiveSources()
      
      // Filter sources based on profile configuration
      if (profile.sources && profile.sources.length > 0) {
        return allSources.filter(source => profile.sources.includes(source.id))
      }
      
      // If no specific sources defined, return all active sources
      return allSources
    } catch (error) {
      console.error(`Failed to get sources for profile ${profileId}:`, error)
      throw error
    }
  }
  
  /**
   * Get profile by ID
   */
  async getProfileById(profileId: string): Promise<FocusProfile | null> {
    try {
      return await this.dbService.getProfileById(profileId)
    } catch (error) {
      console.error(`Failed to get profile ${profileId}:`, error)
      throw error
    }
  }
  
  /**
   * Get source by ID
   */
  async getSourceById(sourceId: string): Promise<SourceConfig | null> {
    try {
      return await this.dbService.getSourceById(sourceId)
    } catch (error) {
      console.error(`Failed to get source ${sourceId}:`, error)
      throw error
    }
  }
  
  /**
   * Get configuration summary for status reporting
   */
  async getConfigSummary() {
    try {
      const [allSources, allProfiles, activeProfiles] = await Promise.all([
        this.dbService.getSources(),
        this.dbService.getProfiles(),
        this.dbService.getActiveProfiles()
      ])
      
      const enabledSources = allSources.filter(s => s.enabled)
      
      return {
        sourcesCount: allSources.length,
        enabledSourcesCount: enabledSources.length,
        profilesCount: allProfiles.length,
        activeProfilesCount: activeProfiles.length,
        configDir: 'supabase' // Indicates database-backed config
      }
    } catch (error) {
      console.error('Failed to get config summary:', error)
      throw error
    }
  }
  
  /**
   * Initialize database with default configuration if empty
   * This is useful for first-time setup
   */
  async initializeDefaultConfig(): Promise<void> {
    try {
      const existingSources = await this.dbService.getSources()
      const existingProfiles = await this.dbService.getProfiles()
      
      // Define default sources
      const defaultSources: Omit<SourceConfig, 'id'>[] = [
          {
            name: 'Vercel Blog',
            type: 'rss',
            url: 'https://vercel.com/blog/rss.xml',
            enabled: true,
            fetchInterval: 3600,
            weight: 1.0
          },
          {
            name: 'GitHub Trending TypeScript',
            type: 'github',
            url: 'https://api.github.com/search/repositories?q=language:typescript&sort=stars&order=desc',
            enabled: true,
            fetchInterval: 7200,
            weight: 0.8
          },
          {
            name: 'HackerNews AI Stories',
            type: 'hn',
            url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
            enabled: true,
            fetchInterval: 1800,
            weight: 0.9
          }
      ]
      
      // Define default profiles
      const defaultProfiles: Omit<FocusProfile, 'id'>[] = [
          {
            name: 'AI Product Builder',
            description: 'Focus on AI products, tools, and product development',
            enabled: true,
            weight: 1.0,
            keywords: {
              boost: {
                high: ['ai', 'machine learning', 'product'],
                medium: ['startup', 'tools', 'automation'],
                low: ['technology', 'development']
              },
              filter: {
                exclude: ['spam', 'advertisement'],
                require: []
              }
            },
            // IDs will be generated as: type-urlhash
            // vercel: rss-httpsvercel (first 10 chars of cleaned URL)
            // github: github-httpsapigi
            // hn: hn-httpshacker
            sources: ['rss-httpsvercel', 'github-httpsapigi', 'hn-httpshacker'],
            processing: {
              generateSummary: true,
              enhanceTags: true,
              scoreRelevance: true,
              checkDuplicates: true,
              minRelevanceScore: 0.3,
              maxAgeDays: 7
            }
          },
          {
            name: 'ML Engineering',
            description: 'Machine learning engineering and infrastructure',
            enabled: true,
            weight: 0.8,
            keywords: {
              boost: {
                high: ['ml', 'pytorch', 'tensorflow', 'mlops'],
                medium: ['data', 'neural networks', 'deep learning'],
                low: ['python', 'jupyter', 'models']
              },
              filter: {
                exclude: ['spam', 'advertisement'],
                require: []
              }
            },
            sources: ['github-httpsapigi', 'hn-httpshacker'],
            processing: {
              generateSummary: true,
              enhanceTags: true,
              scoreRelevance: true,
              checkDuplicates: true,
              minRelevanceScore: 0.4,
              maxAgeDays: 7
            }
          }
      ]
      
      // Initialize sources if none exist
      if (existingSources.length === 0) {
        console.log('Initializing default sources in Supabase...')
        for (const source of defaultSources) {
          try {
            await this.dbService.createSource(source)
          } catch (error) {
            console.warn(`Source ${source.name} may already exist:`, error)
          }
        }
      }
      
      // Initialize profiles separately if they don't exist
      if (existingProfiles.length === 0) {
        for (const profile of defaultProfiles) {
          try {
            await this.dbService.createProfile(profile)
          } catch (error) {
            console.warn(`Profile ${profile.name} may already exist:`, error)
          }
        }
        
        console.log('Default configuration initialized successfully')
      }
    } catch (error) {
      console.error('Failed to initialize default configuration:', error)
      throw error
    }
  }
  
  /**
   * Create a new source in the database
   */
  async createSource(source: Omit<SourceConfig, 'id'>): Promise<SourceConfig> {
    try {
      return await this.dbService.createSource(source)
    } catch (error) {
      console.error('Failed to create source:', error)
      throw error
    }
  }
  
  /**
   * Create a new profile in the database
   */
  async createProfile(profile: Omit<FocusProfile, 'id'>): Promise<FocusProfile> {
    try {
      return await this.dbService.createProfile(profile)
    } catch (error) {
      console.error('Failed to create profile:', error)
      throw error
    }
  }
  
  /**
   * Update source configuration
   */
  async updateSource(id: string, updates: Partial<SourceConfig>): Promise<SourceConfig> {
    try {
      return await this.dbService.updateSource(id, updates)
    } catch (error) {
      console.error(`Failed to update source ${id}:`, error)
      throw error
    }
  }
  
  /**
   * Validate database connection and schema
   */
  async validateDatabaseConnection(): Promise<boolean> {
    try {
      // Try to fetch a simple query to validate connection
      await this.dbService.getSources()
      return true
    } catch (error) {
      console.error('Database validation failed:', error)
      return false
    }
  }
}