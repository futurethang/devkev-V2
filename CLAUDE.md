# Kevin Hyde Portfolio - AI Context Document

## Project Overview
This is Kevin Hyde's personal portfolio website, designed to showcase his expertise as an AI-Augmented Product Engineer. The site demonstrates mastery of modern AI-powered development practices and serves as a living example of high-velocity, AI-first software development.

## User Context
- **Name:** Kevin Hyde
- **Location:** Seattle, WA
- **Role:** AI-Augmented Product Engineer (formerly Design Engineer)
- **Core Skills:** TypeScript, React, Next.js, Node.js, AI Integration (Claude, OpenAI, LangChain)
- **Unique Value:** Combines deep product thinking with design sensibility and advanced AI collaboration skills

## Project Goals
1. Position Kevin as a top-tier developer who leverages AI for 10x productivity
2. Showcase a high volume of shipped projects and experiments
3. Share AI development workflows and techniques
4. Create an easily maintainable platform for continuous content creation
5. Build with semantic, AI-parseable architecture

## Technical Architecture

### Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Package Manager:** pnpm (ALWAYS use pnpm, never npm or yarn)
- **Styling:** CSS Modules + CSS Variables (theme agnostic, no Tailwind utilities)
- **Content:** MDX with Contentlayer for type-safe markdown
- **Database:** Supabase (PostgreSQL with vector embeddings)
- **Media CDN:** Cloudflare R2 + Images
- **Deployment:** Vercel
- **Analytics:** Posthog

### Project Structure
```
/
├── app/                    # Next.js App Router
│   ├── (site)/            # Main website routes
│   │   ├── page.tsx       # Homepage
│   │   ├── page.module.css # Homepage styles
│   │   ├── projects/      # Project showcase
│   │   ├── blog/          # Writing/posts
│   │   ├── lab/           # Live experiments
│   │   └── about/         # About/resume
│   ├── api/               # API routes
│   │   ├── llm/           # AI-friendly data endpoints
│   │   └── analytics/     # Usage tracking
│   └── _components/       # Shared components
├── content/               # MDX content files
│   ├── projects/          # Project documentation
│   ├── posts/             # Blog posts
│   └── experiments/       # Quick demos
├── lib/                   # Utilities
│   ├── contentlayer.ts    # Content configuration
│   ├── ai/                # AI integration helpers
│   └── utils/             # General utilities
├── styles/                # Global styles
│   ├── globals.css        # CSS reset and variables
│   └── themes/            # Theme variations
└── public/                # Static assets
```

### Design Principles
1. **Semantic HTML First:** Every component uses proper semantic HTML with ARIA labels
2. **Theme Agnostic:** All styling through CSS variables, allowing complete visual redesigns without markup changes
3. **AI Parseable:** Structured data (JSON-LD) on every page, OpenGraph optimization
4. **Performance First:** Static generation where possible, dynamic only when necessary
5. **Type Safety:** Full TypeScript coverage with strict mode

## Styling Strategy

### Why No Tailwind Utilities
We avoid Tailwind utility classes to maintain theme agnosticism. Instead:
- Use CSS Modules for component-scoped styles
- Define all design tokens as CSS variables
- Use semantic class names that describe purpose, not appearance
- Borrow Tailwind's design scale for our variables (spacing, sizing, etc.)

### CSS Architecture
```css
/* styles/globals.css - Design tokens */
:root {
  /* Colors - Abstract naming */
  --color-primary: #0066cc;
  --color-secondary: #6366f1;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  
  /* Spacing - Based on Tailwind scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;
  --space-16: 4rem;
  
  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: 'SF Mono', Monaco, monospace;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  
  /* Borders, shadows, etc. */
  --radius-base: 0.5rem;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Dark theme override */
[data-theme="dark"] {
  --color-background: #0f172a;
  --color-text: #f8fafc;
  /* ... other overrides */
}
```

```css
/* Component CSS Module example */
.hero {
  background: var(--color-background);
  padding: var(--space-16) var(--space-4);
}

.heroTitle {
  color: var(--color-text);
  font-size: var(--text-xl);
  margin-bottom: var(--space-4);
}
```

## Content Strategy

### Main Sections
1. **Homepage**
   - Hero: Dynamic tagline about AI-augmented development
   - Featured Projects: 3-4 latest high-impact projects
   - Recent Posts: Latest thoughts on AI development
   - Stats: GitHub activity, project count, lines of AI-generated code

2. **Projects (/projects)**
   - Grid layout with live preview tiles
   - Each project shows: Built time, AI assistance %, Tech stack
   - Categories: Full Apps, Experiments, Open Source, Client Work
   - "Built Live" badge for AI-pair-programmed projects

3. **Lab (/lab)**
   - Weekly experiments and prototypes
   - Embedded demos (CodeSandbox/StackBlitz)
   - Source code with prompts that created it
   - Build process documentation

4. **Blog (/blog)**
   - AI development techniques
   - Productivity workflows
   - Tool reviews and configurations
   - Case studies of AI-assisted builds

5. **About (/about)**
   - Professional narrative emphasizing AI collaboration
   - Interactive resume
   - Skills matrix with proficiency levels
   - Contact information

### AI-First Features
- `/api/llm/summary` - Returns site content in LLM-friendly format
- Semantic search across all content
- Prompt library for successful AI interactions
- Public metrics dashboard showing AI-assisted productivity

## Development Guidelines

### Component Structure
```tsx
// Every component follows this pattern
import styles from './ComponentName.module.css'

interface ComponentProps {
  // Explicit, typed props
}

export function ComponentName({ props }: ComponentProps) {
  return (
    <section className={styles.container} aria-label="Descriptive label">
      {/* Semantic HTML structure */}
    </section>
  )
}
```

### Content Files (MDX)
```mdx
---
title: "Project Title"
description: "Brief description for SEO"
date: "2024-01-15"
tags: ["ai", "nextjs", "experiment"]
aiAssisted: true
buildTime: "2 hours"
liveUrl: "https://demo.com"
githubUrl: "https://github.com/..."
featured: true
---

Content with full MDX support...
```

## AI Integration Points

1. **Content Generation**
   - Use Claude to generate MDX files from project descriptions
   - Automated weekly experiment ideas
   - Blog post outlines from bullet points

2. **Code Quality**
   - All code should be parseable by AI tools
   - Include descriptive comments for complex logic
   - Use consistent naming conventions

3. **Documentation**
   - Every feature includes implementation notes
   - Prompt examples that created the feature
   - Time tracking for AI-assisted vs manual coding

## Performance Targets
- Lighthouse score: 95+ across all metrics
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Bundle size: < 100KB for initial load

## Deployment Workflow
1. Local development with `pnpm dev`
2. Type checking with `pnpm type-check`
3. Build validation with `pnpm build`
4. Preview deployment on Vercel
5. Production deployment on merge to main

## Future Enhancements
- AI chat interface for portfolio exploration
- Automated project documentation from code
- Integration with development metrics (WakaTime, GitHub)
- Live coding session replays
- Collaborative AI project submissions

## Commands Reference
```bash
# ALWAYS USE PNPM - NEVER USE NPM OR YARN

# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm type-check   # TypeScript validation
pnpm lint         # ESLint validation

# Content
pnpm content:new  # Create new content file
pnpm content:build # Rebuild Contentlayer

# Deployment
pnpm deploy:preview # Deploy to Vercel preview
pnpm deploy:prod    # Deploy to production

# Package Management
pnpm add [package]      # Add dependency
pnpm add -D [package]   # Add dev dependency
pnpm install            # Install all dependencies
pnpm update             # Update dependencies
```

## Key Decisions
1. **MDX over CMS:** Faster iteration, version control, AI-friendly
2. **CSS Modules over Tailwind utilities:** True theme agnosticism, semantic HTML
3. **pnpm over npm:** Faster, more efficient, better monorepo support
4. **Cloudflare R2:** Cost-effective media storage with global CDN
5. **Supabase:** Full-featured PostgreSQL with real-time capabilities and vector support
6. **Vercel:** Optimal Next.js hosting with preview deployments

## Theme System
The site is built to support multiple themes without changing markup:
- All colors, spacing, typography use CSS variables
- Themes are simply different CSS variable definitions
- Can switch themes at runtime with `data-theme` attribute
- Future themes can completely change the visual design
- Components use semantic naming (primary, surface) not visual (blue, gray)

Remember: This is an AI-FIRST project. Every decision should optimize for:
1. AI comprehension and parsing
2. Rapid iteration and deployment
3. Showcasing AI-augmented development capabilities
4. Maintaining clean, semantic code structure