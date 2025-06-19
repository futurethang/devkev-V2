# Tag Generation Prompts

## Current Production Prompt

### Base Prompt Template
```
Generate 5-8 relevant tags for this content.{existing}

Content: "{content}"

Return tags as a comma-separated list. Focus on:
- Technology/framework names
- Concepts and methodologies  
- Industry categories
- Skill levels (beginner, advanced, etc.)

Example: machine-learning, python, neural-networks, deep-learning, tutorial
```

### Current Implementation Details
- **File**: `aggregator/lib/ai/providers/base-provider.ts:155-169`
- **Method**: `buildTagsPrompt(content, existingTags)`
- **Existing Tags Injection**: `\nExisting tags: ${existingTags.join(', ')}` (when provided)
- **Max Tokens**: 100
- **Temperature**: 0.2 (low-medium for consistency)
- **Expected Output**: Comma-separated tag list

## Tag Categories and Examples

### Technology Tags
- **Languages**: `javascript`, `python`, `typescript`, `rust`, `go`
- **Frameworks**: `react`, `nextjs`, `django`, `tensorflow`, `pytorch`
- **Tools**: `docker`, `kubernetes`, `git`, `vscode`, `figma`
- **Platforms**: `aws`, `vercel`, `github`, `openai`, `anthropic`

### Concept Tags
- **AI/ML**: `machine-learning`, `deep-learning`, `nlp`, `computer-vision`, `llm`
- **Development**: `frontend`, `backend`, `fullstack`, `devops`, `testing`
- **Design**: `ui-design`, `ux-research`, `design-systems`, `accessibility`
- **Business**: `startup`, `saas`, `product-management`, `growth`

### Skill Level Tags
- **Difficulty**: `beginner`, `intermediate`, `advanced`, `expert`
- **Content Type**: `tutorial`, `guide`, `reference`, `case-study`, `news`
- **Industry**: `fintech`, `healthcare`, `enterprise`, `consumer`, `developer-tools`

## Real Content Examples

### Example 1: AI Development Article
**Content**: "Building a ChatGPT-like interface with React and OpenAI's API. This step-by-step tutorial covers authentication, streaming responses, and error handling for production apps."

**Expected Tags**:
```
chatgpt, openai, react, javascript, api-integration, streaming, authentication, tutorial, intermediate, ai-development
```

### Example 2: Design System Article  
**Content**: "Scaling design tokens across multiple platforms. How Airbnb manages consistency between web, iOS, and Android using automated token generation and style guides."

**Expected Tags**:
```
design-systems, design-tokens, cross-platform, airbnb, case-study, style-guides, automation, advanced, ui-design
```

### Example 3: MLOps Article
**Content**: "Deploying ML models with MLflow and Kubernetes. A comprehensive guide to model versioning, monitoring, and automated retraining pipelines in production."

**Expected Tags**:
```
mlops, mlflow, kubernetes, model-deployment, monitoring, automation, production, machine-learning, advanced, devops
```

## Prompt Engineering Variations to Test

### Variation A: Structured Categories
```
Analyze this content and generate relevant tags in these categories:

Content: "{content}"
{existing ? `Existing tags: ${existing}` : ''}

Categories:
- Technologies: Programming languages, frameworks, tools
- Concepts: Key ideas, methodologies, approaches  
- Industry: Domain areas, use cases, applications
- Type: tutorial, news, case-study, reference, opinion
- Level: beginner, intermediate, advanced

Generate 6-10 tags total, focusing on the most relevant and specific terms.
Format: tag1, tag2, tag3, ...
```

### Variation B: Audience-Focused
```
You are tagging content for a technical newsletter. Generate tags that help readers quickly identify if this content matches their interests.

Content: "{content}"
{existing ? `Current tags: ${existing}` : ''}

Focus on:
- Specific technologies mentioned (not generic terms)
- Key concepts that define the content
- Practical applications or use cases
- Content format and difficulty level

Generate 5-8 precise tags as a comma-separated list.
```

### Variation C: SEO-Optimized
```
Generate SEO-friendly tags for this technical content:

Content: "{content}"
{existing ? `Building on: ${existing}` : ''}

Requirements:
- Use kebab-case formatting (e.g., machine-learning)
- Include both broad and specific terms
- Consider search intent and discoverability
- Balance popular and niche terms
- 6-8 tags maximum for focus

Tags:
```

### Variation D: Hierarchical Tagging
```
Create a hierarchical tag set for this content:

Content: "{content}"

Generate tags in order of importance:
1. Primary topic (1-2 most important tags)
2. Secondary topics (2-3 supporting concepts)  
3. Technical details (2-3 specific technologies/methods)
4. Context tags (1-2 for difficulty, type, etc.)

Return as flat comma-separated list, but ordered by importance.
```

## Quality Metrics

### Tag Accuracy
- **Relevance**: Do tags accurately describe the content?
- **Specificity**: Are tags specific enough to be useful?
- **Completeness**: Do tags cover all major topics?
- **Consistency**: Similar content gets similar tags?

### Tag Utility
- **Searchability**: Would readers search for these terms?
- **Categorization**: Do tags help organize content effectively?
- **Discoverability**: Do tags help surface related content?
- **Balance**: Good mix of broad and specific tags?

### Format Quality
- **Parsing**: Tags correctly extracted from response
- **Format**: Consistent kebab-case or lowercase
- **Deduplication**: No duplicate tags generated
- **Length**: Appropriate number of tags (5-8)

## Testing Content Samples

### AI Product Development
1. **"Building AI Features with Claude API"** → Expected: `claude`, `ai-api`, `product-development`, `integration`
2. **"GPT-4 vs GPT-3.5 Performance Comparison"** → Expected: `gpt-4`, `llm-comparison`, `performance`, `analysis`
3. **"AI Product Launch Strategies"** → Expected: `ai-products`, `product-launch`, `strategy`, `go-to-market`

### ML Engineering  
1. **"MLOps Pipeline with Apache Airflow"** → Expected: `mlops`, `apache-airflow`, `data-pipeline`, `ml-engineering`
2. **"Model Monitoring in Production"** → Expected: `model-monitoring`, `production-ml`, `observability`, `ml-engineering`
3. **"Feature Store Architecture Patterns"** → Expected: `feature-store`, `ml-architecture`, `data-engineering`, `advanced`

### Design Systems
1. **"Component API Design Best Practices"** → Expected: `design-systems`, `component-apis`, `developer-experience`, `best-practices`
2. **"Design Token Automation Tools"** → Expected: `design-tokens`, `automation`, `design-ops`, `tooling`
3. **"Cross-Platform Design System Scaling"** → Expected: `design-systems`, `cross-platform`, `scaling`, `mobile-web`

## Integration Notes

### Current Tag Enhancement
- **Keyword Extraction**: Extracts tech terms from content
- **Pattern Matching**: Identifies common technology patterns
- **Deduplication**: Combines AI and extracted tags
- **Normalization**: Converts to consistent format

### Tag Sources
1. **Original Feed Tags**: From RSS or API source
2. **Extracted Tags**: Pattern-based extraction from content
3. **AI-Generated Tags**: LLM-suggested tags
4. **Enhanced Tags**: Final combined and deduplicated set

### Usage in System
- **Content Categorization**: Groups similar articles
- **Search Enhancement**: Improves content searchability  
- **Recommendation**: Surfaces related content
- **Analytics**: Tracks tag popularity and trends

## Performance Optimization

### Batching Strategy
```javascript
// Batch multiple articles for tag generation
const batchTagRequest = `
Generate tags for these articles:

Article 1: "${content1}"
Article 2: "${content2}"
Article 3: "${content3}"

Return format:
1: tag1, tag2, tag3
2: tag1, tag2, tag3  
3: tag1, tag2, tag3
`
```

### Caching Strategy
- **Content-Based**: Cache tags by content hash
- **Tag Reuse**: Common tags across similar content
- **TTL**: Reasonable cache expiration (24h)
- **Invalidation**: Clear cache on prompt updates

### Error Handling
- **Parse Failures**: Fall back to extracted tags
- **API Limits**: Use cached or extracted tags
- **Quality Control**: Validate tag format and relevance
- **Monitoring**: Track tag generation success rates