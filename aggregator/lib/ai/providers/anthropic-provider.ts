import Anthropic from '@anthropic-ai/sdk'
import { BaseAIProvider } from './base-provider'
import type { 
  AIProvider, 
  AIModelConfig, 
  AIRequest, 
  AIResponse, 
  ContentSummary 
} from '../types'

/**
 * Anthropic Claude AI provider for high-quality content processing
 * Provides article-specific summaries and insights
 */
export class AnthropicProvider extends BaseAIProvider {
  readonly name: AIProvider = 'anthropic'
  readonly supportedModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022', 
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229'
  ]

  private client?: Anthropic
  private rateLimitDelay = 1000 // 1 second between requests for rate limiting

  protected async validateConfig(config: AIModelConfig): Promise<void> {
    if (!this.supportedModels.includes(config.model)) {
      throw new Error(`Unsupported Anthropic model: ${config.model}`)
    }

    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    })

    // Test the connection with a simple request
    try {
      await this.client.messages.create({
        model: config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      })
    } catch (error) {
      throw new Error(`Failed to connect to Anthropic API: ${error}`)
    }
  }

  protected async makeAPIRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.client || !this.config) {
      throw new Error('Anthropic provider not initialized')
    }

    const startTime = Date.now()

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ]
      })

      // Extract text content from response
      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('')

      // Calculate token usage
      const usage = {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      }

      return {
        content,
        usage,
        model: this.config.model,
        provider: 'anthropic',
        duration: Date.now() - startTime
      }

    } catch (error: any) {
      // Handle rate limiting
      if (error.status === 429) {
        console.warn('Anthropic rate limit hit, waiting before retry...')
        await this.delay(this.rateLimitDelay)
        this.rateLimitDelay = Math.min(this.rateLimitDelay * 2, 10000) // Exponential backoff up to 10s
        return this.makeAPIRequest(request) // Retry once
      }

      throw new Error(`Anthropic API request failed: ${error.message || error}`)
    }
  }

  /**
   * Generate article-specific summary with enhanced prompts
   */
  async generateSummary(content: string, focusArea?: string): Promise<ContentSummary> {
    const prompt = this.buildEnhancedSummaryPrompt(content, focusArea)
    const startTime = Date.now()
    
    const response = await this.processRequest({
      prompt,
      content,
      maxTokens: this.config?.maxTokens || 800,
      temperature: 0.2 // Lower temperature for more consistent summaries
    })

    return this.parseSummaryResponse(response.content, Date.now() - startTime)
  }

  /**
   * Enhanced prompt that analyzes actual article content
   */
  protected buildEnhancedSummaryPrompt(content: string, focusArea?: string): string {
    const focusContext = focusArea ? `\nFocus Area: ${focusArea}` : ''
    
    // Extract title and first few paragraphs for better context
    const contentLines = content.split('\n').filter(line => line.trim())
    const title = contentLines[0] || 'No title'
    const contentPreview = contentLines.slice(0, 20).join('\n').substring(0, 3000)
    
    return `You are an expert content analyst. Analyze this article and provide a structured summary in JSON format.

Article Title: "${title}"${focusContext}

Article Content:
${contentPreview}

Instructions:
1. Read the actual content carefully and create a summary that captures the SPECIFIC details, examples, and unique insights from this particular article
2. Avoid generic statements - focus on what makes this article unique
3. Extract concrete information, data points, examples, or case studies mentioned
4. Identify the main argument or thesis of the piece
5. Note any practical applications or actionable insights

Return a JSON object with these fields:
- summary: A specific 2-3 sentence summary highlighting what makes this article unique
- keyPoints: Array of 3-5 specific points from the article (not generic statements)
- tags: Array of relevant technical/topic tags based on actual content
- insights: Array of 2-3 actionable insights or key takeaways specific to this content
- confidence: Your confidence score (0.0-1.0) in the analysis quality

Example format:
{
  "summary": "This article presents [specific approach/finding/case study] showing [concrete results/data]. The author demonstrates [specific technique/method] with [particular example/outcome].",
  "keyPoints": ["Specific point about X methodology", "Concrete example of Y implementation", "Data showing Z% improvement"],
  "tags": ["specific-technology", "methodology-name", "use-case"],
  "insights": ["Actionable insight about implementation", "Specific recommendation for practitioners"],
  "confidence": 0.85
}

Focus on being specific rather than generic. If the content is promotional or lacks substance, reflect that honestly in a lower confidence score.`
  }

  /**
   * Calculate semantic relevance with content-aware analysis
   */
  async calculateSemanticRelevance(content: string, focusDescription: string): Promise<number> {
    const prompt = this.buildSemanticRelevancePrompt(content, focusDescription)
    
    const response = await this.processRequest({
      prompt,
      content,
      maxTokens: 50,
      temperature: 0.1
    })

    return this.parseRelevanceScore(response.content)
  }

  protected buildSemanticRelevancePrompt(content: string, focusDescription: string): string {
    // Extract key content for analysis
    const contentPreview = content.substring(0, 2000)
    
    return `Analyze the semantic relevance of this content to the focus area. Consider the depth, specificity, and practical value.

Focus Area: ${focusDescription}

Content to analyze:
${contentPreview}

Rate the relevance on a scale of 0.0 to 1.0 based on:
- Direct relevance to the focus area (40%)
- Depth and specificity of information (30%) 
- Practical applicability and insights (20%)
- Content quality and credibility (10%)

Return only a decimal number between 0.0 and 1.0 (e.g., 0.73)`
  }

  /**
   * Enhanced tag generation based on actual content
   */
  async generateTags(content: string, existingTags: string[]): Promise<string[]> {
    const prompt = this.buildContentAwareTagsPrompt(content, existingTags)
    
    const response = await this.processRequest({
      prompt,
      content,
      maxTokens: 100,
      temperature: 0.2
    })

    return this.parseTagsResponse(response.content)
  }

  protected buildContentAwareTagsPrompt(content: string, existingTags: string[]): string {
    const existing = existingTags.length > 0 ? `\nExisting tags: ${existingTags.join(', ')}` : ''
    const contentPreview = content.substring(0, 1500)
    
    return `Generate relevant tags for this content based on the actual technologies, concepts, and topics mentioned.${existing}

Content:
${contentPreview}

Generate 5-8 specific tags based on:
- Actual technologies and frameworks mentioned
- Specific methodologies or approaches discussed  
- Industry domains and use cases covered
- Skill levels or audience types (if apparent)

Return tags as a comma-separated list. Focus on specificity over generality.
Example: react-hooks, typescript-generics, performance-optimization, enterprise-architecture`
  }

  /**
   * Extract insights with content-specific analysis
   */
  async extractInsights(content: string, focusArea?: string): Promise<string[]> {
    const prompt = this.buildInsightsPrompt(content, focusArea)
    
    const response = await this.processRequest({
      prompt,
      content,
      maxTokens: 300,
      temperature: 0.3
    })

    return this.parseInsightsResponse(response.content)
  }

  protected buildInsightsPrompt(content: string, focusArea?: string): string {
    const focus = focusArea ? `Focus on insights relevant to: ${focusArea}\n` : ''
    const contentPreview = content.substring(0, 2000)
    
    return `${focus}Extract 2-3 key insights or takeaways from this specific content that readers can act on.

Content:
${contentPreview}

Look for:
- Actionable advice or recommendations mentioned
- Important trends or patterns identified
- Novel approaches or solutions presented
- Critical considerations or warnings
- Practical implementation details

Format as a numbered list:
1. First specific insight
2. Second specific insight  
3. Third specific insight (if applicable)

Focus on insights that are specific to this content, not general industry knowledge.`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}