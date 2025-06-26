import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/database/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile')
    const itemIds = searchParams.get('itemIds')?.split(',') || []
    
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
    
  } catch (error) {
    console.error('Failed to get read status:', error)
    return NextResponse.json(
      { error: 'Failed to get read status' },
      { status: 500 }
    )
  }
}