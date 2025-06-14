import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HackerNewsParser } from '../../lib/sources/hn-parser'
import type { FeedItem } from '../../lib/types/feed'

// Mock fetch
global.fetch = vi.fn()

describe('HackerNewsParser', () => {
  let parser: HackerNewsParser
  
  beforeEach(() => {
    parser = new HackerNewsParser()
    vi.clearAllMocks()
  })

  describe('getTopStories', () => {
    it('should fetch top stories and return normalized feed items', async () => {
      const mockTopStoryIds = [12345, 12346, 12347]
      const mockStoryDetails = [
        {
          id: 12345,
          title: 'New AI Framework Released',
          url: 'https://example.com/ai-framework',
          by: 'aidev',
          time: 1640995200, // 2022-01-01 00:00:00 UTC
          score: 350,
          descendants: 42,
          type: 'story',
          text: 'This is an amazing new AI framework that developers love.'
        },
        {
          id: 12346,
          title: 'Show HN: My AI Product for Developers',
          url: 'https://example.com/ai-product',
          by: 'builder',
          time: 1640995800,
          score: 250,
          descendants: 28,
          type: 'story'
        },
        {
          id: 12347,
          title: 'Ask HN: Best practices for machine learning in production?',
          by: 'mleng',
          time: 1640996400,
          score: 180,
          descendants: 67,
          type: 'story',
          text: 'Looking for advice on deploying ML models.'
        }
      ]

      const mockFetch = vi.mocked(fetch)
      
      // Mock top stories API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopStoryIds
      } as Response)
      
      // Mock individual story API calls
      mockStoryDetails.forEach(story => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => story
        } as Response)
      })

      const result = await parser.getTopStories(3)

      expect(result).toHaveLength(3)
      
      expect(result[0]).toMatchObject({
        id: 'hn-12345',
        title: 'New AI Framework Released',
        url: 'https://example.com/ai-framework',
        author: 'aidev',
        source: 'hn'
      })
      
      // Check that tags include story category and extracted topics
      expect(result[0].tags).toContain('story')
      expect(result[0].tags).toContain('ai')
      
      expect(result[0].publishedAt).toBeInstanceOf(Date)
      expect(result[0].metadata).toMatchObject({
        score: 350,
        comments: 42,
        storyType: 'story'
      })
    })

    it('should handle stories without URLs (Ask HN, etc.)', async () => {
      const mockTopStoryIds = [12348]
      const mockStory = {
        id: 12348,
        title: 'Ask HN: Best practices for machine learning?',
        by: 'asker',
        time: 1640995200,
        score: 120,
        descendants: 35,
        type: 'story',
        text: 'Looking for ML best practices and advice from the community.'
      }

      const mockFetch = vi.mocked(fetch)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopStoryIds
      } as Response)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStory
      } as Response)

      const result = await parser.getTopStories(1)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'hn-12348',
        title: 'Ask HN: Best practices for machine learning?',
        url: 'https://news.ycombinator.com/item?id=12348', // Should use HN URL
        author: 'asker',
        content: 'Looking for ML best practices and advice from the community.',
        source: 'hn'
      })
    })

    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)

      await expect(parser.getTopStories(5))
        .rejects.toThrow('HackerNews API error: 500 Internal Server Error')
    })

    it('should handle network errors', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(parser.getTopStories(5))
        .rejects.toThrow('Failed to fetch HackerNews top stories')
    })
  })

  describe('searchStories', () => {
    it('should search stories by tags and keywords', async () => {
      const mockSearchResults = {
        hits: [
          {
            objectID: '23456',
            title: 'Machine Learning in Production',
            url: 'https://example.com/ml-production',
            author: 'mlexpert',
            created_at_i: 1640995200,
            points: 280,
            num_comments: 45,
            story_text: 'Guide to deploying ML models in production environments.'
          },
          {
            objectID: '23457',
            title: 'AI Safety Research Update',
            url: 'https://example.com/ai-safety',
            author: 'researcher',
            created_at_i: 1640995800,
            points: 195,
            num_comments: 32
          }
        ],
        nbHits: 2
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSearchResults
      } as Response)

      const result = await parser.searchStories('machine learning', ['ai', 'ml'])

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: 'hn-23456',
        title: 'Machine Learning in Production',
        url: 'https://example.com/ml-production',
        author: 'mlexpert',
        source: 'hn',
        content: 'Guide to deploying ML models in production environments.'
      })
      
      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('query=machine%20learning')
      expect(fetchCall[0]).toContain('tags=story')
    })

    it('should handle empty search results', async () => {
      const mockSearchResults = {
        hits: [],
        nbHits: 0
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSearchResults
      } as Response)

      const result = await parser.searchStories('nonexistent')

      expect(result).toHaveLength(0)
    })
  })

  describe('fetchFromSource', () => {
    it('should fetch from a HackerNews source configuration', async () => {
      const mockSource = {
        id: 'hn-top',
        name: 'HackerNews Top',
        type: 'hn' as const,
        url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
        fetchInterval: 30,
        weight: 0.8,
        enabled: true,
        config: {
          count: 2,
          query: 'ai machine learning'
        }
      }

      const mockSearchResults = {
        hits: [
          {
            objectID: '34567',
            title: 'AI Development Tools',
            url: 'https://example.com/ai-tools',
            author: 'devtools',
            created_at_i: 1640995200,
            points: 320,
            num_comments: 58
          }
        ],
        nbHits: 1
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSearchResults
      } as Response)

      const result = await parser.fetchFromSource(mockSource)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('AI Development Tools')
    })

    it('should use top stories when no query is provided', async () => {
      const mockSource = {
        id: 'hn-basic',
        name: 'HackerNews Basic',
        type: 'hn' as const,
        url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
        fetchInterval: 30,
        weight: 0.8,
        enabled: true,
        config: {
          count: 1
        }
      }

      const mockTopStoryIds = [45678]
      const mockStory = {
        id: 45678,
        title: 'Tech News Story',
        url: 'https://example.com/tech-news',
        by: 'technews',
        time: 1640995200,
        score: 150,
        descendants: 25,
        type: 'story'
      }

      const mockFetch = vi.mocked(fetch)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopStoryIds
      } as Response)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStory
      } as Response)

      const result = await parser.fetchFromSource(mockSource)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Tech News Story')
      
      // Should have called top stories API
      expect(fetch).toHaveBeenCalledWith('https://hacker-news.firebaseio.com/v0/topstories.json')
    })
  })

  describe('categorizeStory', () => {
    it('should categorize different types of HN stories', () => {
      expect(parser.categorizeStory('Show HN: My new app')).toEqual(['story', 'show-hn'])
      expect(parser.categorizeStory('Ask HN: How to learn ML?')).toEqual(['story', 'ask-hn'])
      expect(parser.categorizeStory('Tell HN: My experience with AI')).toEqual(['story', 'tell-hn'])
      expect(parser.categorizeStory('Regular tech news story')).toEqual(['story'])
    })
  })

  describe('extractTopics', () => {
    it('should extract tech topics from title and content', () => {
      const title = 'Machine Learning with React and TypeScript'
      const content = 'Building AI applications using modern web technologies'
      
      const topics = parser.extractTopics(title, content)
      
      expect(topics).toContain('machine-learning')
      expect(topics).toContain('react')
      expect(topics).toContain('typescript')
      expect(topics).toContain('ai')
    })
  })
})