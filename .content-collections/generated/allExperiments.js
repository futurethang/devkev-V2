
export default [
  {
    "title": "API Mocker",
    "description": "AI-powered mock API generator that creates realistic endpoints with smart data generation based on schema descriptions",
    "date": new Date("2024-03-08T00:00:00.000Z"),
    "tags": [
      "api",
      "mocking",
      "testing",
      "development",
      "ai"
    ],
    "demoUrl": "https://api-mocker-ai.dev",
    "sourceUrl": "https://github.com/experiments/api-mocker",
    "buildPrompt": "Create a mock API generator that uses AI to understand endpoint descriptions and generate realistic JSON responses with proper relationships and data types",
    "mock": true,
    "content": "# API Mocker\n\nGenerate realistic mock APIs with intelligent data relationships using natural language descriptions.\n\n## Features\n\n- **Schema-Free Setup**: Describe endpoints in plain English\n- **Intelligent Data Generation**: AI creates realistic, related data\n- **Relationship Mapping**: Automatically handles foreign keys and references\n- **Multiple Formats**: JSON, GraphQL, REST endpoints\n- **Real-time Updates**: Live API available instantly\n\n## How It Works\n\nSimply describe your API needs:\n- \"User management system with profiles and posts\"\n- \"E-commerce API with products, orders, and inventory\"\n- \"Social media API with users, posts, comments, and likes\"\n\nThe AI generates:\n- Realistic field names and data types\n- Proper relationships between entities\n- Consistent data patterns\n- Appropriate HTTP methods and status codes\n\n## Example Generation\n\nInput: \"Blog API with authors and posts\"\n\nGenerated endpoints:\n```\nGET /api/authors\nGET /api/authors/:id\nGET /api/posts\nGET /api/posts/:id\nGET /api/authors/:id/posts\nPOST /api/posts\nPUT /api/posts/:id\nDELETE /api/posts/:id\n```\n\nWith realistic data:\n```json\n{\n  \"author\": {\n    \"id\": 1,\n    \"name\": \"Sarah Chen\",\n    \"email\": \"sarah.chen@example.com\",\n    \"bio\": \"Tech writer and developer\",\n    \"joined\": \"2023-01-15T10:30:00Z\"\n  }\n}\n```\n\n## Tech Stack\n\n- Express.js for API hosting\n- OpenAI API for data generation\n- Faker.js for realistic data\n- JSON Server for quick deployment\n\n## Use Cases\n\n- Frontend development without backend\n- API design prototyping\n- Integration testing\n- Demo applications\n\nPerfect for developers who need realistic mock data without manual JSON creation.",
    "_meta": {
      "filePath": "api-mocker.mdx",
      "fileName": "api-mocker.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "api-mocker"
    },
    "url": "/lab/api-mocker",
    "slug": "api-mocker",
    "_id": "api-mocker.mdx",
    "_raw": {
      "sourceFilePath": "api-mocker.mdx",
      "sourceFileName": "api-mocker.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "api-mocker",
      "contentType": "mdx"
    }
  },
  {
    "title": "Color Palette AI",
    "description": "AI-powered color palette generator that creates brand-appropriate color schemes based on industry, mood, and style preferences",
    "date": new Date("2024-03-18T00:00:00.000Z"),
    "tags": [
      "design",
      "colors",
      "branding",
      "ai",
      "palette"
    ],
    "demoUrl": "https://color-palette-ai.dev",
    "sourceUrl": "https://github.com/experiments/color-palette-ai",
    "buildPrompt": "Create an AI color palette generator that understands brand context, industry standards, and psychological color theory to generate appropriate color schemes",
    "mock": true,
    "content": "# Color Palette AI\n\nGenerate intelligent color palettes tailored to your brand, industry, and design goals using AI-powered color theory.\n\n## Features\n\n- **Context-Aware Generation**: Understands industry standards and brand personality\n- **Psychological Insights**: Explains color psychology behind each palette\n- **Multiple Formats**: HEX, RGB, HSL, and CSS custom properties\n- **Accessibility Checking**: Ensures WCAG contrast compliance\n- **Export Options**: Sketch, Figma, Adobe, and CSS formats\n\n## Input Options\n\n**Brand Description**: \n- \"Sustainable tech startup focused on renewable energy\"\n- \"Luxury fashion brand targeting millennials\"\n- \"Playful children's education app\"\n\n**Industry Selection**:\n- Technology, Healthcare, Finance, Education, Entertainment\n- Retail, Food & Beverage, Non-profit, Creative\n\n**Mood & Style**:\n- Professional, Playful, Elegant, Bold, Minimalist\n- Warm, Cool, Vibrant, Muted, High-contrast\n\n## AI-Generated Insights\n\nEach palette includes:\n- **Primary Colors**: Main brand colors with usage guidelines\n- **Secondary Colors**: Supporting colors for variety\n- **Neutral Colors**: Grays and background colors\n- **Accent Colors**: Highlight and call-to-action colors\n- **Psychology Explanation**: Why these colors work for your brand\n\n## Example Output\n\n**Sustainable Tech Startup**:\n```css\n:root {\n  --primary-green: #2D7D32;      /* Trust, growth, sustainability */\n  --secondary-blue: #1976D2;     /* Innovation, reliability */\n  --accent-orange: #FF6F00;      /* Energy, optimism */\n  --neutral-gray: #546E7A;       /* Balance, professionalism */\n  --background: #FAFAFA;         /* Clean, modern */\n}\n```\n\n## Tech Stack\n\n- React with color picker components\n- OpenAI API for context understanding\n- Chroma.js for color manipulation\n- Color accessibility APIs\n\n## Use Cases\n\n- Brand identity development\n- Website and app design\n- Marketing material creation\n- Design system establishment\n\nPerfect for designers and developers who want data-driven color decisions backed by psychology and industry best practices.",
    "_meta": {
      "filePath": "color-palette-ai.mdx",
      "fileName": "color-palette-ai.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "color-palette-ai"
    },
    "url": "/lab/color-palette-ai",
    "slug": "color-palette-ai",
    "_id": "color-palette-ai.mdx",
    "_raw": {
      "sourceFilePath": "color-palette-ai.mdx",
      "sourceFileName": "color-palette-ai.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "color-palette-ai",
      "contentType": "mdx"
    }
  },
  {
    "title": "Commit Message AI",
    "description": "AI-generated git commit messages that follow conventional commit standards and accurately describe code changes",
    "date": new Date("2024-03-20T00:00:00.000Z"),
    "tags": [
      "git",
      "commits",
      "ai",
      "development",
      "automation"
    ],
    "demoUrl": "https://commit-ai.dev",
    "sourceUrl": "https://github.com/experiments/commit-message-ai",
    "buildPrompt": "Build a tool that analyzes git diffs and generates meaningful commit messages following conventional commit format with proper scope and description",
    "mock": true,
    "content": "# Commit Message AI\n\nGenerate meaningful, standardized git commit messages by analyzing your code changes with AI.\n\n## Features\n\n- **Diff Analysis**: Examines actual code changes to understand intent\n- **Conventional Commits**: Follows conventional commit specification\n- **Scope Detection**: Automatically identifies affected modules/components\n- **Breaking Changes**: Detects and flags breaking changes\n- **Multiple Options**: Generates several commit message variations\n\n## Conventional Commit Format\n\nGenerated messages follow the standard:\n```\n<type>(<scope>): <description>\n\n[optional body]\n\n[optional footer(s)]\n```\n\n## Supported Types\n\n- **feat**: New features\n- **fix**: Bug fixes\n- **docs**: Documentation changes\n- **style**: Code style changes\n- **refactor**: Code refactoring\n- **test**: Test additions/modifications\n- **chore**: Build process or auxiliary tool changes\n\n## Example Analysis\n\n**Git Diff**:\n```diff\ndiff --git a/src/components/Button.tsx b/src/components/Button.tsx\nindex 1234567..abcdefg 100644\n--- a/src/components/Button.tsx\n+++ b/src/components/Button.tsx\n@@ -1,8 +1,12 @@\n export interface ButtonProps {\n   children: React.ReactNode;\n+  variant?: 'primary' | 'secondary';\n+  size?: 'sm' | 'md' | 'lg';\n }\n\n-export function Button({ children }: ButtonProps) {\n-  return <button className=\"btn\">{children}</button>\n+export function Button({ children, variant = 'primary', size = 'md' }: ButtonProps) {\n+  const classes = `btn btn-${variant} btn-${size}`;\n+  return <button className={classes}>{children}</button>\n }\n```\n\n**Generated Messages**:\n1. `feat(components): add variant and size props to Button component`\n2. `feat(ui): enhance Button with variant and size styling options`\n3. `feat(button): add customizable variant and size properties`\n\n## Advanced Features\n\n**Breaking Change Detection**:\n```\nfeat(api)!: change user authentication endpoint structure\n\nBREAKING CHANGE: The /auth endpoint now requires email instead of username\n```\n\n**Multi-scope Changes**:\n```\nfeat(auth,ui): implement OAuth login with new button styles\n```\n\n**Issue Linking**:\n```\nfix(validation): resolve email regex pattern bug\n\nFixes #123\n```\n\n## Integration Options\n\n- **CLI Tool**: `npx commit-ai` in any git repository\n- **Git Hook**: Automatic message generation on commit\n- **VS Code Extension**: Generate messages from diff view\n- **GitHub Action**: PR title and description generation\n\n## Tech Stack\n\n- Node.js CLI with git integration\n- OpenAI API for change analysis\n- Simple-git for repository operations\n- Conventional commits parser\n\n## Configuration\n\nCustomize generation with `.commitai.json`:\n```json\n{\n  \"maxLength\": 72,\n  \"types\": [\"feat\", \"fix\", \"docs\"],\n  \"scopes\": [\"auth\", \"ui\", \"api\"],\n  \"includeBody\": true,\n  \"linkIssues\": true\n}\n```\n\n## Use Cases\n\n- Maintaining consistent commit history\n- Automating commit message writing\n- Learning conventional commit standards\n- Code review and change tracking\n\n## Benefits\n\n- **Consistency**: Standardized message format across team\n- **Accuracy**: Messages reflect actual code changes\n- **Speed**: Faster commit workflow\n- **Quality**: Better commit history for project maintenance\n\nPerfect for developers and teams who want professional commit messages without the manual effort of writing them.",
    "_meta": {
      "filePath": "commit-message-ai.mdx",
      "fileName": "commit-message-ai.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "commit-message-ai"
    },
    "url": "/lab/commit-message-ai",
    "slug": "commit-message-ai",
    "_id": "commit-message-ai.mdx",
    "_raw": {
      "sourceFilePath": "commit-message-ai.mdx",
      "sourceFileName": "commit-message-ai.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "commit-message-ai",
      "contentType": "mdx"
    }
  },
  {
    "title": "Component Variants",
    "description": "Dynamic component variant generator that creates multiple design variations of React components using AI",
    "date": new Date("2024-03-10T00:00:00.000Z"),
    "tags": [
      "react",
      "components",
      "variants",
      "design-system",
      "ai"
    ],
    "demoUrl": "https://component-variants.dev",
    "sourceUrl": "https://github.com/experiments/component-variants",
    "buildPrompt": "Build a tool that takes a base React component and generates multiple design variants (different colors, sizes, styles) with live preview and code export",
    "mock": true,
    "content": "# Component Variants\n\nAutomatically generate multiple design variations of your React components with AI-powered styling suggestions.\n\n## Features\n\n- **Base Component Import**: Upload or paste your existing component code\n- **Variant Generation**: AI creates multiple design variations automatically\n- **Live Preview**: See all variants rendered side-by-side\n- **Export Options**: Download individual variants or complete design system\n- **Prop Mapping**: Automatically generates prop interfaces for variants\n\n## Supported Variations\n\n- **Color Schemes**: Primary, secondary, success, warning, danger themes\n- **Sizes**: XS through 3XL with proper scaling\n- **Styles**: Filled, outlined, ghost, gradient variations\n- **States**: Hover, focus, active, disabled states\n\n## Example Input/Output\n\nInput a basic button component:\n```jsx\nfunction Button({ children }) {\n  return <button>{children}</button>\n}\n```\n\nOutput includes variants like:\n- `ButtonPrimary`, `ButtonSecondary`, `ButtonDanger`\n- `ButtonSmall`, `ButtonLarge`\n- `ButtonOutlined`, `ButtonGhost`\n\n## Tech Stack\n\n- React 18 with TypeScript\n- Styled Components for dynamic styling\n- OpenAI API for variant generation\n- Storybook integration for documentation\n\n## Use Cases\n\n- Rapid prototyping of design systems\n- Creating consistent component libraries\n- Exploring design possibilities\n- Generating component documentation\n\nSaves hours of manual variant creation while maintaining design consistency.",
    "_meta": {
      "filePath": "component-variants.mdx",
      "fileName": "component-variants.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "component-variants"
    },
    "url": "/lab/component-variants",
    "slug": "component-variants",
    "_id": "component-variants.mdx",
    "_raw": {
      "sourceFilePath": "component-variants.mdx",
      "sourceFileName": "component-variants.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "component-variants",
      "contentType": "mdx"
    }
  },
  {
    "title": "CSS Grid Generator",
    "description": "AI-powered tool that generates CSS Grid layouts based on natural language descriptions and visual mockups",
    "date": new Date("2024-03-15T00:00:00.000Z"),
    "tags": [
      "css",
      "grid",
      "ai",
      "layout",
      "generator"
    ],
    "demoUrl": "https://css-grid-ai.dev",
    "sourceUrl": "https://github.com/experiments/css-grid-generator",
    "buildPrompt": "Create a CSS Grid layout generator that takes natural language input like 'create a 3-column layout with sidebar and main content' and outputs clean CSS Grid code with visual preview",
    "mock": true,
    "content": "# CSS Grid Generator\n\nAn intelligent CSS Grid layout generator that transforms natural language descriptions into production-ready CSS Grid code.\n\n## Features\n\n- **Natural Language Input**: Describe your layout in plain English\n- **Visual Preview**: See your grid layout rendered in real-time\n- **Responsive Variants**: Automatically generate mobile-friendly versions\n- **Clean Code Output**: Export optimized CSS with proper naming conventions\n\n## How It Works\n\nThe tool uses AI to parse layout descriptions and translate them into semantic CSS Grid properties. Simply describe what you want:\n\n- \"Three equal columns with gaps\"\n- \"Header, main content, sidebar, footer layout\"\n- \"Masonry-style grid for image gallery\"\n\n## Tech Stack\n\n- Next.js for the interface\n- OpenAI API for natural language processing\n- CSS Grid for layout generation\n- Tailwind CSS for styling\n\n## Example Output\n\n```css\n.grid-container {\n  display: grid;\n  grid-template-columns: 1fr 300px;\n  grid-template-rows: auto 1fr auto;\n  grid-template-areas: \n    \"header header\"\n    \"main sidebar\"\n    \"footer footer\";\n  gap: 1rem;\n}\n```\n\nPerfect for developers who want to quickly prototype layouts without memorizing complex Grid syntax.",
    "_meta": {
      "filePath": "css-grid-generator.mdx",
      "fileName": "css-grid-generator.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "css-grid-generator"
    },
    "url": "/lab/css-grid-generator",
    "slug": "css-grid-generator",
    "_id": "css-grid-generator.mdx",
    "_raw": {
      "sourceFilePath": "css-grid-generator.mdx",
      "sourceFileName": "css-grid-generator.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "css-grid-generator",
      "contentType": "mdx"
    }
  },
  {
    "title": "AI-Powered CSS Theme Generator",
    "description": "Interactive tool that generates complete CSS theme systems from a single color input using AI-suggested complementary palettes",
    "date": new Date("2024-11-25T00:00:00.000Z"),
    "tags": [
      "css",
      "ai",
      "design-tools",
      "experiment"
    ],
    "demoUrl": "https://codepen.io/futurethang/pen/css-theme-gen",
    "buildPrompt": "Create a tool that generates a complete CSS theme (colors, typography, spacing) from a single brand color input, with AI suggestions for complementary colors",
    "mock": true,
    "content": "Built this in 2 hours with Claude's help to solve a recurring problem: clients who have \"a brand color\" but need a complete design system. The tool generates a full CSS theme with proper color scales, semantic tokens, and accessibility checks.\n\n## How It Works\n\n1. **Input a single hex color** - Your brand's primary color\n2. **AI generates complementary colors** - Using color theory algorithms\n3. **Automatic scale generation** - Creates 10 shades (50-900) for each color  \n4. **Semantic token mapping** - Maps colors to purpose (primary, success, warning, etc.)\n5. **Copy-paste CSS** - Get variables ready for your project\n\n## Key Features\n\n- **WCAG contrast checking** - Ensures text/background combinations are accessible\n- **Multiple export formats** - CSS variables, Sass, JSON tokens\n- **Real-time preview** - See your theme applied to common UI components\n- **Color blindness simulation** - Check how your palette appears to all users\n\n## AI Integration\n\nUsed Claude to implement the color theory algorithms. The trickiest part was generating perceptually uniform color scales - traditional HSL manipulation creates muddy mid-tones. Claude helped implement a LAB color space approach that maintains vibrancy across the scale.\n\n```javascript\n// Claude-assisted perceptual scaling\nfunction generateColorScale(baseColor, steps = 10) {\n  const lab = hexToLab(baseColor);\n  const scale = [];\n  \n  for (let i = 0; i < steps; i++) {\n    const lightness = 95 - (i * 9); // Even distribution\n    scale.push(labToHex({\n      ...lab,\n      l: lightness\n    }));\n  }\n  \n  return scale;\n}\n```\n\n## Learnings\n\n- Color math is harder than it looks\n- Accessibility should be built-in, not bolted on\n- Real-time feedback dramatically improves UX\n- AI excels at implementing complex algorithms from descriptions\n\nThis experiment led to a consulting project where I built a custom theme generator for a design system. Sometimes the best portfolio pieces are tools that solve your own problems!",
    "_meta": {
      "filePath": "css-theme-generator.mdx",
      "fileName": "css-theme-generator.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "css-theme-generator"
    },
    "url": "/lab/css-theme-generator",
    "slug": "css-theme-generator",
    "_id": "css-theme-generator.mdx",
    "_raw": {
      "sourceFilePath": "css-theme-generator.mdx",
      "sourceFileName": "css-theme-generator.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "css-theme-generator",
      "contentType": "mdx"
    }
  },
  {
    "title": "Markdown to Slides",
    "description": "Convert markdown documents into beautiful presentation slides with AI-powered layout optimization and design suggestions",
    "date": new Date("2024-03-16T00:00:00.000Z"),
    "tags": [
      "markdown",
      "presentations",
      "slides",
      "ai",
      "design"
    ],
    "demoUrl": "https://md-to-slides.dev",
    "sourceUrl": "https://github.com/experiments/markdown-to-slides",
    "buildPrompt": "Create a tool that converts markdown files into presentation slides with intelligent slide breaks, layout optimization, and design theme application",
    "mock": true,
    "content": "# Markdown to Slides\n\nTransform markdown documents into professional presentation slides with AI-powered layout and design optimization.\n\n## Features\n\n- **Intelligent Slide Breaks**: AI determines optimal content distribution\n- **Layout Optimization**: Automatically chooses best layouts for content types\n- **Theme Generation**: AI-suggested themes based on content analysis\n- **Interactive Elements**: Convert lists to animations and transitions\n- **Export Options**: PDF, PowerPoint, HTML, and web-hosted presentations\n\n## How It Works\n\n**Input**: Standard markdown with headers, lists, code blocks, and images\n**Processing**: AI analyzes content structure and generates slide layouts\n**Output**: Professional presentation with optimized visual hierarchy\n\n## Content Analysis\n\nThe AI identifies and optimizes:\n- **Title Slides**: H1 headers become section dividers\n- **Content Slides**: H2/H3 headers with supporting content\n- **List Presentations**: Bullet points with progressive disclosure\n- **Code Demonstrations**: Syntax-highlighted code with explanations\n- **Image Layouts**: Optimal image placement and sizing\n\n## Example Transformation\n\n**Markdown Input**:\n```markdown\n# Project Overview\n\n## Problem Statement\n- User engagement is declining\n- Complex navigation structure\n- Performance issues on mobile\n\n## Solution Approach\n- Redesign user interface\n- Implement progressive web app\n- Optimize for mobile-first\n\n## Expected Results\nThe new design should improve:\n1. User retention by 25%\n2. Page load speed by 40%\n3. Mobile conversion rates\n```\n\n**Generated Slides**:\n1. **Title Slide**: \"Project Overview\" with clean typography\n2. **Problem Slide**: Animated bullet points with icons\n3. **Solution Slide**: Process flow with visual elements\n4. **Results Slide**: Metrics with progress indicators\n\n## Design Themes\n\nAI suggests themes based on content:\n- **Technical**: Clean, code-focused layouts\n- **Business**: Professional, data-driven designs\n- **Creative**: Visual-heavy, artistic layouts\n- **Educational**: Clear, structured presentation style\n\n## Tech Stack\n\n- Unified (remark/rehype) for markdown parsing\n- React for slide rendering\n- Reveal.js for presentation engine\n- OpenAI API for content analysis\n- Canvas API for custom graphics\n\n## Export Formats\n\n- **Web Presentation**: Hosted, shareable URL\n- **PDF Export**: High-quality printable slides\n- **PowerPoint**: Native .pptx for editing\n- **HTML Package**: Self-contained presentation\n\n## Use Cases\n\n- Technical documentation to presentations\n- Blog posts to conference talks\n- README files to project pitches\n- Meeting notes to stakeholder presentations\n\nPerfect for developers and content creators who want to quickly turn written content into engaging presentations.",
    "_meta": {
      "filePath": "markdown-to-slides.mdx",
      "fileName": "markdown-to-slides.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "markdown-to-slides"
    },
    "url": "/lab/markdown-to-slides",
    "slug": "markdown-to-slides",
    "_id": "markdown-to-slides.mdx",
    "_raw": {
      "sourceFilePath": "markdown-to-slides.mdx",
      "sourceFileName": "markdown-to-slides.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "markdown-to-slides",
      "contentType": "mdx"
    }
  },
  {
    "title": "Regex Explainer",
    "description": "Natural language regex explanation tool that breaks down complex regular expressions into human-readable descriptions",
    "date": new Date("2024-03-12T00:00:00.000Z"),
    "tags": [
      "regex",
      "explanation",
      "learning",
      "development",
      "ai"
    ],
    "demoUrl": "https://regex-explainer.dev",
    "sourceUrl": "https://github.com/experiments/regex-explainer",
    "buildPrompt": "Build a tool that takes complex regular expressions and explains them in plain English, with visual breakdown and test examples",
    "mock": true,
    "content": "# Regex Explainer\n\nTransform cryptic regular expressions into clear, human-readable explanations with visual breakdown and examples.\n\n## Features\n\n- **Plain English Explanations**: Convert regex patterns to natural language\n- **Visual Breakdown**: Highlight and explain each part of the pattern\n- **Live Testing**: Test regex against sample inputs in real-time\n- **Example Generation**: AI creates relevant test cases\n- **Pattern Variations**: Suggest alternative regex approaches\n\n## How It Works\n\nPaste any regular expression and get:\n1. **Overall Purpose**: What the regex is trying to match\n2. **Part-by-Part Breakdown**: Each component explained\n3. **Visual Highlighting**: Color-coded pattern segments\n4. **Test Cases**: Examples of matching and non-matching strings\n5. **Common Pitfalls**: Potential issues and edge cases\n\n## Example Explanation\n\n**Input regex:**\n```\n^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])$\n```\n\n**Output:**\n\n**Purpose**: Validates email addresses according to RFC 5322 specification\n\n**Breakdown**:\n- `^` - Start of string\n- `(?:...)` - Non-capturing group for email username  \n- Valid username characters with special symbols allowed\n- `@` - Required @ symbol  \n- Domain validation with support for both domain names and IP addresses\n- `$` - End of string\n\n## Tech Stack\n\n- React with syntax highlighting\n- OpenAI API for explanations\n- RegExp parser for pattern analysis\n- Monaco Editor for regex input\n\n## Use Cases\n\n- Learning regular expressions\n- Debugging complex patterns\n- Code review and documentation\n- Teaching regex concepts\n\nMakes regex accessible to developers of all skill levels.",
    "_meta": {
      "filePath": "regex-explainer.mdx",
      "fileName": "regex-explainer.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "regex-explainer"
    },
    "url": "/lab/regex-explainer",
    "slug": "regex-explainer",
    "_id": "regex-explainer.mdx",
    "_raw": {
      "sourceFilePath": "regex-explainer.mdx",
      "sourceFileName": "regex-explainer.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "regex-explainer",
      "contentType": "mdx"
    }
  },
  {
    "title": "SQL Optimizer",
    "description": "AI-powered SQL query optimization tool that analyzes queries and provides performance improvement suggestions with explanations",
    "date": new Date("2024-03-14T00:00:00.000Z"),
    "tags": [
      "sql",
      "optimization",
      "database",
      "performance",
      "ai"
    ],
    "demoUrl": "https://sql-optimizer-ai.dev",
    "sourceUrl": "https://github.com/experiments/sql-optimizer",
    "buildPrompt": "Build a SQL query optimizer that uses AI to analyze queries, identify performance bottlenecks, and suggest optimizations with detailed explanations",
    "mock": true,
    "content": "# SQL Optimizer\n\nAnalyze and optimize SQL queries with AI-powered performance suggestions and detailed explanations.\n\n## Features\n\n- **Query Analysis**: Deep analysis of SQL structure and performance patterns\n- **Optimization Suggestions**: Specific recommendations for improvement\n- **Performance Metrics**: Estimated execution time and resource usage\n- **Index Recommendations**: Suggested indexes for better performance\n- **Query Rewriting**: Alternative query structures that perform better\n\n## Optimization Categories\n\n**Indexing**:\n- Missing index identification\n- Composite index suggestions\n- Unused index detection\n\n**Query Structure**:\n- JOIN optimization\n- Subquery to JOIN conversion\n- WHERE clause improvements\n\n**Performance Patterns**:\n- N+1 query detection\n- Inefficient LIKE patterns\n- Unnecessary DISTINCT usage\n\n## Example Optimization\n\n**Original Query**:\n```sql\nSELECT * FROM users u\nWHERE u.email LIKE '%@gmail.com%'\nAND u.created_at > '2023-01-01'\nORDER BY u.name;\n```\n\n**AI Analysis**:\n- ⚠️ `LIKE '%@gmail.com%'` prevents index usage\n- ⚠️ `SELECT *` retrieves unnecessary columns\n- ⚠️ Missing index on `created_at`\n- ⚠️ ORDER BY may require filesort\n\n**Optimized Query**:\n```sql\nSELECT u.id, u.name, u.email, u.created_at \nFROM users u\nWHERE u.email LIKE '%@gmail.com'\nAND u.created_at > '2023-01-01'\nAND u.created_at IS NOT NULL\nORDER BY u.name;\n```\n\n**Recommended Indexes**:\n```sql\nCREATE INDEX idx_users_created_name ON users(created_at, name);\nCREATE INDEX idx_users_email_suffix ON users(email) WHERE email LIKE '%@gmail.com';\n```\n\n## Supported Databases\n\n- PostgreSQL\n- MySQL\n- SQL Server\n- Oracle\n- SQLite\n\n## Tech Stack\n\n- Node.js with SQL parsing libraries\n- OpenAI API for optimization analysis\n- Database-specific query planners\n- Performance metrics calculation\n\n## Use Cases\n\n- Database performance tuning\n- Query review and optimization\n- Learning SQL best practices\n- Production query monitoring\n\n## Performance Insights\n\nEach optimization includes:\n- **Before/After Metrics**: Estimated performance improvement\n- **Explanation**: Why the optimization works\n- **Trade-offs**: Potential drawbacks or considerations\n- **Implementation Steps**: How to apply the changes\n\nPerfect for developers and DBAs who want to write efficient SQL without deep database internals knowledge.",
    "_meta": {
      "filePath": "sql-optimizer.mdx",
      "fileName": "sql-optimizer.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "sql-optimizer"
    },
    "url": "/lab/sql-optimizer",
    "slug": "sql-optimizer",
    "_id": "sql-optimizer.mdx",
    "_raw": {
      "sourceFilePath": "sql-optimizer.mdx",
      "sourceFileName": "sql-optimizer.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "sql-optimizer",
      "contentType": "mdx"
    }
  },
  {
    "title": "Instant Theme Switcher",
    "description": "CSS-only theme switching with zero JavaScript using CSS variables",
    "date": new Date("2024-01-12T00:00:00.000Z"),
    "tags": [
      "css",
      "experiment",
      "accessibility"
    ],
    "demoUrl": "https://codepen.io/kevinhyde/pen/theme-switcher",
    "buildPrompt": "Create a theme switcher that works without JavaScript using only CSS variables and radio buttons",
    "mock": true,
    "content": "A pure CSS theme switching mechanism that demonstrates the power of CSS variables for creating theme-agnostic components.\n\nBuilt in 15 minutes with Claude's assistance, this experiment shows how modern CSS can handle complex UI state without JavaScript.",
    "_meta": {
      "filePath": "theme-switcher.mdx",
      "fileName": "theme-switcher.mdx",
      "directory": ".",
      "extension": "mdx",
      "path": "theme-switcher"
    },
    "url": "/lab/theme-switcher",
    "slug": "theme-switcher",
    "_id": "theme-switcher.mdx",
    "_raw": {
      "sourceFilePath": "theme-switcher.mdx",
      "sourceFileName": "theme-switcher.mdx",
      "sourceFileDir": ".",
      "flattenedPath": "theme-switcher",
      "contentType": "mdx"
    }
  }
]