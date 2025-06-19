import { Aggregator } from '../aggregator'
import { SourceConfig, FeedItem } from '../types/feed'
import fs from 'fs/promises'
import path from 'path'

interface FetchResearchData {
  sourceId: string
  interval: number // minutes
  fetchTime: string
  newItems: number
  totalItems: number
  duplicates: number
  avgAge: number // hours since publication
  success: boolean
  error?: string
}

interface IntervalResearchResult {
  sourceId: string
  optimalInterval: number
  currentInterval: number
  recommendation: string
  data: {
    intervals: Record<number, {
      avgNewItems: number
      avgDuplicates: number
      avgAge: number
      fetchCount: number
      successRate: number
    }>
    patterns: {
      hourlyActivity: number[]
      dailyActivity: number[]
      peakHours: number[]
    }
  }
}

export class IntervalOptimizer {
  private aggregator: Aggregator
  private researchDataPath: string
  private isRunning = false
  private researchIntervals = [15, 30, 60, 120, 240, 360] // minutes

  constructor(aggregator: Aggregator, dataPath: string) {
    this.aggregator = aggregator
    this.researchDataPath = path.join(dataPath, 'interval-research.json')
  }

  /**
   * Start research mode - runs for specified duration with varying intervals
   */
  async startResearch(durationDays: number = 14): Promise<void> {
    if (this.isRunning) {
      console.log('Research mode already running')
      return
    }

    this.isRunning = true
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    console.log(`Starting interval research for ${durationDays} days`)

    // Run research fetches
    while (this.isRunning && new Date() < endDate) {
      const sources = await this.aggregator['configLoader'].loadSources()
      const enabledSourceConfigs = sources.filter(s => s.enabled)

      for (const source of enabledSourceConfigs) {
        // Try different intervals for each source
        const testInterval = this.getNextTestInterval(source.id)
        await this.performResearchFetch(source, testInterval)
      }

      // Wait before next research cycle (minimum interval)
      await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000)) // 15 minutes
    }

    this.isRunning = false
    console.log('Research mode completed')

    // Generate recommendations
    await this.generateRecommendations()
  }

  /**
   * Stop research mode
   */
  stopResearch(): void {
    this.isRunning = false
  }

  /**
   * Perform a research fetch and collect data
   */
  private async performResearchFetch(source: SourceConfig, interval: number): Promise<void> {
    const startTime = Date.now()
    
    try {
      const result = await this.aggregator.fetchFromSource(source)
      const endTime = Date.now()

      // Analyze results
      const existingData = await this.loadResearchData()
      const lastFetch = existingData
        .filter(d => d.sourceId === source.id)
        .sort((a, b) => new Date(b.fetchTime).getTime() - new Date(a.fetchTime).getTime())[0]

      let newItems = 0
      let duplicates = 0
      let totalAge = 0

      if (result.items && lastFetch) {
        const lastItemIds = new Set(lastFetch.totalItems > 0 ? [] : []) // Would need to store item IDs
        
        for (const item of result.items) {
          const age = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60)
          totalAge += age

          if (lastItemIds.has(item.id)) {
            duplicates++
          } else {
            newItems++
          }
        }
      }

      const researchData: FetchResearchData = {
        sourceId: source.id,
        interval,
        fetchTime: new Date().toISOString(),
        newItems: result.items?.length || 0,
        totalItems: result.items?.length || 0,
        duplicates,
        avgAge: result.items?.length ? totalAge / result.items.length : 0,
        success: result.success,
        error: result.error
      }

      await this.saveResearchData(researchData)

    } catch (error) {
      const researchData: FetchResearchData = {
        sourceId: source.id,
        interval,
        fetchTime: new Date().toISOString(),
        newItems: 0,
        totalItems: 0,
        duplicates: 0,
        avgAge: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      await this.saveResearchData(researchData)
    }
  }

  /**
   * Get next interval to test for a source
   */
  private getNextTestInterval(sourceId: string): number {
    // Rotate through test intervals
    const index = Math.floor(Date.now() / (1000 * 60 * 15)) % this.researchIntervals.length
    return this.researchIntervals[index]
  }

  /**
   * Load research data
   */
  private async loadResearchData(): Promise<FetchResearchData[]> {
    try {
      const data = await fs.readFile(this.researchDataPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      return []
    }
  }

  /**
   * Save research data point
   */
  private async saveResearchData(data: FetchResearchData): Promise<void> {
    const existing = await this.loadResearchData()
    existing.push(data)

    // Keep only last 30 days of data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const filtered = existing.filter(d => 
      new Date(d.fetchTime) > thirtyDaysAgo
    )

    await fs.mkdir(path.dirname(this.researchDataPath), { recursive: true })
    await fs.writeFile(this.researchDataPath, JSON.stringify(filtered, null, 2))
  }

  /**
   * Generate recommendations based on research data
   */
  async generateRecommendations(): Promise<IntervalResearchResult[]> {
    const data = await this.loadResearchData()
    const sources = await this.aggregator['configLoader'].loadSourceConfigs()
    const results: IntervalResearchResult[] = []

    for (const source of sources) {
      const sourceData = data.filter(d => d.sourceId === source.id)
      if (sourceData.length === 0) continue

      // Analyze each interval
      const intervalStats: Record<number, any> = {}
      
      for (const interval of this.researchIntervals) {
        const intervalData = sourceData.filter(d => d.interval === interval)
        if (intervalData.length === 0) continue

        intervalStats[interval] = {
          avgNewItems: intervalData.reduce((sum, d) => sum + d.newItems, 0) / intervalData.length,
          avgDuplicates: intervalData.reduce((sum, d) => sum + d.duplicates, 0) / intervalData.length,
          avgAge: intervalData.reduce((sum, d) => sum + d.avgAge, 0) / intervalData.length,
          fetchCount: intervalData.length,
          successRate: intervalData.filter(d => d.success).length / intervalData.length
        }
      }

      // Find optimal interval
      let optimalInterval = source.fetchInterval
      let bestScore = -1

      for (const [interval, stats] of Object.entries(intervalStats)) {
        // Score based on: new items (good), low duplicates (good), freshness (lower age is good)
        const score = stats.avgNewItems * 10 - stats.avgDuplicates * 5 - stats.avgAge + stats.successRate * 20
        
        if (score > bestScore) {
          bestScore = score
          optimalInterval = parseInt(interval)
        }
      }

      // Generate recommendation
      let recommendation = ''
      if (optimalInterval < source.fetchInterval) {
        recommendation = `Decrease interval from ${source.fetchInterval} to ${optimalInterval} minutes for fresher content`
      } else if (optimalInterval > source.fetchInterval) {
        recommendation = `Increase interval from ${source.fetchInterval} to ${optimalInterval} minutes to reduce duplicates`
      } else {
        recommendation = 'Current interval is optimal'
      }

      // Analyze patterns
      const hourlyActivity = new Array(24).fill(0)
      const dailyActivity = new Array(7).fill(0)

      sourceData.forEach(d => {
        const date = new Date(d.fetchTime)
        hourlyActivity[date.getHours()] += d.newItems
        dailyActivity[date.getDay()] += d.newItems
      })

      // Find peak hours
      const peakHours = hourlyActivity
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(p => p.hour)

      results.push({
        sourceId: source.id,
        optimalInterval,
        currentInterval: source.fetchInterval,
        recommendation,
        data: {
          intervals: intervalStats,
          patterns: {
            hourlyActivity,
            dailyActivity,
            peakHours
          }
        }
      })
    }

    // Save recommendations
    const recommendationsPath = path.join(path.dirname(this.researchDataPath), 'interval-recommendations.json')
    await fs.writeFile(recommendationsPath, JSON.stringify(results, null, 2))

    return results
  }

  /**
   * Get current recommendations
   */
  async getRecommendations(): Promise<IntervalResearchResult[]> {
    try {
      const recommendationsPath = path.join(path.dirname(this.researchDataPath), 'interval-recommendations.json')
      const data = await fs.readFile(recommendationsPath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      return []
    }
  }
}