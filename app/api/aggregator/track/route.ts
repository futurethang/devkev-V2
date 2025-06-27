import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Try to import Supabase, but handle if it's not configured
let supabase: any = null
try {
  const supabaseModule = require('../../../../lib/database/supabase')
  supabase = supabaseModule.supabase
} catch (error) {
  console.warn('Supabase not configured, falling back to file-based storage')
}

// File-based storage fallback
const TRACKING_FILE = path.join(process.cwd(), 'aggregator', 'data', 'engagement.json')

interface EngagementEvent {
  itemId: string
  action: 'view' | 'click' | 'read' | 'unread'
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
      reads: number
      isRead: boolean
      ctr: number
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
    
    // Map actions to event types
    const eventTypeMap: Record<string, string> = {
      'view': 'view',
      'click': 'click',
      'read': 'read',
      'unread': 'read' // We'll handle unread by deleting the read event
    }
    
    const eventType = eventTypeMap[action]
    if (!eventType) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "view", "click", "read", or "unread"' },
        { status: 400 }
      )
    }
    
    // Get session ID from cookies or generate one
    const sessionId = request.cookies.get('digest-session')?.value || 
      `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    if (supabase) {
      // Use Supabase if available
      const userAgent = request.headers.get('user-agent')
      const forwardedFor = request.headers.get('x-forwarded-for')
      const ipAddress = forwardedFor?.split(',')[0].trim() || request.headers.get('x-real-ip')
      
      if (action === 'unread') {
        // For unread action, delete the most recent read event
        const { error } = await supabase
          .from('user_engagement')
          .delete()
          .eq('item_id', itemId)
          .eq('profile_id', profileId)
          .eq('event_type', 'read')
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (error) {
          console.error('Failed to remove read status:', error)
          return NextResponse.json(
            { error: 'Failed to update read status' },
            { status: 500 }
          )
        }
      } else {
        // For other actions, insert a new engagement event
        const { error } = await supabase
          .from('user_engagement')
          .insert({
            item_id: itemId,
            profile_id: profileId,
            event_type: eventType as any,
            session_id: sessionId,
            user_agent: userAgent,
            ip_address: ipAddress,
            metadata: {
              source: 'digest',
              timestamp: new Date().toISOString()
            }
          })
        
        if (error) {
          console.error('Failed to track engagement:', error)
          return NextResponse.json(
            { error: 'Failed to track engagement' },
            { status: 500 }
          )
        }
      }
    } else {
      // Fallback to file-based storage
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
          reads: 0,
          isRead: false,
          ctr: 0,
          profile: profileId,
          lastEngagement: event.timestamp
        }
      }
      
      if (action === 'view') {
        data.summary[itemId].views++
      } else if (action === 'click') {
        data.summary[itemId].clicks++
      } else if (action === 'read') {
        data.summary[itemId].reads++
        data.summary[itemId].isRead = true
      } else if (action === 'unread') {
        data.summary[itemId].isRead = false
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
    }
    
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
    
    if (supabase) {
      // Query the materialized view for engagement summary
      let query = supabase
        .from('mv_engagement_summary')
        .select('*')
        .order('total_engagements', { ascending: false })
        .limit(limit)
      
      if (profileId) {
        query = query.eq('profile_id', profileId)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Failed to get engagement data:', error)
        return NextResponse.json(
          { error: 'Failed to get engagement data' },
          { status: 500 }
        )
      }
      
      // Transform data to match expected format
      const topEngaged = data?.map((item: {
        item_id: string;
        views: number;
        clicks: number;
        reads: number;
        is_read: boolean | null;
        ctr: number;
        last_engagement: string | null;
      }) => ({
        itemId: item.item_id,
        views: item.views,
        clicks: item.clicks,
        reads: item.reads,
        isRead: item.is_read,
        ctr: item.ctr,
        lastEngagement: item.last_engagement,
        engagementScore: item.views + (item.clicks * 5) + (item.reads * 3)
      })) || []
      
      return NextResponse.json({
        topEngaged,
        totalEvents: topEngaged.length,
        profileId
      })
    } else {
      // Fallback to file-based storage
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
          engagementScore: summary.views + (summary.clicks * 5) + (summary.reads * 3)
        }))
      
      return NextResponse.json({
        topEngaged: items,
        totalEvents: data.events.length,
        profileId
      })
    }
    
  } catch (error) {
    console.error('Failed to get engagement data:', error)
    return NextResponse.json(
      { error: 'Failed to get engagement data' },
      { status: 500 }
    )
  }
}