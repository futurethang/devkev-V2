import { NextRequest, NextResponse } from 'next/server'
import { DatabaseAggregator } from '../../../../aggregator/lib/database-aggregator'
import { DatabaseService } from '../../../../lib/database/database-service'

// Background sync API for scheduled processing
// This ensures fresh data is always available for instant UI loading

const aggregator = new DatabaseAggregator(true) // AI enabled
const dbService = new DatabaseService()
let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    try {
      await aggregator.initialize()
      initialized = true
      console.log('Background sync aggregator initialized')
    } catch (error) {
      console.error('Failed to initialize background sync aggregator:', error)
      throw error
    }
  }
}

// Verify the sync request is authorized (basic security)
function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Allow cron jobs (Vercel Cron or external)
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }
  
  // Allow internal calls in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return false
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await ensureInitialized()
    
    const body = await request.json().catch(() => ({}))
    const { 
      profileId, 
      force = false, 
      includeAI = true,
      operation = 'full_sync'
    } = body

    console.log(`Starting background sync: ${operation}, profile: ${profileId || 'all'}`)
    
    const startTime = Date.now()
    let result

    switch (operation) {
      case 'full_sync':
        // Full sync of all active profiles with AI processing
        result = await aggregator.fetchFromAllActiveProfiles()
        break
        
      case 'profile_sync':
        if (!profileId) {
          return NextResponse.json(
            { error: 'profileId required for profile_sync' },
            { status: 400 }
          )
        }
        
        // Get profile and sync
        const profiles = await aggregator['configLoader'].getActiveProfiles()
        const profile = profiles.find(p => p.id === profileId)
        
        if (!profile) {
          return NextResponse.json(
            { error: `Profile '${profileId}' not found` },
            { status: 404 }
          )
        }
        
        if (includeAI) {
          result = await aggregator.fetchFromProfileWithAI(profile, true)
        } else {
          result = await aggregator.fetchFromProfile(profile, true)
        }
        break
        
      case 'health_check':
        // Just check system health
        const status = await aggregator.getStatus()
        return NextResponse.json({
          success: true,
          operation: 'health_check',
          status,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime
        })
        
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }

    const duration = Date.now() - startTime
    
    // Store sync metadata for monitoring
    try {
      await dbService.createAggregationRun({
        status: 'completed',
        metadata: {
          operation,
          profileId,
          backgroundSync: true,
          duration,
          totalItems: 'totalItems' in result ? result.totalItems : result.processedItems,
          processedItems: 'processedItems' in result ? result.processedItems : result.processedItems,
          aiEnabled: includeAI
        }
      })
    } catch (error) {
      console.warn('Failed to store sync metadata:', error)
    }

    console.log(`Background sync completed in ${duration}ms`)
    
    return NextResponse.json({
      success: true,
      operation,
      result: {
        totalItems: 'totalItems' in result ? result.totalItems : result.processedItems,
        processedItems: 'processedItems' in result ? result.processedItems : result.processedItems,
        duration,
        profileId: profileId || 'all'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Background sync error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Background sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET endpoint for manual trigger and status check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation') || 'health_check'
    
    // For GET requests, only allow health checks unless specifically authorized
    if (operation !== 'health_check' && !verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Use POST for sync operations' },
        { status: 405 }
      )
    }
    
    await ensureInitialized()
    
    if (operation === 'health_check') {
      const status = await aggregator.getStatus()
      return NextResponse.json({
        success: true,
        status,
        timestamp: new Date().toISOString()
      })
    }
    
    // For other operations, redirect to POST
    return NextResponse.json(
      { error: 'Use POST for sync operations' },
      { status: 405 }
    )
    
  } catch (error) {
    console.error('Background sync GET error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}