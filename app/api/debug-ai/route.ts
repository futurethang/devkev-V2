import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../lib/database/database-service'
import { DatabaseAggregator } from '../../../aggregator/lib/database-aggregator'

// Debug endpoint to test AI processing step by step
const aggregator = new DatabaseAggregator(true)
let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    await aggregator.initialize()
    initialized = true
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized()
    
    const { searchParams } = new URL(request.url)
    const step = searchParams.get('step') || '1'
    
    const dbService = new DatabaseService()
    const contentProcessor = aggregator['contentProcessor']
    
    switch (step) {
      case '1':
        // Test basic setup
        await contentProcessor.initializeAISync()
        return NextResponse.json({
          step: 1,
          test: 'Basic Setup',
          results: {
            aiEnabled: contentProcessor.isAIEnabled(),
            anthropicKey: !!process.env.ANTHROPIC_API_KEY,
            dbConnected: true
          }
        })
        
      case '2':
        // Test fetching unprocessed items
        const items = await dbService.getFeedItems({
          profileId: 'ai-product',
          limit: 1,
          aiProcessedOnly: false
        })
        
        return NextResponse.json({
          step: 2,
          test: 'Fetch Unprocessed Items',
          results: {
            itemsFound: items.length,
            firstItem: items[0] ? {
              id: items[0].id,
              title: items[0].title.substring(0, 50),
              hasContent: !!items[0].content,
              contentLength: items[0].content?.length || 0,
              relevanceScore: items[0].relevanceScore
            } : null
          }
        })
        
      case '3':
        // Test AI processing on one item
        await contentProcessor.initializeAISync()
        const testItems = await dbService.getFeedItems({
          profileId: 'ai-product',
          limit: 1,
          aiProcessedOnly: false
        })
        
        if (testItems.length === 0) {
          return NextResponse.json({
            step: 3,
            test: 'AI Processing',
            results: { error: 'No unprocessed items found' }
          })
        }
        
        const profiles = await aggregator['configLoader'].getActiveProfiles()
        const profile = profiles.find(p => p.id === 'ai-product')
        
        if (!profile) {
          return NextResponse.json({
            step: 3,
            test: 'AI Processing',
            results: { error: 'Profile not found' }
          })
        }
        
        const enhanced = await contentProcessor.processBatchWithAI([{
          id: testItems[0].id,
          title: testItems[0].title,
          content: testItems[0].content || '',
          url: testItems[0].url,
          author: testItems[0].author || '',
          publishedAt: testItems[0].publishedAt,
          source: testItems[0].source,
          sourceUrl: testItems[0].sourceName || '',
          tags: testItems[0].tags || [],
          relevanceScore: testItems[0].relevanceScore || 0
        }], profile)
        
        return NextResponse.json({
          step: 3,
          test: 'AI Processing',
          results: {
            itemId: testItems[0].id,
            enhancedCount: enhanced.length,
            firstEnhanced: enhanced[0] ? {
              hasAISummary: !!enhanced[0].aiSummary,
              summaryType: typeof enhanced[0].aiSummary,
              aiSummaryPreview: (() => {
                const summary = enhanced[0].aiSummary
                if (!summary) return 'No summary'
                if (typeof summary === 'string') {
                  return (summary as string).substring(0, 100)
                }
                const obj = summary as any
                return obj.summary ? String(obj.summary).substring(0, 100) : 'No summary text'
              })(),
              hasAITags: !!(enhanced[0].aiTags && enhanced[0].aiTags.length > 0),
              aiTagsCount: enhanced[0].aiTags?.length || 0,
              rawAISummary: enhanced[0].aiSummary
            } : null
          }
        })
        
      case '4':
        // Test database update
        const updateItems = await dbService.getFeedItems({
          profileId: 'ai-product',
          limit: 1,
          aiProcessedOnly: false
        })
        
        if (updateItems.length === 0) {
          return NextResponse.json({
            step: 4,
            test: 'Database Update',
            results: { error: 'No items to test update' }
          })
        }
        
        try {
          await dbService.updateFeedItem(updateItems[0].id, {
            summary: 'Test summary - ' + new Date().toISOString(),
            ai_tags: ['test-tag'],
            insights: 'Test insights',
            ai_processed: true,
            relevance_score: 0.9
          })
          
          // Verify the update
          const verifyItems = await dbService.getFeedItems({
            profileId: 'ai-product',
            limit: 100
          })
          
          const updatedItem = verifyItems.find(item => item.id === updateItems[0].id)
          
          return NextResponse.json({
            step: 4,
            test: 'Database Update',
            results: {
              itemId: updateItems[0].id,
              updateSuccess: true,
              message: 'Test update completed',
              verification: {
                foundItem: !!updatedItem,
                summary: (updatedItem as any)?.summary,
                aiProcessed: updatedItem?.aiProcessed
              }
            }
          })
        } catch (error) {
          return NextResponse.json({
            step: 4,
            test: 'Database Update',
            results: {
              itemId: updateItems[0].id,
              updateSuccess: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
        }
        
      default:
        return NextResponse.json({
          error: 'Invalid step. Use ?step=1,2,3,or 4'
        })
    }
    
  } catch (error) {
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}