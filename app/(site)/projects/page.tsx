'use client'

import { useState, useMemo, useCallback } from 'react'
import Fuse from 'fuse.js'
import { allProjects } from 'contentlayer/generated'
import { ProjectCard } from '@/app/_components/ProjectCard'
import { SearchAndFilter } from '@/app/_components/SearchAndFilter'
import styles from './page.module.css'

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Get all unique tags from projects
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    allProjects.forEach(project => {
      project.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [])

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(allProjects, {
      keys: ['title', 'description', 'tags'],
      threshold: 0.3,
      includeScore: true,
    })
  }, [])

  // Filter projects based on search and tags
  const filteredProjects = useMemo(() => {
    let result = allProjects

    // Apply fuzzy search
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery.trim())
      result = searchResults.map(({ item }) => item)
    }

    // Apply tag filters
    if (selectedTags.length > 0) {
      result = result.filter(project => 
        selectedTags.every(tag => project.tags.includes(tag))
      )
    }

    return result
  }, [searchQuery, selectedTags, fuse])

  // Sort projects by date (newest first)
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [filteredProjects])

  const featuredProjects = sortedProjects.filter(project => project.featured)
  const otherProjects = sortedProjects.filter(project => !project.featured)

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleTagsChange = useCallback((tags: string[]) => {
    setSelectedTags(tags)
  }, [])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Projects</h1>
        <p className={styles.subtitle}>
          Full applications and experiments built with AI-first development. 
          Each project showcases different aspects of human-AI collaboration.
        </p>
      </header>

      <SearchAndFilter
        items={allProjects}
        searchKeys={['title', 'description', 'tags']}
        allTags={allTags}
        placeholder="Search projects..."
        onSearch={handleSearch}
        onTagsChange={handleTagsChange}
      />

      <div className={styles.resultsInfo}>
        <span className={styles.resultCount}>
          {sortedProjects.length} {sortedProjects.length === 1 ? 'project' : 'projects'}
          {(searchQuery || selectedTags.length > 0) && ` found`}
        </span>
      </div>

      {featuredProjects.length > 0 && (
        <section className={styles.section} aria-labelledby="featured-heading">
          <h2 id="featured-heading" className={styles.sectionTitle}>Featured Projects</h2>
          <div className={styles.featuredGrid}>
            {featuredProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} featured />
            ))}
          </div>
        </section>
      )}

      {otherProjects.length > 0 && (
        <section className={styles.section} aria-labelledby="all-heading">
          <h2 id="all-heading" className={styles.sectionTitle}>All Projects</h2>
          <div className={styles.projectGrid}>
            {otherProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}

      {sortedProjects.length === 0 && (
        <div className={styles.empty}>
          <p>No projects match your search criteria. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  )
}