import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Aggregator } from '../../lib/aggregator'
import { RSSParser } from '../../lib/sources/rss-parser'
import { ConfigLoader } from '../../lib/config/config-loader'
import type { FeedItem, SourceConfig, FocusProfile } from '../../lib/types/feed'

// Mock dependencies
vi.mock('../../lib/sources/rss-parser')
vi.mock('../../lib/config/config-loader')

const mockRSSParser = vi.mocked(RSSParser)
const mockConfigLoader = vi.mocked(ConfigLoader)

describe('Aggregator', () => {
  let aggregator: Aggregator
  let mockParserInstance: any
  let mockConfigInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock RSS parser instance
    mockParserInstance = {
      fetchAndParse: vi.fn()
    }
    mockRSSParser.mockImplementation(() => mockParserInstance)
    
    // Mock config loader instance
    mockConfigInstance = {
      getActiveProfiles: vi.fn(),
      getSourcesForProfile: vi.fn(),
      getEnabledSources: vi.fn(),
      getConfigSummary: vi.fn()
    }
    mockConfigLoader.mockImplementation(() => mockConfigInstance)
    
    aggregator = new Aggregator()
  })

  describe('fetchFromSource', () => {
    it('should fetch and parse items from RSS source', async () => {
      const mockSource: SourceConfig = {
        id: 'test-rss',
        name: 'Test RSS',
        type: 'rss',
        url: 'https://example.com/feed.xml',
        fetchInterval: 60,
        weight: 0.8,
        enabled: true
      }

      const mockFeedItems: FeedItem[] = [
        {
          id: 'item1',
          title: 'Test Article',
          content: 'This is a test article about AI',
          url: 'https://example.com/article1',
          author: 'John Doe',
          publishedAt: new Date('2024-01-15'),
          source: 'rss',
          sourceUrl: 'https://example.com/feed.xml',
          tags: ['ai', 'test']
        }
      ]

      mockParserInstance.fetchAndParse.mockResolvedValue(mockFeedItems)

      const result = await aggregator.fetchFromSource(mockSource)

      expect(result.success).toBe(true)
      expect(result.itemCount).toBe(1)
      expect(result.sourceId).toBe('test-rss')
      expect(mockParserInstance.fetchAndParse).toHaveBeenCalledWith(mockSource.url)
    })

    it('should handle fetch errors gracefully', async () => {
      const mockSource: SourceConfig = {
        id: 'test-rss',
        name: 'Test RSS',
        type: 'rss',
        url: 'https://example.com/feed.xml',
        fetchInterval: 60,
        weight: 0.8,
        enabled: true
      }

      mockParserInstance.fetchAndParse.mockRejectedValue(new Error('Network error'))

      const result = await aggregator.fetchFromSource(mockSource)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
      expect(result.itemCount).toBe(0)
      expect(result.sourceId).toBe('test-rss')
    })

    it('should measure fetch duration', async () => {
      const mockSource: SourceConfig = {
        id: 'test-rss',
        name: 'Test RSS',
        type: 'rss',
        url: 'https://example.com/feed.xml',
        fetchInterval: 60,
        weight: 0.8,
        enabled: true
      }

      mockParserInstance.fetchAndParse.mockImplementation(async () => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10))
        return []
      })

      const result = await aggregator.fetchFromSource(mockSource)

      expect(result.duration).toBeGreaterThan(0)
      expect(typeof result.duration).toBe('number')
    })
  })

  describe('fetchFromProfile', () => {
    it('should fetch from all sources in a profile', async () => {
      const mockProfile: FocusProfile = {
        id: 'ai-product',
        name: 'AI Product Builder',
        description: 'Focus on AI products',
        weight: 1.0,
        keywords: {
          boost: { high: ['ai product'], medium: [], low: [] },
          filter: { exclude: [], require: ['ai'] }
        },
        sources: ['rss1', 'rss2'],
        processing: {
          generateSummary: true,
          enhanceTags: true,
          scoreRelevance: true,
          checkDuplicates: true,
          minRelevanceScore: 0.3,
          maxAgeDays: 7
        },
        enabled: true
      }

      const mockSources: SourceConfig[] = [
        {
          id: 'rss1',
          name: 'RSS 1',
          type: 'rss',
          url: 'https://example1.com/feed.xml',
          fetchInterval: 60,
          weight: 0.8,
          enabled: true
        },
        {
          id: 'rss2',
          name: 'RSS 2',
          type: 'rss',
          url: 'https://example2.com/feed.xml',
          fetchInterval: 60,
          weight: 0.7,
          enabled: true
        }
      ]

      mockConfigInstance.getSourcesForProfile.mockResolvedValue(mockSources)
      mockParserInstance.fetchAndParse.mockResolvedValue([])

      const result = await aggregator.fetchFromProfile(mockProfile)

      expect(result.fetchResults).toHaveLength(2)
      expect(result.profileId).toBe('ai-product')
      expect(result.successfulFetches).toBe(2)
      expect(mockConfigInstance.getSourcesForProfile).toHaveBeenCalledWith('ai-product')
      expect(mockParserInstance.fetchAndParse).toHaveBeenCalledTimes(2)
    })
  })

  describe('fetchFromAllActiveProfiles', () => {
    it('should fetch from all active profiles', async () => {
      const mockProfiles: FocusProfile[] = [
        {
          id: 'profile1',
          name: 'Profile 1',
          description: 'Test profile 1',
          weight: 1.0,
          keywords: { boost: { high: [], medium: [], low: [] }, filter: { exclude: [], require: [] } },
          sources: ['rss1'],
          processing: {
            generateSummary: true,
            enhanceTags: true,
            scoreRelevance: true,
            checkDuplicates: true,
            minRelevanceScore: 0.3,
            maxAgeDays: 7
          },
          enabled: true
        }
      ]

      const mockSources: SourceConfig[] = [
        {
          id: 'rss1',
          name: 'RSS 1',
          type: 'rss',
          url: 'https://example1.com/feed.xml',
          fetchInterval: 60,
          weight: 0.8,
          enabled: true
        }
      ]

      mockConfigInstance.getActiveProfiles.mockResolvedValue(mockProfiles)
      mockConfigInstance.getSourcesForProfile.mockResolvedValue(mockSources)
      mockParserInstance.fetchAndParse.mockResolvedValue([])

      const results = await aggregator.fetchFromAllActiveProfiles()

      expect(results.profiles).toHaveLength(1)
      expect(results.totalFetches).toBe(1)
      expect(mockConfigInstance.getActiveProfiles).toHaveBeenCalled()
    })

    it('should handle profiles with no active sources', async () => {
      const mockProfiles: FocusProfile[] = [
        {
          id: 'profile1',
          name: 'Profile 1',
          description: 'Test profile 1',
          weight: 1.0,
          keywords: { boost: { high: [], medium: [], low: [] }, filter: { exclude: [], require: [] } },
          sources: ['disabled-source'],
          processing: {
            generateSummary: true,
            enhanceTags: true,
            scoreRelevance: true,
            checkDuplicates: true,
            minRelevanceScore: 0.3,
            maxAgeDays: 7
          },
          enabled: true
        }
      ]

      mockConfigInstance.getActiveProfiles.mockResolvedValue(mockProfiles)
      mockConfigInstance.getSourcesForProfile.mockResolvedValue([]) // No enabled sources

      const results = await aggregator.fetchFromAllActiveProfiles()

      expect(results.profiles).toHaveLength(1)
      expect(results.totalFetches).toBe(0)
      expect(results.profiles[0].fetchResults).toHaveLength(0)
    })
  })

  describe('getStatus', () => {
    it('should return aggregator status and config summary', async () => {
      const mockSummary = {
        sourcesCount: 5,
        enabledSourcesCount: 4,
        profilesCount: 2,
        activeProfilesCount: 1,
        configDir: '/test/config'
      }

      mockConfigInstance.getConfigSummary.mockResolvedValue(mockSummary)

      const status = await aggregator.getStatus()

      expect(status).toMatchObject({
        isReady: true,
        config: mockSummary
      })
      expect(status.lastRun).toBeUndefined() // No runs yet
    })
  })
})