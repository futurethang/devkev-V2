'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import type { FocusProfile, SourceConfig } from '../../../../aggregator/lib/types/feed'
import { AIProcessButton } from './AIProcessButton'
import styles from './AggregatorControls.module.css'

interface AggregatorControlsProps {
  profiles: FocusProfile[]
  sources: SourceConfig[]
  currentProfile?: FocusProfile | null
  currentSource?: SourceConfig | null
}

export function AggregatorControls({ 
  profiles, 
  sources, 
  currentProfile,
  currentSource 
}: AggregatorControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  const handleProfileChange = (profileId: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (profileId === 'all') {
      params.delete('profile')
    } else {
      params.set('profile', profileId)
    }
    
    // Clear source filter when profile changes
    params.delete('source')
    
    router.push(`/aggregator?${params.toString()}`)
  }

  const handleSourceChange = (sourceId: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (sourceId === 'all') {
      params.delete('source')
    } else {
      params.set('source', sourceId)
    }
    
    router.push(`/aggregator?${params.toString()}`)
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    
    try {
      // Trigger background sync
      const response = await fetch('/api/aggregator/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: currentProfile ? 'profile_sync' : 'full_sync',
          profileId: currentProfile?.id,
          includeAI: true,
          force: true
        })
      })
      
      if (response.ok) {
        // Refresh the page to show new data
        router.refresh()
      } else {
        console.error('Failed to trigger sync')
      }
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.controls}>
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="profile-select" className={styles.filterLabel}>
            Focus Profile:
          </label>
          <select
            id="profile-select"
            value={currentProfile?.id || 'all'}
            onChange={(e) => handleProfileChange(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Profiles</option>
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="source-select" className={styles.filterLabel}>
            Source:
          </label>
          <select
            id="source-select"
            value={currentSource?.id || 'all'}
            onChange={(e) => handleSourceChange(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Sources</option>
            {sources.map(source => (
              <option key={source.id} value={source.id}>
                {source.name} ({source.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.actionSection}>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={styles.refreshButton}
          title="Trigger fresh sync"
        >
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Syncing...
            </>
          ) : (
            <>
              🔄 Refresh
            </>
          )}
        </button>
        
        <AIProcessButton profileId={currentProfile?.id} />
        
        <div className={styles.infoText}>
          {currentProfile && (
            <span className={styles.profileInfo}>
              Showing: {currentProfile.name}
              {currentProfile.description && (
                <span className={styles.profileDescription}>
                  • {currentProfile.description}
                </span>
              )}
            </span>
          )}
          {currentSource && (
            <span className={styles.sourceInfo}>
              Source: {currentSource.name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}