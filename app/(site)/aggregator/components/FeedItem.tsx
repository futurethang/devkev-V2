'use client'

import { useState } from 'react'
  
import type { FeedItem as FeedItemType, FocusProfile, SourceConfig } from '../../../../aggregator/lib/types/feed'
import styles from './FeedItem.module.css'

interface FeedItemWithEngagement extends FeedItemType {
  engagement: {
    views: number
    clicks: number
    reads: number
    isRead: boolean
    ctr: number
  }
  aiProcessed?: boolean
  summary?: string
  insights?: string
  aiTags?: string[]
  description?: string
}

interface FeedItemProps {
  item: FeedItemWithEngagement
  profile?: FocusProfile
  source?: SourceConfig
  viewMode: 'card' | 'list'
}

export function FeedItem({ item, profile, source, viewMode }: FeedItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const handleClick = async (e: React.MouseEvent) => {
    // Track click engagement
    try {
      await fetch('/api/aggregator/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          eventType: 'click',
          metadata: { source: source?.name, profile: profile?.name }
        })
      })
    } catch (error) {
      console.warn('Failed to track engagement:', error)
    }
  }

  const handleReadToggle = async () => {
    setIsExpanded(!isExpanded)
    
    // Track read engagement
    if (!isExpanded) {
      try {
        await fetch('/api/aggregator/engagement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.id,
            eventType: 'read',
            metadata: { source: source?.name, profile: profile?.name }
          })
        })
      } catch (error) {
        console.warn('Failed to track engagement:', error)
      }
    }
  }

  const formatDate = (date: string) => {
    const now = new Date()
    const itemDate = new Date(date)
    const diffMs = now.getTime() - itemDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return itemDate.toLocaleDateString()
  }

  const relevancePercent = Math.round((item.relevanceScore || 0) * 100)
  
  return (
    <article 
      className={`${styles.feedItem} ${styles[viewMode]} ${item.engagement.isRead ? styles.read : ''}`}
      data-item-id={item.id}
    >
      <div className={styles.header}>
        <div className={styles.metadata}>
          <div className={styles.sourceInfo}>
            <span className={styles.sourceName} title={source?.name || item.sourceName}>
              {source?.name || item.sourceName || 'Unknown Source'}
            </span>
            <span className={styles.sourceType}>({source?.type || item.source})</span>
          </div>
          <div className={styles.dateInfo}>
            <time dateTime={item.publishedAt.toISOString()} className={styles.publishedDate}>
              {formatDate(item.publishedAt.toISOString())}
            </time>
          </div>
        </div>
        
        <div className={styles.indicators}>
          {item.aiProcessed && (
            <span className={styles.aiIndicator} title="AI Enhanced">
              AI
            </span>
          )}
          {relevancePercent > 70 && (
            <span className={styles.relevanceIndicator} title={`${relevancePercent}% relevant`}>
              {relevancePercent}%
            </span>
          )}
          {item.engagement.isRead && (
            <span className={styles.readIndicator} title="Read">
              ✓
            </span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>
          <a 
            href={item.url}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleClick}
            className={styles.titleLink}
          >
            {item.title}
          </a>
        </h3>

        {item.description && (
          <p className={styles.description}>
            {item.description}
          </p>
        )}

        {item.aiSummary && viewMode === 'card' && (
          <div className={styles.summary}>
            <h4>AI Summary:</h4>
            <p>{typeof item.aiSummary === 'string' ? item.aiSummary : 'AI analysis available'}</p>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className={styles.tags}>
            {item.tags.slice(0, viewMode === 'card' ? 5 : 3).map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
            {item.tags.length > (viewMode === 'card' ? 5 : 3) && (
              <span className={styles.moreTagsIndicator}>
                +{item.tags.length - (viewMode === 'card' ? 5 : 3)} more
              </span>
            )}
          </div>
        )}

        {item.aiSummary && viewMode === 'card' && (
          <button
            onClick={handleReadToggle}
            className={styles.insightsToggle}
          >
            {isExpanded ? 'Hide' : 'Show'} AI Analysis
          </button>
        )}

        {isExpanded && item.aiSummary && (
          <div className={styles.insights}>
            <h4>AI Analysis:</h4>
            <p>{typeof item.aiSummary === 'string' ? item.aiSummary : 'AI analysis available'}</p>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.engagement}>
          <span className={styles.engagementStat} title="Views">
            👁 {item.engagement.views}
          </span>
          <span className={styles.engagementStat} title="Clicks">
            🔗 {item.engagement.clicks}
          </span>
          {item.engagement.ctr > 0 && (
            <span className={styles.engagementStat} title="Click-through rate">
              CTR: {(item.engagement.ctr * 100).toFixed(1)}%
            </span>
          )}
        </div>

        <div className={styles.actions}>
          {item.author && (
            <span className={styles.author} title="Author">
              By {item.author}
            </span>
          )}
          {profile && (
            <span className={styles.profileTag} title={`Profile: ${profile.name}`}>
              {profile.name}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}