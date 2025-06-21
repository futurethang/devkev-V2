import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../../lib/database/database-service'

const dbService = new DatabaseService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, eventType, sessionId, metadata = {} } = body
    
    if (!itemId || !eventType) {
      return NextResponse.json(
        { error: 'itemId and eventType are required' },
        { status: 400 }
      )
    }
    
    // Validate event type
    const validEventTypes = ['view', 'click', 'read', 'like', 'share', 'save']
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Extract additional metadata from request
    const userAgent = request.headers.get('user-agent')
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'
    
    // Track the engagement
    await dbService.trackEngagement({
      itemId,
      eventType,
      sessionId: sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userAgent: userAgent || undefined,
      ipAddress: ipAddress !== 'unknown' ? ipAddress : undefined,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        url: request.nextUrl.toString()
      }
    })
    
    return NextResponse.json({ 
      success: true,
      tracked: {
        itemId,
        eventType,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Engagement tracking error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track engagement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving engagement data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemIds = searchParams.get('itemIds')?.split(',') || []
    
    if (itemIds.length === 0) {
      return NextResponse.json(
        { error: 'itemIds parameter required' },
        { status: 400 }
      )
    }
    
    const engagementData = await dbService.getEngagementSummary(itemIds)
    
    return NextResponse.json({
      success: true,
      data: engagementData
    })
    
  } catch (error) {
    console.error('Engagement retrieval error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve engagement data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}