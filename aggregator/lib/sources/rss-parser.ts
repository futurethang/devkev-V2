import Parser from 'rss-parser'
import type { FeedItem, SourceType, SourceConfig } from '../types/feed'

/**
 * RSS/Atom feed parser that normalizes content into FeedItem format
 */
export class RSSParser {
  private parser: Parser
  
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Kevin Hyde AI Aggregator 1.0'
      }
    })
  }

  /**
   * Parse RSS feed content and return normalized FeedItems
   */
  async parseFeed(feedContent: string, sourceUrl: string, sourceName?: string): Promise<FeedItem[]> {
    try {
      const feed = await this.parser.parseString(feedContent)
      
      if (!feed.items || feed.items.length === 0) {
        return []
      }

      return feed.items.map(item => this.normalizeItem(item, sourceUrl, sourceName))
    } catch (error) {
      throw new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fetch RSS feed from URL and parse it
   */
  async fetchAndParse(feedUrl: string, sourceName?: string): Promise<FeedItem[]> {
    try {
      const response = await fetch(feedUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const feedContent = await response.text()
      return this.parseFeed(feedContent, feedUrl, sourceName)
    } catch (error) {
      throw new Error(`Failed to fetch RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Fetch RSS feed from source configuration
   */
  async fetchFromSource(source: SourceConfig): Promise<FeedItem[]> {
    return this.fetchAndParse(source.url, source.name)
  }

  /**
   * Normalize a raw RSS item to our FeedItem format
   */
  private normalizeItem(item: any, sourceUrl: string, sourceName?: string): FeedItem {
    const id = item.guid || item.link || item.id || `${sourceUrl}-${Date.now()}`
    const title = item.title || 'Untitled'
    const content = item.content || item.description || item.summary || ''
    const url = item.link || item.url || ''
    const author = this.extractAuthor(item)
    const publishedAt = this.parseDate(item.pubDate || item.isoDate || item.date)
    const tags = this.extractTags(item)

    return {
      id,
      title: title.trim(),
      content: this.stripHtml(content).trim(),
      url,
      author,
      publishedAt,
      source: 'rss' as SourceType,
      sourceName,
      sourceUrl,
      tags,
      metadata: {
        categories: item.categories,
        guid: item.guid,
        originalPubDate: item.pubDate,
        creator: item.creator,
        contentSnippet: item.contentSnippet
      }
    }
  }

  /**
   * Extract author name from various possible fields
   */
  private extractAuthor(item: any): string {
    if (item.author) {
      // Handle "email (Name)" format
      const match = item.author.match(/\(([^)]+)\)/)
      if (match) {
        return match[1]
      }
      return item.author
    }
    
    if (item.creator) {
      return item.creator
    }
    
    if (item['dc:creator']) {
      return item['dc:creator']
    }
    
    return 'Unknown'
  }

  /**
   * Parse date string into Date object
   */
  private parseDate(dateString?: string): Date {
    if (!dateString) {
      return new Date()
    }
    
    const parsed = new Date(dateString)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }

  /**
   * Extract tags from categories
   */
  private extractTags(item: any): string[] {
    const tags: string[] = []
    
    if (item.categories && Array.isArray(item.categories)) {
      tags.push(...item.categories.map((cat: string) => cat.toLowerCase().trim()))
    }
    
    return tags.filter(tag => tag.length > 0)
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\s+/g, ' ')
              .trim()
  }
}