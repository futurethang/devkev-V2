import { describe, it, expect, vi } from 'vitest'
import { RSSParser } from '../../lib/sources/rss-parser'
import type { FeedItem } from '../../lib/types/feed'

describe('RSSParser', () => {
  describe('parseFeed', () => {
    it('should parse a valid RSS feed and return normalized items', async () => {
      const parser = new RSSParser()
      const mockRSSFeed = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Dev Blog</title>
            <link>https://example.com</link>
            <description>A developer blog</description>
            <item>
              <title>Understanding AI Development</title>
              <link>https://example.com/post1</link>
              <description>A post about AI development practices</description>
              <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
              <author>john@example.com (John Doe)</author>
              <guid>https://example.com/post1</guid>
            </item>
          </channel>
        </rss>`

      const result = await parser.parseFeed(mockRSSFeed, 'https://example.com/feed.xml')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'https://example.com/post1',
        title: 'Understanding AI Development',
        content: 'A post about AI development practices',
        url: 'https://example.com/post1',
        author: 'John Doe',
        publishedAt: new Date('2024-01-15T10:00:00.000Z'),
        source: 'rss',
        sourceUrl: 'https://example.com/feed.xml',
        tags: []
      })
    })

    it('should handle missing optional fields gracefully', async () => {
      const parser = new RSSParser()
      const mockRSSFeed = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Dev Blog</title>
            <item>
              <title>Minimal Post</title>
              <link>https://example.com/post2</link>
            </item>
          </channel>
        </rss>`

      const result = await parser.parseFeed(mockRSSFeed, 'https://example.com/feed.xml')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'https://example.com/post2',
        title: 'Minimal Post',
        content: '',
        url: 'https://example.com/post2',
        author: 'Unknown',
        source: 'rss',
        sourceUrl: 'https://example.com/feed.xml',
        tags: []
      })
      expect(result[0].publishedAt).toBeInstanceOf(Date)
    })

    it('should throw an error for invalid XML', async () => {
      const parser = new RSSParser()
      const invalidXML = 'not valid xml'

      await expect(parser.parseFeed(invalidXML, 'https://example.com/feed.xml'))
        .rejects.toThrow('Failed to parse RSS feed')
    })

    it('should extract categories as tags when available', async () => {
      const parser = new RSSParser()
      const mockRSSFeed = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Dev Blog</title>
            <item>
              <title>AI and React</title>
              <link>https://example.com/post3</link>
              <category>AI</category>
              <category>React</category>
              <category>TypeScript</category>
            </item>
          </channel>
        </rss>`

      const result = await parser.parseFeed(mockRSSFeed, 'https://example.com/feed.xml')

      expect(result[0].tags).toEqual(['ai', 'react', 'typescript'])
    })
  })

  describe('fetchAndParse', () => {
    it('should fetch and parse a feed from a URL', async () => {
      const parser = new RSSParser()
      
      // Mock fetch for testing
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `<?xml version="1.0" encoding="UTF-8"?>
          <rss version="2.0">
            <channel>
              <title>Test Blog</title>
              <item>
                <title>Test Post</title>
                <link>https://example.com/test</link>
              </item>
            </channel>
          </rss>`
      } as Response)

      const result = await parser.fetchAndParse('https://example.com/feed.xml')

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Test Post')
      expect(fetch).toHaveBeenCalledWith('https://example.com/feed.xml')
    })

    it('should handle fetch errors gracefully', async () => {
      const parser = new RSSParser()
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(parser.fetchAndParse('https://example.com/feed.xml'))
        .rejects.toThrow('Failed to fetch RSS feed')
    })
  })
})