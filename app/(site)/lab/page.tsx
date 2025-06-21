'use client'

import { useState, useMemo, useCallback } from 'react'
import Fuse from 'fuse.js'
import { allExperiments } from 'content-collections'
import { ExperimentCard } from '@/app/_components/ExperimentCard'
import { SearchAndFilter } from '@/app/_components/SearchAndFilter'
import { filterMockContent } from '@/lib/content-utils'
import styles from './page.module.css'

export default function LabPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Filter out mock content in production
  const experiments = useMemo(() => filterMockContent(allExperiments), [])
  
  // Get all unique tags from experiments
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    experiments.forEach(experiment => {
      experiment.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [experiments])

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(experiments, {
      keys: ['title', 'description', 'tags', 'buildPrompt'],
      threshold: 0.3,
      includeScore: true,
    })
  }, [experiments])

  // Filter experiments based on search and tags
  const filteredExperiments = useMemo(() => {
    let result = experiments

    // Apply fuzzy search
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery.trim())
      result = searchResults.map(({ item }) => item)
    }

    // Apply tag filters
    if (selectedTags.length > 0) {
      result = result.filter(experiment => 
        selectedTags.every(tag => experiment.tags.includes(tag))
      )
    }

    return result
  }, [searchQuery, selectedTags, fuse])

  // Sort experiments by date (newest first)
  const sortedExperiments = useMemo(() => {
    return [...filteredExperiments].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [filteredExperiments])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleTagsChange = useCallback((tags: string[]) => {
    setSelectedTags(tags)
  }, [])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Lab</h1>
        <p className={styles.subtitle}>
          Rapid prototypes and experiments built to explore AI-powered development techniques. 
          Each experiment represents a small idea brought to life in hours, not days.
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{allExperiments.length}</span>
            <span className={styles.statLabel}>Total Experiments</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>~2hrs</span>
            <span className={styles.statLabel}>Avg Build Time</span>
          </div>
        </div>
      </header>

      <SearchAndFilter
        items={allExperiments}
        searchKeys={['title', 'description', 'tags', 'buildPrompt']}
        allTags={allTags}
        placeholder="Search experiments..."
        onSearch={handleSearch}
        onTagsChange={handleTagsChange}
      />

      <div className={styles.resultsInfo}>
        <span className={styles.resultCount}>
          {sortedExperiments.length} {sortedExperiments.length === 1 ? 'experiment' : 'experiments'}
          {(searchQuery || selectedTags.length > 0) && ` found`}
        </span>
      </div>

      {sortedExperiments.length > 0 ? (
        <section className={styles.experiments} aria-label="Lab experiments">
          <div className={styles.experimentGrid}>
            {sortedExperiments.map((experiment) => (
              <ExperimentCard key={experiment.slug} experiment={experiment} />
            ))}
          </div>
        </section>
      ) : (
        <div className={styles.empty}>
          <p>No experiments match your search criteria. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  )
}