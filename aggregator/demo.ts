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
    
    console.log('\n✨ Demo completed successfully!')
    
  } catch (error) {
    console.error('❌ Demo failed:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

// Run the demo
main().catch(console.error)