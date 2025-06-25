import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/database/supabase'

// Test endpoint to check database fields directly
export async function GET(request: NextRequest) {
  try {
    // Get one processed item directly from database
    const { data, error } = await supabase
      .from('feed_items')
      .select('id, title, summary, ai_processed, ai_tags, insights')
      .eq('ai_processed', true)
      .limit(1)
      .single()
    
    if (error) {
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message
      }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json({
        message: 'No AI processed items found'
      })
    }
    
    return NextResponse.json({
      directDatabaseResult: {
        id: data.id,
        title: data.title,
        hasSummary: !!data.summary,
        summaryType: typeof data.summary,
        summaryPreview: data.summary ? 
          (typeof data.summary === 'string' ? 
            data.summary.substring(0, 100) : 
            JSON.stringify(data.summary).substring(0, 100)
          ) : null,
        aiProcessed: data.ai_processed,
        aiTagsCount: data.ai_tags?.length || 0,
        hasInsights: !!data.insights
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}