'use client'

import styles from './AggregatorStats.module.css'

interface Stats {
  totalItems: number
  processedItems: number
  aiProcessedItems: number
  avgRelevanceScore: number
  lastUpdated: Date
}

interface AggregatorStatsProps {
  stats: Stats
  profileName?: string
}

export function AggregatorStats({ stats, profileName }: AggregatorStatsProps) {
  const relevancePercent = Math.round(stats.avgRelevanceScore * 100)
  const aiProcessingPercent = stats.totalItems > 0 
    ? Math.round((stats.aiProcessedItems / stats.totalItems) * 100)
    : 0
  
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statValue}>{stats.totalItems}</div>
        <div className={styles.statLabel}>Total Items</div>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statValue}>{stats.processedItems}</div>
        <div className={styles.statLabel}>Processed</div>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statValue}>{relevancePercent}%</div>
        <div className={styles.statLabel}>Avg Relevance</div>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statValue}>
          {aiProcessingPercent}%
          <span className={styles.aiIndicator}>AI</span>
        </div>
        <div className={styles.statLabel}>AI Enhanced</div>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statValue}>
          {stats.lastUpdated.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
        <div className={styles.statLabel}>Last Updated</div>
      </div>
    </div>
  )
}