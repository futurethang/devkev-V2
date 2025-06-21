'use client'

import { useState } from 'react'
import { FeedItem } from './FeedItem'
import { EngagementTracker } from './EngagementTracker'
import type { FeedItem as FeedItemType, FocusProfile, SourceConfig } from '../../../../aggregator/lib/types/feed'
import styles from './AggregatorFeed.module.css'

interface FeedItemWithEngagement extends FeedItemType {
  engagement: {
    views: number
    clicks: number
    reads: number
    isRead: boolean
    ctr: number
  }
}

interface AggregatorFeedProps {
  items: FeedItemWithEngagement[]
  profiles: FocusProfile[]
  sources: SourceConfig[]
}

export function AggregatorFeed({ items, profiles, sources }: AggregatorFeedProps) {
  const [sortBy, setSortBy] = useState<'publishedAt' | 'relevanceScore' | 'engagement'>('publishedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  // Sort items based on selected criteria
  const sortedItems = [...items].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string
    
    switch (sortBy) {
      case 'publishedAt':
        aValue = a.publishedAt.getTime()
        bValue = b.publishedAt.getTime()
        break
      case 'relevanceScore':
        aValue = a.relevanceScore || 0
        bValue = b.relevanceScore || 0
        break
      case 'engagement':
        aValue = a.engagement.views + a.engagement.clicks * 2 + a.engagement.reads * 3
        bValue = b.engagement.views + b.engagement.clicks * 2 + b.engagement.reads * 3
        break
      default:
        aValue = a.publishedAt.getTime()
        bValue = b.publishedAt.getTime()
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📭</div>
        <h3>No items found</h3>
        <p>Try adjusting your filters or check back later for new content.</p>
      </div>
    )
  }

  return (
    <div className={styles.feedContainer}>
      <div className={styles.feedHeader}>
        <div className={styles.sortControls}>
          <span className={styles.sortLabel}>Sort by:</span>
          <button
            onClick={() => handleSortChange('publishedAt')}
            className={`${styles.sortButton} ${sortBy === 'publishedAt' ? styles.active : ''}`}
          >
            Date {sortBy === 'publishedAt' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSortChange('relevanceScore')}
            className={`${styles.sortButton} ${sortBy === 'relevanceScore' ? styles.active : ''}`}
          >
            Relevance {sortBy === 'relevanceScore' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => handleSortChange('engagement')}
            className={`${styles.sortButton} ${sortBy === 'engagement' ? styles.active : ''}`}
          >
            Engagement {sortBy === 'engagement' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>

        <div className={styles.viewControls}>
          <button
            onClick={() => setViewMode('card')}
            className={`${styles.viewButton} ${viewMode === 'card' ? styles.active : ''}`}
            title="Card view"
          >
            🔲
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
            title="List view"
          >
            ≡
          </button>
        </div>
      </div>

      <div className={`${styles.feedGrid} ${styles[viewMode]}`}>
        {sortedItems.map((item) => (
          <FeedItem
            key={item.id}
            item={item}
            profile={profiles.find(p => p.id === (item as any).profileId)}
            source={sources.find(s => s.id === (item as any).sourceId)}
            viewMode={viewMode}
          />
        ))}
      </div>

      <EngagementTracker items={sortedItems} />
    </div>
  )
}