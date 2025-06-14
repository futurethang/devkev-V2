#!/usr/bin/env node

import { Aggregator } from './lib/aggregator'
import fs from 'fs/promises'
import path from 'path'

async function runAggregator() {
  console.log('🚀 Starting AI Content Aggregator...\n')
  
  const aggregator = new Aggregator()
  
  try {
    // Check system status
    console.log('📋 System Status:')
    console.log('─'.repeat(50))
    const status = await aggregator.getStatus()
    console.log(`✅ Ready: ${status.isReady}`)
    console.log(`📁 Config Directory: ${status.config.configDir}`)
    console.log(`📡 Sources: ${status.config.enabledSourcesCount}/${status.config.sourcesCount} enabled`)
    console.log(`👤 Profiles: ${status.config.activeProfilesCount}/${status.config.profilesCount} active`)
    console.log(`⏱️ Uptime: ${Math.round(status.uptime / 1000)}s\n`)

    // Run aggregation
    console.log('🔄 Fetching content from all active profiles...')
    const startTime = Date.now()
    
    const result = await aggregator.fetchFromAllActiveProfiles()
    
    console.log('─'.repeat(50))
    console.log('📊 Aggregation Results:')
    console.log(`⏱️ Duration: ${result.duration}ms`)
    console.log(`📡 Total Fetches: ${result.totalFetches}`)
    console.log(`📄 Total Items: ${result.totalItems}`)
    console.log(`❌ Errors: ${result.totalErrors}`)
    console.log(`📅 Timestamp: ${result.timestamp.toISOString()}\n`)

    // Show per-profile results
    result.profiles.forEach(profile => {
      console.log(`📂 Profile: ${profile.profileName} (${profile.profileId})`)
      console.log(`   📊 Items: ${profile.processedItems}/${profile.totalItems} (after processing)`)
      console.log(`   ✅ Successful fetches: ${profile.successfulFetches}/${profile.fetchResults.length}`)
      console.log(`   🎯 Avg relevance: ${profile.avgRelevanceScore}`)
      console.log(`   🗑️ Duplicates removed: ${profile.duplicatesRemoved}`)
      
      if (profile.errors.length > 0) {
        console.log(`   ❌ Errors: ${profile.errors.join(', ')}`)
      }
      
      // Show source breakdown
      profile.fetchResults.forEach(fetch => {
        const status = fetch.success ? '✅' : '❌'
        const error = fetch.error ? ` (${fetch.error})` : ''
        console.log(`      ${status} ${fetch.sourceId}: ${fetch.itemCount} items in ${fetch.duration}ms${error}`)
      })
      console.log()
    })

    // Get detailed metrics
    const metrics = aggregator.getLastRunMetrics()
    if (metrics) {
      console.log('📈 Performance Metrics:')
      console.log('─'.repeat(50))
      console.log(`📊 Avg items per source: ${metrics.summary.avgItemsPerSource.toFixed(1)}`)
      console.log(`✅ Success rate: ${(metrics.summary.successRate * 100).toFixed(1)}%`)
      console.log()
    }

    // Option to save results
    await saveResults(result)

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

async function saveResults(result: any) {
  try {
    const outputDir = path.join(__dirname, 'output')
    await fs.mkdir(outputDir, { recursive: true })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `aggregation-${timestamp}.json`
    const filepath = path.join(outputDir, filename)
    
    await fs.writeFile(filepath, JSON.stringify(result, null, 2))
    console.log(`💾 Results saved to: ${filepath}`)
    
    // Also save a latest.json for easy access
    const latestPath = path.join(outputDir, 'latest.json')
    await fs.writeFile(latestPath, JSON.stringify(result, null, 2))
    console.log(`💾 Latest results: ${latestPath}`)
    
  } catch (error) {
    console.error('⚠️ Failed to save results:', error)
  }
}

// Add command line options
const args = process.argv.slice(2)
const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp) {
  console.log(`
🤖 AI Content Aggregator

Usage:
  npx tsx run-aggregator.ts [options]

Options:
  --help, -h     Show this help message
  
Examples:
  npx tsx run-aggregator.ts     # Run with default settings
  
Output:
  - Console: Live progress and summary
  - Files: JSON results saved to ./output/ directory
`)
  process.exit(0)
}

runAggregator().catch(console.error)