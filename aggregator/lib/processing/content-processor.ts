import type { FeedItem, FocusProfile, KeywordConfig } from '../types/feed'

/**
 * Content processor for relevance scoring and tag enhancement
 */
export class ContentProcessor {
  /**
   * Calculate relevance score for an item based on a focus profile
   */
  calculateRelevanceScore(item: FeedItem, profile: FocusProfile): number {
    const { keywords } = profile
    const searchText = this.getSearchableText(item)
    
    // Check exclusion filters first
    if (this.isExcluded(searchText, keywords)) {
      return 0
    }
    
    // Check required keywords
    if (!this.hasRequiredKeywords(searchText, keywords)) {
      return 0
    }
    
    // Calculate score based on keyword matches
    let score = 0
    
    // High-value keywords (+3 points each)
    score += this.countKeywordMatches(searchText, keywords.boost.high) * 3
    
    // Medium-value keywords (+1 point each)
    score += this.countKeywordMatches(searchText, keywords.boost.medium) * 1
    
    // Low-value keywords (+0.5 points each)
    score += this.countKeywordMatches(searchText, keywords.boost.low) * 0.5
    
    // Normalize to 0-1 range (assuming max possible score is around 10)
    const normalizedScore = Math.min(score / 10, 1.0)
    
    return Math.round(normalizedScore * 1000) / 1000 // Round to 3 decimal places
  }

  /**
   * Enhance tags by extracting additional tags from title and content
   */
  enhanceTags(item: FeedItem): string[] {
    const existingTags = new Set(item.tags.map(tag => tag.toLowerCase()))
    const extractedTags = new Set<string>()
    
    // Common tech terms to extract
    const techTerms = [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'neural networks', 'nlp', 'natural language processing', 'computer vision',
      'transformers', 'chatgpt', 'openai', 'anthropic', 'claude', 'gpt', 'llm', 'large language model',
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'nodejs', 'javascript', 'typescript',
      'python', 'rust', 'go', 'java', 'csharp', 'swift', 'kotlin',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'serverless',
      'api', 'rest', 'graphql', 'database', 'mongodb', 'postgresql', 'mysql',
      'startup', 'mvp', 'product', 'user experience', 'ux', 'ui', 'design',
      'revenue', 'business model', 'growth', 'marketing', 'saas',
      'blockchain', 'crypto', 'web3', 'defi', 'nft'
    ]
    
    const searchText = this.getSearchableText(item)
    
    // Extract matching tech terms
    techTerms.forEach(term => {
      if (searchText.includes(term.toLowerCase())) {
        extractedTags.add(term.toLowerCase().replace(/\s+/g, ' '))
      }
    })
    
    // Extract words that look like technologies (containing dots, common suffixes)
    const techPatterns = [
      /\b\w+\.js\b/gi,     // JavaScript frameworks (react.js, vue.js)
      /\b\w+\.py\b/gi,     // Python files
      /\b\w+\.rs\b/gi,     // Rust files
      /\b\w+\.go\b/gi,     // Go files
      /\b\w+API\b/gi,      // APIs
      /\b\w+SDK\b/gi,      // SDKs
      /\b\w+DB\b/gi,       // Databases
    ]
    
    techPatterns.forEach(pattern => {
      const matches = searchText.match(pattern) || []
      matches.forEach(match => {
        const normalized = match.toLowerCase().replace(/\./g, '')
        extractedTags.add(normalized)
      })
    })
    
    // Combine existing and extracted tags, remove duplicates
    const allTags = Array.from(new Set([
      ...existingTags,
      ...extractedTags
    ]))
    
    return allTags.filter(tag => tag.length > 1) // Remove single character tags
  }

  /**
   * Process a single feed item according to profile configuration
   */
  processItem(item: FeedItem, profile: FocusProfile): FeedItem | null {
    let processedItem = { ...item }
    
    // Calculate relevance score if enabled
    if (profile.processing.scoreRelevance) {
      const relevanceScore = this.calculateRelevanceScore(item, profile)
      
      // Filter out items below minimum threshold
      if (relevanceScore < profile.processing.minRelevanceScore) {
        return null
      }
      
      processedItem.relevanceScore = relevanceScore
    }
    
    // Enhance tags if enabled
    if (profile.processing.enhanceTags) {
      processedItem.tags = this.enhanceTags(item)
    }
    
    // Check age filter
    const ageInDays = (Date.now() - processedItem.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (ageInDays > profile.processing.maxAgeDays) {
      return null
    }
    
    return processedItem
  }

  /**
   * Process a batch of feed items
   */
  processBatch(items: FeedItem[], profile: FocusProfile): FeedItem[] {
    const processedItems: FeedItem[] = []
    
    for (const item of items) {
      const processed = this.processItem(item, profile)
      if (processed) {
        processedItems.push(processed)
      }
    }
    
    // Sort by relevance score (highest first)
    processedItems.sort((a, b) => {
      const scoreA = a.relevanceScore || 0
      const scoreB = b.relevanceScore || 0
      return scoreB - scoreA
    })
    
    return processedItems
  }

  /**
   * Get searchable text from item (title + content + tags)
   */
  private getSearchableText(item: FeedItem): string {
    return [
      item.title,
      item.content,
      item.tags.join(' ')
    ].join(' ').toLowerCase()
  }

  /**
   * Check if item should be excluded based on exclusion keywords
   */
  private isExcluded(searchText: string, keywords: KeywordConfig): boolean {
    return keywords.filter.exclude.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    )
  }

  /**
   * Check if item contains required keywords
   */
  private hasRequiredKeywords(searchText: string, keywords: KeywordConfig): boolean {
    if (keywords.filter.require.length === 0) {
      return true // No requirements
    }
    
    // Must contain ALL required keywords (changed from some to every)
    return keywords.filter.require.every(keyword => 
      searchText.includes(keyword.toLowerCase())
    )
  }

  /**
   * Count keyword matches in text
   */
  private countKeywordMatches(searchText: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      // Count all occurrences of the keyword
      const regex = new RegExp(keyword.toLowerCase(), 'g')
      const matches = searchText.match(regex)
      return count + (matches ? matches.length : 0)
    }, 0)
  }

  /**
   * Calculate similarity between two pieces of text (simple approach)
   */
  calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    // Calculate Jaccard similarity (intersection over union)
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * Detect duplicate items in a batch
   */
  detectDuplicates(items: FeedItem[], similarityThreshold: number = 0.8): Array<{
    item: FeedItem
    duplicates: FeedItem[]
  }> {
    const duplicates: Array<{
      item: FeedItem
      duplicates: FeedItem[]
    }> = []
    
    const processed = new Set<string>()
    
    for (let i = 0; i < items.length; i++) {
      if (processed.has(items[i].id)) continue
      
      const currentItem = items[i]
      const itemDuplicates: FeedItem[] = []
      
      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(items[j].id)) continue
        
        const otherItem = items[j]
        
        // Check URL similarity first (exact match = duplicate)
        if (currentItem.url === otherItem.url) {
          itemDuplicates.push(otherItem)
          processed.add(otherItem.id)
          continue
        }
        
        // Check title similarity
        const titleSimilarity = this.calculateTextSimilarity(
          currentItem.title,
          otherItem.title
        )
        
        // Check content similarity
        const contentSimilarity = this.calculateTextSimilarity(
          currentItem.content,
          otherItem.content
        )
        
        // Consider duplicate if either title or content is highly similar
        if (titleSimilarity >= similarityThreshold || contentSimilarity >= similarityThreshold) {
          itemDuplicates.push(otherItem)
          processed.add(otherItem.id)
        }
      }
      
      if (itemDuplicates.length > 0) {
        duplicates.push({
          item: currentItem,
          duplicates: itemDuplicates
        })
      }
      
      processed.add(currentItem.id)
    }
    
    return duplicates
  }

  /**
   * Remove duplicates from a batch of items
   */
  deduplicateItems(items: FeedItem[], similarityThreshold: number = 0.8): FeedItem[] {
    const duplicateGroups = this.detectDuplicates(items, similarityThreshold)
    const duplicateIds = new Set<string>()
    
    // Mark all duplicates for removal (keep the first item in each group)
    duplicateGroups.forEach(group => {
      group.duplicates.forEach(duplicate => {
        duplicateIds.add(duplicate.id)
      })
    })
    
    // Return items that are not marked as duplicates
    return items.filter(item => !duplicateIds.has(item.id))
  }
}