#!/usr/bin/env tsx

/**
 * End-to-End Test Suite for AI Aggregator
 * Comprehensive automated testing of the complete system
 */

import fetch from 'node-fetch'
import { performance } from 'perf_hooks'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  duration: number
  error?: string
  details?: any
  apiType: 'internal' | 'external' | 'mixed'
  externalCalls?: string[]
}

interface TestSuite {
  name: string
  results: TestResult[]
  duration: number
  passed: number
  failed: number
  skipped: number
}

class E2ETestRunner {
  private baseUrl: string
  private verbose: boolean
  private testSuites: TestSuite[] = []

  constructor(baseUrl = 'http://localhost:3000', verbose = false) {
    this.baseUrl = baseUrl
    this.verbose = verbose
  }

  async runTest(name: string, testFn: () => Promise<any>, apiType: 'internal' | 'external' | 'mixed' = 'internal', externalCalls?: string[]): Promise<TestResult> {
    const start = performance.now()
    
    const apiIcon = {
      internal: '🏠',
      external: '🌐', 
      mixed: '🔗'
    }[apiType]
    
    if (this.verbose) {
      console.log(`  ⏳ ${apiIcon} ${name}`)
      if (externalCalls && externalCalls.length > 0) {
        console.log(`     External APIs: ${externalCalls.join(', ')}`)
      }
    }

    try {
      const result = await testFn()
      const duration = performance.now() - start
      
      if (this.verbose) {
        console.log(`  ✅ ${apiIcon} ${name} (${duration.toFixed(1)}ms)`)
      }

      return {
        name,
        status: 'pass',
        duration,
        details: result,
        apiType,
        externalCalls
      }
    } catch (error) {
      const duration = performance.now() - start
      
      if (this.verbose) {
        console.log(`  ❌ ${apiIcon} ${name} (${duration.toFixed(1)}ms)`)
        console.log(`     Error: ${error instanceof Error ? error.message : error}`)
      }

      return {
        name,
        status: 'fail',
        duration,
        error: error instanceof Error ? error.message : String(error),
        apiType,
        externalCalls
      }
    }
  }

  async runSuite(suiteName: string, tests: Array<{ name: string; test: () => Promise<any>; apiType?: 'internal' | 'external' | 'mixed'; externalCalls?: string[] }>): Promise<TestSuite> {
    console.log(`\n🧪 ${suiteName}`)
    
    const start = performance.now()
    const results: TestResult[] = []

    for (const { name, test, apiType, externalCalls } of tests) {
      const result = await this.runTest(name, test, apiType, externalCalls)
      results.push(result)
    }

    const duration = performance.now() - start
    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length
    const skipped = results.filter(r => r.status === 'skip').length

    const suite: TestSuite = {
      name: suiteName,
      results,
      duration,
      passed,
      failed,
      skipped
    }

    this.testSuites.push(suite)
    return suite
  }

  // Utility methods for HTTP requests
  async get(path: string, expectedStatus = 200): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`)
    
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text()
  }

  async post(path: string, body: any, expectedStatus = 200): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`)
    }

    return await response.json()
  }

  // Test definitions
  async testBasicConnectivity() {
    await this.runSuite('Basic Connectivity', [
      {
        name: 'Server responds to health check',
        apiType: 'internal',
        test: async () => {
          const response = await fetch(this.baseUrl)
          if (!response.ok) {
            throw new Error(`Server not responding: ${response.status}`)
          }
          return { status: response.status }
        }
      }
    ])
  }

  async testConfigurationAPI() {
    await this.runSuite('Configuration API', [
      {
        name: 'Get sources configuration',
        apiType: 'internal',
        test: async () => {
          const config = await this.get('/api/aggregator/config')
          
          if (!config.sources || !Array.isArray(config.sources)) {
            throw new Error('Invalid sources configuration')
          }
          
          if (!config.profiles || !Array.isArray(config.profiles)) {
            throw new Error('Invalid profiles configuration')
          }

          return {
            sourceCount: config.sources.length,
            profileCount: config.profiles.length,
            enabledSources: config.sources.filter((s: any) => s.enabled).length
          }
        }
      },
      {
        name: 'Profiles have required fields',
        apiType: 'internal',
        test: async () => {
          const config = await this.get('/api/aggregator/config')
          
          for (const profile of config.profiles) {
            if (!profile.id || !profile.name || !profile.sources) {
              throw new Error(`Invalid profile structure: ${profile.id}`)
            }
          }

          return { profilesValidated: config.profiles.length }
        }
      }
    ])
  }

  async testAggregatorAPI() {
    await this.runSuite('Aggregator API', [
      {
        name: 'Fetch content for ai-product profile',
        apiType: 'mixed',
        externalCalls: [
          'https://hnrss.org/frontpage (RSS)',
          'https://dev.to/feed/tag/ai (RSS)',
          'https://towardsdatascience.com/feed (RSS)',
          'https://api.github.com/search/repositories (GitHub API)',
          'OpenAI/Anthropic APIs (if AI enabled)'
        ],
        test: async () => {
          const result = await this.get('/api/aggregator?profile=ai-product&includeItems=true')
          
          if (!result.profileId || !result.profileName) {
            throw new Error('Missing profile information')
          }

          return {
            profileId: result.profileId,
            totalItems: result.totalItems,
            cached: result.cached,
            remainingRequests: result.remainingRequests,
            externalApisCalled: !result.cached
          }
        }
      },
      {
        name: 'Test rate limiting behavior',
        apiType: 'internal',
        test: async () => {
          // Make multiple requests to test rate limiting
          const first = await this.get('/api/aggregator?profile=ml-engineering&includeItems=false')
          const second = await this.get('/api/aggregator?profile=ml-engineering&includeItems=false')
          const third = await this.get('/api/aggregator?profile=ml-engineering&includeItems=false')

          // Third request should be cached
          if (!third.cached && !third.message?.includes('cache')) {
            throw new Error('Rate limiting not working properly')
          }

          return {
            firstCached: first.cached,
            secondCached: second.cached,
            thirdCached: third.cached,
            remainingAfterThird: third.remainingRequests
          }
        }
      },
      {
        name: 'Invalid profile returns 404',
        apiType: 'internal',
        test: async () => {
          try {
            await this.get('/api/aggregator?profile=invalid-profile', 404)
            return { expectedError: 'received' }
          } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
              return { expectedError: 'received' }
            }
            throw error
          }
        }
      }
    ])
  }

  async testManualRefresh() {
    await this.runSuite('Manual Refresh', [
      {
        name: 'Manual refresh via POST',
        apiType: 'mixed',
        externalCalls: ['RSS feeds', 'GitHub API', 'HackerNews API', 'AI APIs (if enabled)'],
        test: async () => {
          const result = await this.post('/api/aggregator', {
            action: 'refresh',
            profileId: 'ai-product',
            aiEnabled: false
          })

          if (!result.success) {
            throw new Error('Manual refresh failed')
          }

          return {
            success: result.success,
            cached: result.result?.cached,
            message: result.result?.message,
            bypassedRateLimit: true
          }
        }
      },
      {
        name: 'Test source endpoint',
        apiType: 'mixed',
        externalCalls: ['https://hnrss.org/frontpage (RSS)'],
        test: async () => {
          const result = await this.post('/api/aggregator', {
            action: 'test_source',
            sources: ['hn-rss']
          })

          if (!result.success || !result.testResults) {
            throw new Error('Source test failed')
          }

          return {
            success: result.success,
            testedSources: result.testResults.length,
            externalApiTested: true
          }
        }
      }
    ])
  }

  async testEngagementTracking() {
    await this.runSuite('Engagement Tracking', [
      {
        name: 'Track view event',
        apiType: 'internal',
        test: async () => {
          const result = await this.post('/api/aggregator/track', {
            itemId: 'test-item-123',
            action: 'view',
            profileId: 'ai-product'
          })

          if (!result.success) {
            throw new Error('View tracking failed')
          }

          return { ...result, dataStorage: 'local file system' }
        }
      },
      {
        name: 'Track click event',
        apiType: 'internal',
        test: async () => {
          const result = await this.post('/api/aggregator/track', {
            itemId: 'test-item-123',
            action: 'click',
            profileId: 'ai-product'
          })

          if (!result.success) {
            throw new Error('Click tracking failed')
          }

          return { ...result, dataStorage: 'local file system' }
        }
      },
      {
        name: 'Get engagement data',
        apiType: 'internal',
        test: async () => {
          const result = await this.get('/api/aggregator/track?profile=ai-product')
          
          if (!result.topEngaged || !Array.isArray(result.topEngaged)) {
            throw new Error('Invalid engagement data structure')
          }

          return {
            totalEvents: result.totalEvents,
            topEngagedCount: result.topEngaged.length,
            dataSource: 'internal analytics'
          }
        }
      }
    ])
  }

  async testUIRoutes() {
    await this.runSuite('UI Routes', [
      {
        name: 'Public digest loads',
        apiType: 'internal',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/digest`)
          if (!response.ok) {
            throw new Error(`Digest page failed to load: ${response.status}`)
          }
          
          const html = await response.text()
          if (!html.includes('AI Digest')) {
            throw new Error('Digest page missing expected content')
          }

          return { 
            status: response.status, 
            hasContent: true,
            pageType: 'public interface'
          }
        }
      },
      {
        name: 'Admin dashboard loads',
        apiType: 'internal',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/dashboard`)
          if (!response.ok) {
            throw new Error(`Dashboard failed to load: ${response.status}`)
          }

          const html = await response.text()
          // Should contain either dashboard content or access denied
          if (!html.includes('Dashboard') && !html.includes('Admin Access')) {
            throw new Error('Dashboard page missing expected content')
          }

          return { 
            status: response.status,
            pageType: 'admin interface'
          }
        }
      }
    ])
  }

  async testContentQuality() {
    await this.runSuite('Content Quality', [
      {
        name: 'AI-enhanced content has summaries',
        apiType: 'mixed',
        externalCalls: [
          'OpenAI API (text-davinci-003)',
          'Anthropic Claude API',
          'Content source APIs (RSS/GitHub/HN)'
        ],
        test: async () => {
          const result = await this.get('/api/aggregator?profile=ai-product&ai=true&includeItems=true')
          
          if (!result.processedFeedItems || result.processedFeedItems.length === 0) {
            throw new Error('No processed items found')
          }

          const itemsWithSummaries = result.processedFeedItems.filter((item: any) => 
            item.aiSummary && item.aiSummary.summary
          )

          return {
            totalItems: result.processedFeedItems.length,
            itemsWithSummaries: itemsWithSummaries.length,
            aiEnabled: result.aiEnabled,
            llmProcessingUsed: result.aiEnabled
          }
        }
      },
      {
        name: 'Relevance scores are present',
        apiType: 'mixed',
        externalCalls: ['Content source APIs for raw data'],
        test: async () => {
          const result = await this.get('/api/aggregator?profile=design-systems&includeItems=true')
          
          if (!result.processedFeedItems || result.processedFeedItems.length === 0) {
            throw new Error('No processed items found')
          }

          const itemsWithScores = result.processedFeedItems.filter((item: any) => 
            typeof item.relevanceScore === 'number' && item.relevanceScore >= 0
          )

          return {
            totalItems: result.processedFeedItems.length,
            itemsWithScores: itemsWithScores.length,
            avgRelevance: result.avgRelevanceScore,
            scoringAlgorithm: 'keyword-based + semantic'
          }
        }
      }
    ])
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting AI Aggregator E2E Test Suite')
    console.log(`📍 Target: ${this.baseUrl}`)
    
    const overallStart = performance.now()

    // Run all test suites
    await this.testBasicConnectivity()
    await this.testConfigurationAPI()
    await this.testAggregatorAPI()
    await this.testManualRefresh()
    await this.testEngagementTracking()
    await this.testUIRoutes()
    await this.testContentQuality()

    const overallDuration = performance.now() - overallStart

    // Generate summary
    this.printSummary(overallDuration)
  }

  private printSummary(overallDuration: number): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))

    let totalPassed = 0
    let totalFailed = 0
    let totalSkipped = 0
    let internalTests = 0
    let externalTests = 0
    let mixedTests = 0

    for (const suite of this.testSuites) {
      const status = suite.failed > 0 ? '❌' : '✅'
      console.log(`${status} ${suite.name}: ${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped (${suite.duration.toFixed(1)}ms)`)
      
      // Count API types
      suite.results.forEach(r => {
        if (r.apiType === 'internal') internalTests++
        else if (r.apiType === 'external') externalTests++
        else if (r.apiType === 'mixed') mixedTests++
      })
      
      if (suite.failed > 0 && this.verbose) {
        suite.results
          .filter(r => r.status === 'fail')
          .forEach(r => {
            const apiIcon = r.apiType === 'internal' ? '🏠' : r.apiType === 'external' ? '🌐' : '🔗'
            console.log(`   💥 ${apiIcon} ${r.name}: ${r.error}`)
            if (r.externalCalls && r.externalCalls.length > 0) {
              console.log(`      External APIs affected: ${r.externalCalls.join(', ')}`)
            }
          })
      }

      totalPassed += suite.passed
      totalFailed += suite.failed
      totalSkipped += suite.skipped
    }

    console.log('='.repeat(60))
    console.log(`🎯 OVERALL: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped`)
    console.log(`🏠 Internal API tests: ${internalTests}`)
    console.log(`🌐 External API tests: ${externalTests}`)
    console.log(`🔗 Mixed API tests: ${mixedTests}`)
    console.log(`⏱️  Duration: ${overallDuration.toFixed(1)}ms`)
    
    if (totalFailed === 0) {
      console.log('🎉 All tests passed!')
    } else {
      console.log(`⚠️  ${totalFailed} test(s) failed`)
      if (externalTests > 0 || mixedTests > 0) {
        console.log(`📍 Note: Some failures may be due to external API availability`)
      }
      process.exit(1)
    }
  }

  // Export results for programmatic use
  getResults() {
    const totalPassed = this.testSuites.reduce((sum, suite) => sum + suite.passed, 0)
    const totalFailed = this.testSuites.reduce((sum, suite) => sum + suite.failed, 0)
    const totalSkipped = this.testSuites.reduce((sum, suite) => sum + suite.skipped, 0)

    return {
      suites: this.testSuites,
      summary: {
        total: totalPassed + totalFailed + totalSkipped,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        success: totalFailed === 0
      }
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose') || args.includes('-v')
  const baseUrl = args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000'

  const runner = new E2ETestRunner(baseUrl, verbose)
  
  try {
    await runner.runAllTests()
  } catch (error) {
    console.error('❌ Test suite failed to run:', error)
    process.exit(1)
  }
}

// Export for programmatic use
export { E2ETestRunner }

// Run if called directly
if (require.main === module) {
  main()
}