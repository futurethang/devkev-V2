import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Simple file-based engagement tracking for now
// In production, this would use a database
const TRACKING_FILE = path.join(process.cwd(), 'aggregator', 'data', 'engagement.json')

interface EngagementEvent {
  itemId: string
  action: 'view' | 'click'
  profileId: string
  timestamp: string
  sessionId?: string
}

interface EngagementData {
  events: EngagementEvent[]
  summary: {
    [itemId: string]: {
      views: number
      clicks: number
      ctr: number // click-through rate
      profile: string
      lastEngagement: string
    }
  }
}

async function loadEngagementData(): Promise<EngagementData> {
  try {
    const data = await fs.readFile(TRACKING_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Initialize if file doesn't exist
    return { events: [], summary: {} }
  }
}

async function saveEngagementData(data: EngagementData): Promise<void> {
  const dir = path.dirname(TRACKING_FILE)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(TRACKING_FILE, JSON.stringify(data, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, action, profileId } = body
    
    if (!itemId || !action || !profileId) {
      return NextResponse.json(
        { error: 'Missing required fields: itemId, action, profileId' },
        { status: 400 }
      )
    }
    
    if (!['view', 'click'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "view" or "click"' },
        { status: 400 }
      )
    }
    
    // Get session ID from cookies or generate one
    const sessionId = request.cookies.get('digest-session')?.value || 
      `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const event: EngagementEvent = {
      itemId,
      action,
      profileId,
      timestamp: new Date().toISOString(),
      sessionId
    }
    
    // Load existing data
    const data = await loadEngagementData()
    
    // Add event
    data.events.push(event)
    
    // Update summary
    if (!data.summary[itemId]) {
      data.summary[itemId] = {
        views: 0,
        clicks: 0,
        ctr: 0,
        profile: profileId,
        lastEngagement: event.timestamp
      }
    }
    
    if (action === 'view') {
      data.summary[itemId].views++
    } else if (action === 'click') {
      data.summary[itemId].clicks++
    }
    
    // Calculate CTR
    if (data.summary[itemId].views > 0) {
      data.summary[itemId].ctr = data.summary[itemId].clicks / data.summary[itemId].views
    }
    
    data.summary[itemId].lastEngagement = event.timestamp
    
    // Keep only last 7 days of events to prevent file bloat
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    data.events = data.events.filter(e => 
      new Date(e.timestamp) > sevenDaysAgo
    )
    
    // Save data
    await saveEngagementData(data)
    
    // Set session cookie if new
    const response = NextResponse.json({ success: true })
    if (!request.cookies.get('digest-session')) {
      response.cookies.set('digest-session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }
    
    return response
    
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track engagement' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const data = await loadEngagementData()
    
    // Get top engaged items
    const items = Object.entries(data.summary)
      .filter(([_, summary]) => !profileId || summary.profile === profileId)
      .sort((a, b) => {
        // Sort by engagement score (views + clicks * 5)
        const scoreA = a[1].views + (a[1].clicks * 5)
        const scoreB = b[1].views + (b[1].clicks * 5)
        return scoreB - scoreA
      })
      .slice(0, limit)
      .map(([itemId, summary]) => ({
        itemId,
        ...summary,
        engagementScore: summary.views + (summary.clicks * 5)
      }))
    
    return NextResponse.json({
      topEngaged: items,
      totalEvents: data.events.length,
      profileId
    })
    
  } catch (error) {
    console.error('Failed to get engagement data:', error)
    return NextResponse.json(
      { error: 'Failed to get engagement data' },
      { status: 500 }
    )
  }
}