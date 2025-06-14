#!/usr/bin/env node

import { Aggregator } from './lib/aggregator'

interface ContentOptions {
  profile?: string
  minScore?: number
  limit?: number
  sources?: string[]
  tags?: string[]
}

async function showContent(options: ContentOptions = {}) {
  console.log('📰 Latest AI Content')
  console.log('─'.repeat(80))
  
  const aggregator = new Aggregator()
  
  try {
    // Fetch with full item details
    const result = await aggregator.fetchFromAllActiveProfiles()
    
    // Re-fetch with processed items included
    const configLoader = aggregator['configLoader']
    const profiles = await configLoader.getActiveProfiles()
    
    for (const profile of profiles) {
      if (options.profile && profile.id !== options.profile) continue
      
      console.log(`\n📂 ${profile.name} (${profile.id})`)
      console.log('═'.repeat(80))
      
      const profileResult = await aggregator.fetchFromProfile(profile, true)
      const items = profileResult.processedFeedItems || []
      
      // Apply filters
      let filteredItems = items
      
      if (options.minScore) {
        filteredItems = filteredItems.filter(item => 
          (item.relevanceScore || 0) >= options.minScore!
        )
      }
      
      if (options.sources) {
        filteredItems = filteredItems.filter(item =>
          options.sources!.includes(item.source)
        )
      }
      
      if (options.tags) {
        filteredItems = filteredItems.filter(item =>
          options.tags!.some(tag => item.tags.includes(tag))
        )
      }
      
      // Sort by relevance score
      filteredItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      
      // Apply limit
      if (options.limit) {
        filteredItems = filteredItems.slice(0, options.limit)
      }
      
      if (filteredItems.length === 0) {
        console.log('   📭 No items match the current filters')
        continue
      }
      
      filteredItems.forEach((item, index) => {
        const score = item.relevanceScore ? `🎯 ${item.relevanceScore.toFixed(2)}` : ''
        const source = getSourceIcon(item.source)
        const age = getTimeAgo(item.publishedAt)
        
        console.log(`\n${index + 1}. ${item.title}`)
        console.log(`   ${source} ${item.author} • ${age} ${score}`)
        console.log(`   🔗 ${item.url}`)
        console.log(`   🏷️ ${item.tags.join(', ')}`)
        
        // Show excerpt if available
        if (item.content && item.content !== item.title) {
          const excerpt = item.content.length > 150 
            ? item.content.substring(0, 150) + '...'
            : item.content
          console.log(`   📝 ${excerpt}`)
        }
        
        // Show metadata
        if (item.metadata) {
          const meta = []
          if (item.metadata.score) meta.push(`⭐ ${item.metadata.score}`)
          if (item.metadata.comments) meta.push(`💬 ${item.metadata.comments}`)
          if (item.metadata.language) meta.push(`🔤 ${item.metadata.language}`)
          if (meta.length > 0) {
            console.log(`   📊 ${meta.join(' • ')}`)
          }
        }
      })
      
      console.log(`\n📊 Showing ${filteredItems.length} of ${items.length} items`)
    }
    
  } catch (error) {
    console.error('❌ Error fetching content:', error)
  }
}

function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    'rss': '📡',
    'github': '🐙',
    'hn': '🔥',
    'twitter': '🐦', 
    'reddit': '🤖'
  }
  return icons[source] || '📄'
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'recently'
}

// Command line interface
const args = process.argv.slice(2)
const profile = args.find(arg => arg.startsWith('--profile='))?.split('=')[1]
const minScore = args.find(arg => arg.startsWith('--min-score='))?.split('=')[1]
const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1]
const sources = args.find(arg => arg.startsWith('--sources='))?.split('=')[1]?.split(',')
const tags = args.find(arg => arg.startsWith('--tags='))?.split('=')[1]?.split(',')
const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp) {
  console.log(`
📰 Show Aggregated Content

Usage:
  npx tsx show-content.ts [options]

Options:
  --profile=ID        Show only specific profile
  --min-score=0.5     Minimum relevance score (0.0-1.0)
  --limit=10          Max items to show
  --sources=hn,rss    Filter by sources (comma-separated)
  --tags=ai,startup   Filter by tags (comma-separated)
  --help, -h          Show this help

Examples:
  npx tsx show-content.ts                           # All content
  npx tsx show-content.ts --limit=5                 # Top 5 items
  npx tsx show-content.ts --min-score=0.7           # High relevance only
  npx tsx show-content.ts --profile=ai-product      # AI product focus
  npx tsx show-content.ts --sources=hn --limit=3    # Top 3 HN stories
`)
  process.exit(0)
}

showContent({
  profile,
  minScore: minScore ? parseFloat(minScore) : undefined,
  limit: limit ? parseInt(limit) : undefined,
  sources,
  tags
}).catch(console.error)