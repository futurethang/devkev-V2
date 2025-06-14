import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import type { FocusProfile, SourceConfig } from '../types/feed'
import { 
  SourcesConfigSchema, 
  FocusProfileSchema,
  SourceConfigSchema
} from './schemas'

/**
 * Configuration loader with validation using Zod schemas
 */
export class ConfigLoader {
  private configDir: string
  private profilesDir: string
  private sourcesFile: string

  constructor(configDir?: string) {
    // Default to the aggregator config directory from the project root
    this.configDir = configDir || path.join(__dirname, '..', '..', 'config')
    this.profilesDir = path.join(this.configDir, 'profiles')
    this.sourcesFile = path.join(this.configDir, 'sources.json')
  }

  /**
   * Load and validate all source configurations
   */
  async loadSources(): Promise<SourceConfig[]> {
    try {
      const sourcesContent = await fs.readFile(this.sourcesFile, 'utf-8')
      const sourcesData = JSON.parse(sourcesContent)
      
      // Validate the entire sources configuration
      const validatedSources = SourcesConfigSchema.parse(sourcesData)
      
      return validatedSources.sources
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        throw new Error(`Invalid source configuration: ${errorMessages}`)
      }
      
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error(`Sources configuration file not found: ${this.sourcesFile}`)
      }
      
      throw new Error(`Failed to load sources configuration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load and validate a specific focus profile
   */
  async loadProfile(profileId: string): Promise<FocusProfile> {
    const profileFile = path.join(this.profilesDir, `${profileId}.json`)
    
    try {
      const profileContent = await fs.readFile(profileFile, 'utf-8')
      const profileData = JSON.parse(profileContent)
      
      // Validate the profile configuration
      const validatedProfile = FocusProfileSchema.parse(profileData)
      
      return validatedProfile
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        throw new Error(`Invalid profile configuration: ${errorMessages}`)
      }
      
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error(`Profile not found: ${profileId}`)
      }
      
      throw new Error(`Failed to load profile ${profileId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all available profile IDs
   */
  async getAvailableProfiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.profilesDir)
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'))
    } catch (error) {
      throw new Error(`Failed to read profiles directory: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load all enabled focus profiles
   */
  async getActiveProfiles(): Promise<FocusProfile[]> {
    const profileIds = await this.getAvailableProfiles()
    const profiles: FocusProfile[] = []
    
    for (const profileId of profileIds) {
      try {
        const profile = await this.loadProfile(profileId)
        if (profile.enabled) {
          profiles.push(profile)
        }
      } catch (error) {
        console.warn(`Skipping invalid profile ${profileId}:`, error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    return profiles
  }

  /**
   * Get enabled sources filtered by source IDs
   */
  async getEnabledSources(sourceIds?: string[]): Promise<SourceConfig[]> {
    const allSources = await this.loadSources()
    
    let filteredSources = allSources.filter(source => source.enabled)
    
    if (sourceIds && sourceIds.length > 0) {
      filteredSources = filteredSources.filter(source => 
        sourceIds.includes(source.id)
      )
    }
    
    return filteredSources
  }

  /**
   * Get sources configuration for a specific profile
   */
  async getSourcesForProfile(profileId: string): Promise<SourceConfig[]> {
    const profile = await this.loadProfile(profileId)
    return this.getEnabledSources(profile.sources)
  }

  /**
   * Validate a source configuration without saving
   */
  validateSource(sourceConfig: unknown): SourceConfig {
    try {
      return SourceConfigSchema.parse(sourceConfig)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        throw new Error(`Invalid source configuration: ${errorMessages}`)
      }
      throw error
    }
  }

  /**
   * Validate a profile configuration without saving
   */
  validateProfile(profileConfig: unknown): FocusProfile {
    try {
      return FocusProfileSchema.parse(profileConfig)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ')
        throw new Error(`Invalid profile configuration: ${errorMessages}`)
      }
      throw error
    }
  }

  /**
   * Get configuration summary for debugging
   */
  async getConfigSummary(): Promise<{
    sourcesCount: number
    enabledSourcesCount: number
    profilesCount: number
    activeProfilesCount: number
    configDir: string
  }> {
    try {
      const [sources, profiles] = await Promise.all([
        this.loadSources(),
        this.getActiveProfiles()
      ])
      
      const profileIds = await this.getAvailableProfiles()
      
      return {
        sourcesCount: sources.length,
        enabledSourcesCount: sources.filter(s => s.enabled).length,
        profilesCount: profileIds.length,
        activeProfilesCount: profiles.length,
        configDir: this.configDir
      }
    } catch (error) {
      throw new Error(`Failed to get config summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}