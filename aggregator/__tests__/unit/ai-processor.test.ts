import { describe, test, expect, beforeEach, vi } from 'vitest'
import { AIProcessor } from '../../lib/ai/ai-processor'
import type { FeedItem, FocusProfile } from '../../lib/types/feed'

describe('AIProcessor', () => {
  let processor: AIProcessor
  let mockFeedItem: FeedItem
  let mockProfile: FocusProfile

  beforeEach(async () => {
    processor = await AIProcessor.createDefault()
    
    mockFeedItem = {
      id: 'test-item-1',
      title: 'Building AI-Powered Applications with React',
      content: 'This article explores how to integrate artificial intelligence features into React applications using modern AI APIs and libraries.',
      url: 'https://example.com/ai-react-app',
      author: 'jane-dev',
      publishedAt: new Date('2024-01-15T10:00:00Z'),
      source: 'rss',
      sourceUrl: 'https://example.com/feed.xml',
      tags: ['react', 'javascript', 'ai'],
      relevanceScore: 0.8
    }

    mockProfile = {
      id: 'ai-product',
      name: 'AI Product Builder',
      description: 'AI-powered product development, machine learning integration, and modern web technologies',
      weight: 1.0,
      keywords: {
        boost: {
          high: ['ai', 'machine learning', 'product development'],
          medium: ['react', 'javascript', 'api'],
          low: ['web', 'frontend', 'backend']
        },
        filter: {
          exclude: ['cryptocurrency', 'blockchain'],
          require: []
        }
      },
      sources: ['test-source'],
      processing: {
        generateSummary: true,
        enhanceTags: true,
        scoreRelevance: true,
        checkDuplicates: true,
        minRelevanceScore: 0.1,
        maxAgeDays: 7
      },
      enabled: true
    }
  })

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(processor.isReady()).toBe(true)
      
      const stats = processor.getStats()
      expect(stats.activeProvider).toBe('mock')
      expect(stats.providersReady).toBe(1)
      expect(stats.processing).toBe(false)
    })

    test('should provide processing statistics', () => {
      const stats = processor.getStats()
      
      expect(stats).toHaveProperty('providersReady')
      expect(stats).toHaveProperty('activeProvider')
      expect(stats).toHaveProperty('requestsQueued')
      expect(stats).toHaveProperty('processing')
      expect(typeof stats.providersReady).toBe('number')
      expect(typeof stats.activeProvider).toBe('string')
    })
  })

  describe('Single Item Processing', () => {
    test('should process a single feed item with AI enhancement', async () => {
      const enhanced = await processor.processItem(mockFeedItem, mockProfile)
      
      expect(enhanced.id).toBe(mockFeedItem.id)
      expect(enhanced.title).toBe(mockFeedItem.title)
      expect(enhanced.aiSummary).toBeDefined()
      expect(enhanced.aiTags).toBeDefined()
      expect(enhanced.aiInsights).toBeDefined()
      expect(enhanced.semanticScore).toBeDefined()
      expect(enhanced.processingMetadata).toBeDefined()
    })

    test('should generate AI summary', async () => {
      const enhanced = await processor.processItem(mockFeedItem, mockProfile)
      
      expect(enhanced.aiSummary).toBeDefined()
      expect(enhanced.aiSummary!.summary).toBeTruthy()
      expect(enhanced.aiSummary!.keyPoints).toBeInstanceOf(Array)
      expect(enhanced.aiSummary!.tags).toBeInstanceOf(Array)
      expect(enhanced.aiSummary!.insights).toBeInstanceOf(Array)
      expect(enhanced.aiSummary!.confidence).toBeGreaterThan(0)
      expect(enhanced.aiSummary!.confidence).toBeLessThanOrEqual(1)
      expect(enhanced.aiSummary!.processingTime).toBeGreaterThan(0)
    })

    test('should enhance tags with AI', async () => {
      const enhanced = await processor.processItem(mockFeedItem, mockProfile)
      
      expect(enhanced.aiTags).toBeDefined()
      expect(enhanced.aiTags!.length).toBeGreaterThan(0)
      expect(enhanced.tags.length).toBeGreaterThanOrEqual(mockFeedItem.tags.length)
      
      // Should include original tags
      mockFeedItem.tags.forEach(tag => {
        expect(enhanced.tags).toContain(tag)
      })
    })

    test('should extract insights', async () => {
      const enhanced = await processor.processItem(mockFeedItem, mockProfile)
      
      expect(enhanced.aiInsights).toBeDefined()
      expect(enhanced.aiInsights!.length).toBeGreaterThan(0)
      enhanced.aiInsights!.forEach(insight => {
        expect(typeof insight).toBe('string')
        expect(insight.length).toBeGreaterThan(0) // Just ensure insights exist
      })
    })

    test('should calculate semantic relevance score', async () => {
      const enhanced = await processor.processItem(mockFeedItem, mockProfile)
      
      expect(enhanced.semanticScore).toBeDefined()
      expect(enhanced.semanticScore!).toBeGreaterThanOrEqual(0)
      expect(enhanced.semanticScore!).toBeLessThanOrEqual(1)
    })

    test('should include processing metadata', async () => {
      const enhanced = await processor.processItem(mockFeedItem, mockProfile)
      
      expect(enhanced.processingMetadata).toBeDefined()
      expect(enhanced.processingMetadata!.provider).toBe('mock')
      expect(enhanced.processingMetadata!.model).toBeTruthy()
      expect(enhanced.processingMetadata!.processingTime).toBeGreaterThan(0)
      expect(enhanced.processingMetadata!.confidence).toBeGreaterThanOrEqual(0)
      expect(enhanced.processingMetadata!.confidence).toBeLessThanOrEqual(1)
    })

    test('should handle processing with minimal options', async () => {
      const options = {
        generateSummary: true,
        enhanceTags: false,
        extractInsights: false,
        calculateSemanticScore: false,
        maxConcurrency: 1,
        timeout: 5000
      }
      
      const enhanced = await processor.processItem(mockFeedItem, mockProfile, options)
      
      expect(enhanced.aiSummary).toBeDefined()
      expect(enhanced.aiTags).toBeUndefined()
      expect(enhanced.aiInsights).toBeUndefined()
      expect(enhanced.semanticScore).toBeUndefined()
    })
  })

  describe('Batch Processing', () => {
    let mockItems: FeedItem[]

    beforeEach(() => {
      mockItems = [
        { ...mockFeedItem, id: 'item-1', title: 'AI in Web Development' },
        { ...mockFeedItem, id: 'item-2', title: 'Machine Learning with Python' },
        { ...mockFeedItem, id: 'item-3', title: 'Building React Components' }
      ]
    })

    test('should process multiple items in batch', async () => {
      const result = await processor.processBatch(mockItems, mockProfile)
      
      expect(result.processed).toHaveLength(3)
      expect(result.failed).toHaveLength(0)
      expect(result.stats.totalItems).toBe(3)
      expect(result.stats.successfulItems).toBe(3)
      expect(result.stats.failedItems).toBe(0)
      expect(result.stats.totalProcessingTime).toBeGreaterThan(0)
      expect(result.stats.averageProcessingTime).toBeGreaterThan(0)
    })

    test('should include processing statistics', async () => {
      const result = await processor.processBatch(mockItems, mockProfile)
      
      expect(result.stats).toBeDefined()
      expect(result.stats.totalItems).toBe(mockItems.length)
      expect(result.stats.successfulItems).toBe(mockItems.length)
      expect(result.stats.failedItems).toBe(0)
      expect(result.stats.totalProcessingTime).toBeGreaterThan(0)
      expect(result.stats.totalTokensUsed).toBeGreaterThanOrEqual(0)
    })

    test('should handle empty batch', async () => {
      const result = await processor.processBatch([], mockProfile)
      
      expect(result.processed).toHaveLength(0)
      expect(result.failed).toHaveLength(0)
      expect(result.stats.totalItems).toBe(0)
      expect(result.stats.successfulItems).toBe(0)
      expect(result.stats.failedItems).toBe(0)
    })

    test('should respect concurrency limits', async () => {
      const options = { maxConcurrency: 1 }
      const startTime = Date.now()
      
      await processor.processBatch(mockItems, mockProfile, options)
      
      const duration = Date.now() - startTime
      // Should take longer with concurrency limit of 1
      expect(duration).toBeGreaterThan(200) // Mock delay is ~100-300ms per item
    }, 10000) // Increase timeout to 10 seconds
  })

  describe('Enhanced Relevance Scoring', () => {
    test('should calculate enhanced relevance score', async () => {
      const keywordScore = 0.6
      const enhanced = await processor.getEnhancedRelevanceScore(mockFeedItem, keywordScore, mockProfile)
      
      expect(enhanced).toBeGreaterThanOrEqual(0)
      expect(enhanced).toBeLessThanOrEqual(1)
      expect(typeof enhanced).toBe('number')
    })

    test('should fallback to keyword score when semantic scoring fails', async () => {
      const keywordScore = 0.7
      const enhanced = await processor.getEnhancedRelevanceScore(mockFeedItem, keywordScore)
      
      // Without profile, should return original keyword score
      expect(enhanced).toBe(keywordScore)
    })

    test('should combine keyword and semantic scores', async () => {
      const keywordScore = 0.5
      const enhanced = await processor.getEnhancedRelevanceScore(mockFeedItem, keywordScore, mockProfile)
      
      // Result should be influenced by both scores
      expect(enhanced).toBeGreaterThanOrEqual(0)
      expect(enhanced).toBeLessThanOrEqual(1)
    })
  })

  describe('Collection Summary', () => {
    test('should generate summary for collection of items', async () => {
      const enhancedItems = await Promise.all(
        [mockFeedItem, { ...mockFeedItem, id: 'item-2' }].map(item => 
          processor.processItem(item, mockProfile)
        )
      )
      
      const collectionSummary = await processor.generateCollectionSummary(enhancedItems, mockProfile)
      
      expect(collectionSummary.summary).toBeTruthy()
      expect(collectionSummary.keyPoints).toBeInstanceOf(Array)
      expect(collectionSummary.tags).toBeInstanceOf(Array)
      expect(collectionSummary.confidence).toBeGreaterThan(0)
      expect(collectionSummary.processingTime).toBeGreaterThan(0)
    })

    test('should handle empty collection', async () => {
      const collectionSummary = await processor.generateCollectionSummary([], mockProfile)
      
      expect(collectionSummary.summary).toBeTruthy()
      expect(collectionSummary.keyPoints).toBeInstanceOf(Array)
      expect(collectionSummary.tags).toBeInstanceOf(Array)
    })
  })

  describe('Error Handling', () => {
    test('should handle processor not ready', async () => {
      const unreadyProcessor = new AIProcessor({
        defaultProvider: 'mock',
        models: {},
        processing: {
          generateSummary: true,
          enhanceTags: true,
          extractInsights: true,
          calculateSemanticScore: true,
          maxConcurrency: 1,
          timeout: 5000
        }
      })
      
      await expect(unreadyProcessor.processItem(mockFeedItem)).rejects.toThrow('not ready')
    })
  })
})