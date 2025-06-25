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
    
    // Keep batch size small to avoid timeouts (7 is the safe maximum based on testing)
    const safeBatchSize = Math.min(batchSize, 7)
    
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
    
    console.log('AI Processor Status:', {
      isAIEnabled: contentProcessor.isAIEnabled(),
      anthropicKey: !!process.env.ANTHROPIC_API_KEY
    })
    
    const profile = profileId ? 
      (await aggregator['configLoader'].getActiveProfiles()).find(p => p.id === profileId) : 
      null
    
    // Only process if we have a profile
    let successCount = 0
    let failedCount = 0
    
    let processedItemDetails: any[] = []
    
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
          console.log(`Processing item ${item.id}:`, {
            hasAISummary: !!item.aiSummary,
            summaryType: typeof item.aiSummary,
            hasAITags: !!(item.aiTags && item.aiTags.length > 0),
            hasInsights: !!item.aiInsights
          })
          
          // Standardize summary storage - always store as JSON object
          let summaryData = null
          if (item.aiSummary) {
            if (typeof item.aiSummary === 'string') {
              // If it's already a JSON string, parse it first
              try {
                const parsed = JSON.parse(item.aiSummary)
                summaryData = parsed
              } catch {
                // If it's not valid JSON, wrap it in a standard structure
                summaryData = {
                  summary: item.aiSummary,
                  keyPoints: [],
                  tags: [],
                  insights: [],
                  confidence: 0.5,
                  processingTime: 0,
                  relevanceScore: item.relevanceScore || 0
                }
              }
            } else if (typeof item.aiSummary === 'object') {
              // Already an object, store as-is
              summaryData = item.aiSummary
            }
          }
          
          console.log(`[Process-Batch] Updating database for ${item.id}:`, {
            hasSummaryData: !!summaryData,
            summaryDataType: typeof summaryData,
            aiTagsCount: item.aiTags?.length || 0
          })
          
          await dbService.updateFeedItem(item.id, {
            summary: summaryData,
            ai_tags: item.aiTags || [],
            insights: item.aiInsights,
            ai_processed: true,
            relevance_score: item.relevanceScore
          })
          successCount++
          
          processedItemDetails.push({
            id: item.id,
            title: item.title.substring(0, 50),
            summaryPreview: (() => {
              if (!summaryData) return 'No summary'
              if (typeof summaryData === 'string') {
                return (summaryData as string).substring(0, 50)
              }
              const obj = summaryData as any
              return obj.summary ? String(obj.summary).substring(0, 50) : 'No summary text'
            })(),
            aiTagsCount: item.aiTags?.length || 0
          })
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
      profileId: profileId || 'all',
      debug: {
        aiEnabled: contentProcessor.isAIEnabled(),
        hasProfile: !!profile,
        unprocessedItemsFound: unprocessedItems.length,
        anthropicKeyPresent: !!process.env.ANTHROPIC_API_KEY
      },
      processedItems: processedItemDetails
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