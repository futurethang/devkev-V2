import { describe, it, expect, beforeEach } from 'vitest'
import { ContentProcessor } from '../../lib/processing/content-processor'
import type { FeedItem, FocusProfile } from '../../lib/types/feed'

describe('ContentProcessor', () => {
  let processor: ContentProcessor
  let mockProfile: FocusProfile
  let mockFeedItem: FeedItem

  beforeEach(() => {
    processor = new ContentProcessor()
    
    mockProfile = {
      id: 'ai-product',
      name: 'AI Product Builder',
      description: 'Focus on AI products',
      weight: 1.0,
      keywords: {
        boost: {
          high: ['ai product', 'user experience', 'chatgpt'],
          medium: ['prototype', 'mvp', 'startup'],
          low: ['revenue', 'business model']
        },
        filter: {
          exclude: ['academic', 'research paper', 'phd'],
          require: ['ai'] // Only require one keyword to be more permissive
        }
      },
      sources: ['test-source'],
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

    mockFeedItem = {
      id: 'test-item-1',
      title: 'Building AI Products for Better User Experience',
      content: 'This article discusses how to create AI-powered products that enhance user experience through intelligent automation.',
      url: 'https://example.com/ai-product-ux',
      author: 'Jane Smith',
      publishedAt: new Date(), // Use current date
      source: 'rss',
      sourceUrl: 'https://example.com/feed.xml',
      tags: ['ai', 'product', 'ux']
    }
  })

  describe('calculateRelevanceScore', () => {
    it('should calculate high relevance for items matching high-value keywords', () => {
      const score = processor.calculateRelevanceScore(mockFeedItem, mockProfile)
      
      // Should match "ai product" and "user experience" (high value)
      // Plus base keywords "ai" and "product" 
      expect(score).toBeGreaterThan(0.8)
    })

    it('should give medium relevance for medium-value keywords', () => {
      const item = {
        ...mockFeedItem,
        title: 'Building an AI MVP Startup',
        content: 'How to create a minimum viable product for your AI startup',
        tags: ['mvp', 'startup', 'ai']
      }

      const score = processor.calculateRelevanceScore(item, mockProfile)
      
      // Should match "mvp" and "startup" (medium value)
      expect(score).toBeGreaterThan(0.3)
      expect(score).toBeLessThan(0.8)
    })

    it('should give low relevance for items with only low-value keywords', () => {
      const item = {
        ...mockFeedItem,
        title: 'AI Revenue Models and Business Strategy',
        content: 'Understanding different business models for AI revenue generation',
        tags: ['revenue', 'business', 'ai']
      }

      const score = processor.calculateRelevanceScore(item, mockProfile)
      
      // Should match "revenue" and "business model" (low value)
      expect(score).toBeLessThan(0.5)
    })

    it('should return zero for excluded content', () => {
      const item = {
        ...mockFeedItem,
        title: 'Academic Research Paper on Machine Learning',
        content: 'This PhD research explores theoretical foundations of AI',
        tags: ['academic', 'research', 'phd']
      }

      const score = processor.calculateRelevanceScore(item, mockProfile)
      
      // Should be excluded due to "academic", "research paper", "phd"
      expect(score).toBe(0)
    })

    it('should return zero if required keywords are missing', () => {
      const item = {
        ...mockFeedItem,
        title: 'Web Development Best Practices',
        content: 'How to build better websites with modern tools',
        tags: ['web', 'development']
      }

      const score = processor.calculateRelevanceScore(item, mockProfile)
      
      // Should be excluded due to missing required keywords "ai" and "product"
      expect(score).toBe(0)
    })

    it('should normalize scores to 0-1 range', () => {
      const item = {
        ...mockFeedItem,
        title: 'AI Product User Experience ChatGPT MVP Startup Revenue',
        content: 'ai product user experience chatgpt mvp startup revenue business model prototype',
        tags: ['ai', 'product', 'ux', 'chatgpt', 'mvp', 'startup']
      }

      const score = processor.calculateRelevanceScore(item, mockProfile)
      
      // Even with many matching keywords, score should not exceed 1.0
      expect(score).toBeLessThanOrEqual(1.0)
      expect(score).toBeGreaterThan(0.8)
    })

    it('should be case-insensitive for keyword matching', () => {
      const item = {
        ...mockFeedItem,
        title: 'AI PRODUCT for USER EXPERIENCE',
        content: 'Building AI Products with ChatGPT',
        tags: ['AI', 'PRODUCT']
      }

      const score = processor.calculateRelevanceScore(item, mockProfile)
      
      // Should match despite different casing
      expect(score).toBeGreaterThan(0.8)
    })
  })

  describe('enhanceTags', () => {
    it('should extract additional tags from title and content', () => {
      const item = {
        ...mockFeedItem,
        title: 'Machine Learning and Deep Learning for NLP',
        content: 'Exploring neural networks and transformers for natural language processing',
        tags: ['ai'] // minimal existing tags
      }

      const enhancedTags = processor.enhanceTags(item)
      
      expect(enhancedTags).toContain('machine learning')
      expect(enhancedTags).toContain('deep learning')
      expect(enhancedTags).toContain('nlp')
      expect(enhancedTags).toContain('neural networks')
      expect(enhancedTags).toContain('transformers')
      
      // Should preserve existing tags
      expect(enhancedTags).toContain('ai')
    })

    it('should normalize extracted tags', () => {
      const item = {
        ...mockFeedItem,
        title: 'React.js and Vue.js Development',
        content: 'Building apps with React.js, Vue.js, and Node.js',
        tags: []
      }

      const enhancedTags = processor.enhanceTags(item)
      
      // Should normalize to lowercase and remove punctuation
      expect(enhancedTags).toContain('react')
      expect(enhancedTags).toContain('vue')
      expect(enhancedTags).toContain('nodejs')
    })

    it('should remove duplicate tags', () => {
      const item = {
        ...mockFeedItem,
        title: 'React React React Development',
        content: 'Learning React for React development',
        tags: ['react']
      }

      const enhancedTags = processor.enhanceTags(item)
      
      // Should only have one "react" tag
      const reactCount = enhancedTags.filter(tag => tag === 'react').length
      expect(reactCount).toBe(1)
    })
  })

  describe('processItem', () => {
    it('should process an item with relevance scoring and tag enhancement', () => {
      const processedItem = processor.processItem(mockFeedItem, mockProfile)
      
      expect(processedItem.relevanceScore).toBeDefined()
      expect(processedItem.relevanceScore).toBeGreaterThan(0.8)
      
      // Should enhance tags
      expect(processedItem.tags.length).toBeGreaterThan(mockFeedItem.tags.length)
    })

    it('should respect processing configuration', () => {
      const profileNoEnhancement = {
        ...mockProfile,
        processing: {
          ...mockProfile.processing,
          enhanceTags: false,
          scoreRelevance: false
        }
      }

      const processedItem = processor.processItem(mockFeedItem, profileNoEnhancement)
      
      // Should not add relevance score or enhance tags
      expect(processedItem.relevanceScore).toBeUndefined()
      expect(processedItem.tags).toEqual(mockFeedItem.tags)
    })

    it('should filter out items below minimum relevance score', () => {
      const profileHighThreshold = {
        ...mockProfile,
        processing: {
          ...mockProfile.processing,
          minRelevanceScore: 0.9
        }
      }

      const lowRelevanceItem = {
        ...mockFeedItem,
        title: 'Random Topic',
        content: 'This has minimal relevance to AI products',
        tags: ['ai'] // just barely meets required keywords
      }

      const processedItem = processor.processItem(lowRelevanceItem, profileHighThreshold)
      
      // Should return null for items below threshold
      expect(processedItem).toBeNull()
    })
  })

  describe('processBatch', () => {
    it('should process multiple items and return sorted results', () => {
      const items: FeedItem[] = [
        {
          ...mockFeedItem,
          id: 'item-1',
          title: 'High Relevance AI Product',
          content: 'AI product user experience chatgpt'
        },
        {
          ...mockFeedItem,
          id: 'item-2', 
          title: 'Medium Relevance AI Startup',
          content: 'mvp startup ai product'
        },
        {
          ...mockFeedItem,
          id: 'item-3',
          title: 'Low Relevance AI Business',
          content: 'revenue business model ai product'
        }
      ]

      const processedItems = processor.processBatch(items, mockProfile)
      
      expect(processedItems).toHaveLength(3)
      
      // Should be sorted by relevance score (highest first)
      expect(processedItems[0].relevanceScore).toBeGreaterThanOrEqual(processedItems[1].relevanceScore!)
      expect(processedItems[1].relevanceScore).toBeGreaterThanOrEqual(processedItems[2].relevanceScore!)
      
      // Highest scoring should be the AI product item
      expect(processedItems[0].id).toBe('item-1')
    })

    it('should filter out items below threshold', () => {
      const profileHighThreshold = {
        ...mockProfile,
        processing: {
          ...mockProfile.processing,
          minRelevanceScore: 0.8
        }
      }

      const items: FeedItem[] = [
        {
          ...mockFeedItem,
          id: 'item-1',
          title: 'High Relevance AI Product User Experience',
          content: 'AI product user experience chatgpt'
        },
        {
          ...mockFeedItem,
          id: 'item-2',
          title: 'Low Relevance Random AI Topic',
          content: 'random content with minimal ai relevance'
        }
      ]

      const processedItems = processor.processBatch(items, profileHighThreshold)
      
      // Should only return high-relevance items
      expect(processedItems).toHaveLength(1)
      expect(processedItems[0].id).toBe('item-1')
    })
  })
})