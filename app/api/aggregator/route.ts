import { NextRequest, NextResponse } from 'next/server'
import { Aggregator } from '../../../aggregator/lib/aggregator'
import path from 'path'

// Initialize aggregator with AI enabled
const aggregatorPath = path.join(process.cwd(), 'aggregator', 'config')
const aggregator = new Aggregator(aggregatorPath, true)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile')
    const enableAI = searchParams.get('ai') === 'true'
    const includeItems = searchParams.get('includeItems') === 'true'
    
    // Initialize AI if requested
    if (enableAI) {
      const contentProcessor = aggregator['contentProcessor']
      await contentProcessor.initializeAISync()
    }
    
    let result
    
    if (profileId) {
      // Fetch specific profile
      const profiles = await aggregator['configLoader'].getActiveProfiles()
      const profile = profiles.find(p => p.id === profileId)
      
      if (!profile) {
        return NextResponse.json(
          { error: `Profile '${profileId}' not found` },
          { status: 404 }
        )
      }
      
      if (enableAI) {
        // Use AI-enhanced processing
        const regularResult = await aggregator.fetchFromProfile(profile, includeItems)
        const contentProcessor = aggregator['contentProcessor']
        
        let enhancedItems: any[] = []
        if (regularResult.processedFeedItems && regularResult.processedFeedItems.length > 0) {
          enhancedItems = await contentProcessor.processBatchWithAI(regularResult.processedFeedItems, profile)
        }
        
        result = {
          ...regularResult,
          processedItems: enhancedItems.length,
          processedFeedItems: includeItems ? enhancedItems : undefined,
          aiStats: contentProcessor.getAIStats(),
          aiEnabled: true
        }
      } else {
        result = await aggregator.fetchFromProfile(profile, includeItems)
        result.aiEnabled = false
      }
    } else {
      // Fetch all active profiles
      result = await aggregator.fetchFromAllActiveProfiles()
      result.aiEnabled = enableAI
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Aggregator API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch aggregator data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, profileId, sources, aiEnabled = false } = body
    
    switch (action) {
      case 'refresh':
        // Trigger a fresh aggregation
        if (aiEnabled) {
          const contentProcessor = aggregator['contentProcessor']
          await contentProcessor.initializeAISync()
        }
        
        if (profileId) {
          const profiles = await aggregator['configLoader'].getActiveProfiles()
          const profile = profiles.find(p => p.id === profileId)
          
          if (!profile) {
            return NextResponse.json(
              { error: `Profile '${profileId}' not found` },
              { status: 404 }
            )
          }
          
          const result = await aggregator.fetchFromProfile(profile, true)
          return NextResponse.json({ success: true, result })
        } else {
          const result = await aggregator.fetchFromAllActiveProfiles()
          return NextResponse.json({ success: true, result })
        }
        
      case 'test_source':
        // Test a specific source
        if (!sources || !Array.isArray(sources) || sources.length === 0) {
          return NextResponse.json(
            { error: 'Sources array required for test_source action' },
            { status: 400 }
          )
        }
        
        const allSources = await aggregator['configLoader'].loadSources()
        const testResults = []
        
        for (const sourceId of sources) {
          const source = allSources.find(s => s.id === sourceId)
          if (source) {
            const result = await aggregator.fetchFromSource(source)
            testResults.push({
              sourceId,
              success: result.success,
              itemCount: result.items?.length || 0,
              duration: result.duration,
              error: result.error
            })
          } else {
            testResults.push({
              sourceId,
              success: false,
              itemCount: 0,
              duration: 0,
              error: 'Source not found'
            })
          }
        }
        
        return NextResponse.json({ success: true, testResults })
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Aggregator POST API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}