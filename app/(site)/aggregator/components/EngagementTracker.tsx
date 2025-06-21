'use client'

import { useEffect } from 'react'

interface FeedItemWithEngagement {
  id: string
  title: string
  engagement: {
    views: number
    clicks: number
    reads: number
    isRead: boolean
    ctr: number
  }
}

interface EngagementTrackerProps {
  items: FeedItemWithEngagement[]
}

export function EngagementTracker({ items }: EngagementTrackerProps) {
  useEffect(() => {
    // Track view events for visible items
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const itemId = entry.target.getAttribute('data-item-id')
            if (itemId) {
              // Track view engagement
              fetch('/api/aggregator/engagement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  itemId,
                  eventType: 'view',
                  metadata: { 
                    viewportIntersection: entry.intersectionRatio,
                    timestamp: new Date().toISOString()
                  }
                })
              }).catch((error) => {
                console.warn('Failed to track view engagement:', error)
              })
              
              // Stop observing this item after first view
              observer.unobserve(entry.target)
            }
          }
        })
      },
      {
        threshold: 0.5, // Track when 50% of item is visible
        rootMargin: '0px'
      }
    )

    // Observe all feed items
    const feedItems = document.querySelectorAll('[data-item-id]')
    feedItems.forEach((item) => observer.observe(item))

    return () => {
      observer.disconnect()
    }
  }, [items])

  // This component doesn't render anything visible
  return null
}