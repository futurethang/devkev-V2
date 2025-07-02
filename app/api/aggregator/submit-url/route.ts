import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database/database-service'
import { AIProcessor } from '@/aggregator/lib/ai/ai-processor'
import { AnthropicProvider } from '@/aggregator/lib/ai/providers/anthropic-provider'
import type { FeedItem } from '@/aggregator/lib/types/feed'

export const runtime = 'nodejs'

interface SubmitUrlRequest {
  url: string
  profileId?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SubmitUrlRequest
    const { url, profileId } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let validatedUrl: URL
    try {
      validatedUrl = new URL(url)
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Initialize services
    const db = new DatabaseService()
    
    // Check if article already exists
    const existingItems = await db.searchFeedItemsByUrl(validatedUrl.href)
    if (existingItems.length > 0) {
      return NextResponse.json({
        message: 'Article already exists in the database',
        item: existingItems[0],
        alreadyExists: true
      })
    }

    // Fetch and parse the article content
    const articleContent = await fetchArticleContent(validatedUrl.href)
    
    // Create a manual source for user-submitted articles if it doesn't exist
    const manualSourceId = 'manual-submissions'
    let source = await db.getSourceById(manualSourceId)
    
    if (!source) {
      source = await db.createSource({
        name: 'Manual Submissions',
        type: 'rss', // Using 'rss' as a generic type
        url: 'manual://user-submissions',
        enabled: true,
        fetchInterval: 0, // Never auto-fetch
        weight: 1.5 // Give manual submissions higher weight
      })
    }

    // Create the feed item
    const feedItem: Omit<FeedItem, 'id'> = {
      source: 'rss' as const, // Manual submissions use 'rss' type
      sourceId: source.id,
      sourceUrl: source.url,
      title: articleContent.title,
      url: validatedUrl.href,
      content: articleContent.content,
      author: articleContent.author || 'Unknown',
      publishedAt: articleContent.publishedAt ? new Date(articleContent.publishedAt) : new Date(),
      tags: articleContent.tags || [],
      relevanceScore: 0.8, // Default high relevance for manual submissions
    }

    // Save to database - add profileId and processing status
    const itemToSave = {
      ...feedItem,
      profileId: profileId || null,
      processingStatus: 'pending',
      aiProcessed: false
    }
    
    const savedItem = await db.createFeedItem(itemToSave as any)

    // Process with AI if configured and not disabled in development
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    const aiDisabledInDev = process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTO_AI_PROCESSING === 'true'
    
    if (anthropicApiKey && !aiDisabledInDev) {
      try {
        const aiProcessor = await AIProcessor.createDefault()
        const processedItems = await aiProcessor.processBatch([savedItem])

        if (processedItems.processed.length > 0) {
          const aiItem = processedItems.processed[0]
          await db.updateFeedItem(savedItem.id, {
            aiSummary: typeof aiItem.aiSummary === 'string' ? aiItem.aiSummary : aiItem.aiSummary?.summary,
            aiTags: aiItem.aiTags,
            insights: aiItem.insights,
            relevance_score: aiItem.relevanceScore,
            processingStatus: 'processed',
            aiProcessed: true
          })
          
          return NextResponse.json({
            message: 'Article submitted and processed successfully',
            item: aiItem
          })
        }
      } catch (aiError) {
        console.error('AI processing failed:', aiError)
        // Continue without AI processing
      }
    }

    // Mark as processed even without AI
    await db.updateFeedItem(savedItem.id, {
      processingStatus: 'processed',
      aiProcessed: false
    })

    const message = aiDisabledInDev 
      ? 'Article submitted successfully (AI processing disabled in development)'
      : 'Article submitted successfully (without AI processing)'
    
    return NextResponse.json({
      message,
      item: savedItem
    })

  } catch (error) {
    console.error('Error submitting URL:', error)
    return NextResponse.json(
      { error: 'Failed to submit URL' },
      { status: 500 }
    )
  }
}

async function fetchArticleContent(url: string): Promise<{
  title: string
  content: string
  author?: string
  publishedAt?: string
  tags?: string[]
}> {
  try {
    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DevKev-Aggregator/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    // Basic HTML parsing to extract content
    // In production, you'd want to use a proper article parser like @extractus/article-parser
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : url

    // Try to extract meta description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    const description = descMatch ? descMatch[1] : ''

    // Try to extract author
    const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i)
    const author = authorMatch ? authorMatch[1] : undefined

    // Try to extract publish date
    const dateMatch = html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)
    const publishedAt = dateMatch ? dateMatch[1] : undefined

    // Extract text content (very basic - strips all HTML)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000) // Limit content length

    return {
      title,
      content: description || textContent.substring(0, 500),
      author,
      publishedAt,
      tags: []
    }
  } catch (error) {
    console.error('Error fetching article content:', error)
    throw new Error('Failed to fetch article content')
  }
}