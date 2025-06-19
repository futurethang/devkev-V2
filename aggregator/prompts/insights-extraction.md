# Insights Extraction Prompts

## Current Production Prompt

### Base Prompt Template
```
{focus}Extract 2-3 key insights or takeaways from this content.

Content: "{content}"

Return insights as a numbered list. Focus on:
- Actionable advice or recommendations
- Important trends or patterns
- Novel approaches or solutions
- Critical considerations

Format as:
1. First insight
2. Second insight
3. Third insight
```

### Current Implementation Details
- **File**: `aggregator/lib/ai/providers/base-provider.ts:171-188`
- **Method**: `buildInsightsPrompt(content, focusArea?)`
- **Focus Area Injection**: `Focus on insights relevant to: ${focusArea}\n` (when provided)
- **Max Tokens**: 200
- **Temperature**: 0.4 (medium for creativity)
- **Expected Output**: Numbered list (1-3 insights)

## Focus-Specific Insights

### AI Product Development Focus
```
Focus on insights relevant to: AI-powered product development, machine learning integration, and developer productivity tools

Extract 2-3 key insights or takeaways from this content.
...
```

**Expected Insight Types**:
- Product strategy for AI features
- Technical implementation approaches
- User experience considerations
- Development workflow improvements
- ROI and business impact insights

### ML Engineering Focus  
```
Focus on insights relevant to: Machine learning engineering, MLOps, model deployment, and production ML systems

Extract 2-3 key insights or takeaways from this content.
...
```

**Expected Insight Types**:
- Infrastructure and scaling patterns
- Model lifecycle management
- Performance optimization techniques
- Monitoring and observability practices
- Team organization and processes

### Design Systems Focus
```
Focus on insights relevant to: Design systems, UI/UX best practices, component libraries, and design-developer collaboration

Extract 2-3 key insights or takeaways from this content.
...
```

**Expected Insight Types**:
- System architecture decisions
- Design-dev collaboration workflows
- Component design principles
- Scalability and maintenance strategies
- User adoption and governance

## Real Content Examples

### Example 1: AI Development Article
**Content**: "Our team integrated GPT-4 into our customer support system and saw 60% reduction in response time. However, we learned that human oversight is crucial - AI responses needed review for tone and accuracy. The key was building a hybrid workflow where AI handles initial drafts and humans provide final approval."

**Expected Insights**:
```
1. AI integration can deliver significant efficiency gains (60% response time reduction) when properly implemented in customer-facing workflows
2. Human oversight remains essential for quality control, particularly for tone and accuracy in customer communications
3. Hybrid AI-human workflows that combine AI speed with human judgment create optimal outcomes for sensitive customer interactions
```

### Example 2: MLOps Infrastructure
**Content**: "After migrating our ML pipeline to Kubernetes, deployment time dropped from 2 hours to 15 minutes. The containerization forced us to properly version our dependencies and environment configs. Most importantly, we implemented automated rollback when model performance degrades below threshold."

**Expected Insights**:
```
1. Containerization with Kubernetes can dramatically reduce ML model deployment times while enforcing better dependency management practices
2. Proper environment versioning becomes a forcing function for improved MLOps hygiene and reproducibility across development teams
3. Automated performance monitoring with rollback capabilities provides essential safety nets for production ML systems deployment
```

### Example 3: Design System Evolution
**Content**: "Our design system adoption jumped from 30% to 85% after we introduced automated component generation from Figma designs. Designers loved maintaining single source of truth, developers appreciated consistent APIs. The breakthrough was treating the design system as a product with dedicated PM support."

**Expected Insights**:
```
1. Automation bridging design and development tools significantly increases design system adoption by reducing friction for both teams
2. Single source of truth approaches that serve both designer and developer workflows create stronger incentives for consistent system usage
3. Treating design systems as products with dedicated product management support drives higher adoption and more strategic evolution
```

## Prompt Engineering Variations to Test

### Variation A: Role-Based Analysis
```
You are an expert technical advisor analyzing this content for practical insights.

{focus ? `Domain expertise: ${focus}` : ''}
Content: "{content}"

Extract 2-3 insights that would be valuable for someone implementing similar solutions:

Focus on:
- What worked and why
- Critical success factors or failure points
- Practical recommendations for implementation
- Lessons learned that aren't obvious

Format as numbered list (1-3 insights maximum).
```

### Variation B: Strategic vs Tactical
```
Analyze this content for both strategic and tactical insights:

Content: "{content}"
{focus ? `Context: ${focus}` : ''}

Extract insights in these categories:
- Strategic: High-level decisions, business impact, long-term implications
- Tactical: Implementation details, specific techniques, immediate actions

Provide 2-3 total insights, mixing strategic and tactical where relevant.

Format:
1. [Strategic/Tactical] Insight description
2. [Strategic/Tactical] Insight description
3. [Strategic/Tactical] Insight description
```

### Variation C: Problem-Solution-Impact
```
Extract key insights using the Problem-Solution-Impact framework:

Content: "{content}"
{focus ? `Focus area: ${focus}` : ''}

For each insight, identify:
- What problem or challenge was addressed
- What solution or approach was used  
- What impact or outcome was achieved

Return 2-3 insights in this format:
1. Problem: X | Solution: Y | Impact: Z
2. Problem: X | Solution: Y | Impact: Z
3. Problem: X | Solution: Y | Impact: Z
```

### Variation D: Comparative Analysis
```
Extract insights by comparing this content to common industry practices:

Content: "{content}"
{focus ? `Industry context: ${focus}` : ''}

Identify insights that show:
- Novel approaches that differ from standard practice
- Validation or contradiction of conventional wisdom
- Emerging patterns or trends worth noting

Provide 2-3 comparative insights explaining what makes each approach notable.
```

## Quality Metrics

### Insight Value
- **Actionability**: Can readers apply these insights?
- **Specificity**: Are insights concrete rather than generic?
- **Novelty**: Do insights provide new information or perspectives?
- **Relevance**: Do insights match the focus area and content?

### Insight Structure
- **Clarity**: Are insights clearly written and understandable?
- **Completeness**: Do insights capture the full context?
- **Conciseness**: Are insights appropriately detailed but not verbose?
- **Logical Flow**: Do insights build on each other coherently?

### Content Coverage
- **Key Points**: Do insights capture the most important content?
- **Balance**: Do insights cover different aspects of the topic?
- **Context**: Do insights include relevant background or implications?
- **Practical Focus**: Do insights emphasize practical applications?

## Testing Content Categories

### Success Stories & Case Studies
- **Expected**: Implementation strategies, success factors, measurable outcomes
- **Example**: "How Stripe built their ML fraud detection system"
- **Insight Focus**: Technical decisions, business impact, scaling challenges

### Technical Tutorials & Guides
- **Expected**: Best practices, common pitfalls, practical recommendations
- **Example**: "Complete guide to React server components"
- **Insight Focus**: Implementation patterns, performance considerations, adoption strategies

### Research & Analysis
- **Expected**: Emerging trends, implications, future directions
- **Example**: "State of AI development tools in 2024"
- **Insight Focus**: Market trends, tool evolution, developer preferences

### Opinion & Commentary  
- **Expected**: Perspective shifts, contrarian views, strategic implications
- **Example**: "Why design systems are failing at enterprise scale"
- **Insight Focus**: Systemic issues, alternative approaches, organizational factors

## Integration Notes

### Current Usage in System
- **Newsletter Generation**: Insights feed into digest summaries
- **Content Ranking**: High-insight content gets priority
- **Knowledge Base**: Insights stored for trend analysis
- **Recommendation**: Similar insights surface related content

### Processing Pipeline
1. **Content Analysis**: Extract insights from individual articles
2. **Cross-Reference**: Compare insights across similar content
3. **Validation**: Check insight quality and relevance
4. **Storage**: Index insights for search and retrieval
5. **Aggregation**: Combine insights for trend identification

### Performance Optimization

#### Batch Processing
```javascript
// Process multiple articles for insights
const batchInsightRequest = `
Extract key insights from these articles:

Article 1: "${content1}"
Article 2: "${content2}"

Focus: ${focusArea}

Return insights for each article:
Article 1:
1. Insight one
2. Insight two

Article 2:
1. Insight one  
2. Insight two
`
```

#### Caching Strategy
- **Content-Based**: Cache insights by content hash
- **Similarity**: Reuse insights for similar content
- **Update Policy**: Refresh insights when prompts change
- **TTL**: 7-day cache for insights extraction

### Error Handling
- **Parse Failures**: Extract any numbered items from response
- **Empty Responses**: Return generic insight about content type
- **Quality Validation**: Filter out low-quality or generic insights
- **Fallback**: Use content summary as backup insight source

## Evaluation Framework

### Human Evaluation
- **Expert Review**: Domain experts rate insight quality
- **User Testing**: Newsletter readers rate insight usefulness
- **Comparative Analysis**: Compare AI vs human-extracted insights
- **Longitudinal Study**: Track insight quality over time

### Automated Metrics
- **Specificity Score**: Measure insight concreteness vs generality
- **Actionability Score**: Identify actionable vs observational insights
- **Novelty Detection**: Compare against existing knowledge base
- **Relevance Matching**: Align insights with focus area requirements

### Success Criteria
- **Quality Rating**: >4.0/5.0 average from expert reviewers
- **Actionability**: >70% of insights include actionable recommendations
- **Relevance**: >85% of insights align with focus area priorities
- **Parse Success**: >95% of responses generate valid numbered lists