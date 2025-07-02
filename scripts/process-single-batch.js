#!/usr/bin/env node

/**
 * Manual script to process a single batch of unprocessed articles with AI
 * Usage: node scripts/process-single-batch.js [profileId] [batchSize]
 */

const fetch = require('node-fetch');

async function processSingleBatch(profileId = null, batchSize = 5) {
  const baseUrl = 'http://localhost:3000';
  
  console.log(`🚀 Processing single batch of ${batchSize} articles...`);
  if (profileId) {
    console.log(`📁 Profile: ${profileId}`);
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/aggregator/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'ai_batch_process',
        profileId,
        batchSize,
        includeAI: true
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Batch processing completed successfully');
      console.log(`⏱️  Duration: ${result.duration}ms`);
      console.log(`📊 Stats:`, result.stats || 'No stats available');
      
      if (result.processedCount !== undefined) {
        console.log(`🔄 Processed: ${result.processedCount} articles`);
      }
    } else {
      console.error('❌ Batch processing failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure your development server is running on localhost:3000');
    console.log('   Run: pnpm dev');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const profileId = args[0] || null;
const batchSize = parseInt(args[1]) || 5;

processSingleBatch(profileId, batchSize);