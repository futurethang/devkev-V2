import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConfigLoader } from '../../lib/config/config-loader'
import type { FocusProfile, SourceConfig } from '../../lib/types/feed'
import fs from 'fs/promises'

// Mock fs module
vi.mock('fs/promises')
const mockFs = vi.mocked(fs)

describe('ConfigLoader', () => {
  let configLoader: ConfigLoader

  beforeEach(() => {
    configLoader = new ConfigLoader()
    vi.clearAllMocks()
  })

  describe('loadSources', () => {
    it('should load and validate source configurations', async () => {
      const mockSourcesConfig = {
        sources: [
          {
            id: 'test-rss',
            name: 'Test RSS',
            type: 'rss',
            url: 'https://example.com/feed.xml',
            fetchInterval: 60,
            weight: 0.8,
            enabled: true,
            config: {
              timeout: 10000
            }
          }
        ]
      }

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockSourcesConfig))

      const sources = await configLoader.loadSources()

      expect(sources).toHaveLength(1)
      expect(sources[0]).toMatchObject({
        id: 'test-rss',
        name: 'Test RSS',
        type: 'rss',
        url: 'https://example.com/feed.xml',
        fetchInterval: 60,
        weight: 0.8,
        enabled: true
      })
    })

    it('should throw validation error for invalid source config', async () => {
      const invalidConfig = {
        sources: [
          {
            id: 'invalid',
            name: 'Invalid Source',
            type: 'invalid-type',
            url: 'not-a-url',
            fetchInterval: 'not-a-number',
            weight: 2.0, // Invalid weight > 1
            enabled: 'not-a-boolean'
          }
        ]
      }

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig))

      await expect(configLoader.loadSources())
        .rejects.toThrow('Invalid source configuration')
    })

    it('should handle file read errors gracefully', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'))

      await expect(configLoader.loadSources())
        .rejects.toThrow('Failed to load sources configuration')
    })
  })

  describe('loadProfile', () => {
    it('should load and validate a focus profile', async () => {
      const mockProfile = {
        id: 'ai-product',
        name: 'AI Product Builder',
        description: 'Focus on AI product development',
        weight: 1.0,
        keywords: {
          boost: {
            high: ['ai product', 'user experience'],
            medium: ['prototype', 'mvp'],
            low: ['startup', 'revenue']
          },
          filter: {
            exclude: ['academic', 'research paper'],
            require: ['ai', 'product']
          }
        },
        sources: ['test-rss'],
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

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockProfile))

      const profile = await configLoader.loadProfile('ai-product')

      expect(profile).toMatchObject({
        id: 'ai-product',
        name: 'AI Product Builder',
        description: 'Focus on AI product development',
        weight: 1.0,
        enabled: true
      })
      expect(profile.keywords.boost.high).toContain('ai product')
      expect(profile.sources).toContain('test-rss')
    })

    it('should throw error for non-existent profile', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'))

      await expect(configLoader.loadProfile('non-existent'))
        .rejects.toThrow('Profile not found: non-existent')
    })

    it('should validate profile schema and throw on invalid data', async () => {
      const invalidProfile = {
        id: 'invalid',
        name: 'Invalid Profile',
        weight: 'not-a-number',
        keywords: {
          boost: 'not-an-object'
        },
        enabled: 'not-a-boolean'
      }

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidProfile))

      await expect(configLoader.loadProfile('invalid'))
        .rejects.toThrow('Invalid profile configuration')
    })
  })

  describe('getActiveProfiles', () => {
    it('should return only enabled profiles', async () => {
      const mockProfile1 = {
        id: 'profile1',
        name: 'Profile 1',
        description: 'Test profile 1',
        weight: 1.0,
        keywords: { boost: { high: [], medium: [], low: [] }, filter: { exclude: [], require: [] } },
        sources: [],
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

      const mockProfile2 = {
        ...mockProfile1,
        id: 'profile2',
        name: 'Profile 2',
        enabled: false
      }

      // Mock fs.readdir to return profile files
      mockFs.readdir = vi.fn().mockResolvedValue(['profile1.json', 'profile2.json'])
      
      // Mock individual profile reads
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockProfile1))
        .mockResolvedValueOnce(JSON.stringify(mockProfile2))

      const activeProfiles = await configLoader.getActiveProfiles()

      expect(activeProfiles).toHaveLength(1)
      expect(activeProfiles[0].id).toBe('profile1')
      expect(activeProfiles[0].enabled).toBe(true)
    })
  })

  describe('getEnabledSources', () => {
    it('should return only enabled sources for given source IDs', async () => {
      const mockSourcesConfig = {
        sources: [
          {
            id: 'source1',
            name: 'Source 1',
            type: 'rss',
            url: 'https://example.com/feed1.xml',
            fetchInterval: 60,
            weight: 0.8,
            enabled: true
          },
          {
            id: 'source2',
            name: 'Source 2',
            type: 'rss',
            url: 'https://example.com/feed2.xml',
            fetchInterval: 60,
            weight: 0.7,
            enabled: false
          },
          {
            id: 'source3',
            name: 'Source 3',
            type: 'rss',
            url: 'https://example.com/feed3.xml',
            fetchInterval: 60,
            weight: 0.6,
            enabled: true
          }
        ]
      }

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockSourcesConfig))

      const enabledSources = await configLoader.getEnabledSources(['source1', 'source2', 'source3'])

      expect(enabledSources).toHaveLength(2)
      expect(enabledSources.map(s => s.id)).toEqual(['source1', 'source3'])
    })
  })
})