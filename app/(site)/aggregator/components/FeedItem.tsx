'use client'

import { useState } from 'react'
import Link from 'next/link'  
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
            <span className={styles.sourceName} title={source?.name}>
              {source?.name || 'Unknown Source'}
            </span>
            <span className={styles.sourceType}>({source?.type})</span>
          </div>
          <div className={styles.dateInfo}>
            <time dateTime={item.publishedAt} className={styles.publishedDate}>
              {formatDate(item.publishedAt)}
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
          <Link 
            href={item.url}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleClick}
            className={styles.titleLink}
          >
            {item.title}
          </Link>
        </h3>

        {item.description && (
          <p className={styles.description}>
            {item.description}
          </p>
        )}

        {item.summary && viewMode === 'card' && (
          <div className={styles.summary}>
            <h4>AI Summary:</h4>
            <p>{item.summary}</p>
          </div>
        )}

        {item.aiTags && item.aiTags.length > 0 && (
          <div className={styles.tags}>
            {item.aiTags.slice(0, viewMode === 'card' ? 5 : 3).map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
            {item.aiTags.length > (viewMode === 'card' ? 5 : 3) && (
              <span className={styles.moreTagsIndicator}>
                +{item.aiTags.length - (viewMode === 'card' ? 5 : 3)} more
              </span>
            )}
          </div>
        )}

        {item.insights && viewMode === 'card' && (
          <button
            onClick={handleReadToggle}
            className={styles.insightsToggle}
          >
            {isExpanded ? 'Hide' : 'Show'} AI Insights
          </button>
        )}

        {isExpanded && item.insights && (
          <div className={styles.insights}>
            <h4>AI Insights:</h4>
            <p>{item.insights}</p>
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