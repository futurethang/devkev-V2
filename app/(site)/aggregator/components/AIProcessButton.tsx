'use client'

import { useState } from 'react'
import styles from './AIProcessButton.module.css'

interface AIProcessButtonProps {
  profileId?: string
}

export function AIProcessButton({ profileId }: AIProcessButtonProps) {
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [remainingCount, setRemainingCount] = useState<number | null>(null)

  const processBatch = async () => {
    setProcessing(true)
    setStatus('Processing...')

    try {
      const params = new URLSearchParams({
        batchSize: '5'
      })
      if (profileId) {
        params.append('profile', profileId)
      }

      const response = await fetch(`/api/aggregator/process-batch?${params}`)
      const result = await response.json()

      if (result.success) {
        setStatus(`✅ Processed ${result.processedCount} items`)
        setRemainingCount(result.remainingCount)
        
        // If there are more items, offer to continue
        if (result.remainingCount > 0) {
          setTimeout(() => {
            setStatus(`${result.remainingCount} items remaining`)
          }, 2000)
        } else {
          setStatus('🎉 All items processed!')
        }
      } else {
        setStatus(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setStatus('❌ Failed to process batch')
      console.error('Batch processing error:', error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className={styles.container}>
      <button
        onClick={processBatch}
        disabled={processing}
        className={styles.button}
        title="Process 5 articles with AI to generate summaries and insights (optimized for Vercel limits)"
      >
        {processing ? '⏳ Processing...' : '🤖 Process with AI'}
      </button>
      
      {status && (
        <div className={styles.status}>
          {status}
          {remainingCount !== null && remainingCount > 0 && !processing && (
            <button
              onClick={processBatch}
              className={styles.continueButton}
            >
              Continue Processing
            </button>
          )}
        </div>
      )}
    </div>
  )
}