'use client'

import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import styles from './SearchAndFilter.module.css'

interface SearchAndFilterProps<T> {
  items: T[]
  searchKeys: string[]
  allTags: string[]
  placeholder?: string
  onSearch: (query: string) => void
  onTagsChange: (tags: string[]) => void
}

export function SearchAndFilter<T extends { tags: string[] }>({ 
  items, 
  searchKeys, 
  allTags,
  placeholder = "Search...",
  onSearch,
  onTagsChange
}: SearchAndFilterProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isTagsOpen, setIsTagsOpen] = useState(false)

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    onSearch(query)
  }

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag) 
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    
    setSelectedTags(newTags)
    onTagsChange(newTags)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    onSearch('')
    onTagsChange([])
  }

  const hasActiveFilters = searchQuery.trim() || selectedTags.length > 0

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={styles.input}
            aria-label="Search content"
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.tagFilter}>
          <button
            onClick={() => setIsTagsOpen(!isTagsOpen)}
            className={styles.tagButton}
            aria-expanded={isTagsOpen}
            aria-label="Filter by tags"
          >
            🏷️ Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
          </button>

          {isTagsOpen && (
            <div className={styles.tagDropdown}>
              <div className={styles.tagList}>
                {allTags.map((tag) => (
                  <label key={tag} className={styles.tagOption}>
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                      className={styles.tagCheckbox}
                    />
                    <span className={styles.tagLabel}>{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={styles.clearButton}
            aria-label="Clear all filters"
          >
            Clear
          </button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className={styles.selectedTags}>
          {selectedTags.map((tag) => (
            <span key={tag} className={styles.selectedTag}>
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className={styles.removeTag}
                aria-label={`Remove ${tag} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}