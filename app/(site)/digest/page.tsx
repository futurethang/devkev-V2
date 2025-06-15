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
}

interface DigestData {
  profileId: string
  profileName: string
  processedFeedItems?: FeedItem[]
  totalItems: number
  lastUpdated?: string
}

export default function DigestPage() {
  const [loading, setLoading] = useState(true)
  const [digestData, setDigestData] = useState<DigestData | null>(null)
  const [selectedProfile, setSelectedProfile] = useState('ai-product')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDigestData()
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(fetchDigestData, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedProfile])

  const fetchDigestData = async () => {
    try {
      const params = new URLSearchParams({
        profile: selectedProfile,
        ai: 'true',
        includeItems: 'true'
      })
      
      const response = await fetch(`/api/aggregator?${params}`)
      if (!response.ok) throw new Error('Failed to fetch digest')
      
      const data = await response.json()
      setDigestData({
        profileId: data.profileId,
        profileName: data.profileName,
        processedFeedItems: data.processedFeedItems,
        totalItems: data.totalItems,
        lastUpdated: data.cached ? new Date(Date.now() - (data.cacheAge || 0) * 60 * 1000).toISOString() : new Date().toISOString()
      })
      setError(null)
    } catch (err) {
      setError('Unable to load content at this time')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'rss': styles.sourceRss,
      'github': styles.sourceGithub,
      'hn': styles.sourceHn,
      'twitter': styles.sourceTwitter,
      'reddit': styles.sourceReddit
    }
    return colors[source] || styles.sourceDefault
  }

  const trackEngagement = (itemId: string, action: 'view' | 'click') => {
    // Track engagement for future relevancy tuning
    fetch('/api/aggregator/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, action, profileId: selectedProfile })
    }).catch(() => {}) // Silent fail for tracking
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingText}>Loading AI Digest...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>AI Digest</h1>
          <p className={styles.subtitle}>
            Curated content from across the AI ecosystem
          </p>
          
          <nav className={styles.profileNav}>
            <button
              className={`${styles.profileButton} ${selectedProfile === 'ai-product' ? styles.active : ''}`}
              onClick={() => setSelectedProfile('ai-product')}
            >
              AI Products
            </button>
            <button
              className={`${styles.profileButton} ${selectedProfile === 'ml-engineering' ? styles.active : ''}`}
              onClick={() => setSelectedProfile('ml-engineering')}
            >
              ML Engineering
            </button>
            <button
              className={`${styles.profileButton} ${selectedProfile === 'design-systems' ? styles.active : ''}`}
              onClick={() => setSelectedProfile('design-systems')}
            >
              Design Systems
            </button>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        {digestData?.processedFeedItems && digestData.processedFeedItems.length > 0 ? (
          <>
            <div className={styles.meta}>
              <span className={styles.itemCount}>
                {digestData.processedFeedItems.length} stories
              </span>
              <span className={styles.lastUpdated}>
                Updated {formatDate(digestData.lastUpdated || new Date().toISOString())}
              </span>
            </div>

            <div className={styles.articles}>
              {digestData.processedFeedItems.map((item, index) => (
                <article 
                  key={item.id} 
                  className={styles.article}
                  onMouseEnter={() => trackEngagement(item.id, 'view')}
                >
                  <div className={styles.articleHeader}>
                    <span className={`${styles.source} ${getSourceColor(item.source)}`}>
                      {item.source.toUpperCase()}
                    </span>
                    <span className={styles.relevance}>
                      {Math.round((item.relevanceScore || 0) * 100)}% relevant
                    </span>
                  </div>

                  <h2 className={styles.articleTitle}>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => trackEngagement(item.id, 'click')}
                    >
                      {item.title}
                    </a>
                  </h2>

                  <div className={styles.articleMeta}>
                    <span className={styles.author}>{item.author}</span>
                    <span className={styles.separator}>•</span>
                    <span className={styles.time}>{formatDate(item.publishedAt)}</span>
                  </div>

                  {item.aiSummary && (
                    <div className={styles.summary}>
                      <p>{item.aiSummary.summary}</p>
                      
                      {item.aiSummary.keyPoints && item.aiSummary.keyPoints.length > 0 && (
                        <ul className={styles.keyPoints}>
                          {item.aiSummary.keyPoints.slice(0, 3).map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className={styles.tags}>
                    {item.tags.slice(0, 5).map(tag => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <p>No content available at this time. Check back soon!</p>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          AI Digest • Powered by{' '}
          <a href="/about" className={styles.footerLink}>
            Kevin Hyde's AI Aggregator
          </a>
        </p>
      </footer>
    </div>
  )
}