import { BaseAIProvider } from './base-provider'
import type { AIProvider, AIModelConfig, AIRequest, AIResponse, ContentSummary } from '../types'

/**
 * Mock AI provider for testing and development
 * Simulates AI responses without making actual API calls
 */
export class MockAIProvider extends BaseAIProvider {
  readonly name: AIProvider = 'mock'
  readonly supportedModels = ['mock-gpt', 'mock-claude', 'mock-local']

  protected async validateConfig(config: AIModelConfig): Promise<void> {
    if (!this.supportedModels.includes(config.model)) {
      throw new Error(`Unsupported mock model: ${config.model}`)
    }
  }

  protected async makeAPIRequest(request: AIRequest): Promise<AIResponse> {
    // Simulate API delay
    await this.delay(100 + Math.random() * 200)

    const mockResponse = this.generateMockResponse(request)
    
    return {
      content: mockResponse,
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: Math.floor(mockResponse.length / 4),
        totalTokens: Math.floor((request.prompt.length + mockResponse.length) / 4)
      },
      model: this.config?.model || 'mock-gpt',
      provider: 'mock',
      duration: 0 // Will be set by base class
    }
  }

  /**
   * Generate realistic mock responses based on the request
   */
  private generateMockResponse(request: AIRequest): string {
    const content = request.content.toLowerCase()
    const prompt = request.prompt.toLowerCase()

    // Summary response
    if (prompt.includes('json') && prompt.includes('summary')) {
      return this.generateMockSummary(content)
    }

    // Relevance score response
    if (prompt.includes('relevance') || prompt.includes('rate')) {
      return this.generateMockRelevanceScore(content)
    }

    // Tags response
    if (prompt.includes('tags')) {
      return this.generateMockTags(content)
    }

    // Insights response
    if (prompt.includes('insights') || prompt.includes('takeaways')) {
      return this.generateMockInsights(content)
    }

    // Default response
    return "Mock AI response for development and testing purposes."
  }

  private generateMockSummary(content: string): string {
    const summaries = [
      "This article discusses the latest developments in AI technology and its impact on software development.",
      "The content explores practical applications of machine learning in modern product development.",
      "This piece examines emerging trends in artificial intelligence and their implications for developers.",
      "The article presents insights into AI-powered tools and their role in enhancing developer productivity."
    ]

    const keyPoints = [
      ["AI is transforming software development", "New tools are emerging rapidly", "Productivity gains are significant"],
      ["Machine learning is becoming mainstream", "Integration challenges remain", "Best practices are still evolving"],
      ["Automation is key to future development", "Human oversight remains crucial", "Skills adaptation is necessary"],
      ["AI tools enhance rather than replace developers", "Learning curve considerations", "Cost-benefit analysis is important"]
    ]

    const tags = this.generateMockTags(content).split(', ')
    const insights = this.generateMockInsights(content).split('\n').filter(i => i.trim())

    const randomIndex = Math.floor(Math.random() * summaries.length)

    return JSON.stringify({
      summary: summaries[randomIndex],
      keyPoints: keyPoints[randomIndex],
      tags: tags.slice(0, 5),
      insights: insights.slice(0, 3),
      confidence: 0.7 + Math.random() * 0.25 // 0.7-0.95 range
    }, null, 2)
  }

  private generateMockRelevanceScore(content: string): string {
    // Generate higher scores for AI-related content
    let baseScore = 0.3
    
    const aiTerms = ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'llm', 'gpt', 'claude']
    const techTerms = ['javascript', 'python', 'react', 'typescript', 'api', 'database', 'cloud', 'docker']
    const productTerms = ['product', 'user', 'ux', 'ui', 'design', 'startup', 'saas', 'app']

    aiTerms.forEach(term => {
      if (content.includes(term)) baseScore += 0.15
    })

    techTerms.forEach(term => {
      if (content.includes(term)) baseScore += 0.05
    })

    productTerms.forEach(term => {
      if (content.includes(term)) baseScore += 0.08
    })

    // Add some randomness
    baseScore += (Math.random() - 0.5) * 0.1

    // Clamp to 0-1 range
    return Math.max(0, Math.min(1, baseScore)).toFixed(2)
  }

  private generateMockTags(content: string): string {
    const allTags = [
      'ai', 'machine-learning', 'artificial-intelligence', 'deep-learning', 'neural-networks',
      'javascript', 'typescript', 'python', 'react', 'nodejs', 'api', 'database',
      'product-development', 'user-experience', 'design', 'startup', 'saas', 'automation',
      'cloud-computing', 'docker', 'kubernetes', 'microservices', 'devops',
      'frontend', 'backend', 'fullstack', 'mobile', 'web-development', 'programming',
      'software-engineering', 'architecture', 'performance', 'security', 'testing'
    ]

    // Select tags based on content
    const selectedTags: string[] = []
    const contentLower = content.toLowerCase()

    // Always include some AI-related tags for mock responses
    if (Math.random() > 0.3) {
      selectedTags.push('ai', 'machine-learning')
    }

    // Add relevant tags
    allTags.forEach(tag => {
      if (contentLower.includes(tag.replace('-', ' ')) || contentLower.includes(tag.replace('-', ''))) {
        if (!selectedTags.includes(tag)) {
          selectedTags.push(tag)
        }
      }
    })

    // Add some random tags if we don't have enough
    while (selectedTags.length < 3) {
      const randomTag = allTags[Math.floor(Math.random() * allTags.length)]
      if (!selectedTags.includes(randomTag)) {
        selectedTags.push(randomTag)
      }
    }

    return selectedTags.slice(0, 6).join(', ')
  }

  private generateMockInsights(content: string): string {
    const insights = [
      "1. AI integration requires careful consideration of user experience and workflow disruption to minimize adoption barriers",
      "2. Investment in comprehensive developer education and training programs is crucial for successful AI technology adoption",
      "3. Balancing intelligent automation with appropriate human oversight ensures quality output while maintaining operational efficiency",
      "1. The key to AI success lies in understanding the specific problem domain requirements and actual user needs rather than technology capabilities",
      "2. Iterative development methodologies and continuous feedback loops are essential for effective AI product development and refinement",
      "3. Comprehensive cost-effectiveness analysis should include both direct implementation costs and long-term productivity gains and efficiency improvements",
      "1. Technical debt considerations become significantly more complex when integrating AI systems into existing software architectures",
      "2. Data quality, availability, and proper preprocessing often determine the ultimate success of AI implementations more than algorithm choice",
      "3. Cross-functional collaboration between technical teams, domain experts, and stakeholders is critical for effective AI product development"
    ]

    const randomStart = Math.floor(Math.random() * (insights.length - 2))
    return insights.slice(randomStart, randomStart + 3).join('\n')
  }

  /**
   * Override summary generation to add mock delay
   */
  async generateSummary(content: string, focusArea?: string): Promise<ContentSummary> {
    await this.delay(200 + Math.random() * 300)
    return super.generateSummary(content, focusArea)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}