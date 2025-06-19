# Relevance Scoring Prompts

## Current Production Prompt

### Base Prompt Template
```
Rate the relevance of this content to the focus area on a scale of 0.0 to 1.0.

Focus Area: {focusDescription}
Content: "{content}"

Consider:
- Direct relevance to the focus area
- Practical applicability 
- Novelty and insights
- Quality of information

Return only a decimal number between 0.0 and 1.0 (e.g., 0.75)
```

### Current Implementation Details
- **File**: `aggregator/lib/ai/providers/base-provider.ts:140-153`
- **Method**: `buildRelevancePrompt(content, focusDescription)`
- **Max Tokens**: 50
- **Temperature**: 0.1 (low for consistency)
- **Expected Output**: Single decimal number (0.0-1.0)

## Focus Area Descriptions

### AI Product Development
```
Focus Area: AI-powered product development, machine learning integration, developer productivity tools, and AI-enhanced user experiences. Prioritizes practical AI applications, LLM integration, automation tools, and productivity improvements for software development teams.
```

### ML Engineering
```
Focus Area: Machine learning engineering, MLOps, model deployment, production ML systems, and data pipeline optimization. Focuses on technical implementation, infrastructure, monitoring, and operational aspects of ML systems.
```

### Design Systems
```
Focus Area: Design systems, component libraries, UI/UX best practices, design-developer collaboration, and scalable design workflows. Emphasizes systematic design approaches, design tokens, accessibility, and design tooling.
```

## Real Scoring Examples

### High Relevance (0.8-1.0)

**AI Product Focus + GPT-4 Integration Article**
- Content: "Building production-ready AI features with GPT-4: A step-by-step guide to integrating OpenAI's API into your product workflow..."
- **Expected Score**: 0.95
- **Reasoning**: Direct AI product implementation guidance

**ML Engineering Focus + MLOps Pipeline Article**
- Content: "Deploying machine learning models with Kubernetes and MLflow: Production-grade ML infrastructure patterns..."
- **Expected Score**: 0.90
- **Reasoning**: Core MLOps technical content

### Medium Relevance (0.4-0.7)

**AI Product Focus + General Programming Article**
- Content: "Best practices for TypeScript API development and error handling patterns..."
- **Expected Score**: 0.45
- **Reasoning**: Useful for AI product development but not AI-specific

**Design Systems Focus + General UX Article**
- Content: "User research methods for understanding customer behavior and preferences..."
- **Expected Score**: 0.55
- **Reasoning**: Relevant to design but not system-focused

### Low Relevance (0.0-0.3)

**AI Product Focus + Unrelated Content**
- Content: "10 tips for growing tomatoes in your backyard garden this summer..."
- **Expected Score**: 0.05
- **Reasoning**: No relevance to AI or product development

## Prompt Engineering Variations to Test

### Variation A: Detailed Criteria
```
Evaluate how relevant this content is to the specified focus area. Rate from 0.0 (not relevant) to 1.0 (highly relevant).

Focus Area: {focusDescription}
Content: "{content}"

Scoring criteria:
- 0.9-1.0: Core topic, directly actionable, high quality
- 0.7-0.8: Highly relevant, some practical value
- 0.5-0.6: Moderately relevant, tangentially useful
- 0.3-0.4: Slightly relevant, minimal applicability
- 0.0-0.2: Not relevant or very poor quality

Consider: Direct relevance, practical applicability, information quality, novelty.

Score (0.0-1.0):
```

### Variation B: Comparative Scoring
```
You are scoring content relevance for a technical newsletter.

Target Audience: {focusDescription}
Content: "{content}"

How valuable would this content be to someone deeply interested in this focus area?

Rate 0.0-1.0 where:
- 1.0 = Must-read, core to their interests
- 0.8 = Very valuable, clearly relevant
- 0.6 = Somewhat valuable, decent relevance
- 0.4 = Marginally valuable, tangentially related
- 0.2 = Low value, barely related
- 0.0 = No value, unrelated

Relevance score:
```

### Variation C: Multi-Factor Analysis
```
Analyze content relevance across multiple dimensions:

Focus: {focusDescription}
Content: "{content}"

Rate each dimension (0.0-1.0):
1. Topic Alignment: How well does the content match the focus area?
2. Practical Value: How actionable/useful is this information?
3. Technical Depth: Appropriate depth for the target audience?
4. Information Quality: How reliable and well-presented is the content?

Provide an overall relevance score (0.0-1.0) that weighs these factors.

Overall score:
```

### Variation D: Binary + Confidence
```
Is this content relevant to: {focusDescription}?

Content: "{content}"

First determine: Relevant (Yes/No)
If Yes, rate relevance strength: 0.5 (somewhat) to 1.0 (highly)
If No, rate: 0.0 (completely unrelated) to 0.4 (barely related)

Final relevance score (0.0-1.0):
```

## Calibration Test Cases

### Known High-Quality AI Content
1. **OpenAI GPT-4 Technical Report** → Expected: 0.95+ for AI Product
2. **MLOps Best Practices Guide** → Expected: 0.90+ for ML Engineering  
3. **Design Systems Documentation** → Expected: 0.95+ for Design Systems

### Edge Cases
1. **AI Ethics Discussion** → AI Product: 0.6-0.7 (relevant but not directly practical)
2. **JavaScript Performance Tips** → AI Product: 0.4-0.5 (general dev skills)
3. **Product Management for ML Teams** → ML Engineering: 0.6-0.7 (relevant but not technical)

### Cross-Domain Content
1. **AI in Design Tools** → Design Systems: 0.7-0.8, AI Product: 0.6-0.7
2. **No-Code ML Platforms** → AI Product: 0.7-0.8, ML Engineering: 0.5-0.6
3. **Design System APIs** → Design Systems: 0.8-0.9, AI Product: 0.4-0.5

## Performance Metrics

### Scoring Accuracy
- **Precision**: How often high scores (>0.7) identify truly relevant content
- **Recall**: How often truly relevant content gets high scores
- **Consistency**: Score variation for similar content
- **Calibration**: Score distribution matches expected relevance

### Response Format
- **Parse Success Rate**: Percentage of responses that extract valid scores
- **Score Range Utilization**: How well the full 0.0-1.0 range is used
- **Boundary Behavior**: Consistency near score thresholds (0.5, 0.7, etc.)

## Testing Methodology

### Dataset Creation
1. **Gold Standard Set**: 100 articles manually scored by domain experts
2. **Focus Area Balance**: Equal representation across all focus areas
3. **Score Distribution**: Balanced across relevance spectrum
4. **Content Variety**: Different article types (tutorials, news, research, tools)

### Evaluation Protocol
1. **Blind Testing**: Score without knowing expected scores
2. **Multiple Runs**: Test consistency across multiple API calls
3. **Temperature Testing**: Compare scores at different temperature settings
4. **Cross-Provider**: Compare OpenAI vs Claude vs other models

### Success Criteria
- **Correlation >0.8** with expert human scores
- **Consistency**: <0.1 standard deviation across runs
- **Boundary Accuracy**: >90% correct classification at 0.5 threshold
- **Parse Rate**: >98% valid numeric outputs

## Integration Notes

### Current Usage
- Combined with keyword-based scoring (60% semantic, 40% keyword)
- Used in `AIProcessor.getEnhancedRelevanceScore()`
- Feeds into content ranking and filtering
- Cached to avoid repeated API calls

### Performance Optimization
- **Batching**: Multiple relevance checks in single request
- **Caching**: Store scores for identical content
- **Fallback**: Use keyword scoring if AI unavailable
- **Rate Limiting**: Respect API quotas and limits

### Error Handling
- **Invalid Responses**: Fallback to keyword score
- **API Failures**: Graceful degradation to baseline scoring
- **Timeout Handling**: Short timeout for relevance scoring
- **Cost Management**: Track token usage for scoring operations