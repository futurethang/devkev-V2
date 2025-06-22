import { NextRequest, NextResponse } from 'next/server'
import { DatabaseAggregator } from '../../../aggregator/lib/database-aggregator'

// Initialize database aggregator with AI enabled
const aggregator = new DatabaseAggregator(true)

// Initialize aggregator on first load
let initialized = false
async function ensureInitialized() {
  if (!initialized) {
    try {
      await aggregator.initialize()
      initialized = true
      console.log('Database aggregator initialized successfully')
    } catch (error) {
      console.error('Failed to initialize database aggregator:', error)
      throw error
    }
  }
}

// Cache system for request limiting
interface CacheEntry {
  data: any
  timestamp: number
  profileId?: string
}

const cache = new Map<string, CacheEntry>()
const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 hours in milliseconds
const MAX_REQUESTS_PER_DAY = process.env.NODE_ENV === 'development' ? 100 : 10

// Track daily request counts per profile
const dailyRequestCounts = new Map<string, { date: string; count: number }>()

function getCacheKey(profileId?: string, includeItems?: boolean, aiEnabled?: boolean): string {
  return `${profileId || 'all'}_${includeItems ? 'items' : 'noitems'}_${aiEnabled ? 'ai' : 'noai'}`
}

function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_DURATION
}

function canMakeRequest(profileId?: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  const key = profileId || 'all'
  const requestData = dailyRequestCounts.get(key)
  
  if (!requestData || requestData.date !== today) {
    // New day or first request
    dailyRequestCounts.set(key, { date: today, count: 0 })
    return true
  }
  
  return requestData.count < MAX_REQUESTS_PER_DAY
}

function incrementRequestCount(profileId?: string): void {
  const today = new Date().toISOString().split('T')[0]
  const key = profileId || 'all'
  const requestData = dailyRequestCounts.get(key)
  
  if (requestData && requestData.date === today) {
    requestData.count += 1
  } else {
    dailyRequestCounts.set(key, { date: today, count: 1 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Ensure aggregator is initialized
    await ensureInitialized()
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile')
    const enableAI = searchParams.get('ai') === 'true'
    const includeItems = searchParams.get('includeItems') === 'true'
    const forceRefresh = searchParams.get('refresh') === 'true'
    
    const cacheKey = getCacheKey(profileId || undefined, includeItems, enableAI)
    const cachedEntry = cache.get(cacheKey)
    
    // Check if we can use cached data
    if (!forceRefresh && cachedEntry && isCacheValid(cachedEntry)) {
      return NextResponse.json({
        ...cachedEntry.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cachedEntry.timestamp) / 1000 / 60), // minutes
        message: 'Serving cached data to limit API requests (max 2 per day per profile)'
      })
    }
    
    // Check request limits for fresh data
    if (!forceRefresh && !canMakeRequest(profileId || undefined)) {
      const today = new Date().toISOString().split('T')[0]
      const key = profileId || 'all'
      const requestData = dailyRequestCounts.get(key)
      
      if (cachedEntry) {
        // Return stale cache with warning
        return NextResponse.json({
          ...cachedEntry.data,
          cached: true,
          stale: true,
          cacheAge: Math.floor((Date.now() - cachedEntry.timestamp) / 1000 / 60), // minutes
          message: `Daily request limit reached (${requestData?.count}/${MAX_REQUESTS_PER_DAY}). Use ?refresh=true to force refresh.`,
          remainingRequests: 0
        })
      } else {
        return NextResponse.json(
          { 
            error: 'Daily request limit reached and no cached data available',
            requestCount: requestData?.count || 0,
            maxRequests: MAX_REQUESTS_PER_DAY,
            message: 'Use POST /api/aggregator with action=refresh to force refresh'
          },
          { status: 429 }
        )
      }
    }
    
    // Increment request count for fresh data
    if (!forceRefresh) {
      incrementRequestCount(profileId || undefined)
    }
    
    let result
    
    if (profileId) {
      // Get the database service to find the profile
      const status = await aggregator.getStatus()
      if (!status.databaseConnected) {
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 503 }
        )
      }
      
      // For now, we'll need to get the profile through the aggregator's config loader
      // This is a temporary solution until we refactor the API structure
      try {
        if (enableAI) {
          const profileData = { 
            id: profileId, 
            name: profileId, 
            enabled: true,
            description: '',
            weight: 1.0,
            keywords: {
              boost: { high: [], medium: [], low: [] },
              filter: { exclude: [], require: [] }
            },
            sources: [],
            processing: { 
              checkDuplicates: true, 
              minRelevanceScore: 0.3,
              generateSummary: true,
              enhanceTags: true,
              scoreRelevance: true,
              maxAgeDays: 7
            }
          }
          result = await aggregator.fetchFromProfileWithAI(profileData, includeItems)
          ;(result as any).aiEnabled = true
        } else {
          result = await aggregator.fetchFromProfile({ 
            id: profileId, 
            name: profileId, 
            enabled: true,
            description: '',
            weight: 1.0,
            keywords: {
              boost: { high: [], medium: [], low: [] },
              filter: { exclude: [], require: [] }
            },
            sources: [],
            processing: { 
              checkDuplicates: true, 
              minRelevanceScore: 0.3,
              generateSummary: true,
              enhanceTags: true,
              scoreRelevance: true,
              maxAgeDays: 7
            }
          }, includeItems)
          ;(result as any).aiEnabled = false
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return NextResponse.json(
            { error: `Profile '${profileId}' not found` },
            { status: 404 }
          )
        }
        throw error
      }
    } else {
      // Fetch all active profiles
      result = await aggregator.fetchFromAllActiveProfiles()
      ;(result as any).aiEnabled = enableAI
    }
    
    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      profileId: profileId || undefined
    })
    
    // Add cache metadata to response
    const today = new Date().toISOString().split('T')[0]
    const key = profileId || 'all'
    const requestData = dailyRequestCounts.get(key)
    
    ;(result as any).cached = false
    ;(result as any).remainingRequests = MAX_REQUESTS_PER_DAY - (requestData?.count || 0)
    ;(result as any).message = forceRefresh ? 'Force refreshed data' : 'Fresh data fetched'
    
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
        // Manual refresh - bypasses daily limits
        if (aiEnabled) {
          const contentProcessor = aggregator['contentProcessor']
          await contentProcessor.initializeAISync()
        }
        
        let result
        
        if (profileId) {
          const profiles = await aggregator['configLoader'].getActiveProfiles()
          const profile = profiles.find(p => p.id === profileId)
          
          if (!profile) {
            return NextResponse.json(
              { error: `Profile '${profileId}' not found` },
              { status: 404 }
            )
          }
          
          if (aiEnabled) {
            // Use AI-enhanced processing
            const regularResult = await aggregator.fetchFromProfile(profile, true)
            const contentProcessor = aggregator['contentProcessor']
            
            let enhancedItems: any[] = []
            if (regularResult.processedFeedItems && regularResult.processedFeedItems.length > 0) {
              enhancedItems = await contentProcessor.processBatchWithAI(regularResult.processedFeedItems, profile)
            }
            
            result = {
              ...regularResult,
              processedItems: enhancedItems.length,
              processedFeedItems: enhancedItems,
              aiStats: contentProcessor.getAIStats(),
              aiEnabled: true
            }
          } else {
            result = await aggregator.fetchFromProfile(profile, true)
            ;(result as any).aiEnabled = false
          }
        } else {
          result = await aggregator.fetchFromAllActiveProfiles()
          ;(result as any).aiEnabled = aiEnabled
        }
        
        // Update cache with fresh data
        const cacheKey = getCacheKey(profileId, true, aiEnabled)
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          profileId
        })
        
        ;(result as any).cached = false
        ;(result as any).message = 'Manual refresh completed - cache updated'
        
        return NextResponse.json({ success: true, result })
        
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
              itemCount: result.itemCount || 0,
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