import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/database/supabase'

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
    
    // Get user agent and IP from request headers
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
    const topEngaged = data?.map(item => ({
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
    
  } catch (error) {
    console.error('Failed to get engagement data:', error)
    return NextResponse.json(
      { error: 'Failed to get engagement data' },
      { status: 500 }
    )
  }
}