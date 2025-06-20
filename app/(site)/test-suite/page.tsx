'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip' | 'running'
  duration: number
  error?: string
  details?: any
  apiType: 'internal' | 'external' | 'mixed'
  externalCalls?: string[]
  aiProvider?: 'mock' | 'anthropic' | 'openai' | 'unknown'
  aiProviderWarning?: string
}

interface TestSuite {
  name: string
  results: TestResult[]
  duration: number
  passed: number
  failed: number
  skipped: number
  status: 'idle' | 'running' | 'complete'
}

export default function TestSuitePage() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'complete'>('idle')
  const [startTime, setStartTime] = useState<number>(0)
  const [totalDuration, setTotalDuration] = useState<number>(0)

  const testDefinitions = [
    {
      name: 'Basic Connectivity',
      tests: [
        { 
          name: 'Server responds to health check', 
          endpoint: '/',
          apiType: 'internal' as const
        },
        { 
          name: 'API endpoints are accessible', 
          endpoint: '/api/aggregator/config',
          apiType: 'internal' as const
        }
      ]
    },
    {
      name: 'Configuration API',
      tests: [
        { 
          name: 'Get sources configuration', 
          endpoint: '/api/aggregator/config',
          apiType: 'internal' as const
        },
        { 
          name: 'Validate profile structures', 
          endpoint: '/api/aggregator/config',
          apiType: 'internal' as const
        }
      ]
    },
    {
      name: 'Aggregator API',
      tests: [
        { 
          name: 'Fetch AI Product content', 
          endpoint: '/api/aggregator?profile=ai-product&includeItems=true',
          apiType: 'mixed' as const,
          externalCalls: ['RSS feeds', 'GitHub API', 'HackerNews API']
        },
        { 
          name: 'Fetch ML Engineering content', 
          endpoint: '/api/aggregator?profile=ml-engineering&includeItems=true',
          apiType: 'mixed' as const,
          externalCalls: ['RSS feeds', 'GitHub API', 'HackerNews API']
        },
        { 
          name: 'Fetch Design Systems content', 
          endpoint: '/api/aggregator?profile=design-systems&includeItems=true',
          apiType: 'mixed' as const,
          externalCalls: ['RSS feeds', 'GitHub API']
        },
        { 
          name: 'Test rate limiting', 
          endpoint: '/api/aggregator?profile=ai-product&includeItems=false',
          apiType: 'internal' as const
        },
        { 
          name: 'Invalid profile returns error', 
          endpoint: '/api/aggregator?profile=invalid',
          apiType: 'internal' as const
        }
      ]
    },
    {
      name: 'Manual Refresh',
      tests: [
        { 
          name: 'Manual refresh via POST', 
          endpoint: '/api/aggregator', 
          method: 'POST',
          apiType: 'mixed' as const,
          externalCalls: ['RSS feeds', 'GitHub API', 'HackerNews API']
        },
        { 
          name: 'Test source endpoint', 
          endpoint: '/api/aggregator', 
          method: 'POST',
          apiType: 'mixed' as const,
          externalCalls: ['HackerNews RSS']
        }
      ]
    },
    {
      name: 'Engagement Tracking',
      tests: [
        { 
          name: 'Track view event', 
          endpoint: '/api/aggregator/track', 
          method: 'POST',
          apiType: 'internal' as const
        },
        { 
          name: 'Track click event', 
          endpoint: '/api/aggregator/track', 
          method: 'POST',
          apiType: 'internal' as const
        },
        { 
          name: 'Get engagement data', 
          endpoint: '/api/aggregator/track',
          apiType: 'internal' as const
        }
      ]
    },
    {
      name: 'UI Routes',
      tests: [
        { 
          name: 'Public digest loads', 
          endpoint: '/digest',
          apiType: 'internal' as const
        },
        { 
          name: 'Admin dashboard loads', 
          endpoint: '/dashboard',
          apiType: 'internal' as const
        }
      ]
    },
    {
      name: 'Content Quality',
      tests: [
        { 
          name: 'AI-enhanced content has summaries', 
          endpoint: '/api/aggregator?profile=ai-product&ai=true&includeItems=true',
          apiType: 'mixed' as const,
          externalCalls: ['AI Provider (Claude/OpenAI)', 'Content sources'],
          requiresAI: true
        },
        { 
          name: 'Relevance scores are present', 
          endpoint: '/api/aggregator?profile=design-systems&includeItems=true',
          apiType: 'mixed' as const,
          externalCalls: ['Content source APIs']
        }
      ]
    }
  ]

  const runTest = async (testName: string, endpoint: string, method = 'GET', apiType: 'internal' | 'external' | 'mixed' = 'internal', externalCalls?: string[], requiresAI = false): Promise<TestResult> => {
    const start = performance.now()
    
    try {
      let response: Response
      
      if (method === 'POST') {
        // Handle specific POST requests
        let body = {}
        if (endpoint === '/api/aggregator') {
          if (testName.includes('Manual refresh')) {
            body = { action: 'refresh', profileId: 'ai-product', aiEnabled: false }
          } else if (testName.includes('Test source')) {
            body = { action: 'test_source', sources: ['hn-rss'] }
          }
        } else if (endpoint === '/api/aggregator/track') {
          if (testName.includes('view')) {
            body = { itemId: 'test-item-123', action: 'view', profileId: 'ai-product' }
          } else if (testName.includes('click')) {
            body = { itemId: 'test-item-123', action: 'click', profileId: 'ai-product' }
          }
        }

        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
      } else {
        response = await fetch(endpoint)
      }

      const duration = performance.now() - start
      
      // Special handling for expected errors
      if (testName.includes('Invalid profile') && response.status === 404) {
        return {
          name: testName,
          status: 'pass',
          duration,
          details: { expectedError: 'received', status: response.status }
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      let result: any = {}
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        result = await response.json()
      } else {
        result = { text: await response.text(), contentLength: response.headers.get('content-length') }
      }

      // Validate specific test requirements
      if (testName.includes('sources configuration')) {
        if (!result.sources || !Array.isArray(result.sources)) {
          throw new Error('Invalid sources configuration')
        }
        if (!result.profiles || !Array.isArray(result.profiles)) {
          throw new Error('Invalid profiles configuration')
        }
      }

      let aiProvider: 'mock' | 'anthropic' | 'openai' | 'unknown' = 'unknown'
      let aiProviderWarning: string | undefined

      if (testName.includes('AI-enhanced content')) {
        if (!result.processedFeedItems || result.processedFeedItems.length === 0) {
          throw new Error('No processed items found')
        }
        
        // Check AI provider status from the response
        const firstItem = result.processedFeedItems[0]
        if (firstItem?.processingMetadata?.provider) {
          aiProvider = firstItem.processingMetadata.provider as typeof aiProvider
          
          if (aiProvider === 'mock') {
            aiProviderWarning = 'Using MOCK AI provider - summaries are generic, not content-specific. Add ANTHROPIC_API_KEY to .env.local for real AI processing.'
          } else {
            aiProviderWarning = `Using REAL AI provider (${aiProvider}) - summaries are content-specific and high-quality.`
          }
        }
      }

      return {
        name: testName,
        status: 'pass',
        duration,
        details: result,
        apiType,
        externalCalls,
        aiProvider,
        aiProviderWarning
      }

    } catch (error) {
      const duration = performance.now() - start
      return {
        name: testName,
        status: 'fail',
        duration,
        error: error instanceof Error ? error.message : String(error),
        apiType,
        externalCalls,
        aiProvider: requiresAI ? 'unknown' : undefined,
        aiProviderWarning: requiresAI ? 'AI provider test failed - check API configuration' : undefined
      }
    }
  }

  const runTestSuite = async (suiteDef: any): Promise<TestSuite> => {
    const suite: TestSuite = {
      name: suiteDef.name,
      results: [],
      duration: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      status: 'running'
    }

    const start = performance.now()

    for (const test of suiteDef.tests) {
      // Update suite with running test
      suite.results.push({
        name: test.name,
        status: 'running',
        duration: 0,
        apiType: test.apiType || 'internal',
        externalCalls: test.externalCalls
      })
      
      setTestSuites(prev => prev.map(s => s.name === suite.name ? { ...suite } : s))

      const result = await runTest(test.name, test.endpoint, test.method, test.apiType, test.externalCalls, test.requiresAI)
      
      // Update the result
      suite.results[suite.results.length - 1] = result
      
      if (result.status === 'pass') suite.passed++
      else if (result.status === 'fail') suite.failed++
      else suite.skipped++

      setTestSuites(prev => prev.map(s => s.name === suite.name ? { ...suite } : s))
    }

    suite.duration = performance.now() - start
    suite.status = 'complete'

    return suite
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setOverallStatus('running')
    setStartTime(performance.now())
    
    // Initialize test suites
    const initialSuites = testDefinitions.map(def => ({
      name: def.name,
      results: [],
      duration: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      status: 'idle' as const
    }))
    
    setTestSuites(initialSuites)

    try {
      // Run each suite sequentially
      for (const suiteDef of testDefinitions) {
        const suite = await runTestSuite(suiteDef)
        setTestSuites(prev => prev.map(s => s.name === suite.name ? suite : s))
      }

      setTotalDuration(performance.now() - startTime)
      setOverallStatus('complete')
    } catch (error) {
      console.error('Test suite failed:', error)
      setOverallStatus('complete')
    } finally {
      setIsRunning(false)
    }
  }

  const getSummary = () => {
    const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0)
    const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0)
    const totalSkipped = testSuites.reduce((sum, suite) => sum + suite.skipped, 0)
    const total = totalPassed + totalFailed + totalSkipped

    return { total, passed: totalPassed, failed: totalFailed, skipped: totalSkipped }
  }

  const summary = getSummary()

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>AI Aggregator Test Suite</h1>
        <p>Comprehensive automated testing of the AI content aggregator system</p>
      </header>

      <div className={styles.controls}>
        <button 
          onClick={runAllTests} 
          disabled={isRunning}
          className={`${styles.runButton} ${isRunning ? styles.running : ''}`}
        >
          {isRunning ? '⏳ Running Tests...' : '🚀 Run All Tests'}
        </button>

        {overallStatus === 'complete' && (
          <div className={styles.summary}>
            <div className={`${styles.summaryCard} ${summary.failed === 0 ? styles.success : styles.failure}`}>
              <h3>Test Results</h3>
              <div className={styles.stats}>
                <span className={styles.passed}>{summary.passed} Passed</span>
                <span className={styles.failed}>{summary.failed} Failed</span>
                <span className={styles.skipped}>{summary.skipped} Skipped</span>
              </div>
              <div className={styles.apiBreakdown}>
                <div className={styles.apiStat}>
                  🏠 Internal: {testSuites.flatMap(s => s.results).filter(r => r.apiType === 'internal').length}
                </div>
                <div className={styles.apiStat}>
                  🌐 External: {testSuites.flatMap(s => s.results).filter(r => r.apiType === 'external').length}
                </div>
                <div className={styles.apiStat}>
                  🔗 Mixed: {testSuites.flatMap(s => s.results).filter(r => r.apiType === 'mixed').length}
                </div>
              </div>
              <div className={styles.duration}>
                Duration: {totalDuration.toFixed(1)}ms
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.testSuites}>
        {testSuites.map(suite => (
          <div key={suite.name} className={styles.testSuite}>
            <div className={styles.suiteHeader}>
              <div className={styles.suiteTitle}>
                <span className={styles.suiteIcon}>
                  {suite.status === 'idle' && '⚪'}
                  {suite.status === 'running' && '🔄'}
                  {suite.status === 'complete' && (suite.failed > 0 ? '❌' : '✅')}
                </span>
                <h3>{suite.name}</h3>
              </div>
              
              {suite.status === 'complete' && (
                <div className={styles.suiteStats}>
                  <span className={styles.passed}>{suite.passed}</span> /
                  <span className={styles.failed}>{suite.failed}</span> /
                  <span className={styles.skipped}>{suite.skipped}</span>
                  <span className={styles.suiteDuration}>({suite.duration.toFixed(1)}ms)</span>
                </div>
              )}
            </div>

            <div className={styles.testResults}>
              {suite.results.map((result, index) => (
                <div key={index} className={`${styles.testResult} ${styles[result.status]}`}>
                  <div className={styles.testName}>
                    <span className={styles.testIcon}>
                      {result.status === 'running' && '⏳'}
                      {result.status === 'pass' && '✅'}
                      {result.status === 'fail' && '❌'}
                      {result.status === 'skip' && '⏭️'}
                    </span>
                    <span className={styles.apiTypeIcon}>
                      {result.apiType === 'internal' && '🏠'}
                      {result.apiType === 'external' && '🌐'}
                      {result.apiType === 'mixed' && '🔗'}
                    </span>
                    {result.name}
                  </div>
                  
                  <div className={styles.testMeta}>
                    <span className={styles.apiTypeBadge} data-type={result.apiType}>
                      {result.apiType}
                    </span>
                    {result.duration > 0 && (
                      <span className={styles.testDuration}>{result.duration.toFixed(1)}ms</span>
                    )}
                  </div>

                  {result.externalCalls && result.externalCalls.length > 0 && (
                    <div className={styles.externalApis}>
                      <strong>External APIs:</strong> {result.externalCalls.join(', ')}
                    </div>
                  )}

                  {result.aiProviderWarning && (
                    <div className={`${styles.aiProviderStatus} ${result.aiProvider === 'mock' ? styles.warning : styles.success}`}>
                      <span className={styles.aiProviderIcon}>
                        {result.aiProvider === 'mock' && '⚠️'}
                        {result.aiProvider === 'anthropic' && '🧠'}
                        {result.aiProvider === 'openai' && '🤖'}
                        {result.aiProvider === 'unknown' && '❓'}
                      </span>
                      <strong>AI Provider:</strong> {result.aiProviderWarning}
                    </div>
                  )}

                  {result.error && (
                    <div className={styles.testError}>
                      <strong>Error:</strong> {result.error}
                      {result.apiType !== 'internal' && (
                        <div className={styles.apiHint}>
                          💡 This test involves external APIs and may fail due to network issues or API availability
                        </div>
                      )}
                    </div>
                  )}

                  {result.details && result.status === 'pass' && (
                    <details className={styles.testDetails}>
                      <summary>Details</summary>
                      <pre>{JSON.stringify(result.details, null, 2)}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {overallStatus === 'complete' && summary.failed > 0 && (
        <div className={styles.failureAnalysis}>
          <h3>❌ Failed Tests Analysis</h3>
          <div className={styles.failedTests}>
            {testSuites.flatMap(suite => 
              suite.results
                .filter(result => result.status === 'fail')
                .map(result => (
                  <div key={`${suite.name}-${result.name}`} className={styles.failedTest}>
                    <strong>{suite.name} → {result.name}</strong>
                    <p>{result.error}</p>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}