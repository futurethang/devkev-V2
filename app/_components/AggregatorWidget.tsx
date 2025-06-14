'use client'

import { useState, useEffect } from 'react'
import styles from './AggregatorWidget.module.css'

interface WidgetData {
  profileName: string
  totalItems: number
  processedItems: number
  avgRelevanceScore: number
  lastUpdated: string
  topTags: string[]
  aiEnabled: boolean
}

interface AggregatorWidgetProps {
  profileId?: string
  autoRefresh?: boolean
  refreshInterval?: number
  compact?: boolean
}

export function AggregatorWidget({ 
  profileId = 'ai-product',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  compact = false
}: AggregatorWidgetProps) {
  const [data, setData] = useState<WidgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setError(null)
      const params = new URLSearchParams({
        profile: profileId,
        ai: 'true',
        includeItems: 'false'
      })
      
      const response = await fetch(`/api/aggregator?${params}`)
      if (!response.ok) throw new Error('Failed to fetch data')
      
      const result = await response.json()
      
      // Extract top tags from the result (simplified)
      const topTags = ['ai', 'machine-learning', 'typescript', 'react', 'product']
      
      setData({
        profileName: result.profileName,
        totalItems: result.totalItems,
        processedItems: result.processedItems,
        avgRelevanceScore: result.avgRelevanceScore,
        lastUpdated: new Date().toLocaleTimeString(),
        topTags,
        aiEnabled: result.aiEnabled || false
      })
      
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchData()
  }, [profileId])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  if (loading && !data) {
    return (
      <div className={`${styles.widget} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading aggregator data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${styles.widget} ${compact ? styles.compact : ''}`}>
        <div className={styles.error}>
          <span>⚠️ {error}</span>
          <button onClick={fetchData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className={`${styles.widget} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <h3>
          🤖 {data.profileName}
          {data.aiEnabled && <span className={styles.aiIndicator}>AI</span>}
        </h3>
        <button 
          onClick={fetchData}
          className={styles.refreshButton}
          disabled={loading}
          title="Refresh data"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Items</span>
          <span className={styles.statValue}>
            {data.processedItems}/{data.totalItems}
          </span>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Relevance</span>
          <span className={styles.statValue}>
            {(data.avgRelevanceScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {!compact && (
        <>
          <div className={styles.tags}>
            <span className={styles.tagsLabel}>Trending:</span>
            <div className={styles.tagList}>
              {data.topTags.slice(0, 3).map(tag => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            <span className={styles.lastUpdated}>
              Updated: {data.lastUpdated}
            </span>
            {autoRefresh && (
              <span className={styles.autoRefresh}>
                Auto-refresh: {refreshInterval / 1000}s
              </span>
            )}
          </div>
        </>
      )}

      {compact && lastRefresh && (
        <div className={styles.compactFooter}>
          {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}