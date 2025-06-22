#!/usr/bin/env tsx

import { DatabaseService } from '../lib/database/database-service'
import { DatabaseConfigLoader } from '../aggregator/lib/config/database-config-loader'

async function seedSampleData() {
  console.log('🌱 Seeding sample data...')
  
  const dbService = new DatabaseService()
  const configLoader = new DatabaseConfigLoader()
  
  try {
    // Check if we already have data
    const existingProfiles = await dbService.getProfiles()
    if (existingProfiles.length > 0) {
      console.log('✅ Data already exists, skipping seed')
      return
    }
    
    // Create sample profiles
    console.log('Creating sample profiles...')
    const profiles = [
      {
        name: 'AI Products',
        description: 'Focus on AI product development and applications',
        enabled: true,
        weight: 1.0,
        keywords: {
          boost: {
            high: ['GPT', 'Claude', 'LLM', 'AI product'],
            medium: ['machine learning', 'neural network', 'automation'],
            low: ['tech', 'software']
          },
          filter: {
            exclude: ['crypto', 'blockchain'],
            require: []
          }
        },
        sources: [],
        processing: {
          generateSummary: true,
          enhanceTags: true,
          scoreRelevance: true,
          checkDuplicates: true,
          minRelevanceScore: 0.3,
          maxAgeDays: 7
        }
      },
      {
        name: 'ML Engineering',
        description: 'Technical ML/AI engineering content',
        enabled: true,
        weight: 1.0,
        keywords: {
          boost: {
            high: ['PyTorch', 'TensorFlow', 'model training', 'MLOps'],
            medium: ['Python', 'GPU', 'optimization', 'deployment'],
            low: ['engineering', 'development']
          },
          filter: {
            exclude: ['marketing', 'sales'],
            require: []
          }
        },
        sources: [],
        processing: {
          generateSummary: true,
          enhanceTags: true,
          scoreRelevance: true,
          checkDuplicates: true,
          minRelevanceScore: 0.4,
          maxAgeDays: 7
        }
      }
    ]
    
    for (const profile of profiles) {
      await configLoader.createProfile(profile)
      console.log(`✅ Created profile: ${profile.name}`)
    }
    
    // Create sample sources
    console.log('Creating sample sources...')
    const sources = [
      {
        name: 'Hacker News AI',
        type: 'hn' as const,
        url: 'https://news.ycombinator.com',
        enabled: true,
        fetchInterval: 3600,
        weight: 1.0,
        maxItems: 30
      },
      {
        name: 'AI News RSS',
        type: 'rss' as const,
        url: 'https://www.artificialintelligence-news.com/feed/',
        enabled: true,
        fetchInterval: 3600,
        weight: 0.8
      }
    ]
    
    for (const source of sources) {
      await configLoader.createSource(source)
      console.log(`✅ Created source: ${source.name}`)
    }
    
    // Create some sample feed items
    console.log('Creating sample feed items...')
    const sampleItems = [
      {
        title: 'Claude 3.5 Sonnet: A New Frontier in AI Assistants',
        content: 'Anthropic releases Claude 3.5 Sonnet with improved reasoning capabilities...',
        url: 'https://example.com/claude-35-sonnet',
        author: 'AI Reporter',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        source: 'rss' as const,
        sourceName: 'AI News RSS',
        sourceUrl: 'https://www.artificialintelligence-news.com/feed/',
        tags: ['AI', 'Claude', 'Anthropic'],
        relevanceScore: 0.95,
        aiSummary: 'Anthropic announces Claude 3.5 Sonnet with enhanced capabilities for code generation and analysis.',
        metadata: {
          aiProcessed: true,
          processingStatus: 'processed'
        }
      },
      {
        title: 'Building Production-Ready LLM Applications',
        content: 'A comprehensive guide to deploying LLM applications at scale...',
        url: 'https://example.com/llm-production',
        author: 'Tech Writer',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        source: 'hn' as const,
        sourceName: 'Hacker News',
        sourceUrl: 'https://news.ycombinator.com',
        tags: ['LLM', 'Production', 'Engineering'],
        relevanceScore: 0.87,
        aiSummary: 'Best practices for deploying LLM applications including monitoring, scaling, and cost optimization.',
        metadata: {
          aiProcessed: true,
          processingStatus: 'processed'
        }
      },
      {
        title: 'The Future of AI in Software Development',
        content: 'How AI is transforming the way we write and maintain code...',
        url: 'https://example.com/ai-software-dev',
        author: 'Dev Advocate',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        source: 'rss' as const,
        sourceName: 'Tech Blog',
        sourceUrl: 'https://techblog.example.com/feed',
        tags: ['AI', 'Software Development', 'Future'],
        relevanceScore: 0.82,
        aiSummary: 'Exploring how AI tools are augmenting developer productivity and changing software development workflows.',
        metadata: {
          aiProcessed: true,
          processingStatus: 'processed'
        }
      }
    ]
    
    for (const item of sampleItems) {
      await dbService.createFeedItem(item)
      console.log(`✅ Created feed item: ${item.title}`)
    }
    
    console.log('🎉 Sample data seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  seedSampleData()
}

export { seedSampleData }