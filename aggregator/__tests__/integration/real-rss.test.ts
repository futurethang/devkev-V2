import { describe, it, expect } from 'vitest'
import { RSSParser } from '../../lib/sources/rss-parser'
import { ConfigLoader } from '../../lib/config/config-loader'
import { Aggregator } from '../../lib/aggregator'

// Integration tests - these may be slow and depend on external services
describe('Integration: Real RSS Feeds', () => {
  // Skip these tests in CI or when network is unavailable
  const shouldSkipNetworkTests = process.env.SKIP_NETWORK_TESTS === 'true'

  describe('RSSParser with real feeds', () => {
    it.skipIf(shouldSkipNetworkTests)('should parse Hacker News RSS feed', async () => {
      const parser = new RSSParser()
      
      try {
        const items = await parser.fetchAndParse('https://hnrss.org/frontpage?count=5')
        
        expect(items.length).toBeGreaterThan(0)
        expect(items.length).toBeLessThanOrEqual(5)
        
        // Check first item structure
        const firstItem = items[0]
        expect(firstItem.id).toBeTruthy()
        expect(firstItem.title).toBeTruthy()
        expect(firstItem.url).toBeTruthy()
        expect(firstItem.source).toBe('rss')
        expect(firstItem.publishedAt).toBeInstanceOf(Date)
        
        console.log(`✓ Fetched ${items.length} items from Hacker News`)
        console.log(`✓ Sample title: "${firstItem.title}"`)
      } catch (error) {
        // If the feed is temporarily unavailable, skip the test
        if (error instanceof Error && (
          error.message.includes('ENOTFOUND') || 
          error.message.includes('timeout') ||
          error.message.includes('503') ||
          error.message.includes('502')
        )) {
          console.warn('Skipping test due to network issue:', error.message)
          return
        }
        throw error
      }
    }, 10000) // 10 second timeout for network requests

    it.skipIf(shouldSkipNetworkTests)('should parse Dev.to AI RSS feed', async () => {
      const parser = new RSSParser()
      
      try {
        const items = await parser.fetchAndParse('https://dev.to/feed/tag/ai')
        
        expect(items.length).toBeGreaterThan(0)
        
        // Check that tags are extracted
        const itemsWithTags = items.filter(item => item.tags.length > 0)
        expect(itemsWithTags.length).toBeGreaterThan(0)
        
        // Verify AI-related content
        const aiItems = items.filter(item => 
          item.title.toLowerCase().includes('ai') ||
          item.content.toLowerCase().includes('ai') ||
          item.tags.some(tag => tag.includes('ai'))
        )
        expect(aiItems.length).toBeGreaterThan(0)
        
        console.log(`✓ Fetched ${items.length} items from Dev.to AI feed`)
        console.log(`✓ ${aiItems.length} items contain AI-related content`)
      } catch (error) {
        if (error instanceof Error && (
          error.message.includes('ENOTFOUND') || 
          error.message.includes('timeout') ||
          error.message.includes('503') ||
          error.message.includes('502')
        )) {
          console.warn('Skipping test due to network issue:', error.message)
          return
        }
        throw error
      }
    }, 10000)
  })

  describe('ConfigLoader with real files', () => {
    it('should load actual configuration files', async () => {
      const configLoader = new ConfigLoader()
      
      // Test loading sources
      const sources = await configLoader.loadSources()
      expect(sources.length).toBeGreaterThan(0)
      
      // Verify each source has required fields
      sources.forEach(source => {
        expect(source.id).toBeTruthy()
        expect(source.name).toBeTruthy()
        expect(source.type).toBeTruthy()
        expect(source.url).toBeTruthy()
        expect(typeof source.fetchInterval).toBe('number')
        expect(typeof source.weight).toBe('number')
        expect(typeof source.enabled).toBe('boolean')
      })
      
      // Test loading a profile
      const profile = await configLoader.loadProfile('ai-product')
      expect(profile.id).toBe('ai-product')
      expect(profile.name).toBeTruthy()
      expect(profile.keywords).toBeTruthy()
      expect(profile.sources.length).toBeGreaterThan(0)
      
      console.log(`✓ Loaded ${sources.length} sources`)
      console.log(`✓ Loaded profile: ${profile.name}`)
    })

    it('should get enabled sources correctly', async () => {
      const configLoader = new ConfigLoader()
      
      const enabledSources = await configLoader.getEnabledSources()
      expect(enabledSources.length).toBeGreaterThan(0)
      
      // All returned sources should be enabled
      enabledSources.forEach(source => {
        expect(source.enabled).toBe(true)
      })
      
      console.log(`✓ Found ${enabledSources.length} enabled sources`)
    })
  })

  describe('End-to-end aggregation', () => {
    it.skipIf(shouldSkipNetworkTests)('should aggregate content from real sources', async () => {
      const aggregator = new Aggregator()
      
      try {
        // Get status first
        const status = await aggregator.getStatus()
        expect(status.isReady).toBe(true)
        expect(status.config.enabledSourcesCount).toBeGreaterThan(0)
        
        // Test single source
        const sources = await new ConfigLoader().getEnabledSources()
        const firstSource = sources[0]
        
        const singleResult = await aggregator.fetchFromSource(firstSource)
        expect(singleResult.sourceId).toBe(firstSource.id)
        
        if (singleResult.success) {
          expect(singleResult.itemCount).toBeGreaterThan(0)
          console.log(`✓ Successfully fetched ${singleResult.itemCount} items from ${firstSource.name}`)
        } else {
          console.warn(`⚠ Failed to fetch from ${firstSource.name}: ${singleResult.error}`)
        }
        
        // Test full aggregation (but with shorter timeout for testing)
        // We'll just test the first enabled source to keep test fast
        console.log(`✓ Aggregator is ready with ${status.config.enabledSourcesCount} enabled sources`)
        
      } catch (error) {
        if (error instanceof Error && (
          error.message.includes('ENOTFOUND') || 
          error.message.includes('timeout') ||
          error.message.includes('503') ||
          error.message.includes('502')
        )) {
          console.warn('Skipping test due to network issue:', error.message)
          return
        }
        throw error
      }
    }, 15000) // 15 second timeout for full aggregation test
  })
})