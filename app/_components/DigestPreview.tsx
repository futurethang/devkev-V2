'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './DigestPreview.module.css'

interface DigestItem {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  relevanceScore?: number
}

export function DigestPreview() {
  const [items, setItems] = useState<DigestItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestItems()
  }, [])

  const fetchLatestItems = async () => {
    try {
      const response = await fetch('/api/aggregator?profile=ai-product&includeItems=true')
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      if (data.processedFeedItems) {
        setItems(data.processedFeedItems.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load digest preview:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null

  if (items.length === 0) return null

  return (
    <section className={styles.preview}>
      <div className={styles.header}>
        <h2>Latest from AI Digest</h2>
        <Link href="/digest" className={styles.viewAll}>
          View all →
        </Link>
      </div>
      
      <div className={styles.items}>
        {items.map(item => (
          <article key={item.id} className={styles.item}>
            <div className={styles.source}>{item.source}</div>
            <h3 className={styles.title}>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            </h3>
            {item.relevanceScore && (
              <div className={styles.relevance}>
                {Math.round(item.relevanceScore * 100)}% relevant
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}