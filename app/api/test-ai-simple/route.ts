import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint - no auth required
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'process'
    
    if (action === 'process') {
      // Process one item with full pipeline
      const processResponse = await fetch('https://devkev-v2.vercel.app/api/aggregator/process-batch?profile=ai-product&batchSize=1')
      const processResult = await processResponse.json()
      
      // Then check if it appears in aggregator
      const aggregatorResponse = await fetch('https://devkev-v2.vercel.app/api/aggregator?profile=ai-product&includeItems=true&refresh=true')
      const aggregatorResult = await aggregatorResponse.json()
      
      return NextResponse.json({
        processResult: {
          success: processResult.success,
          processedCount: processResult.processedCount,
          processedItems: processResult.processedItems
        },
        aggregatorCheck: {
          totalItems: aggregatorResult.totalItems,
          firstItemHasSummary: !!aggregatorResult.processedFeedItems?.[0]?.aiSummary,
          firstItemSummary: aggregatorResult.processedFeedItems?.[0]?.aiSummary
        }
      })
    }
    
    return NextResponse.json({ error: 'Use ?action=process' })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}