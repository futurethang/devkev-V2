#!/usr/bin/env tsx

/**
 * Demo script to test the aggregator system
 */

import { Aggregator } from './lib/aggregator.js'
import { ConfigLoader } from './lib/config/config-loader.js'
import fetch from 'node-fetch'

// Add fetch polyfill for Node.js
if (!global.fetch) {
  global.fetch = fetch as any
}

async function main() {
  console.log('🚀 Starting AI Aggregator Demo\n')
  
  try {
    // Initialize components
    const configLoader = new ConfigLoader()
    const aggregator = new Aggregator()
    
    // Get system status
    console.log('📊 System Status:')
    const status = await aggregator.getStatus()
    console.log(`  Ready: ${status.isReady}`)
    console.log(`  Sources: ${status.config.sourcesCount} total, ${status.config.enabledSourcesCount} enabled`)
    console.log(`  Profiles: ${status.config.profilesCount} total, ${status.config.activeProfilesCount} active`)
    console.log(`  Config Dir: ${status.config.configDir}\n`)
    
    // Load and display configuration
    console.log('⚙️  Configuration:')
    const sources = await configLoader.loadSources()
    console.log(`  Loaded ${sources.length} sources:`)
    sources.forEach(source => {
      console.log(`    - ${source.name} (${source.type}) ${source.enabled ? '✅' : '❌'}`)
    })
    
    const profiles = await configLoader.getActiveProfiles()
    console.log(`\n  Active profiles: ${profiles.length}`)
    profiles.forEach(profile => {
      console.log(`    - ${profile.name}: ${profile.sources.length} sources`)
    })
    
    // Test single source (first enabled RSS source)
    console.log('\n🔗 Testing single RSS source:')
    const enabledSources = sources.filter(s => s.enabled && s.type === 'rss')
    if (enabledSources.length > 0) {
      const testSource = enabledSources[0]
      console.log(`  Testing: ${testSource.name}`)
      
      const result = await aggregator.fetchFromSource(testSource)
      if (result.success) {
        console.log(`  ✅ Success: ${result.itemCount} items in ${result.duration}ms`)
      } else {
        console.log(`  ❌ Failed: ${result.error}`)
      }
    } else {
      console.log('  No enabled RSS sources found')
    }
    
    // Test profile-based aggregation with content processing
    console.log('\n🧠 Testing AI-powered content processing:')
    if (profiles.length > 0) {
      const testProfile = profiles[0]
      console.log(`  Processing with profile: ${testProfile.name}`)
      
      const profileResult = await aggregator.fetchFromProfile(testProfile, true)
      console.log(`  📊 Results:`)
      console.log(`    - Raw items: ${profileResult.totalItems}`)
      console.log(`    - Processed items: ${profileResult.processedItems}`)
      console.log(`    - Duplicates removed: ${profileResult.duplicatesRemoved}`)
      console.log(`    - Average relevance: ${profileResult.avgRelevanceScore.toFixed(3)}`)
      console.log(`    - Successful sources: ${profileResult.successfulFetches}/${profileResult.fetchResults.length}`)
      
      if (profileResult.errors.length > 0) {
        console.log(`    - Errors: ${profileResult.errors.length}`)
        profileResult.errors.forEach(error => console.log(`      ⚠️  ${error}`))
      }
      
      // Show top 3 most relevant items
      if (profileResult.processedFeedItems && profileResult.processedFeedItems.length > 0) {
        console.log(`\n  🔥 Top relevant items:`)
        profileResult.processedFeedItems.slice(0, 3).forEach((item, index) => {
          console.log(`    ${index + 1}. "${item.title}" (score: ${item.relevanceScore?.toFixed(3)})`)
          console.log(`       ${item.url}`)
        })
      }
    } else {
      console.log('  No active profiles found')
    }
    
    console.log('\n✨ Demo completed successfully!')
    
  } catch (error) {
    console.error('❌ Demo failed:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

// Run the demo
main().catch(console.error)