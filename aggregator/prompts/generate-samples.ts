#!/usr/bin/env tsx

/**
 * Generate sample content for prompt testing
 * Extracts real content from aggregator feeds for use in external prompt engineering tools
 */

import { ConfigLoader } from '../lib/config/config-loader'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface SampleContent {
  id: string
  title: string
  content: string
  url: string
  source: string
  publishedAt: string
  tags: string[]
  focusArea: string
  expectedRelevanceScore?: number
  notes?: string
}

class SampleContentGenerator {
  private configLoader = new ConfigLoader()
  private samplesDir = join(__dirname, 'samples')

  async generateSamples() {
    console.log('🔄 Generating sample content for prompt testing...')
    
    // Ensure samples directory exists
    mkdirSync(this.samplesDir, { recursive: true })

    // Load configuration
    const profiles = await this.configLoader.getAvailableProfiles()

    for (const profileId of profiles) {
      const profile = await this.configLoader.loadProfile(profileId)
      console.log(`\n📋 Processing profile: ${profile.name}`)
      await this.generateProfileSamples(profile)
    }

    await this.generateCombinedSamples()
    console.log('✅ Sample generation complete!')
  }

  private async generateProfileSamples(profile: any) {
    try {
      // For now, create mock samples since we're having integration issues
      const samples: SampleContent[] = [
        {
          id: `${profile.id}-sample-1`,
          title: "Example AI Product Development Article",
          content: "This is sample content for testing AI product development prompts. It discusses building AI-powered features, user experience considerations, and practical implementation strategies.",
          url: "https://example.com/ai-product-1",
          source: "sample",
          publishedAt: new Date().toISOString(),
          tags: ["ai", "product-development", "ux"],
          focusArea: profile.name,
          expectedRelevanceScore: 0.85,
          notes: `Mock sample from ${profile.id} profile - for prompt testing`
        },
        {
          id: `${profile.id}-sample-2`,
          title: "Machine Learning Engineering Best Practices",
          content: "Sample content about MLOps, model deployment, and production ML systems. Covers infrastructure, monitoring, and operational considerations for ML teams.",
          url: "https://example.com/ml-engineering-1", 
          source: "sample",
          publishedAt: new Date().toISOString(),
          tags: ["machine-learning", "mlops", "engineering"],
          focusArea: profile.name,
          expectedRelevanceScore: 0.78,
          notes: `Mock sample from ${profile.id} profile - for prompt testing`
        }
      ]

      // Write profile-specific samples
      const filename = `${profile.id}-samples.json`
      const filepath = join(this.samplesDir, filename)
      
      writeFileSync(filepath, JSON.stringify({
        metadata: {
          profile: profile.name,
          profileId: profile.id,
          description: profile.description || '',
          generatedAt: new Date().toISOString(),
          sampleCount: samples.length
        },
        samples
      }, null, 2))

      console.log(`  ✅ Generated ${samples.length} samples → ${filename}`)

      // Generate OpenAI Playground format
      await this.generatePlaygroundFormat(profile, samples)

      // Generate Claude format
      await this.generateClaudeFormat(profile, samples)

    } catch (error) {
      console.error(`❌ Error generating samples for ${profile.name}:`, error)
    }
  }

  private async generatePlaygroundFormat(profile: any, samples: SampleContent[]) {
    const playgroundExamples = samples.slice(0, 5).map((sample, index) => ({
      name: `${profile.name} Example ${index + 1}`,
      content: sample.content,
      title: sample.title,
      expectedScore: sample.expectedRelevanceScore || 0.5,
      focusArea: profile.description || ''
    }))

    const playgroundFile = {
      name: `${profile.name} - Prompt Testing`,
      description: `Sample content for testing ${profile.name} prompts`,
      examples: playgroundExamples,
      prompts: {
        summarization: this.getSummarizationPrompt(profile.description),
        relevanceScoring: this.getRelevancePrompt(profile.description),
        tagGeneration: this.getTagGenerationPrompt(),
        insightsExtraction: this.getInsightsPrompt(profile.description)
      }
    }

    const filename = `${profile.id}-playground.json`
    writeFileSync(join(this.samplesDir, filename), JSON.stringify(playgroundFile, null, 2))
    console.log(`  📱 Generated OpenAI Playground format → ${filename}`)
  }

  private async generateClaudeFormat(profile: any, samples: SampleContent[]) {
    const claudeExamples = samples.slice(0, 3).map((sample, index) => {
      return `## Example ${index + 1}: ${sample.title}

**Content:**
${sample.content}

**Expected Focus**: ${profile.description || profile.name}
**Expected Relevance**: ${sample.expectedRelevanceScore || 'Unknown'}
**Source**: ${sample.source}
**URL**: ${sample.url}

---
`
    }).join('\n')

    const claudeWorkbook = `# ${profile.name} - Claude Console Workbook

## Focus Area
${profile.description || profile.name}

## Test Content Examples

${claudeExamples}

## Test Prompts

### Summarization Test
\`\`\`
Focus area: ${profile.description || profile.name}

Please analyze this content and provide a structured summary in JSON format:

Content: "[PASTE CONTENT HERE]"

Return a JSON object with these fields:
- summary: A concise 2-3 sentence summary
- keyPoints: Array of 3-5 key points 
- tags: Array of relevant topic tags
- insights: Array of 2-3 key insights or takeaways
- confidence: Confidence score from 0.0 to 1.0
\`\`\`

### Relevance Scoring Test
\`\`\`
Rate the relevance of this content to the focus area on a scale of 0.0 to 1.0.

Focus Area: ${profile.description || profile.name}
Content: "[PASTE CONTENT HERE]"

Consider:
- Direct relevance to the focus area
- Practical applicability 
- Novelty and insights
- Quality of information

Return only a decimal number between 0.0 and 1.0 (e.g., 0.75)
\`\`\`

### Tag Generation Test
\`\`\`
Generate 5-8 relevant tags for this content.

Content: "[PASTE CONTENT HERE]"

Return tags as a comma-separated list. Focus on:
- Technology/framework names
- Concepts and methodologies  
- Industry categories
- Skill levels (beginner, advanced, etc.)

Example: machine-learning, python, neural-networks, deep-learning, tutorial
\`\`\`

### Insights Extraction Test
\`\`\`
Focus on insights relevant to: ${profile.description || profile.name}

Extract 2-3 key insights or takeaways from this content.

Content: "[PASTE CONTENT HERE]"

Return insights as a numbered list. Focus on:
- Actionable advice or recommendations
- Important trends or patterns
- Novel approaches or solutions
- Critical considerations

Format as:
1. First insight
2. Second insight
3. Third insight
\`\`\`
`

    const filename = `${profile.id}-claude-workbook.md`
    writeFileSync(join(this.samplesDir, filename), claudeWorkbook)
    console.log(`  🤖 Generated Claude workbook → ${filename}`)
  }

  private async generateCombinedSamples() {
    console.log('\n📊 Generating combined test dataset...')

    const profiles = await this.configLoader.getAllProfiles()
    const allSamples: SampleContent[] = []

    // Collect samples from all profiles
    for (const profile of profiles) {
      try {
        const filename = `${profile.id}-samples.json`
        const filepath = join(this.samplesDir, filename)
        const data = JSON.parse(require('fs').readFileSync(filepath, 'utf8'))
        allSamples.push(...data.samples)
      } catch (error) {
        console.warn(`⚠️  Could not load samples for ${profile.id}`)
      }
    }

    // Create balanced test set
    const testSet = {
      metadata: {
        description: 'Combined test dataset for cross-profile prompt evaluation',
        totalSamples: allSamples.length,
        profiles: profiles.map(p => ({ id: p.id, name: p.name })),
        generatedAt: new Date().toISOString()
      },
      samples: allSamples,
      testSets: {
        relevanceScoring: this.createRelevanceTestSet(allSamples),
        crossProfileContent: this.createCrossProfileTestSet(allSamples),
        qualityControl: this.createQualityTestSet(allSamples)
      }
    }

    writeFileSync(join(this.samplesDir, 'combined-test-dataset.json'), JSON.stringify(testSet, null, 2))
    console.log(`✅ Generated combined dataset with ${allSamples.length} samples`)
  }

  private createRelevanceTestSet(samples: SampleContent[]) {
    // Create test cases with known relevance expectations
    return {
      highRelevance: samples.filter(s => (s.expectedRelevanceScore || 0) > 0.7).slice(0, 10),
      mediumRelevance: samples.filter(s => {
        const score = s.expectedRelevanceScore || 0
        return score >= 0.4 && score <= 0.7
      }).slice(0, 10),
      lowRelevance: samples.filter(s => (s.expectedRelevanceScore || 0) < 0.4).slice(0, 10)
    }
  }

  private createCrossProfileTestSet(samples: SampleContent[]) {
    // Create test cases that might be relevant to multiple profiles
    const byProfile = samples.reduce((acc, sample) => {
      if (!acc[sample.focusArea]) acc[sample.focusArea] = []
      acc[sample.focusArea].push(sample)
      return acc
    }, {} as Record<string, SampleContent[]>)

    return Object.entries(byProfile).map(([profile, profileSamples]) => ({
      profile,
      samples: profileSamples.slice(0, 5)
    }))
  }

  private createQualityTestSet(samples: SampleContent[]) {
    // Create a curated set for quality evaluation
    return samples
      .filter(s => s.content.length > 200) // Substantial content
      .sort((a, b) => (b.expectedRelevanceScore || 0) - (a.expectedRelevanceScore || 0))
      .slice(0, 20)
  }

  // Prompt templates
  private getSummarizationPrompt(focusArea?: string) {
    const focus = focusArea ? `Focus area: ${focusArea}\n` : ''
    return `${focus}Please analyze this content and provide a structured summary in JSON format:

Content: "{content}"

Return a JSON object with these fields:
- summary: A concise 2-3 sentence summary
- keyPoints: Array of 3-5 key points 
- tags: Array of relevant topic tags
- insights: Array of 2-3 key insights or takeaways
- confidence: Confidence score from 0.0 to 1.0`
  }

  private getRelevancePrompt(focusArea?: string) {
    return `Rate the relevance of this content to the focus area on a scale of 0.0 to 1.0.

Focus Area: ${focusArea || '[FOCUS_AREA]'}
Content: "{content}"

Consider:
- Direct relevance to the focus area
- Practical applicability 
- Novelty and insights
- Quality of information

Return only a decimal number between 0.0 and 1.0 (e.g., 0.75)`
  }

  private getTagGenerationPrompt() {
    return `Generate 5-8 relevant tags for this content.

Content: "{content}"

Return tags as a comma-separated list. Focus on:
- Technology/framework names
- Concepts and methodologies  
- Industry categories
- Skill levels (beginner, advanced, etc.)

Example: machine-learning, python, neural-networks, deep-learning, tutorial`
  }

  private getInsightsPrompt(focusArea?: string) {
    const focus = focusArea ? `Focus on insights relevant to: ${focusArea}\n` : ''
    return `${focus}Extract 2-3 key insights or takeaways from this content.

Content: "{content}"

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
}

// CLI execution
async function main() {
  const generator = new SampleContentGenerator()
  try {
    await generator.generateSamples()
  } catch (error) {
    console.error('❌ Sample generation failed:', error)
    process.exit(1)
  }
}

// Export for programmatic use
export { SampleContentGenerator }

// Run if called directly
if (require.main === module) {
  main()
}