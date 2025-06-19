# Content Summarization Prompts

## Current Production Prompt

### Base Prompt Template
```
{focus}Please analyze this content and provide a structured summary in JSON format:

Content: "{content}"

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
}
```

### Current Implementation Details
- **File**: `aggregator/lib/ai/providers/base-provider.ts:116-138`
- **Method**: `buildSummaryPrompt(content, focusArea?)`
- **Focus Area Injection**: `Focus area: ${focusArea}\n` (when provided)
- **Max Tokens**: 300 (configurable)
- **Temperature**: 0.3

## Focus Area Examples

### AI Product Development
```
Focus area: AI-powered product development, machine learning integration, and developer productivity tools

Please analyze this content and provide a structured summary in JSON format:
...
```

### ML Engineering  
```
Focus area: Machine learning engineering, MLOps, model deployment, and production ML systems

Please analyze this content and provide a structured summary in JSON format:
...
```

### Design Systems
```
Focus area: Design systems, UI/UX best practices, component libraries, and design-developer collaboration

Please analyze this content and provide a structured summary in JSON format:
...
```

## Real Content Examples

### Example 1: AI Article
**Input Content**: "GPT-4 has transformed how developers approach code generation. New studies show 40% productivity gains when developers use AI coding assistants for routine tasks. However, code quality reviews remain essential..."

**Expected Output**:
```json
{
  "summary": "GPT-4 significantly improves developer productivity with 40% gains in routine tasks, though human code review remains critical for quality assurance.",
  "keyPoints": [
    "GPT-4 transforms developer code generation workflows",
    "40% productivity improvement in routine coding tasks",
    "Code quality reviews still require human oversight"
  ],
  "tags": ["ai", "gpt-4", "developer-productivity", "code-generation", "code-review"],
  "insights": [
    "AI tools excel at routine tasks but human judgment remains crucial for quality",
    "Productivity gains are measurable and significant in real-world development",
    "Balanced AI-human collaboration yields optimal development outcomes"
  ],
  "confidence": 0.92
}
```

## Prompt Engineering Variations to Test

### Variation A: More Directive
```
You are an expert technical content analyst. Analyze the following content and extract key information.

Content: "{content}"
Focus: {focusArea}

Provide a JSON response with exactly these fields:
- summary: 2-3 sentence executive summary
- keyPoints: 3-5 most important points (array)
- tags: 5-8 relevant technology/concept tags
- insights: 2-3 actionable insights or takeaways
- confidence: Your confidence in this analysis (0.0-1.0)

Be precise, factual, and focus on practical implications.
```

### Variation B: Conversational
```
I need help understanding this technical content. Can you break it down for me?

{focusArea ? `I'm particularly interested in: ${focusArea}` : ''}

Content: "{content}"

Please give me:
1. A clear summary in 2-3 sentences
2. The 3-5 most important points
3. Relevant tags for categorization  
4. Key insights I should remember
5. How confident you are in this analysis

Format as JSON please.
```

### Variation C: Role-Based
```
As a technical content curator for an AI-focused newsletter, analyze this content:

Content: "{content}"
Target audience: {focusArea}

Create a structured analysis that includes:
- summary: Newsletter-ready description (2-3 sentences)
- keyPoints: Bullet points for quick scanning (3-5 items)
- tags: SEO and categorization tags (5-8 items)
- insights: Why this matters to our audience (2-3 insights)
- confidence: Editorial confidence score (0.0-1.0)

Return as clean JSON.
```

## Performance Metrics to Track

### Quality Metrics
- **Summary Accuracy**: Does the summary capture the main point?
- **Key Points Relevance**: Are key points actually the most important?
- **Tag Precision**: Are tags accurate and useful for categorization?
- **Insight Value**: Do insights provide actionable takeaways?
- **JSON Validity**: Does the response parse correctly?

### Focus Area Relevance
- **AI Product**: How well does it identify AI/ML product implications?
- **ML Engineering**: Does it highlight technical implementation details?
- **Design Systems**: Does it extract design and UX insights?

### Consistency Metrics
- **Output Format**: Consistent JSON structure across requests
- **Confidence Calibration**: Do confidence scores correlate with quality?
- **Length Consistency**: Appropriate length for each field

## Testing Workflow

### 1. OpenAI Playground Testing
1. Copy base prompt to Playground
2. Test with real content samples from feeds
3. Vary temperature (0.1, 0.3, 0.5, 0.7)
4. Test max_tokens (200, 300, 500)
5. Compare system vs user message placement

### 2. Claude Console Testing
1. Test same prompts in Claude interface
2. Compare structured output quality
3. Test reasoning capability for insights
4. Evaluate focus area adherence

### 3. Batch Testing Setup
1. Create 20-30 real content samples per focus area
2. Run each prompt variation on full sample set
3. Score outputs on quality metrics
4. Identify best-performing variations

## Implementation Notes

### Current Parsing Logic
- **JSON Extraction**: Uses regex to find JSON in response
- **Fallback Handling**: Falls back to text-only summary if JSON fails
- **Field Validation**: Provides defaults for missing fields
- **Error Recovery**: Graceful degradation when AI fails

### Integration Points
- Called from `AIProcessor.processItem()`
- Used in batch processing for newsletter generation
- Integrated with relevance scoring pipeline
- Cached for performance optimization