#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'

interface ViewOptions {
  format: 'summary' | 'detailed' | 'items' | 'sources'
  profile?: string
  minScore?: number
  limit?: number
}

async function viewResults(options: ViewOptions = { format: 'summary' }) {
  try {
    const outputDir = path.join(__dirname, 'output')
    const latestPath = path.join(outputDir, 'latest.json')
    
    const data = await fs.readFile(latestPath, 'utf8')
    const result = JSON.parse(data)
    
    switch (options.format) {
      case 'summary':
        showSummary(result)
        break
      case 'detailed':
        showDetailed(result, options)
        break
      case 'items':
        showItems(result, options)
        break
      case 'sources':
        showSources(result)
        break
    }
    
  } catch (error) {
    console.error('❌ Error reading results:', error)
    console.log('\n💡 Try running the aggregator first: npx tsx run-aggregator.ts')
  }
}

function showSummary(result: any) {
  console.log('📊 Aggregation Summary')
  console.log('─'.repeat(50))
  console.log(`📅 Run time: ${new Date(result.timestamp).toLocaleString()}`)
  console.log(`⏱️ Duration: ${result.duration}ms`)
  console.log(`📡 Sources checked: ${result.totalFetches}`)
  console.log(`📄 Raw items found: ${result.totalItems}`)
  console.log(`❌ Errors: ${result.totalErrors}`)
  console.log()
  
  result.profiles.forEach((profile: any) => {
    console.log(`📂 ${profile.profileName}:`)
    console.log(`   📊 ${profile.processedItems} items (${profile.totalItems} raw)`)
    console.log(`   🎯 Avg relevance: ${profile.avgRelevanceScore}`)
    console.log(`   🗑️ ${profile.duplicatesRemoved} duplicates removed`)
  })
}

function showDetailed(result: any, options: ViewOptions) {
  console.log('📋 Detailed Results')
  console.log('─'.repeat(50))
  
  result.profiles.forEach((profile: any) => {
    if (options.profile && profile.profileId !== options.profile) return
    
    console.log(`\n📂 Profile: ${profile.profileName} (${profile.profileId})`)
    console.log(`📊 Processing: ${profile.processedItems}/${profile.totalItems} items`)
    console.log(`🎯 Avg relevance score: ${profile.avgRelevanceScore}`)
    console.log(`🗑️ Duplicates removed: ${profile.duplicatesRemoved}`)
    console.log()
    
    console.log('📡 Source Performance:')
    profile.fetchResults.forEach((fetch: any) => {
      const status = fetch.success ? '✅' : '❌'
      const duration = `${fetch.duration}ms`
      const items = `${fetch.itemCount} items`
      console.log(`   ${status} ${fetch.sourceId}: ${items} in ${duration}`)
      if (fetch.error) {
        console.log(`      ❌ ${fetch.error}`)
      }
    })
    
    if (profile.errors.length > 0) {
      console.log('\n❌ Profile Errors:')
      profile.errors.forEach((error: string) => console.log(`   • ${error}`))
    }
  })
}

async function showItems(result: any, options: ViewOptions) {
  console.log('📄 Content Items')
  console.log('─'.repeat(50))
  
  // To show actual items, we'd need to re-run with includeProcessedItems: true
  // For now, show what we can from the summary
  console.log('💡 To view actual content items, the aggregator needs to be run with full item details.')
  console.log('📝 Showing available item statistics:\n')
  
  result.profiles.forEach((profile: any) => {
    if (options.profile && profile.profileId !== options.profile) return
    
    console.log(`📂 ${profile.profileName}: ${profile.processedItems} items`)
    
    profile.fetchResults.forEach((fetch: any) => {
      if (fetch.success && fetch.itemCount > 0) {
        console.log(`   📡 ${fetch.sourceId}: ${fetch.itemCount} items`)
      }
    })
  })
  
  console.log(`\n💡 Run: npx tsx show-content.ts to see actual article titles and links`)
}

function showSources(result: any) {
  console.log('📡 Source Performance')
  console.log('─'.repeat(50))
  
  const allSources = new Map()
  
  result.profiles.forEach((profile: any) => {
    profile.fetchResults.forEach((fetch: any) => {
      if (!allSources.has(fetch.sourceId)) {
        allSources.set(fetch.sourceId, {
          id: fetch.sourceId,
          successes: 0,
          failures: 0,
          totalItems: 0,
          totalDuration: 0,
          errors: new Set()
        })
      }
      
      const source = allSources.get(fetch.sourceId)
      if (fetch.success) {
        source.successes++
        source.totalItems += fetch.itemCount
      } else {
        source.failures++
        if (fetch.error) source.errors.add(fetch.error)
      }
      source.totalDuration += fetch.duration
    })
  })
  
  Array.from(allSources.values()).forEach((source: any) => {
    const total = source.successes + source.failures
    const successRate = total > 0 ? (source.successes / total * 100).toFixed(1) : '0'
    const avgDuration = total > 0 ? Math.round(source.totalDuration / total) : 0
    
    console.log(`📡 ${source.id}:`)
    console.log(`   ✅ Success rate: ${successRate}% (${source.successes}/${total})`)
    console.log(`   📊 Total items: ${source.totalItems}`)
    console.log(`   ⏱️ Avg duration: ${avgDuration}ms`)
    
    if (source.errors.size > 0) {
      console.log(`   ❌ Errors: ${Array.from(source.errors).join(', ')}`)
    }
    console.log()
  })
}

// Command line interface
const args = process.argv.slice(2)
const format = args.find(arg => ['summary', 'detailed', 'items', 'sources'].includes(arg)) || 'summary'
const profile = args.find(arg => arg.startsWith('--profile='))?.split('=')[1]
const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp) {
  console.log(`
📊 View Aggregator Results

Usage:
  npx tsx view-results.ts [format] [options]

Formats:
  summary     Quick overview (default)
  detailed    Full profile and source details  
  items       Content items (requires full run)
  sources     Source performance analysis

Options:
  --profile=ID    Filter to specific profile
  --help, -h      Show this help

Examples:
  npx tsx view-results.ts                    # Quick summary
  npx tsx view-results.ts detailed           # Full details
  npx tsx view-results.ts sources            # Source performance
  npx tsx view-results.ts detailed --profile=ai-product
`)
  process.exit(0)
}

viewResults({ 
  format: format as any, 
  profile 
}).catch(console.error)