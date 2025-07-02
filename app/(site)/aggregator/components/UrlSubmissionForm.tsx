'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FocusProfile } from '../../../../aggregator/lib/types/feed'
import styles from './UrlSubmissionForm.module.css'

interface UrlSubmissionFormProps {
  profiles: FocusProfile[]
  currentProfile?: FocusProfile | null
  onSubmissionComplete?: () => void
}

export function UrlSubmissionForm({ 
  profiles, 
  currentProfile,
  onSubmissionComplete 
}: UrlSubmissionFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [selectedProfile, setSelectedProfile] = useState(currentProfile?.id || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setMessage({ type: 'error', text: 'Please enter a URL' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/aggregator/submit-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          profileId: selectedProfile || undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        if (result.alreadyExists) {
          setMessage({ 
            type: 'error', 
            text: 'This article is already in your collection' 
          })
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Article added successfully!' 
          })
          setUrl('')
          
          // Refresh the page to show the new article
          setTimeout(() => {
            router.refresh()
            setIsOpen(false)
            setMessage(null)
            onSubmissionComplete?.()
          }, 1500)
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Failed to add article' 
        })
      }
    } catch (error) {
      console.error('Submission error:', error)
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setUrl('')
    setMessage(null)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={styles.openButton}
        title="Add article from URL"
      >
        📄 Add URL
      </button>
    )
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Add Article from URL</h3>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="article-url" className={styles.label}>
              Article URL:
            </label>
            <input
              id="article-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className={styles.urlInput}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="profile-select" className={styles.label}>
              Add to Profile:
            </label>
            <select
              id="profile-select"
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className={styles.select}
              disabled={isSubmitting}
            >
              <option value="">No specific profile</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !url.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Adding...
                </>
              ) : (
                'Add Article'
              )}
            </button>
          </div>
        </form>

        <div className={styles.info}>
          <p className={styles.infoText}>
            The article will be automatically processed and summarized using AI.
          </p>
        </div>
      </div>
    </div>
  )
}