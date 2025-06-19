# External Prompt Testing Guide

This guide walks you through testing and optimizing prompts using external AI platforms and tools.

## 🎯 Overview

Our prompts are designed to be **platform-agnostic** and can be easily tested on any LLM platform. This allows you to:

- Compare performance across different models (GPT-4, Claude, etc.)
- Optimize prompts without affecting production systems
- A/B test variations before deployment
- Leverage advanced prompt engineering tools

## 🚀 Quick Start

### 1. Generate Sample Content
```bash
cd aggregator/prompts
tsx generate-samples.ts
```

This creates:
- `samples/[profile]-samples.json` - Raw content samples
- `samples/[profile]-playground.json` - OpenAI Playground format
- `samples/[profile]-claude-workbook.md` - Claude Console format
- `samples/combined-test-dataset.json` - Full test dataset

### 2. Choose Your Platform
- **OpenAI Playground** - Best for GPT models, easy iteration
- **Claude Console** - Best for Anthropic models, great reasoning
- **LangSmith** - Best for versioning and systematic testing
- **Poe/Perplexity** - Quick testing across multiple models

## 🔧 Platform-Specific Setup

### OpenAI Playground

#### Initial Setup
1. Go to [platform.openai.com/playground](https://platform.openai.com/playground)
2. Select **Chat** mode
3. Choose your model (GPT-4 recommended)
4. Set initial parameters:
   - **Temperature**: 0.3 (for consistency)
   - **Max tokens**: 500 (adjust per prompt type)

#### Testing Workflow
1. **Load Sample Content**:
   ```json
   // From samples/ai-product-playground.json
   {
     "content": "GPT-4 has transformed...",
     "expectedScore": 0.85
   }
   ```

2. **Test Summarization**:
   ```
   System: You are an expert technical content analyst.
   
   User: Focus area: AI-powered product development
   
   Please analyze this content and provide a structured summary in JSON format:
   
   Content: "[PASTE CONTENT HERE]"
   
   Return a JSON object with these fields:
   - summary: A concise 2-3 sentence summary
   - keyPoints: Array of 3-5 key points 
   - tags: Array of relevant topic tags
   - insights: Array of 2-3 key insights or takeaways
   - confidence: Confidence score from 0.0 to 1.0
   ```

3. **Save Variations**:
   - Use Playground's "Save" feature for each variation
   - Name systematically: "Summarization_v1", "Summarization_v2_directive"
   - Document changes and performance notes

#### Parameter Testing
Test these variations systematically:

| Parameter | Values to Test | Purpose |
|-----------|----------------|---------|
| Temperature | 0.1, 0.3, 0.5, 0.7 | Consistency vs creativity |
| Max Tokens | 200, 300, 500, 1000 | Output length optimization |
| Top P | 0.9, 0.95, 1.0 | Response diversity |
| Frequency Penalty | 0.0, 0.3, 0.6 | Reduce repetition |

### Claude Console (Anthropic)

#### Initial Setup
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create a new conversation
3. Use Claude-3 Sonnet or Opus for best results

#### Testing Workflow
1. **Load Workbook**: Open `samples/[profile]-claude-workbook.md`
2. **Copy-Paste Testing**: Use the pre-formatted prompts
3. **Iterative Refinement**: Claude excels at explaining its reasoning

#### Claude-Specific Advantages
- **Reasoning Transparency**: Ask "Why did you score this as 0.7?"
- **Prompt Refinement**: Ask Claude to improve its own prompts
- **Multi-turn Testing**: Build conversation context for better results

Example conversation:
```
Human: [PASTE RELEVANCE SCORING PROMPT WITH CONTENT]

Claude: 0.75