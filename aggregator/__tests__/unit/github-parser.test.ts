import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitHubParser } from '../../lib/sources/github-parser'
import type { FeedItem } from '../../lib/types/feed'

// Mock fetch
global.fetch = vi.fn()

describe('GitHubParser', () => {
  let parser: GitHubParser
  const mockGitHubResponse = {
    items: [
      {
        id: 123456,
        name: 'awesome-ai-tools',
        full_name: 'user/awesome-ai-tools',
        description: 'A curated list of AI tools for developers',
        html_url: 'https://github.com/user/awesome-ai-tools',
        stargazers_count: 1500,
        language: 'TypeScript',
        topics: ['ai', 'tools', 'machine-learning'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        owner: {
          login: 'user',
          avatar_url: 'https://github.com/user.png'
        }
      },
      {
        id: 789012,
        name: 'nextjs-ai-starter',
        full_name: 'company/nextjs-ai-starter',
        description: 'Next.js starter template with AI integrations',
        html_url: 'https://github.com/company/nextjs-ai-starter',
        stargazers_count: 850,
        language: 'JavaScript',
        topics: ['nextjs', 'ai', 'starter-template'],
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-15T08:00:00Z',
        owner: {
          login: 'company',
          avatar_url: 'https://github.com/company.png'
        }
      }
    ],
    total_count: 2
  }

  beforeEach(() => {
    parser = new GitHubParser()
    vi.clearAllMocks()
  })

  describe('searchRepositories', () => {
    it('should search repositories and return normalized feed items', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGitHubResponse
      } as Response)

      const result = await parser.searchRepositories('ai tools')

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: 'github-123456',
        title: 'user/awesome-ai-tools',
        content: 'A curated list of AI tools for developers',
        url: 'https://github.com/user/awesome-ai-tools',
        author: 'user',
        source: 'github',
        tags: ['ai', 'tools', 'machine-learning', 'typescript']
      })
      
      expect(result[0].publishedAt).toBeInstanceOf(Date)
      expect(result[0].metadata).toMatchObject({
        stars: 1500,
        language: 'TypeScript',
        topics: ['ai', 'tools', 'machine-learning']
      })
    })

    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Rate limit exceeded'
      } as Response)

      await expect(parser.searchRepositories('ai tools'))
        .rejects.toThrow('GitHub API error: 403 Rate limit exceeded')
    })

    it('should handle network errors', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(parser.searchRepositories('ai tools'))
        .rejects.toThrow('Failed to search GitHub repositories')
    })

    it('should normalize repository data correctly', async () => {
      const mockResponse = {
        items: [{
          id: 555,
          name: 'test-repo',
          full_name: 'test/test-repo',
          description: null, // Handle null description
          html_url: 'https://github.com/test/test-repo',
          stargazers_count: 0,
          language: null, // Handle null language
          topics: [], // Handle empty topics
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          owner: {
            login: 'test',
            avatar_url: 'https://github.com/test.png'
          }
        }],
        total_count: 1
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await parser.searchRepositories('test')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'github-555',
        title: 'test/test-repo',
        content: 'No description provided',
        url: 'https://github.com/test/test-repo',
        author: 'test',
        source: 'github',
        tags: []
      })
      
      expect(result[0].metadata).toMatchObject({
        stars: 0,
        language: 'Unknown',
        topics: []
      })
    })
  })

  describe('getTrending', () => {
    it('should get trending repositories with default parameters', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGitHubResponse
      } as Response)

      const result = await parser.getTrending()

      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('q=created%3A%3E')
      expect(fetchCall[1]).toMatchObject({
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Aggregator/1.0'
        }
      })
      expect(result).toHaveLength(2)
    })

    it('should get trending repositories with custom language', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGitHubResponse
      } as Response)

      await parser.getTrending('typescript', 'weekly')

      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('language%3Atypescript')
    })

    it('should handle different time periods', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGitHubResponse
      } as Response)

      await parser.getTrending('javascript', 'monthly')

      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('created%3A%3E')
      expect(fetchCall[0]).toContain('language%3Ajavascript')
    })
  })

  describe('fetchFromSource', () => {
    it('should fetch from a GitHub source configuration', async () => {
      const mockSource = {
        id: 'github-trending',
        name: 'GitHub Trending',
        type: 'github' as const,
        url: 'https://api.github.com/search/repositories',
        fetchInterval: 60,
        weight: 0.8,
        enabled: true,
        config: {
          language: 'typescript',
          query: 'ai machine learning',
          since: 'daily'
        }
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGitHubResponse
      } as Response)

      const result = await parser.fetchFromSource(mockSource)

      expect(result).toHaveLength(2)
      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('q=ai+machine+learning')
      expect(fetchCall[0]).toContain('language%3Atypescript')
    })

    it('should handle missing configuration gracefully', async () => {
      const mockSource = {
        id: 'github-basic',
        name: 'GitHub Basic',
        type: 'github' as const,
        url: 'https://api.github.com/search/repositories',
        fetchInterval: 60,
        weight: 0.8,
        enabled: true
        // No config object
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGitHubResponse
      } as Response)

      const result = await parser.fetchFromSource(mockSource)

      expect(result).toHaveLength(2)
      // Should use default trending query
      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('q=created%3A%3E')
    })

    it('should respect rate limits with proper headers', async () => {
      const mockSource = {
        id: 'github-test',
        name: 'GitHub Test',
        type: 'github' as const,
        url: 'https://api.github.com/search/repositories',
        fetchInterval: 60,
        weight: 0.8,
        enabled: true,
        config: {
          accessToken: 'test-token'
        }
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGitHubResponse
      } as Response)

      await parser.fetchFromSource(mockSource)

      const fetchCall = vi.mocked(fetch).mock.calls[0]
      expect(fetchCall[1]).toMatchObject({
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Aggregator/1.0',
          'Authorization': 'token test-token'
        }
      })
    })
  })
})