#!/usr/bin/env node

/**
 * Manual script to process articles with AI in small batches
 * Run this locally to avoid Vercel timeout issues
 * 
 * Usage: node scripts/process-ai-batch.js [profileId]
 */

const BATCH_SIZE = 5 // Small batches to avoid timeouts
const API_URL = process.env.VERCEL_URL || 'https://devkev-v2.vercel.app'
const CRON_SECRET = process.env.CRON_SECRET || ''

async function processBatch(profileId) {
  try {
    const response = await fetch(`${API_URL}/api/aggregator/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`
      },
      body: JSON.stringify({
        operation: 'ai_batch_process',
        profileId: profileId || null,
        batchSize: BATCH_SIZE
      })
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to process batch:', error)
    throw error
  }
}

async function main() {
  const profileId = process.argv[2]
  
  console.log('🤖 AI Batch Processor')
  console.log('====================')
  console.log(`Profile: ${profileId || 'all'}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log(`API: ${API_URL}`)
  console.log('')

  let totalProcessed = 0
  let iteration = 0

  while (true) {
    iteration++
    console.log(`\n📦 Processing batch ${iteration}...`)
    
    try {
      const result = await processBatch(profileId)
      
      if (result.result.processedCount === 0) {
        console.log('✅ All articles processed!')
        break
      }

      totalProcessed += result.result.processedCount
      
      console.log(`✓ Processed: ${result.result.processedCount}`)
      console.log(`✓ Failed: ${result.result.failedCount}`)
      console.log(`✓ Remaining: ${result.result.remainingUnprocessed}`)
      console.log(`✓ Duration: ${result.duration}ms`)

      // Wait a bit between batches to avoid rate limits
      if (result.result.remainingUnprocessed > 0) {
        console.log('\n⏳ Waiting 2 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error) {
      console.error('\n❌ Batch failed:', error.message)
      console.log('Stopping processing.')
      break
    }
  }

  console.log(`\n🎉 Processing complete! Total articles processed: ${totalProcessed}`)
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}