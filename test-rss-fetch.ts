#!/usr/bin/env tsx

/**
 * Test script to debug RSS fetching issue
 */

import { DatabaseAggregator } from './aggregator/lib/database-aggregator.js'
import { DatabaseService } from './lib/database/database-service.js'
import { RSSParser } from './aggregator/lib/sources/rss-parser.js'

async function testDirectRSSFetch() {
  console.log('🔍 Testing direct RSS fetch...\n')
  
  const rssParser = new RSSParser()
  const testUrls = [
    'https://vercel.com/blog/rss.xml',
    'https://github.blog/feed/',
    'https://blog.google/rss/'
  ]
  
  for (const url of testUrls) {
    console.log(`Testing ${url}...`)
    try {
      const items = await rssParser.fetchAndParse(url, 'Test Source')
      console.log(`✅ Success: ${items.length} items fetched`)
      if (items.length > 0) {
        console.log(`   First item: "${items[0].title}"`)
      }
    } catch (error) {
      console.log(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    console.log()
  }
}

async function testDatabaseSources() {
  console.log('📊 Testing database sources...\n')
  
  const dbService = new DatabaseService()
  
  try {
    // Get all sources from database
    const sources = await dbService.getSources()
    console.log(`Found ${sources.length} sources in database:`)
    
    sources.forEach(source => {
      console.log(`  - ${source.name} (${source.type}): ${source.url}`)
      console.log(`    Enabled: ${source.enabled}, Fetch Interval: ${source.fetchInterval}s`)
    })
    
    // Get active sources
    console.log('\nActive sources:')
    const activeSources = await dbService.getActiveSources()
    console.log(`Found ${activeSources.length} active sources`)
    
    // Test RSS sources
    const rssSources = activeSources.filter(s => s.type === 'rss')
    console.log(`\nRSS sources to test: ${rssSources.length}`)
    
    if (rssSources.length > 0) {
      const rssParser = new RSSParser()
      for (const source of rssSources) {
        console.log(`\nTesting ${source.name} (${source.url})...`)
        try {
          const items = await rssParser.fetchFromSource(source)
          console.log(`✅ Success: ${items.length} items fetched`)
        } catch (error) {
          console.log(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
    
  } catch (error) {
    console.error('Database error:', error)
  }
}

async function testAggregatorFlow() {
  console.log('\n🤖 Testing full aggregator flow...\n')
  
  const aggregator = new DatabaseAggregator(false) // No AI for debugging
  
  try {
    await aggregator.initialize()
    console.log('Aggregator initialized')
    
    // Get status
    const status = await aggregator.getStatus()
    console.log('Status:', status)
    
    // Get active profiles
    const configLoader = (aggregator as any).configLoader
    const activeProfiles = await configLoader.getActiveProfiles()
    console.log(`\nActive profiles: ${activeProfiles.length}`)
    
    if (activeProfiles.length > 0) {
      const profile = activeProfiles[0]
      console.log(`\nTesting profile: ${profile.name}`)
      
      // Get sources for profile
      const sources = await configLoader.getSourcesForProfile(profile.id)
      console.log(`Sources for profile: ${sources.length}`)
      sources.forEach(s => console.log(`  - ${s.name}: ${s.url}`))
      
      // Fetch from profile
      console.log('\nFetching from profile...')
      const result = await aggregator.fetchFromProfile(profile, true)
      console.log('Result:', {
        totalItems: result.totalItems,
        processedItems: result.processedItems,
        successfulFetches: result.successfulFetches,
        errors: result.errors
      })
      
      if (result.processedFeedItems && result.processedFeedItems.length > 0) {
        console.log(`\nSample items:`)
        result.processedFeedItems.slice(0, 3).forEach(item => {
          console.log(`  - "${item.title}"`)
        })
      }
    }
    
  } catch (error) {
    console.error('Aggregator error:', error)
  }
}

async function main() {
  console.log('🚀 RSS Fetch Debugging Script\n')
  
  // Test 1: Direct RSS fetching
  await testDirectRSSFetch()
  
  // Test 2: Database sources
  await testDatabaseSources()
  
  // Test 3: Full aggregator flow
  await testAggregatorFlow()
  
  console.log('\n✨ Testing completed!')
}

main().catch(console.error)