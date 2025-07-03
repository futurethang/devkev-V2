import { useState, useEffect } from 'react'
import { NewsItem } from '@/app/_components/NewsTicker'

export function useLatestArticles(limit: number = 5) {
  const [articles, setArticles] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true)
        setError(null)

        // Fetch articles from AI Product profile with items included
        const params = new URLSearchParams({
          profile: 'ai-product',
          includeItems: 'true',
          ai: 'false' // Don't use AI processing for the ticker
        })

        const response = await fetch(`/api/aggregator?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch articles')
        }

        const data = await response.json()
        console.log('Aggregator response:', data)
        
        // Collect all articles from all profiles if data has multiple profiles
        let allArticles: NewsItem[] = []
        
        if (data.processedFeedItems && data.processedFeedItems.length > 0) {
          // Direct feed items from single profile or aggregated
          allArticles = data.processedFeedItems.map((item: any) => ({
            id: item.id,
            title: item.title,
            url: item.url,
            sourceName: item.sourceName,
            relevanceScore: item.relevanceScore
          }))
        }

        console.log('Processed articles:', allArticles)
        
        // Sort by relevance score and take the top N
        allArticles.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        setArticles(allArticles.slice(0, limit))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Failed to fetch articles:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [limit])

  return { articles, loading, error }
}