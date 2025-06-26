'use client'

import { useState } from 'react'
import styles from './page.module.css'
import { useAggregatorData, useTrackEngagement } from '../../../lib/aggregator-query'
import type { FeedItemUI, AISummary } from '../../../aggregator/lib/types/feed'

export default function DigestPage() {
  const [selectedProfile, setSelectedProfile] = useState('ai-product')
  const [showReadArticles, setShowReadArticles] = useState(true)
  const [collapseReadArticles, setCollapseReadArticles] = useState(true)
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'unread'>('relevance')

  // Use React Query for data fetching
  const { 
    data: digestData, 
    isLoading: loading, 
    error,
    refetch
  } = useAggregatorData(selectedProfile, {
    includeItems: true,
    aiEnabled: true,
    refetchInterval: 15 * 60 * 1000 // 15 minutes
  })

  const trackEngagementMutation = useTrackEngagement()

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

  const trackEngagement = (itemId: string, action: 'view' | 'click' | 'read' | 'unread') => {
    trackEngagementMutation.mutate({ itemId, action, profileId: selectedProfile })
  }

  const toggleReadStatus = (itemId: string, currentStatus: boolean) => {
    if (currentStatus) {
      trackEngagement(itemId, 'unread')
    } else {
      trackEngagement(itemId, 'read')
    }
  }

  // Filter and sort articles
  const getFilteredAndSortedArticles = () => {
    if (!digestData?.processedFeedItems) return []
    
    // Adapt AggregatorItem to be compatible with FeedItemUI by adding missing properties
    let articles = [...digestData.processedFeedItems].map(item => ({
      ...item,
      sourceUrl: item.url, // AggregatorItem doesn't have sourceUrl, use url as sourceUrl
      content: item.description || '' // AggregatorItem doesn't have content, use description or empty string
    })) as FeedItemUI[]
    
    // Filter by read status
    if (!showReadArticles) {
      articles = articles.filter(item => !item.isRead)
    }
    
    // Sort articles
    switch (sortBy) {
      case 'relevance':
        articles.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        break
      case 'date':
        articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        break
      case 'unread':
        articles.sort((a, b) => {
          if (a.isRead === b.isRead) return (b.relevanceScore || 0) - (a.relevanceScore || 0)
          return a.isRead ? 1 : -1
        })
        break
    }
    
    return articles
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
        <div className={styles.error}>
          Unable to load content at this time
          <button onClick={() => refetch()} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const filteredArticles = getFilteredAndSortedArticles()
  const readCount = digestData?.processedFeedItems?.filter(item => item.isRead).length || 0
  const totalCount = digestData?.processedFeedItems?.length || 0

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

          <div className={styles.controls}>
            <div className={styles.filters}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={showReadArticles}
                  onChange={(e) => setShowReadArticles(e.target.checked)}
                />
                Show read articles ({readCount}/{totalCount})
              </label>
              
              {showReadArticles && (
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={collapseReadArticles}
                    onChange={(e) => setCollapseReadArticles(e.target.checked)}
                  />
                  Collapse read articles
                </label>
              )}
            </div>
            
            <div className={styles.sortControls}>
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date' | 'unread')}
                className={styles.sortSelect}
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="unread">Unread first</option>
              </select>
              
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {filteredArticles.length > 0 ? (
          <>
            <div className={styles.meta}>
              <span className={styles.itemCount}>
                {filteredArticles.length} stories
                {!showReadArticles && readCount > 0 && (
                  <span className={styles.hiddenCount}> ({readCount} read hidden)</span>
                )}
              </span>
              <span className={styles.lastUpdated}>
                Updated {formatDate(digestData?.cached 
                  ? new Date(Date.now() - (digestData?.cacheAge || 0) * 60 * 1000).toISOString() 
                  : new Date().toISOString())}
              </span>
            </div>

            <div className={styles.articles}>
              {filteredArticles.map((item, index) => {
                const isCollapsed = item.isRead && collapseReadArticles
                
                return (
                <article 
                  key={item.id} 
                  className={`${styles.article} ${item.isRead ? styles.read : ''} ${isCollapsed ? styles.collapsed : ''}`}
                  onMouseEnter={() => trackEngagement(item.id, 'view')}
                  onClick={isCollapsed ? () => toggleReadStatus(item.id, true) : undefined}
                  style={isCollapsed ? { cursor: 'pointer' } : undefined}
                >
                  <div className={styles.articleHeader}>
                    <div className={styles.articleMeta}>
                      <span className={`${styles.source} ${getSourceColor(item.source)}`}>
                        {item.sourceName || item.source.toUpperCase()}
                      </span>
                      <span className={styles.relevance}>
                        {Math.round((item.relevanceScore || 0) * 100)}% relevant
                      </span>
                      {item.isRead && <span className={styles.readBadge}>✓ Read</span>}
                    </div>
                    <button
                      className={`${styles.readButton} ${item.isRead ? styles.readButtonRead : ''}`}
                      onClick={() => toggleReadStatus(item.id, item.isRead || false)}
                      title={item.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      {item.isRead ? '↺ Unread' : 'Mark as read'}
                    </button>
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

                  {!isCollapsed && (
                    <>
                      <div className={styles.articleMeta}>
                        <span className={styles.author}>{item.author}</span>
                        <span className={styles.separator}>•</span>
                        <span className={styles.time}>{formatDate(item.publishedAt)}</span>
                      </div>

                      {item.aiSummary && (
                        <div className={styles.summary}>
                          {typeof item.aiSummary === 'string' ? (
                            <p>{item.aiSummary}</p>
                          ) : (
                            <>
                              <p>{item.aiSummary.summary || 'AI analysis available'}</p>
                              
                              {item.aiSummary.keyPoints && item.aiSummary.keyPoints.length > 0 && (
                                <ul className={styles.keyPoints}>
                                  {item.aiSummary.keyPoints.slice(0, 3).map((point: string, i: number) => (
                                    <li key={i}>{point}</li>
                                  ))}
                                </ul>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      <div className={styles.tags}>
                        {item.aiTags && item.aiTags.slice(0, 5).map(tag => (
                          <span key={tag} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {isCollapsed && (
                    <div className={styles.collapsedMeta}>
                      <span className={styles.author}>{item.author}</span>
                      <span className={styles.separator}>•</span>
                      <span className={styles.time}>{formatDate(item.publishedAt)}</span>
                      <span className={styles.separator}>•</span>
                      <span className={styles.readLabel}>Read</span>
                      <span className={styles.separator}>•</span>
                      <span className={styles.expandHint}>Click to expand</span>
                    </div>
                  )}
                </article>
                )
              })}
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