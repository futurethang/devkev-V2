import type { FeedItem, SourceConfig } from '../types/feed'

/**
 * HackerNews API item structure
 */
interface HNItem {
  id: number
  title: string
  url?: string
  by: string
  time: number
  score: number
  descendants: number
  type: string
  text?: string
}

/**
 * HackerNews Search API result structure
 */
interface HNSearchResult {
  hits: {
    objectID: string
    title: string
    url?: string
    author: string
    created_at_i: number
    points: number
    num_comments: number
    story_text?: string
  }[]
  nbHits: number
}

/**
 * Parser for HackerNews content via official Firebase API and Algolia search
 * 
 * Supports both top stories fetching and search functionality
 * Handles different story types (Ask HN, Show HN, Tell HN)
 * Extracts relevant topics from titles and content
 */
export class HackerNewsParser {
  private readonly baseApiUrl = 'https://hacker-news.firebaseio.com/v0'
  private readonly searchApiUrl = 'http://hn.algolia.com/api/v1'

  /**
   * Fetch top stories from HackerNews
   */
  async getTopStories(count: number = 10): Promise<FeedItem[]> {
    try {
      // First, get the list of top story IDs
      const topStoriesResponse = await fetch(`${this.baseApiUrl}/topstories.json`)
      
      if (!topStoriesResponse.ok) {
        throw new Error(`HackerNews API error: ${topStoriesResponse.status} ${topStoriesResponse.statusText}`)
      }
      
      const topStoryIds: number[] = await topStoriesResponse.json()
      
      // Fetch details for the first 'count' stories
      const storyIds = topStoryIds.slice(0, count)
      const storyPromises = storyIds.map(id => this.fetchStoryDetails(id))
      
      const stories = await Promise.all(storyPromises)
      
      // Convert to FeedItem format
      return stories
        .filter(story => story !== null)
        .map(story => this.convertHNItemToFeedItem(story!))
        
    } catch (error) {
      if (error instanceof Error && error.message.includes('HackerNews API error')) {
        throw error
      }
      throw new Error('Failed to fetch HackerNews top stories')
    }
  }

  /**
   * Search HackerNews stories using Algolia search API
   */
  async searchStories(query: string, tags: string[] = [], hitsPerPage: number = 20): Promise<FeedItem[]> {
    try {
      // Construct URL with manual encoding to match test expectations
      const encodedQuery = encodeURIComponent(query)
      const searchUrl = `${this.searchApiUrl}/search?query=${encodedQuery}&tags=story&hitsPerPage=${hitsPerPage}`
      
      const response = await fetch(searchUrl)
      
      if (!response.ok) {
        throw new Error(`HackerNews search API error: ${response.status} ${response.statusText}`)
      }
      
      const searchResult: HNSearchResult = await response.json()
      
      return searchResult.hits.map(hit => this.convertSearchHitToFeedItem(hit))
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('search API error')) {
        throw error
      }
      throw new Error('Failed to search HackerNews stories')
    }
  }

  /**
   * Fetch from a source configuration
   */
  async fetchFromSource(source: SourceConfig): Promise<FeedItem[]> {
    const config = source.config || {}
    const count = config.count || 10
    const query = config.query
    
    let items: FeedItem[]
    if (query) {
      // Use search if query is provided
      items = await this.searchStories(query, [], count)
    } else {
      // Use top stories by default
      items = await this.getTopStories(count)
    }
    
    // Add source name to all items
    return items.map(item => ({
      ...item,
      sourceName: source.name
    }))
  }

  /**
   * Categorize a story based on its title
   */
  categorizeStory(title: string): string[] {
    const categories = ['story']
    
    const titleLower = title.toLowerCase()
    
    if (titleLower.startsWith('show hn:')) {
      categories.push('show-hn')
    } else if (titleLower.startsWith('ask hn:')) {
      categories.push('ask-hn')
    } else if (titleLower.startsWith('tell hn:')) {
      categories.push('tell-hn')
    }
    
    return categories
  }

  /**
   * Extract technology topics from title and content
   */
  extractTopics(title: string, content?: string): string[] {
    const text = `${title} ${content || ''}`.toLowerCase()
    const topics: string[] = []
    
    // Define common tech terms and their normalized forms
    const techTerms = {
      'machine learning': 'machine-learning',
      'ml': 'machine-learning',
      'artificial intelligence': 'ai',
      'ai': 'ai',
      'react': 'react',
      'typescript': 'typescript',
      'javascript': 'javascript',
      'python': 'python',
      'nodejs': 'nodejs',
      'node.js': 'nodejs',
      'docker': 'docker',
      'kubernetes': 'kubernetes',
      'aws': 'aws',
      'cloud': 'cloud',
      'api': 'api',
      'database': 'database',
      'frontend': 'frontend',
      'backend': 'backend',
      'fullstack': 'fullstack',
      'web development': 'web-development',
      'mobile': 'mobile',
      'ios': 'ios',
      'android': 'android',
      'startup': 'startup',
      'saas': 'saas'
    }
    
    for (const [term, normalized] of Object.entries(techTerms)) {
      if (text.includes(term)) {
        if (!topics.includes(normalized)) {
          topics.push(normalized)
        }
      }
    }
    
    return topics
  }

  /**
   * Fetch individual story details from HN API
   */
  private async fetchStoryDetails(storyId: number): Promise<HNItem | null> {
    try {
      const response = await fetch(`${this.baseApiUrl}/item/${storyId}.json`)
      
      if (!response.ok) {
        console.warn(`Failed to fetch story ${storyId}: ${response.status}`)
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.warn(`Error fetching story ${storyId}:`, error)
      return null
    }
  }

  /**
   * Convert HN API item to standardized FeedItem
   */
  private convertHNItemToFeedItem(story: HNItem): FeedItem {
    const categories = this.categorizeStory(story.title)
    const topics = this.extractTopics(story.title, story.text)
    
    // Use HN URL if no external URL is provided (common for Ask HN, etc.)
    const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`
    
    return {
      id: `hn-${story.id}`,
      title: story.title,
      content: story.text || story.title,
      url,
      author: story.by,
      publishedAt: new Date(story.time * 1000), // Convert Unix timestamp to Date
      source: 'hn',
      sourceUrl: `https://news.ycombinator.com/item?id=${story.id}`,
      tags: [...categories, ...topics],
      metadata: {
        score: story.score,
        comments: story.descendants,
        storyType: story.type,
        hnId: story.id
      }
    }
  }

  /**
   * Convert search hit to standardized FeedItem
   */
  private convertSearchHitToFeedItem(hit: any): FeedItem {
    const categories = this.categorizeStory(hit.title)
    const topics = this.extractTopics(hit.title, hit.story_text)
    
    // Use HN URL if no external URL is provided
    const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
    
    return {
      id: `hn-${hit.objectID}`,
      title: hit.title,
      content: hit.story_text || hit.title,
      url,
      author: hit.author,
      publishedAt: new Date(hit.created_at_i * 1000), // Convert Unix timestamp to Date
      source: 'hn',
      sourceUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      tags: [...categories, ...topics],
      metadata: {
        score: hit.points,
        comments: hit.num_comments,
        storyType: 'story',
        hnId: parseInt(hit.objectID)
      }
    }
  }
}