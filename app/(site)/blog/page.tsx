'use client'

import { useState, useMemo, useCallback } from 'react'
import Fuse from 'fuse.js'
import { allPosts } from 'content-collections'
import { PostCard } from '@/app/_components/PostCard'
import { SearchAndFilter } from '@/app/_components/SearchAndFilter'
import { filterMockContent } from '@/lib/content-utils'
import styles from './page.module.css'

export default function BlogPage() {
  const publishedPosts = useMemo(() => {
    const nonMockPosts = filterMockContent(allPosts)
    return nonMockPosts.filter(post => post.published)
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Get all unique tags from posts
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    publishedPosts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [publishedPosts])

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(publishedPosts, {
      keys: ['title', 'description', 'tags'],
      threshold: 0.3,
      includeScore: true,
    })
  }, [publishedPosts])

  // Filter posts based on search and tags
  const filteredPosts = useMemo(() => {
    let result = publishedPosts

    // Apply fuzzy search
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery.trim())
      result = searchResults.map(({ item }) => item)
    }

    // Apply tag filters
    if (selectedTags.length > 0) {
      result = result.filter(post => 
        selectedTags.every(tag => post.tags.includes(tag))
      )
    }

    return result
  }, [publishedPosts, searchQuery, selectedTags, fuse])

  // Sort posts by date (newest first)
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [filteredPosts])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleTagsChange = useCallback((tags: string[]) => {
    setSelectedTags(tags)
  }, [])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Blog</h1>
        <p className={styles.subtitle}>
          Thoughts on AI-augmented development, productivity techniques, and the evolving 
          landscape of software engineering. Learn from real experiences building with AI.
        </p>
      </header>

      <SearchAndFilter
        items={publishedPosts}
        searchKeys={['title', 'description', 'tags']}
        allTags={allTags}
        placeholder="Search blog posts..."
        onSearch={handleSearch}
        onTagsChange={handleTagsChange}
      />

      <div className={styles.resultsInfo}>
        <span className={styles.resultCount}>
          {sortedPosts.length} {sortedPosts.length === 1 ? 'post' : 'posts'}
          {(searchQuery || selectedTags.length > 0) && ` found`}
        </span>
      </div>

      {sortedPosts.length > 0 ? (
        <section className={styles.posts} aria-label="Blog posts">
          {sortedPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </section>
      ) : (
        <div className={styles.empty}>
          <p>No posts match your search criteria. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  )
}