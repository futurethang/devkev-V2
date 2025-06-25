import type { FeedItem, FocusProfile, KeywordConfig } from '../types/feed'
import type { EnhancedFeedItem } from '../ai/types'
import { AIProcessor } from '../ai/ai-processor'

/**
 * Content processor for relevance scoring and tag enhancement
 */
export class ContentProcessor {
  private aiProcessor?: AIProcessor

  constructor(enableAI: boolean = false) {
    if (enableAI) {
      // Initialize AI processor asynchronously
      this.initializeAI()
    }
  }

  private async initializeAI() {
    console.log('[ContentProcessor] Initializing AI processor...')
    try {
      this.aiProcessor = await AIProcessor.createDefault()
      console.log('[ContentProcessor] AI processor initialized successfully:', {
        isReady: this.aiProcessor.isReady(),
        stats: this.aiProcessor.getStats()
      })
    } catch (error) {
      console.error('[ContentProcessor] Failed to initialize AI processor:', error)
    }
  }

  /**
   * Explicitly initialize AI features and wait for readiness
   */
  async initializeAISync(): Promise<void> {
    if (!this.aiProcessor) {
      await this.initializeAI()
    }
  }
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
    let processedItem = { 
      ...item,
      processingStatus: 'processed' as const
    }
    
    // Validate content quality before processing
    const contentLength = (item.content || '').trim().length
    const titleLength = (item.title || '').trim().length
    
    // Skip items with insufficient content for meaningful AI processing
    if (contentLength < 100 && titleLength < 20) {
      console.log(`[ContentProcessor] Skipping item ${item.id}: insufficient content (content: ${contentLength} chars, title: ${titleLength} chars)`)
      // Still return the item but mark it as low-quality
      processedItem.relevanceScore = 0.1
      processedItem.metadata = {
        ...processedItem.metadata,
        contentQuality: 'insufficient'
      }
      return processedItem
    }
    
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

  /**
   * Process items with AI enhancement
   */
  async processItemWithAI(item: FeedItem, profile: FocusProfile): Promise<EnhancedFeedItem | null> {
    // First apply standard processing
    const processedItem = this.processItem(item, profile)
    if (!processedItem) {
      return null
    }

    // Apply AI enhancement if available
    if (this.aiProcessor && this.aiProcessor.isReady()) {
      try {
        const enhanced = await this.aiProcessor.processItem(processedItem, profile)
        
        // Use AI-enhanced relevance score if available
        if (enhanced.semanticScore !== undefined) {
          enhanced.relevanceScore = await this.aiProcessor.getEnhancedRelevanceScore(
            processedItem,
            processedItem.relevanceScore || 0,
            profile
          )
        }
        
        return enhanced
      } catch (error) {
        console.warn(`AI processing failed for item ${item.id}:`, error)
        // Return standard processed item as fallback
        return processedItem as EnhancedFeedItem
      }
    }

    return processedItem as EnhancedFeedItem
  }

  /**
   * Process a batch of items with AI enhancement
   */
  async processBatchWithAI(items: FeedItem[], profile: FocusProfile): Promise<EnhancedFeedItem[]> {
    console.log('[ContentProcessor] Starting processBatchWithAI:', {
      itemCount: items.length,
      profileId: profile.id,
      aiProcessorReady: this.aiProcessor?.isReady() || false
    })
    
    if (!this.aiProcessor || !this.aiProcessor.isReady()) {
      console.log('[ContentProcessor] AI processor not ready, falling back to standard processing')
      // Fallback to standard processing
      return this.processBatch(items, profile).map(item => item as EnhancedFeedItem)
    }

    const processedItems: EnhancedFeedItem[] = []
    
    // First apply standard processing and filtering
    for (const item of items) {
      const processed = this.processItem(item, profile)
      if (processed) {
        processedItems.push(processed as EnhancedFeedItem)
      }
    }
    
    console.log('[ContentProcessor] Standard processing complete:', {
      originalCount: items.length,
      afterFilteringCount: processedItems.length
    })

    if (processedItems.length === 0) {
      return []
    }

    try {
      // Apply AI enhancement in batch
      console.log('[ContentProcessor] Calling AI processor...')
      const batchResult = await this.aiProcessor.processBatch(
        processedItems.map(item => item as FeedItem),
        profile
      )
      
      console.log('[ContentProcessor] AI batch result:', {
        processedCount: batchResult.processed.length,
        failedCount: batchResult.failed.length,
        firstProcessedItem: batchResult.processed[0] ? {
          id: batchResult.processed[0].id,
          hasAISummary: !!batchResult.processed[0].aiSummary,
          aiSummaryType: typeof batchResult.processed[0].aiSummary,
          aiTagsCount: batchResult.processed[0].aiTags?.length || 0
        } : null
      })

      // Sort by AI-enhanced relevance scores
      batchResult.processed.sort((a, b) => {
        const scoreA = a.semanticScore || a.relevanceScore || 0
        const scoreB = b.semanticScore || b.relevanceScore || 0
        return scoreB - scoreA
      })

      return batchResult.processed

    } catch (error) {
      console.error('[ContentProcessor] AI batch processing failed:', error)
      return processedItems
    }
  }

  /**
   * Check if AI processing is available
   */
  isAIEnabled(): boolean {
    return !!this.aiProcessor?.isReady()
  }

  /**
   * Get AI processor statistics
   */
  getAIStats() {
    return this.aiProcessor?.getStats() || null
  }

  /**
   * Generate AI summary for a collection of items
   */
  async generateCollectionSummary(items: EnhancedFeedItem[], profile: FocusProfile) {
    if (!this.aiProcessor || !this.aiProcessor.isReady()) {
      throw new Error('AI processor not available')
    }

    return this.aiProcessor.generateCollectionSummary(items, profile)
  }
}