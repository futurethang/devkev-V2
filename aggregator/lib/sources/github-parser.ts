import type { FeedItem, SourceConfig } from '../types/feed'

/**
 * GitHub repository data from API
 */
interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
  topics: string[]
  created_at: string
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

/**
 * GitHub API search response
 */
interface GitHubSearchResponse {
  total_count: number
  incomplete_results: boolean
  items: GitHubRepository[]
}

/**
 * GitHub API parser for trending repositories and search
 */
export class GitHubParser {
  private readonly baseUrl = 'https://api.github.com'
  private readonly userAgent = 'AI-Aggregator/1.0'

  /**
   * Search GitHub repositories
   */
  async searchRepositories(query: string, language?: string, sort: string = 'stars', headers?: Record<string, string>): Promise<FeedItem[]> {
    try {
      let searchQuery = query
      
      if (language) {
        searchQuery += ` language:${language}`
      }

      const url = new URL(`${this.baseUrl}/search/repositories`)
      url.searchParams.set('q', searchQuery)
      url.searchParams.set('sort', sort)
      url.searchParams.set('order', 'desc')
      url.searchParams.set('per_page', '30')

      const requestHeaders = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': this.userAgent,
        ...headers
      }

      const response = await fetch(url.toString(), {
        headers: requestHeaders
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const data: GitHubSearchResponse = await response.json()
      return data.items.map(repo => this.normalizeRepository(repo))
    } catch (error) {
      throw new Error(`Failed to search GitHub repositories: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get trending repositories
   */
  async getTrending(language?: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<FeedItem[]> {
    return this.getTrendingWithHeaders(language, period, {})
  }

  /**
   * Get trending repositories with custom headers
   */
  async getTrendingWithHeaders(language?: string, period: 'daily' | 'weekly' | 'monthly' = 'daily', headers: Record<string, string> = {}): Promise<FeedItem[]> {
    try {
      // Calculate date for "trending" based on period
      const now = new Date()
      const daysAgo = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30
      const sinceDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
      const sinceDateString = sinceDate.toISOString().split('T')[0]

      let query = `created:>${sinceDateString}`
      
      if (language) {
        query += ` language:${language}`
      }

      return this.searchRepositories(query, undefined, 'stars', headers)
    } catch (error) {
      throw new Error(`Failed to get trending repositories: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetch from a configured GitHub source
   */
  async fetchFromSource(source: SourceConfig): Promise<FeedItem[]> {
    try {
      const config = source.config || {}
      
      // Build headers with optional authentication
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': this.userAgent
      }

      if (config.accessToken) {
        headers['Authorization'] = `token ${config.accessToken}`
      }

      let items: FeedItem[] = []

      if (config.query) {
        // Custom search query
        items = await this.searchRepositories(
          config.query,
          config.language,
          'stars',
          headers
        )
      } else {
        // Default to trending repositories - need to pass headers through getTrending
        const authHeaders = config.accessToken ? { 'Authorization': `token ${config.accessToken}` } : {}
        items = await this.getTrendingWithHeaders(
          config.language,
          config.since as 'daily' | 'weekly' | 'monthly' || 'daily',
          authHeaders
        )
      }

      // Apply source-specific filtering if needed
      return items.map(item => ({
        ...item,
        sourceUrl: source.url || this.baseUrl
      }))
    } catch (error) {
      throw new Error(`Failed to fetch from GitHub source ${source.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Normalize GitHub repository to FeedItem
   */
  private normalizeRepository(repo: GitHubRepository): FeedItem {
    const title = repo.full_name
    const content = repo.description || 'No description provided'
    const url = repo.html_url
    const author = repo.owner.login
    const publishedAt = new Date(repo.updated_at)
    
    // Extract tags from topics and language
    const tags: string[] = []
    
    if (repo.topics && repo.topics.length > 0) {
      tags.push(...repo.topics.map(topic => topic.toLowerCase()))
    }
    
    if (repo.language) {
      tags.push(repo.language.toLowerCase())
    }

    return {
      id: `github-${repo.id}`,
      title,
      content,
      url,
      author,
      publishedAt,
      source: 'github',
      sourceUrl: this.baseUrl,
      tags: [...new Set(tags)], // Remove duplicates
      metadata: {
        stars: repo.stargazers_count,
        language: repo.language || 'Unknown',
        topics: repo.topics || [],
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        avatarUrl: repo.owner.avatar_url,
        repositoryId: repo.id
      }
    }
  }

  /**
   * Get repositories by specific criteria
   */
  async getRepositoriesByTopic(topic: string, minStars: number = 100): Promise<FeedItem[]> {
    const query = `topic:${topic} stars:>=${minStars}`
    return this.searchRepositories(query, undefined, 'stars')
  }

  /**
   * Get recently updated repositories
   */
  async getRecentlyUpdated(language?: string, daysAgo: number = 7): Promise<FeedItem[]> {
    const sinceDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000))
    const sinceDateString = sinceDate.toISOString().split('T')[0]
    
    let query = `pushed:>${sinceDateString}`
    
    if (language) {
      query += ` language:${language}`
    }
    
    return this.searchRepositories(query, undefined, 'updated')
  }

  /**
   * Get repositories with AI/ML topics
   */
  async getAIRepositories(period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<FeedItem[]> {
    const aiTopics = [
      'artificial-intelligence',
      'machine-learning', 
      'deep-learning',
      'neural-networks',
      'computer-vision',
      'natural-language-processing',
      'chatgpt',
      'openai',
      'transformers',
      'pytorch',
      'tensorflow'
    ]
    
    const topicQuery = aiTopics.map(topic => `topic:${topic}`).join(' OR ')
    
    const daysAgo = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30
    const sinceDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000))
    const sinceDateString = sinceDate.toISOString().split('T')[0]
    
    const query = `(${topicQuery}) created:>${sinceDateString} stars:>10`
    
    return this.searchRepositories(query, undefined, 'stars')
  }
}