'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

interface FeedItem {
  id: string
  title: string
  content: string
  url: string
  author: string
  publishedAt: string
  source: string
  tags: string[]
  relevanceScore?: number
  aiSummary?: {
    summary: string
    keyPoints: string[]
    confidence: number
    insights?: string[]
  }
  aiTags?: string[]
  semanticScore?: number
  processingMetadata?: {
    provider: string
    model: string
    processingTime: number
    confidence: number
  }
}

interface AggregatorResult {
  profileId: string
  profileName: string
  totalItems: number
  processedItems: number
  avgRelevanceScore: number
  duplicatesRemoved: number
  processedFeedItems?: FeedItem[]
  aiEnabled?: boolean
  aiStats?: {
    activeProvider: string
    providersReady: number
  }
  cached?: boolean
  stale?: boolean
  cacheAge?: number
  message?: string
  remainingRequests?: number
}

interface ConfigData {
  sources: Array<{
    id: string
    name: string
    type: string
    enabled: boolean
    fetchInterval: number
    weight: number
    url: string
  }>
  profiles: Array<{
    id: string
    name: string
    enabled: boolean
    sources: string[]
    focus: {
      description: string
    }
    processing: {
      minRelevanceScore: number
      generateSummary: boolean
      enhanceTags: boolean
    }
  }>
}

export default function DashboardPage() {
  // Simple admin check - in production, use proper authentication
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const [aggregatorData, setAggregatorData] = useState<AggregatorResult | null>(null)
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isManualRefresh, setIsManualRefresh] = useState(false)
  
  useEffect(() => {
    // Check for admin access
    const adminKey = new URLSearchParams(window.location.search).get('admin')
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    // Allow access on localhost or with admin key
    if (isLocalhost || adminKey === process.env.NEXT_PUBLIC_ADMIN_KEY) {
      setIsAdmin(true)
      // Store in session
      sessionStorage.setItem('admin-access', 'true')
    } else if (sessionStorage.getItem('admin-access') === 'true') {
      setIsAdmin(true)
    }
    setLoading(false)
  }, [])

  // Load configuration data
  useEffect(() => {
    if (isAdmin) {
      fetchConfig()
    }
  }, [isAdmin])

  // Load aggregator data when profile or AI setting changes
  useEffect(() => {
    if (config && selectedProfile && isAdmin) {
      fetchAggregatorData()
    }
  }, [selectedProfile, aiEnabled, config, isAdmin])
  
  // Redirect non-admin users
  if (!loading && !isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <h1>Admin Access Required</h1>
          <p>This dashboard is for administrative use only.</p>
          <p>
            <a href="/digest" className={styles.digestLink}>
              Visit the public AI Digest →
            </a>
          </p>
        </div>
      </div>
    )
  }

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/aggregator/config')
      if (!response.ok) throw new Error('Failed to fetch config')
      const data = await response.json()
      setConfig(data)
      
      // Set default profile to first active profile
      if (data.profiles.length > 0 && !selectedProfile) {
        setSelectedProfile(data.profiles[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
    }
  }

  const fetchAggregatorData = async (forceRefresh = false) => {
    if (!selectedProfile) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        profile: selectedProfile,
        ai: aiEnabled.toString(),
        includeItems: 'true'
      })
      
      if (forceRefresh) {
        params.set('refresh', 'true')
      }
      
      const response = await fetch(`/api/aggregator?${params}`)
      
      if (response.status === 429) {
        const errorData = await response.json()
        setError(`${errorData.error}. Remaining requests: ${errorData.requestCount}/${errorData.maxRequests}`)
        return
      }
      
      if (!response.ok) throw new Error('Failed to fetch aggregator data')
      
      const data = await response.json()
      setAggregatorData(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load aggregator data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    await fetchAggregatorData()
  }
  
  const manualRefresh = async () => {
    setIsManualRefresh(true)
    try {
      const response = await fetch('/api/aggregator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refresh',
          profileId: selectedProfile,
          aiEnabled: aiEnabled
        })
      })
      
      if (!response.ok) throw new Error('Manual refresh failed')
      
      const result = await response.json()
      if (result.success) {
        setAggregatorData(result.result)
        setLastRefresh(new Date())
        setError(null)
      } else {
        throw new Error('Manual refresh failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Manual refresh failed')
    } finally {
      setIsManualRefresh(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'recently'
  }

  const getSourceIcon = (source: string) => {
    const icons: Record<string, string> = {
      'rss': '📡',
      'github': '🐙',
      'hn': '🔥',
      'twitter': '🐦',
      'reddit': '🤖'
    }
    return icons[source] || '📄'
  }

  if (loading && !aggregatorData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading AI Content Aggregator...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>AI Content Aggregator Dashboard</h1>
        <p>Intelligent content curation powered by AI</p>
      </header>

      {error && (
        <div className={styles.error}>
          <p>⚠️ {error}</p>
          <button onClick={() => fetchAggregatorData()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.profileSelector}>
          <label htmlFor="profile">Focus Profile:</label>
          <select
            id="profile"
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className={styles.select}
          >
            {config?.profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toggleGroup}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            AI Enhancement
          </label>
        </div>

        <div className={styles.refreshButtons}>
          <button
            onClick={refreshData}
            disabled={loading}
            className={styles.refreshButton}
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
          <button
            onClick={manualRefresh}
            disabled={isManualRefresh}
            className={`${styles.refreshButton} ${styles.manualRefresh}`}
            title="Force refresh (bypasses daily limits)"
          >
            {isManualRefresh ? '⏳' : '⚡'} Force Refresh
          </button>
        </div>
      </div>

      {aggregatorData && (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <h3>📄 Total Items</h3>
              <p className={styles.statValue}>{aggregatorData.totalItems}</p>
            </div>
            <div className={styles.statCard}>
              <h3>🎯 Processed</h3>
              <p className={styles.statValue}>{aggregatorData.processedItems}</p>
            </div>
            <div className={styles.statCard}>
              <h3>⭐ Avg Relevance</h3>
              <p className={styles.statValue}>
                {(aggregatorData.avgRelevanceScore * 100).toFixed(1)}%
              </p>
            </div>
            <div className={styles.statCard}>
              <h3>🗑️ Duplicates</h3>
              <p className={styles.statValue}>{aggregatorData.duplicatesRemoved}</p>
            </div>
            <div className={styles.statCard}>
              <h3>📡 Data Source</h3>
              <p className={styles.statValue}>
                {aggregatorData.cached ? '💾 Cache' : '🌐 Live'}
              </p>
            </div>
            {aggregatorData.aiEnabled && aggregatorData.aiStats && (
              <div className={styles.statCard}>
                <h3>🤖 AI Provider</h3>
                <p className={styles.statValue}>{aggregatorData.aiStats.activeProvider}</p>
              </div>
            )}
          </div>

          {aggregatorData && (
            <div className={styles.cacheInfo}>
              <div className={styles.lastRefresh}>
                {lastRefresh && `Last updated: ${lastRefresh.toLocaleTimeString()}`}
                {aggregatorData.cached && (
                  <span className={`${styles.cacheStatus} ${aggregatorData.stale ? styles.stale : styles.fresh}`}>
                    📁 {aggregatorData.stale ? 'Stale cache' : 'Cached'} 
                    ({aggregatorData.cacheAge}min old)
                  </span>
                )}
                {!aggregatorData.cached && (
                  <span className={styles.cacheStatus}>
                    ✨ Fresh data
                  </span>
                )}
              </div>
              
              {aggregatorData.message && (
                <div className={`${styles.message} ${aggregatorData.stale ? styles.warning : styles.info}`}>
                  ℹ️ {aggregatorData.message}
                </div>
              )}
              
              {typeof aggregatorData.remainingRequests === 'number' && (
                <div className={styles.requestLimits}>
                  🎯 Daily requests remaining: {aggregatorData.remainingRequests}/2
                </div>
              )}
            </div>
          )}

          <div className={styles.content}>
            {aggregatorData.processedFeedItems && aggregatorData.processedFeedItems.length > 0 ? (
              <div className={styles.feedItems}>
                <h2>Latest Content ({aggregatorData.processedFeedItems.length} items)</h2>
                {aggregatorData.processedFeedItems.map((item, index) => (
                  <article key={item.id} className={styles.feedItem}>
                    <div className={styles.itemHeader}>
                      <h3>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          {item.title}
                        </a>
                      </h3>
                      <div className={styles.itemMeta}>
                        <span className={styles.source}>
                          {getSourceIcon(item.source)} {item.author}
                        </span>
                        <span className={styles.time}>
                          {formatTimeAgo(item.publishedAt)}
                        </span>
                        <span className={styles.relevance}>
                          🎯 {((item.relevanceScore || 0) * 100).toFixed(0)}%
                        </span>
                        {item.semanticScore && (
                          <span className={styles.semantic}>
                            🧠 {(item.semanticScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {item.aiSummary && (
                      <div className={styles.aiSummary}>
                        <h4>🤖 AI Summary</h4>
                        <p>{item.aiSummary.summary}</p>
                        
                        {item.aiSummary.keyPoints.length > 0 && (
                          <div className={styles.keyPoints}>
                            <h5>Key Points:</h5>
                            <ul>
                              {item.aiSummary.keyPoints.map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.aiSummary.insights && item.aiSummary.insights.length > 0 && (
                          <div className={styles.insights}>
                            <h5>💡 Insights:</h5>
                            <ul>
                              {item.aiSummary.insights.map((insight, i) => (
                                <li key={i}>{insight}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className={styles.confidence}>
                          Confidence: {(item.aiSummary.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}

                    <div className={styles.content}>
                      {item.content.length > 200 
                        ? `${item.content.substring(0, 200)}...`
                        : item.content
                      }
                    </div>

                    <div className={styles.tags}>
                      {item.tags.map(tag => (
                        <span 
                          key={tag} 
                          className={`${styles.tag} ${item.aiTags?.includes(tag) ? styles.aiTag : ''}`}
                        >
                          {item.aiTags?.includes(tag) && '🤖'} {tag}
                        </span>
                      ))}
                    </div>

                    {item.processingMetadata && (
                      <div className={styles.processingMeta}>
                        Processed by {item.processingMetadata.provider} 
                        ({item.processingMetadata.model}) 
                        in {item.processingMetadata.processingTime}ms
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.noContent}>
                <p>No content items found. Try adjusting the profile settings or refresh the data.</p>
              </div>
            )}
          </div>
        </>
      )}

      {config && (
        <div className={styles.sidebar}>
          <div className={styles.configSection}>
            <h3>📡 Sources ({config.sources.filter(s => s.enabled).length}/{config.sources.length} enabled)</h3>
            <div className={styles.sourceList}>
              {config.sources.map(source => (
                <div key={source.id} className={`${styles.sourceItem} ${source.enabled ? styles.enabled : styles.disabled}`}>
                  <span className={styles.sourceIcon}>{getSourceIcon(source.type)}</span>
                  <div className={styles.sourceInfo}>
                    <div className={styles.sourceName}>{source.name}</div>
                    <div className={styles.sourceType}>{source.type}</div>
                  </div>
                  <div className={styles.sourceStatus}>
                    {source.enabled ? '✅' : '❌'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.configSection}>
            <h3>👤 Profiles</h3>
            <div className={styles.profileList}>
              {config.profiles.map(profile => (
                <div 
                  key={profile.id} 
                  className={`${styles.profileItem} ${profile.id === selectedProfile ? styles.active : ''}`}
                  onClick={() => setSelectedProfile(profile.id)}
                >
                  <div className={styles.profileName}>{profile.name}</div>
                  <div className={styles.profileDescription}>
                    {profile.focus.description}
                  </div>
                  <div className={styles.profileSources}>
                    {profile.sources.length} sources
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}