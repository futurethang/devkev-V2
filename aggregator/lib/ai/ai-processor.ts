import type {
  AIProvider,
  AIModelConfig,
  AIProcessingOptions,
  EnhancedFeedItem,
  BatchProcessingResult,
  ContentSummary,
  AIProvider_Interface
} from './types'
import type { FeedItem, FocusProfile } from '../types/feed'
import { MockAIProvider } from './providers/mock-provider'
import { AnthropicProvider } from './providers/anthropic-provider'

/**
 * Configuration for AI processing
 */
interface AIProcessorConfig {
  defaultProvider: AIProvider
  models: Record<AIProvider, AIModelConfig>
  processing: AIProcessingOptions
  rateLimits?: {
    requestsPerMinute?: number
    requestsPerHour?: number
  }
}

/**
 * AI processor that handles content enhancement using multiple AI providers
 */
export class AIProcessor {
  private providers: Map<AIProvider, AIProvider_Interface> = new Map()
  private config: AIProcessorConfig
  private activeProvider?: AIProvider_Interface
  private requestQueue: Array<() => Promise<any>> = []
  private processing = false

  constructor(config: AIProcessorConfig) {
    this.config = config
  }

  /**
   * Initialize the AI processor (must be called before use)
   */
  async initialize(): Promise<void> {
    await this.initializeProviders()
  }

  /**
   * Initialize all configured AI providers
   */
  private async initializeProviders(): Promise<void> {
    // Initialize Anthropic provider first (preferred)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropicProvider = new AnthropicProvider()
        await anthropicProvider.initialize(this.config.models.anthropic || {
          provider: 'anthropic',
          model: 'claude-3-5-haiku-20241022',
          maxTokens: 800,
          temperature: 0.2
        })
        this.providers.set('anthropic', anthropicProvider)
        this.activeProvider = anthropicProvider
        console.log('✅ Anthropic provider initialized successfully')
      } catch (error) {
        console.warn('⚠️  Failed to initialize Anthropic provider:', error)
      }
    }

    // Always add mock provider as fallback
    const mockProvider = new MockAIProvider()
    await mockProvider.initialize(this.config.models.mock || {
      provider: 'mock',
      model: 'mock-gpt',
      maxTokens: 500,
      temperature: 0.3
    })
    this.providers.set('mock', mockProvider)

    // Use mock as fallback if no other provider initialized
    if (!this.activeProvider) {
      this.activeProvider = mockProvider
      console.log('📝 Using mock provider (no API keys configured)')
    }
  }

  /**
   * Check if AI processing is available
   */
  isReady(): boolean {
    return !!this.activeProvider?.isReady()
  }

  /**
   * Process a single feed item with AI enhancement
   */
  async processItem(
    item: FeedItem,
    profile?: FocusProfile,
    options?: Partial<AIProcessingOptions>
  ): Promise<EnhancedFeedItem> {
    console.log('[AIProcessor] Processing item:', {
      itemId: item.id,
      contentLength: item.content?.length || 0,
      profileId: profile?.id,
      activeProvider: this.activeProvider?.name
    })
    
    if (!this.isReady()) {
      throw new Error('AI processor not ready')
    }

    const opts = { ...this.config.processing, ...options }
    const startTime = Date.now()

  try {
    // Create a basic enhanced item without casting directly to avoid type errors
    const enhanced = { ...item } as Omit<EnhancedFeedItem, 'aiSummary'> & { aiSummary?: ContentSummary }

    // Generate AI summary
      if (opts.generateSummary) {
        console.log('[AIProcessor] Generating summary...')
        enhanced.aiSummary = await this.activeProvider!.generateSummary(
          item.content,
          profile?.description
        )
        console.log('[AIProcessor] Summary generated:', {
          hasContent: !!enhanced.aiSummary,
          summaryType: typeof enhanced.aiSummary,
          summaryLength: enhanced.aiSummary?.summary?.length || 0
        })
        enhanced.aiSummary.relevanceScore = enhanced.relevanceScore
      }

      // Enhance tags with AI
      if (opts.enhanceTags) {
        const aiTags = await this.activeProvider!.generateTags(
          item.content,
          item.tags
        )
        enhanced.aiTags = aiTags
        enhanced.tags = [...new Set([...item.tags, ...aiTags])]
      }

      // Extract insights
      if (opts.extractInsights) {
        enhanced.aiInsights = await this.activeProvider!.extractInsights(
          item.content,
          profile?.description
        )
      }

      // Calculate semantic relevance score
      if (opts.calculateSemanticScore && profile?.description) {
        enhanced.semanticScore = await this.activeProvider!.calculateSemanticRelevance(
          item.content,
          profile.description
        )
      }

      // Add processing metadata
      enhanced.processingMetadata = {
        provider: this.activeProvider!.name,
        model: this.config.models[this.activeProvider!.name]?.model || 'unknown',
        processingTime: Date.now() - startTime,
        confidence: enhanced.aiSummary?.confidence || 0.7
      }

      // Mark as AI processed
      enhanced.aiProcessed = true

      return enhanced

    } catch (error) {
      console.warn(`AI processing failed for item ${item.id}:`, error)
      
    // Return original item with error metadata, with type casting to handle aiSummary type incompatibility
      return {
        ...item,
        processingMetadata: {
          provider: this.activeProvider!.name,
          model: 'error',
          processingTime: Date.now() - startTime,
          confidence: 0
        }
      } as EnhancedFeedItem
    }
  }

  /**
   * Process multiple feed items in batches
   */
  async processBatch(
    items: FeedItem[],
    profile?: FocusProfile,
    options?: Partial<AIProcessingOptions>
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now()
    const opts = { ...this.config.processing, ...options }
    
    console.log('[AIProcessor] Starting batch processing:', {
      itemCount: items.length,
      profileId: profile?.id,
      activeProvider: this.activeProvider?.name,
      options: opts
    })
    const processed: EnhancedFeedItem[] = []
    const failed: Array<{ item: FeedItem; error: string }> = []

    let totalTokens = 0
    let totalProcessingTime = 0

    // Process items with concurrency control
    const batches = this.chunkArray(items, opts.maxConcurrency)
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (item) => {
        try {
          const enhanced = await this.processItem(item, profile, options)
          processed.push(enhanced)
          
          // Track token usage
          if (enhanced.aiSummary) {
            totalProcessingTime += enhanced.aiSummary.processingTime
          }
          
          return enhanced
        } catch (error) {
          failed.push({
            item,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      await Promise.all(batchPromises)
      
      // Add delay between batches for rate limiting
      if (batches.length > 1) {
        await this.delay(1000)
      }
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    return {
      processed,
      failed,
      stats: {
        totalItems: items.length,
        successfulItems: processed.length,
        failedItems: failed.length,
        totalProcessingTime: duration,
        averageProcessingTime: processed.length > 0 ? totalProcessingTime / processed.length : 0,
        totalTokensUsed: totalTokens,
        totalCost: this.estimateCost(totalTokens)
      }
    }
  }

  /**
   * Get AI-enhanced relevance score combining keyword and semantic scoring
   */
  async getEnhancedRelevanceScore(
    item: FeedItem,
    keywordScore: number,
    profile?: FocusProfile
  ): Promise<number> {
    if (!profile?.description || !this.isReady()) {
      return keywordScore
    }

    try {
      const semanticScore = await this.activeProvider!.calculateSemanticRelevance(
        item.content,
        profile.description
      )

      // Combine keyword and semantic scores (weighted average)
      const combinedScore = (keywordScore * 0.4) + (semanticScore * 0.6)
      return Math.min(1.0, combinedScore)
      
    } catch (error) {
      console.warn('Semantic scoring failed, using keyword score:', error)
      return keywordScore
    }
  }

  /**
   * Generate a summary for a collection of items
   */
  async generateCollectionSummary(
    items: EnhancedFeedItem[],
    profile?: FocusProfile
  ): Promise<ContentSummary> {
    if (!this.isReady()) {
      throw new Error('AI processor not ready')
    }

    const content = items
      .map(item => `${item.title}: ${item.content}`)
      .join('\n\n')
      .substring(0, 8000) // Limit content length

    const focusDescription = profile?.description || 'general technology trends'
    
    return this.activeProvider!.generateSummary(content, focusDescription)
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    providersReady: number
    activeProvider: string
    requestsQueued: number
    processing: boolean
  } {
    return {
      providersReady: Array.from(this.providers.values()).filter(p => p.isReady()).length,
      activeProvider: this.activeProvider?.name || 'none',
      requestsQueued: this.requestQueue.length,
      processing: this.processing
    }
  }

  /**
   * Utility methods
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private estimateCost(tokens: number): number {
    // Mock cost calculation - in real implementation this would vary by provider
    const costPerToken = 0.00002 // ~$0.02 per 1K tokens
    return tokens * costPerToken
  }

  /**
   * Factory method to create AI processor with sensible defaults
   */
  static async createDefault(): Promise<AIProcessor> {
    const config: AIProcessorConfig = {
      defaultProvider: process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'mock',
      models: {
        mock: {
          provider: 'mock',
          model: 'mock-gpt',
          maxTokens: 500,
          temperature: 0.3
        },
        openai: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          maxTokens: 600,
          temperature: 0.2
        },
        anthropic: {
          provider: 'anthropic',
          model: 'claude-3-5-haiku-20241022',
          maxTokens: 800,
          temperature: 0.2
        },
        local: {
          provider: 'local',
          model: 'llama-3.1-8b',
          maxTokens: 500,
          temperature: 0.3
        }
      },
      processing: {
        generateSummary: true,
        enhanceTags: true,
        extractInsights: true,
        calculateSemanticScore: true,
        maxConcurrency: 3,
        timeout: 30000
      },
      rateLimits: {
        requestsPerMinute: 50,
        requestsPerHour: 1000
      }
    }

    const processor = new AIProcessor(config)
    await processor.initialize()
    return processor
  }
}