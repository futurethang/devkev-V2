import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../../lib/database/database-service'
import { DatabaseAggregator } from '../../../../aggregator/lib/database-aggregator'

// Simple endpoint to trigger AI batch processing
// Designed to work within Vercel hobby tier limits

const aggregator = new DatabaseAggregator(true)
let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    try {
      await aggregator.initialize()
      initialized = true
    } catch (error) {
      console.error('Failed to initialize aggregator:', error)
      throw error
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized()
    
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile')
    const batchSize = parseInt(searchParams.get('batchSize') || '5', 10)
    
    // Keep batch size small to avoid timeouts
    const safeBatchSize = Math.min(batchSize, 10)
    
    const dbService = new DatabaseService()
    const startTime = Date.now()
    
    // Get unprocessed items
    const unprocessedItems = await dbService.getFeedItems({
      profileId: profileId || undefined,
      limit: safeBatchSize,
      aiProcessedOnly: false
    })
    
    if (unprocessedItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unprocessed items found',
        processedCount: 0,
        remainingCount: 0,
        duration: Date.now() - startTime
      })
    }
    
    // Process items with AI
    const contentProcessor = aggregator['contentProcessor']
    await contentProcessor.initializeAISync()
    
    const profile = profileId ? 
      (await aggregator['configLoader'].getActiveProfiles()).find(p => p.id === profileId) : 
      null
    
    // Only process if we have a profile
    let successCount = 0
    let failedCount = 0
    
    if (profile) {
      // Process the batch
      const enhancedItems = await contentProcessor.processBatchWithAI(
        unprocessedItems.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content || '',
          url: item.url,
          author: item.author || '',
          publishedAt: item.publishedAt,
          source: item.source,
          sourceUrl: item.sourceName || '',
          tags: item.tags || [],
          relevanceScore: item.relevanceScore || 0
        })),
        profile
      )
      
      // Update items in database
      for (const item of enhancedItems) {
        try {
          await dbService.updateFeedItem(item.id, {
            summary: item.aiSummary,
            ai_tags: item.aiTags || [],
            insights: item.aiInsights,
            ai_processed: true,
            relevance_score: item.relevanceScore
          })
          successCount++
        } catch (error) {
          console.error(`Failed to update item ${item.id}:`, error)
          failedCount++
        }
      }
    } else {
      // No profile specified, can't process with AI
      failedCount = unprocessedItems.length
    }
    
    // Get remaining count
    const remainingCount = await dbService.getUnprocessedCount(profileId || undefined)
    
    return NextResponse.json({
      success: true,
      message: profile ? `Processed ${successCount} items` : 'No profile specified for AI processing',
      processedCount: successCount,
      failedCount,
      remainingCount,
      duration: Date.now() - startTime,
      profileId: profileId || 'all'
    })
    
  } catch (error) {
    console.error('Batch processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process batch',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}