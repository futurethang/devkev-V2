import { Suspense } from 'react'
import { DatabaseService } from '../../../lib/database/database-service'
import { DatabaseConfigLoader } from '../../../aggregator/lib/config/database-config-loader'
import { AggregatorFeed } from './components/AggregatorFeed'
import { AggregatorStats } from './components/AggregatorStats'
import { AggregatorControls } from './components/AggregatorControls'
import styles from './page.module.css'

// Server component that pre-loads data for instant UI
// Data is fetched directly from database, not through API routes

interface PageProps {
  searchParams: Promise<{
    profile?: string
    source?: string
    limit?: string
  }>
}

async function getAggregatorData(profileId?: string, sourceId?: string, limit: number = 50) {
  const dbService = new DatabaseService()
  const configLoader = new DatabaseConfigLoader()
  
  try {
    // Use parallel queries with individual error handling
    const [feedItemsResult, statsResult, profilesResult, sourcesResult] = await Promise.allSettled([
      // Get enriched feed items with engagement data (single optimized query)
      dbService.getFeedItems({
        profileId,
        sourceId,
        limit,
        processedOnly: true
      }),
      // Get dashboard stats (optimized function)
      dbService.getDashboardStats(profileId),
      // Get active profiles
      configLoader.getActiveProfiles(),
      // Get active sources
      configLoader.loadSources()
    ])
    
    // Extract results or use defaults
    const feedItems = feedItemsResult.status === 'fulfilled' ? feedItemsResult.value : []
    const stats = statsResult.status === 'fulfilled' ? statsResult.value : {
      totalItems: 0,
      processedItems: 0,
      aiProcessedItems: 0,
      avgRelevanceScore: 0,
      lastUpdated: new Date()
    }
    const profiles = profilesResult.status === 'fulfilled' ? profilesResult.value : []
    const sources = sourcesResult.status === 'fulfilled' ? sourcesResult.value.filter(s => s.enabled) : []
    
    // Log any errors but continue with available data
    if (feedItemsResult.status === 'rejected') {
      console.warn('Failed to load feed items:', feedItemsResult.reason)
    }
    if (statsResult.status === 'rejected') {
      console.warn('Failed to load stats:', statsResult.reason)
    }
    if (profilesResult.status === 'rejected') {
      console.warn('Failed to load profiles:', profilesResult.reason)
    }
    if (sourcesResult.status === 'rejected') {
      console.warn('Failed to load sources:', sourcesResult.reason)
    }
    
    return {
      feedItems,
      profiles,
      sources,
      stats,
      currentProfile: profileId ? profiles.find(p => p.id === profileId) : null,
      currentSource: sourceId ? sources.find(s => s.id === sourceId) : null
    }
  } catch (error) {
    console.error('Failed to load aggregator data:', error)
    // Return empty state instead of throwing
    return {
      feedItems: [],
      profiles: [],
      sources: [],
      stats: {
        totalItems: 0,
        processedItems: 0,
        aiProcessedItems: 0,
        avgRelevanceScore: 0,
        lastUpdated: new Date()
      },
      currentProfile: null,
      currentSource: null
    }
  }
}

export default async function AggregatorPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const profileId = resolvedSearchParams.profile
  const sourceId = resolvedSearchParams.source
  const limit = parseInt(resolvedSearchParams.limit || '50', 10)
  
  // Pre-load data server-side for instant UI
  const data = await getAggregatorData(profileId, sourceId, limit)
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            🤖 AI Content Aggregator
          </h1>
          <p className={styles.subtitle}>
            Curated insights from {data.sources.length} sources
            {data.currentProfile && ` • Focus: ${data.currentProfile.name}`}
          </p>
        </div>
        
        <AggregatorStats 
          stats={data.stats}
          profileName={data.currentProfile?.name}
        />
      </header>
      
      <div className={styles.controls}>
        <AggregatorControls
          profiles={data.profiles}
          sources={data.sources}
          currentProfile={data.currentProfile}
          currentSource={data.currentSource}
        />
      </div>
      
      <main className={styles.main}>
        <Suspense fallback={<div className={styles.loading}>Loading feed...</div>}>
          <AggregatorFeed 
            items={data.feedItems.map(item => ({
              ...item,
              engagement: {
                views: 0,
                clicks: 0,
                reads: 0,
                isRead: false,
                ctr: 0
              }
            }))}
            profiles={data.profiles}
            sources={data.sources}
          />
        </Suspense>
      </main>
      
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <h3>System Status</h3>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span>Active Sources</span>
              <span>{data.sources.length}</span>
            </div>
            <div className={styles.statusItem}>
              <span>Profiles</span>
              <span>{data.profiles.length}</span>
            </div>
            <div className={styles.statusItem}>
              <span>Last Update</span>
              <span>{data.stats.lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className={styles.recentSyncInfo}>
            <p>Background sync ensures this data is always fresh.</p>
            <p>Updates every 30 minutes automatically.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

// Enable static generation with revalidation
export const revalidate = 1800 // 30 minutes

// Metadata for SEO
export const metadata = {
  title: 'AI Content Aggregator | Kevin Hyde',
  description: 'Curated AI and tech insights from multiple sources, processed with AI for relevance and insights.',
  keywords: ['AI', 'content aggregation', 'machine learning', 'tech news', 'automation']
}