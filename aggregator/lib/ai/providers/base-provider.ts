import type { 
  AIProvider,
  AIModelConfig, 
  AIRequest, 
  AIResponse, 
  ContentSummary,
  AIProvider_Interface 
} from '../types'

/**
 * Abstract base class for AI providers
 * Implements common functionality and defines interface
 */
export abstract class BaseAIProvider implements AIProvider_Interface {
  protected config?: AIModelConfig
  protected initialized = false

  abstract readonly name: AIProvider
  abstract readonly supportedModels: string[]

  async initialize(config: AIModelConfig): Promise<void> {
    this.config = config
    await this.validateConfig(config)
    this.initialized = true
  }

  isReady(): boolean {
    return this.initialized && !!this.config
  }

  /**
   * Validate provider-specific configuration
   */
  protected abstract validateConfig(config: AIModelConfig): Promise<void>

  /**
   * Make API request to the provider
   */
  protected abstract makeAPIRequest(request: AIRequest): Promise<AIResponse>

  async processRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.isReady()) {
      throw new Error(`${this.name} provider not initialized`)
    }

    const startTime = Date.now()
    
    try {
      const response = await this.makeAPIRequest(request)
      return {
        ...response,
        duration: Date.now() - startTime
      }
    } catch (error) {
      throw new Error(`${this.name} request failed: ${error}`)
    }
  }

  async generateSummary(content: string, focusArea?: string): Promise<ContentSummary> {
    const prompt = this.buildSummaryPrompt(content, focusArea)
    const startTime = Date.now()
    
    const response = await this.processRequest({
      prompt,
      content,
      maxTokens: this.config?.maxTokens || 300,
      temperature: 0.3
    })

    // Parse the structured response
    return this.parseSummaryResponse(response.content, Date.now() - startTime)
  }

  async calculateSemanticRelevance(content: string, focusDescription: string): Promise<number> {
    const prompt = this.buildRelevancePrompt(content, focusDescription)
    
    const response = await this.processRequest({
      prompt,
      content,
      maxTokens: 50,
      temperature: 0.1
    })

    return this.parseRelevanceScore(response.content)
  }

  async generateTags(content: string, existingTags: string[]): Promise<string[]> {
    const prompt = this.buildTagsPrompt(content, existingTags)
    
    const response = await this.processRequest({
      prompt,
      content,
      maxTokens: 100,
      temperature: 0.2
    })

    return this.parseTagsResponse(response.content)
  }

  async extractInsights(content: string, focusArea?: string): Promise<string[]> {
    const prompt = this.buildInsightsPrompt(content, focusArea)
    
    const response = await this.processRequest({
      prompt,
      content,
      maxTokens: 200,
      temperature: 0.4
    })

    return this.parseInsightsResponse(response.content)
  }

  /**
   * Build prompts for different AI tasks
   */
  protected buildSummaryPrompt(content: string, focusArea?: string): string {
    const focus = focusArea ? `Focus area: ${focusArea}\n` : ''
    
    return `${focus}Please analyze this content and provide a structured summary in JSON format:

Content: "${content}"

Return a JSON object with these fields:
- summary: A concise 2-3 sentence summary
- keyPoints: Array of 3-5 key points 
- tags: Array of relevant topic tags
- insights: Array of 2-3 key insights or takeaways
- confidence: Confidence score from 0.0 to 1.0

Example format:
{
  "summary": "Brief summary here",
  "keyPoints": ["Point 1", "Point 2"],
  "tags": ["tag1", "tag2"],
  "insights": ["Insight 1", "Insight 2"],
  "confidence": 0.85
}`
  }

  protected buildRelevancePrompt(content: string, focusDescription: string): string {
    return `Rate the relevance of this content to the focus area on a scale of 0.0 to 1.0.

Focus Area: ${focusDescription}
Content: "${content}"

Consider:
- Direct relevance to the focus area
- Practical applicability 
- Novelty and insights
- Quality of information

Return only a decimal number between 0.0 and 1.0 (e.g., 0.75)`
  }

  protected buildTagsPrompt(content: string, existingTags: string[]): string {
    const existing = existingTags.length > 0 ? `\nExisting tags: ${existingTags.join(', ')}` : ''
    
    return `Generate 5-8 relevant tags for this content.${existing}

Content: "${content}"

Return tags as a comma-separated list. Focus on:
- Technology/framework names
- Concepts and methodologies  
- Industry categories
- Skill levels (beginner, advanced, etc.)

Example: machine-learning, python, neural-networks, deep-learning, tutorial`
  }

  protected buildInsightsPrompt(content: string, focusArea?: string): string {
    const focus = focusArea ? `Focus on insights relevant to: ${focusArea}\n` : ''
    
    return `${focus}Extract 2-3 key insights or takeaways from this content.

Content: "${content}"

Return insights as a numbered list. Focus on:
- Actionable advice or recommendations
- Important trends or patterns
- Novel approaches or solutions
- Critical considerations

Format as:
1. First insight
2. Second insight
3. Third insight`
  }

  /**
   * Parse AI responses
   */
  protected parseSummaryResponse(response: string, processingTime: number): ContentSummary {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          summary: parsed.summary || '',
          keyPoints: parsed.keyPoints || [],
          tags: parsed.tags || [],
          insights: parsed.insights || [],
          confidence: parsed.confidence || 0.5,
          processingTime
        }
      }
    } catch (error) {
      // Fallback to text parsing
    }

    // Fallback: treat entire response as summary
    return {
      summary: response.trim(),
      keyPoints: [],
      tags: [],
      insights: [],
      confidence: 0.3,
      processingTime
    }
  }

  protected parseRelevanceScore(response: string): number {
    const scoreMatch = response.match(/(\d+\.?\d*)/);
    if (scoreMatch) {
      const score = parseFloat(scoreMatch[1])
      return Math.max(0, Math.min(1, score)) // Clamp to 0-1 range
    }
    return 0.5 // Default/fallback score
  }

  protected parseTagsResponse(response: string): string[] {
    // Split by commas and clean up
    return response
      .split(/[,\n]/)
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length < 50)
      .slice(0, 8) // Limit to 8 tags
  }

  protected parseInsightsResponse(response: string): string[] {
    // Extract numbered list items
    const insights = response
      .split(/\n/)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 10) // Filter out short/empty lines
      .slice(0, 3) // Limit to 3 insights

    return insights.length > 0 ? insights : [response.trim()]
  }
}