# AI-Powered Content Aggregator - Learning Roadmap

## Overview
Building a personal AI-powered content aggregator to stay at the cutting edge of AI-augmented development. This system will be configuration-first, allowing easy pivoting between focus areas without rewiring the stack.

## Architecture Goals
- **Configuration-First**: Change focus areas via JSON configs
- **Flexible Focus Profiles**: Blend interests (Product, ML, Design)
- **AI-Powered Processing**: Summarization, relevance scoring, deduplication
- **Learning Documentation**: Document every step for content creation

## 4-Week Learning Journey

### Week 1: Foundation & RSS Basics
**Learning Goals:**
- Understand RSS/Atom feed formats
- TypeScript configuration patterns
- Basic Next.js API routes
- Error handling and data validation

**Technologies:**
- `rss-parser` for RSS feed parsing
- Zod for schema validation
- TypeScript utility types

**Daily Breakdown:**
- Day 1-2: RSS fundamentals + first parser
- Day 3-4: TypeScript config system
- Day 5-6: Basic aggregation logic
- Day 7: Testing & documentation

**Deliverable:** Working RSS aggregator for 3-5 dev blogs
**Content Output:** "Building My First RSS Aggregator in TypeScript"

### Week 2: API Integration & Data Sources
**Learning Goals:**
- REST API authentication patterns
- Rate limiting and request queuing
- Data normalization strategies
- Caching implementations

**Technologies:**
- Twitter API v2
- GitHub REST API
- Reddit API
- `p-queue` for rate limiting
- Upstash for caching

**Daily Breakdown:**
- Day 1-2: Twitter API integration
- Day 3-4: GitHub trending/search APIs
- Day 5-6: Reddit API + HackerNews
- Day 7: Unified data interface

**Deliverable:** Multi-source aggregator with 10+ data sources
**Content Output:** "Connecting to 10 Data Sources Without Getting Rate Limited"

### Week 3: AI Processing & Intelligence
**Learning Goals:**
- LLM API integration patterns
- Prompt engineering for summarization
- Relevance scoring algorithms
- Content deduplication techniques

**Technologies:**
- OpenAI/Anthropic APIs
- Embedding models for similarity
- Vector databases (Supabase Vector)
- Content similarity algorithms

**Daily Breakdown:**
- Day 1-2: AI summarization system
- Day 3-4: Relevance scoring with embeddings
- Day 5-6: Deduplication & clustering
- Day 7: Quality assessment metrics

**Deliverable:** AI-powered content processing pipeline
**Content Output:** "Using AI to Turn Information Overload into Signal"

### Week 4: Configuration & User Experience
**Learning Goals:**
- Configuration-driven architecture
- Real-time UI updates
- Data visualization basics
- Deployment & monitoring

**Technologies:**
- React Query for state management
- Recharts for visualization
- Server-sent events for real-time updates
- Vercel cron jobs

**Daily Breakdown:**
- Day 1-2: Profile switching system
- Day 3-4: Dashboard UI with charts
- Day 5-6: Real-time feed updates
- Day 7: Deployment & monitoring

**Deliverable:** Full configurable system with UI
**Content Output:** "Building a Configurable AI News Feed in 30 Days"

## Progress Tracking

### Week 1 Progress
- [ ] Project structure setup
- [ ] RSS parser implementation
- [ ] TypeScript types for feed data
- [ ] Basic aggregation logic
- [ ] Error handling
- [ ] Unit tests
- [ ] Documentation

### Week 2 Progress
- [ ] Twitter API setup
- [ ] GitHub API integration
- [ ] Reddit API connection
- [ ] Rate limiting implementation
- [ ] Data normalization
- [ ] Caching layer
- [ ] Documentation

### Week 3 Progress
- [ ] OpenAI/Claude API setup
- [ ] Summarization prompts
- [ ] Relevance scoring algorithm
- [ ] Embedding generation
- [ ] Similarity calculations
- [ ] Deduplication logic
- [ ] Documentation

### Week 4 Progress
- [ ] Configuration system
- [ ] Profile management
- [ ] Dashboard UI
- [ ] Real-time updates
- [ ] Data visualizations
- [ ] Deployment setup
- [ ] Documentation

## Content Creation Plan

### Technical Posts
1. "RSS Parsing in 2024: Modern Approaches"
2. "Rate Limiting Strategies for Multi-API Apps"
3. "Prompt Engineering for Content Summarization"
4. "Building Configuration-First Applications"

### Learning Journey Posts
1. "30 Days Building an AI Aggregator: What I Learned"
2. "Mistakes I Made Building My First AI System"
3. "Tools That Surprised Me During This Build"
4. "From Zero to AI-Powered Feed in 4 Weeks"

### Interactive Content
1. Live coding sessions for each week
2. Architecture walkthrough video
3. Debugging session recordings
4. Configuration playground demo

## Success Metrics
- Aggregate 100+ pieces of content daily
- 90%+ relevance accuracy for focus profiles
- < 5% duplicate content
- < 2s processing time per item
- 10+ blog posts from the journey
- 4+ video tutorials created

## Next Steps
1. Set up project structure
2. Create failing tests for RSS parser
3. Implement RSS parser
4. Document learnings in `/docs/week-1/day-1-rss-basics.md`