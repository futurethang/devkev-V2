'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './NewsTicker.module.css'

export interface NewsItem {
  id: string
  title: string
  url: string
  sourceName?: string
  relevanceScore?: number
}

interface NewsTickerProps {
  items: NewsItem[]
  speed?: number // pixels per second
  pauseOnHover?: boolean
}

export function NewsTicker({ 
  items, 
  speed = 50,
  pauseOnHover = true 
}: NewsTickerProps) {
  const [isPaused, setIsPaused] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const scrollPositionRef = useRef(0)

  useEffect(() => {
    if (!tickerRef.current) return

    const tickerElement = tickerRef.current
    const tickerWidth = tickerElement.scrollWidth / 2 // We duplicate content, so actual width is half

    let lastTimestamp = 0
    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp
      
      const deltaTime = timestamp - lastTimestamp
      lastTimestamp = timestamp

      if (!isPaused) {
        scrollPositionRef.current += (speed * deltaTime) / 1000
        
        // Reset position when we've scrolled through one full set
        if (scrollPositionRef.current >= tickerWidth) {
          scrollPositionRef.current = scrollPositionRef.current % tickerWidth
        }

        tickerElement.style.transform = `translateX(-${scrollPositionRef.current}px)`
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [speed, isPaused])

  if (items.length === 0) {
    return null
  }

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items]

  return (
    <div 
      className={styles.tickerWrapper}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div className={styles.tickerHeader}>
        <h3 className={styles.tickerHeaderText}>Latest AI News</h3>
      </div>
      <div className={styles.tickerContainer}>
        <div ref={tickerRef} className={styles.tickerContent}>
          {duplicatedItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className={styles.tickerItem}>
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.tickerLink}
              >
                <span className={styles.tickerTitle}>{item.title}</span>
                {item.sourceName && (
                  <span className={styles.tickerSource}>— {item.sourceName}</span>
                )}
              </a>
              <span className={styles.tickerSeparator}>•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}