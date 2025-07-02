import { NextRequest, NextResponse } from 'next/server'
import { DatabaseAggregator } from '../../../../aggregator/lib/database-aggregator'
import { DatabaseService } from '../../../../lib/database/database-service'

// Background sync API for scheduled processing
// This ensures fresh data is always available for instant UI loading

// Disable AI in development unless explicitly enabled
const aiEnabled = process.env.NODE_ENV === 'development' 
  ? process.env.AGGREGATOR_AI_ENABLED === 'true'
  : true
const aggregator = new DatabaseAggregator(aiEnabled)
const dbService = new DatabaseService()
let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    try {
      await aggregator.initialize()
      initialized = true
      console.log('Background sync aggregator initialized')
    } catch (error) {
      console.error('Failed to initialize background sync aggregator:', error)
      throw error
    }
  }
}

// Verify the sync request is authorized (basic security)
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Allow cron jobs (Vercel Cron or external)
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }
  
  // Allow internal calls in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return false
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await ensureInitialized()
    
    const body = await request.json().catch(() => ({}))
    const { 
      profileId, 
      force = false, 
      includeAI = true,
      operation = 'full_sync'
    } = body
    
    // Respect AI disable setting in development
    const aiDisabledInDev = process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTO_AI_PROCESSING === 'true'
    const effectiveIncludeAI = includeAI && !aiDisabledInDev

    console.log(`Starting background sync: ${operation}, profile: ${profileId || 'all'}`)
    
    const startTime = Date.now()
    let result

    switch (operation) {
      case 'full_sync':
        // Full sync of all active profiles with AI processing
        result = await aggregator.fetchFromAllActiveProfiles()
        break
        
      case 'profile_sync':
        if (!profileId) {
          return NextResponse.json(
            { error: 'profileId required for profile_sync' },
            { status: 400 }
          )
        }
        
        // Get profile and sync
        const profilesForSync = await aggregator['configLoader'].getActiveProfiles()
        const profileForSync = profilesForSync.find(p => p.id === profileId)
        
        if (!profileForSync) {
          return NextResponse.json(
            { error: `Profile '${profileId}' not found` },
            { status: 404 }
          )
        }
        
        if (effectiveIncludeAI) {
          result = await aggregator.fetchFromProfileWithAI(profileForSync, true)
        } else {
          result = await aggregator.fetchFromProfile(profileForSync, true)
        }
        break
        
      case 'ai_batch_process':
        // Skip AI batch processing if disabled in development
        if (aiDisabledInDev) {
          return NextResponse.json({
            success: true,
            operation: 'ai_batch_process',
            message: 'AI processing disabled in development mode',
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime
          })
        }
        
        // Process unprocessed items with AI in small batches
        const batchSize = body.batchSize || 10 // Small batch to avoid timeout
        const dbServiceForBatch = new DatabaseService()
        
        // Get unprocessed items
        const unprocessedItems = await dbServiceForBatch.getFeedItems({
          profileId,
          limit: batchSize,
          processedOnly: false,
          aiProcessedOnly: false // Get items not yet AI processed
        })
        
        if (unprocessedItems.length === 0) {
          return NextResponse.json({
            success: true,
            operation: 'ai_batch_process',
            message: 'No unprocessed items found',
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime
          })
        }
        
        // Process items with AI
        const contentProcessor = aggregator['contentProcessor']
        await contentProcessor.initializeAISync()
        
        const profileForBatch = profileId ? (await aggregator['configLoader'].getActiveProfiles()).find(p => p.id === profileId) : null
        
        // Process with AI if we have a profile, otherwise skip AI
        let processedCount = 0
        if (profileForBatch) {
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
            profileForBatch
          )
          
          // Update items in database
          for (const item of enhancedItems) {
            await dbServiceForBatch.updateFeedItem(item.id, {
              summary: item.aiSummary,
              ai_tags: item.aiTags || [],
              insights: item.aiInsights,
              ai_processed: true,
              relevance_score: item.relevanceScore
            })
            processedCount++
          }
        }
        
        return NextResponse.json({
          success: true,
          operation: 'ai_batch_process',
          result: {
            processedCount,
            failedCount: unprocessedItems.length - processedCount,
            batchSize,
            profileId: profileId || 'all',
            remainingUnprocessed: await dbServiceForBatch.getUnprocessedCount(profileId)
          },
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        })
        
      case 'health_check':
        // Just check system health
        const status = await aggregator.getStatus()
        return NextResponse.json({
          success: true,
          operation: 'health_check',
          status,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        })
        
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }

    const duration = Date.now() - startTime
    
    // Store sync metadata for monitoring
    try {
      await dbService.createAggregationRun({
        status: 'completed',
        metadata: {
          operation,
          profileId,
          backgroundSync: true,
          duration,
          totalItems: 'totalItems' in result ? result.totalItems : (result as any).processedItems || 0,
          processedItems: 'processedItems' in result ? result.processedItems : (result as any).processedItems || 0,
          aiEnabled: includeAI
        }
      })
    } catch (error) {
      console.warn('Failed to store sync metadata:', error)
    }

    console.log(`Background sync completed in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      operation,
      result: {
        totalItems: 'totalItems' in result ? result.totalItems : (result as any).processedItems || 0,
        processedItems: 'processedItems' in result ? result.processedItems : (result as any).processedItems || 0,
        duration,
        profileId: profileId || 'all'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Background sync error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Background sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET endpoint for manual trigger and status check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation') || 'health_check'
    
    // For GET requests, only allow health checks unless specifically authorized
    if (operation !== 'health_check' && !verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Use POST for sync operations' },
        { status: 405 }
      )
    }
    
    await ensureInitialized()
    
    if (operation === 'health_check') {
      const status = await aggregator.getStatus()
      return NextResponse.json({
        success: true,
        status,
        timestamp: new Date().toISOString()
      })
    }
    
    // For other operations, redirect to POST
    return NextResponse.json(
      { error: 'Use POST for sync operations' },
      { status: 405 }
    )
    
  } catch (error) {
    console.error('Background sync GET error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}