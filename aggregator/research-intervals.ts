#!/usr/bin/env tsx

/**
 * Research Mode CLI
 * Run interval optimization research to find optimal fetch frequencies
 */

import { Aggregator } from './lib/aggregator'
import { IntervalOptimizer } from './lib/research/interval-optimizer'
import path from 'path'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  const configPath = path.join(process.cwd(), 'aggregator', 'config')
  const dataPath = path.join(process.cwd(), 'aggregator', 'data')
  
  const aggregator = new Aggregator(configPath, true)
  const optimizer = new IntervalOptimizer(aggregator, dataPath)

  switch (command) {
    case 'start':
      const days = parseInt(args[1] || '14')
      console.log(`Starting interval research for ${days} days...`)
      console.log('This will test different fetch intervals to find optimal settings.')
      console.log('Research data will be saved to:', dataPath)
      
      // Run in background
      optimizer.startResearch(days).catch(error => {
        console.error('Research failed:', error)
        process.exit(1)
      })
      
      console.log('Research mode started. Run "research-intervals status" to check progress.')
      break

    case 'stop':
      console.log('Stopping research mode...')
      optimizer.stopResearch()
      break

    case 'status':
    case 'results':
      console.log('Fetching research results...')
      const recommendations = await optimizer.getRecommendations()
      
      if (recommendations.length === 0) {
        console.log('No research data available yet.')
        console.log('Run "research-intervals start" to begin collecting data.')
        break
      }

      console.log('\n📊 Interval Optimization Results\n')
      
      for (const result of recommendations) {
        console.log(`Source: ${result.sourceId}`)
        console.log(`Current interval: ${result.currentInterval} minutes`)
        console.log(`Optimal interval: ${result.optimalInterval} minutes`)
        console.log(`Recommendation: ${result.recommendation}`)
        
        if (result.data.patterns.peakHours.length > 0) {
          console.log(`Peak activity hours: ${result.data.patterns.peakHours.join(', ')}`)
        }
        
        console.log('---')
      }
      break

    default:
      console.log('Interval Research CLI - Find optimal fetch frequencies')
      console.log('')
      console.log('Usage:')
      console.log('  pnpm research:intervals start [days]  - Start research mode (default: 14 days)')
      console.log('  pnpm research:intervals stop          - Stop research mode')
      console.log('  pnpm research:intervals status        - View research results')
      console.log('')
      console.log('Research mode will test different fetch intervals and analyze:')
      console.log('- New content rate at different intervals')
      console.log('- Duplicate content patterns')
      console.log('- Content freshness (age at fetch time)')
      console.log('- Peak activity hours for each source')
  }
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})