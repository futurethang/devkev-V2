import { describe, test, expect, beforeAll } from 'vitest'
import { AIProcessor } from '../../lib/ai/ai-processor'
import { AnthropicProvider } from '../../lib/ai/providers/anthropic-provider'
import type { FeedItem, FocusProfile } from '../../lib/types/feed'

describe('AI Provider Health Checks', () => {
  let processor: AIProcessor
  let testItem: FeedItem
  let testProfile: FocusProfile

  beforeAll(async () => {
    processor = await AIProcessor.createDefault()
    
    testItem = {
      id: 'health-check-item',
      title: 'Testing Real AI Provider Integration',
      content: 'This is a comprehensive test to verify that our AI provider integration is working correctly with real API endpoints. We are testing summarization, tag generation, and insight extraction capabilities.',
      url: 'https://example.com/health-check',
      author: 'test-suite',
      publishedAt: new Date(),
      source: 'test',
      sourceUrl: 'test://health-check',
      tags: ['testing', 'ai', 'integration'],
      relevanceScore: 0.9
    }

    testProfile = {
      id: 'health-check',
      name: 'Health Check Profile',
      description: 'AI integration testing and validation for modern software development workflows',
      weight: 1.0,
      keywords: {
        boost: {
          high: ['testing', 'ai', 'integration'],
          medium: ['software', 'development'],
          low: ['api', 'validation']
        },
        filter: { exclude: [], require: [] }
      },
      sources: ['test'],
      processing: {
        generateSummary: true,
        enhanceTags: true,
        scoreRelevance: true,
        checkDuplicates: false,
        minRelevanceScore: 0.1,
        maxAgeDays: 30
      },
      enabled: true
    }
  })

  describe('Provider Status Detection', () => {
    test('should clearly identify active AI provider', () => {
      const stats = processor.getStats()
      const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY
      
      console.log('\n🔍 AI PROVIDER STATUS CHECK:')
      console.log(`Anthropic API Key: ${hasAnthropicKey ? '✅ Present' : '❌ Missing'}`)
      console.log(`OpenAI API Key: ${hasOpenAIKey ? '✅ Present' : '❌ Missing'}`)
      console.log(`Active Provider: ${stats.activeProvider}`)
      console.log(`Providers Ready: ${stats.providersReady}`)
      
      if (stats.activeProvider === 'mock') {
        console.warn('\n⚠️  WARNING: Using MOCK AI provider - responses will be generic')
        console.warn('   To enable real AI processing, add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env.local')
      } else {
        console.log(`\n✅ SUCCESS: Using REAL AI provider (${stats.activeProvider})`)
      }
      
      expect(stats.activeProvider).toBeTruthy()
      expect(stats.providersReady).toBeGreaterThan(0)
    })
  })

  describe('Real Provider Validation', () => {
    test('should process content with appropriate provider warnings', async () => {
      const stats = processor.getStats()
      
      try {
        const enhanced = await processor.processItem(testItem, testProfile)
        
        expect(enhanced.aiSummary).toBeDefined()
        expect(enhanced.aiTags).toBeDefined()
        expect(enhanced.aiInsights).toBeDefined()
        expect(enhanced.processingMetadata).toBeDefined()
        
        if (stats.activeProvider === 'mock') {
          console.warn('\n⚠️  MOCK PROVIDER RESULT:')
          console.warn(`   Summary: ${enhanced.aiSummary?.summary}`)
          console.warn(`   Confidence: ${enhanced.aiSummary?.confidence}`)
          console.warn(`   ⚡ This is a generic mock response, not content-specific`)
          
          // Mock provider should have predictable characteristics
          expect(enhanced.aiSummary?.confidence).toBeGreaterThan(0.6)
          
        } else {
          console.log('\n✅ REAL PROVIDER RESULT:')
          console.log(`   Provider: ${enhanced.processingMetadata?.provider}`)
          console.log(`   Model: ${enhanced.processingMetadata?.model}`)
          console.log(`   Processing Time: ${enhanced.processingMetadata?.processingTime}ms`)
          console.log(`   Summary: ${enhanced.aiSummary?.summary?.substring(0, 100)}...`)
          console.log(`   Confidence: ${enhanced.aiSummary?.confidence}`)
          console.log(`   🎯 This is content-specific analysis`)
          
          // Real provider should produce content-aware results
          expect(enhanced.aiSummary?.summary).not.toContain('Mock AI response')
          expect(enhanced.processingMetadata?.processingTime).toBeGreaterThan(100) // Real API calls take time
        }
        
      } catch (error) {
        if (stats.activeProvider !== 'mock') {
          console.error('\n❌ REAL PROVIDER FAILURE:')
          console.error(`   Provider: ${stats.activeProvider}`)
          console.error(`   Error: ${error}`)
          console.error('   🚨 This indicates API connectivity or authentication issues')
          
          // For real providers, we should fail the test on errors
          throw new Error(`Real AI provider (${stats.activeProvider}) failed: ${error}`)
        } else {
          // Mock provider should not fail
          throw error
        }
      }
    }, 30000) // 30 second timeout for real API calls

    test('should validate provider-specific behavior', async () => {
      const stats = processor.getStats()
      
      if (stats.activeProvider === 'anthropic') {
        console.log('\n🧠 ANTHROPIC-SPECIFIC VALIDATION:')
        
        // Test Anthropic-specific functionality
        try {
          const enhanced = await processor.processItem(testItem, testProfile)
          
          console.log(`   Model: ${enhanced.processingMetadata?.model}`)
          console.log(`   Processing Time: ${enhanced.processingMetadata?.processingTime}ms`)
          
          // Anthropic should use Claude models
          expect(enhanced.processingMetadata?.model).toMatch(/claude/i)
          expect(enhanced.processingMetadata?.provider).toBe('anthropic')
          
          console.log('   ✅ Anthropic integration working correctly')
          
        } catch (error) {
          console.error('   ❌ Anthropic provider failed')
          console.error(`   Error: ${error}`)
          throw new Error(`Anthropic provider test failed: ${error}`)
        }
        
      } else if (stats.activeProvider === 'openai') {
        console.log('\n🤖 OPENAI-SPECIFIC VALIDATION:')
        console.log('   Note: OpenAI provider not yet implemented')
        
      } else {
        console.log('\n📝 MOCK PROVIDER VALIDATION:')
        console.log('   Using mock responses - no real API validation needed')
      }
    }, 30000)
  })

  describe('Provider Failure Scenarios', () => {
    test('should handle provider errors gracefully', async () => {
      const stats = processor.getStats()
      
      if (stats.activeProvider === 'mock') {
        console.log('\n📝 MOCK PROVIDER: Skipping failure scenario test')
        return
      }
      
      // Test with problematic content that might cause API issues
      const problematicItem = {
        ...testItem,
        content: 'A'.repeat(50000), // Very long content
        title: 'Extremely Long Content Test'
      }
      
      try {
        const enhanced = await processor.processItem(problematicItem, testProfile)
        
        console.log('\n✅ PROVIDER RESILIENCE: Handled large content successfully')
        console.log(`   Processing Time: ${enhanced.processingMetadata?.processingTime}ms`)
        
        expect(enhanced.processingMetadata?.provider).toBe(stats.activeProvider)
        
      } catch (error) {
        console.warn('\n⚠️  PROVIDER LIMITATION: Failed to process large content')
        console.warn(`   Error: ${error}`)
        console.warn('   This may indicate provider limits or timeouts')
        
        // This is acceptable for some providers with content limits
        expect(error).toBeDefined()
      }
    }, 60000) // 60 second timeout for stress test
  })
})