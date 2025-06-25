/**
 * Quick script to update existing feed items to mark them as processed
 * This fixes the dashboard showing 0% processed items
 */

const { createClient } = require('@supabase/supabase-js')

async function fixProcessingStatus() {
  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Get count of items that need updating
    const { count: totalCount } = await supabase
      .from('feed_items')
      .select('*', { count: 'exact', head: true })
      .is('processing_status', null)
      .or('processing_status.eq.pending')
    
    console.log(`Found ${totalCount} items that need processing_status update`)
    
    if (totalCount === 0) {
      console.log('No items need updating!')
      return
    }
    
    // Update items in batches to mark them as processed
    const { data, error } = await supabase
      .from('feed_items')
      .update({ 
        processing_status: 'processed'
      })
      .is('processing_status', null)
      .or('processing_status.eq.pending')
      .select('id')
    
    if (error) {
      console.error('Error updating items:', error)
      process.exit(1)
    }
    
    console.log(`✅ Successfully updated ${data?.length || 0} items to 'processed' status`)
    
    // Also update AI processed flag for items that have AI summaries
    const { data: aiData, error: aiError } = await supabase
      .from('feed_items')
      .update({ 
        ai_processed: true
      })
      .not('summary', 'is', null)
      .eq('ai_processed', false)
      .select('id')
    
    if (aiError) {
      console.warn('Warning: Could not update AI processed status:', aiError)
    } else {
      console.log(`✅ Successfully updated ${aiData?.length || 0} items to ai_processed = true`)
    }
    
    console.log('\n🎉 Database update complete! Dashboard metrics should now show correct values.')
    
  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

// Run the script
fixProcessingStatus()