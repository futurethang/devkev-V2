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

interface EngagementData {
  events: any[]
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile')
    const itemIds = searchParams.get('itemIds')?.split(',') || []
    
    if (supabase) {
      // Use Supabase if available
      let query = supabase
        .from('mv_engagement_summary')
        .select('item_id, is_read')
      
      if (itemIds.length > 0) {
        // Get read status for specific items
        query = query.in('item_id', itemIds)
      } else if (profileId) {
        // Get all read items for the profile
        query = query.eq('profile_id', profileId)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Failed to get read status:', error)
        return NextResponse.json(
          { error: 'Failed to get read status' },
          { status: 500 }
        )
      }
      
      // Transform to object format
      const readStatus: { [itemId: string]: boolean } = {}
      data?.forEach(item => {
        readStatus[item.item_id] = item.is_read || false
      })
      
      return NextResponse.json({
        readStatus,
        profileId
      })
    } else {
      // Fallback to file-based storage
      const data = await loadEngagementData()
      
      // Get read status for requested items
      const readStatus: { [itemId: string]: boolean } = {}
      
      if (itemIds.length > 0) {
        // Get read status for specific items
        for (const itemId of itemIds) {
          const summary = data.summary[itemId]
          readStatus[itemId] = summary?.isRead || false
        }
      } else {
        // Get all read items for the profile
        Object.entries(data.summary)
          .filter(([_, summary]) => !profileId || summary.profile === profileId)
          .forEach(([itemId, summary]) => {
            readStatus[itemId] = summary.isRead
          })
      }
      
      return NextResponse.json({
        readStatus,
        profileId
      })
    }
    
  } catch (error) {
    console.error('Failed to get read status:', error)
    return NextResponse.json(
      { error: 'Failed to get read status' },
      { status: 500 }
    )
  }
}