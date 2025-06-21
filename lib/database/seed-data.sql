-- Seed data for Aggregator System
-- This file contains all default sources and focus profiles
-- Run this after schema.sql to populate the database with initial data

-- Clear existing data (optional - comment out if you want to preserve existing data)
-- TRUNCATE sources, focus_profiles CASCADE;

-- Insert default sources
INSERT INTO sources (id, name, type, url, enabled, fetch_interval, weight, config) VALUES
-- RSS Sources
('indie-hackers-rss', 'Indie Hackers', 'rss', 'https://www.indiehackers.com/posts/newest.rss', true, 60, 0.8, '{"timeout": 10000}'),
('hn-rss', 'Hacker News', 'rss', 'https://hnrss.org/frontpage', true, 30, 0.7, '{"timeout": 10000}'),
('dev-to-ai', 'Dev.to AI Posts', 'rss', 'https://dev.to/feed/tag/ai', true, 120, 0.6, '{"timeout": 10000}'),
('toward-data-science', 'Towards Data Science', 'rss', 'https://towardsdatascience.com/feed', true, 180, 0.5, '{"timeout": 10000}'),
('ai-news-mit', 'MIT AI News', 'rss', 'https://news.mit.edu/rss/topic/artificial-intelligence2', true, 360, 0.4, '{"timeout": 10000}'),
('techcrunch', 'TechCrunch', 'rss', 'https://techcrunch.com/feed/', true, 120, 0.8, '{"timeout": 10000}'),
('stratechery', 'Stratechery', 'rss', 'https://stratechery.com/feed/', false, 1440, 0.9, '{"timeout": 10000}'),
('netflix-tech', 'Netflix Tech Blog', 'rss', 'https://netflixtechblog.com/feed', true, 480, 0.8, '{"timeout": 10000}'),
('meta-engineering', 'Engineering at Meta', 'rss', 'https://engineering.fb.com/feed/', true, 480, 0.8, '{"timeout": 10000}'),
('google-research', 'Google Research Blog', 'rss', 'https://research.google/blog/rss', true, 360, 0.7, '{"timeout": 10000}'),
('google-developers', 'Google Developers (Medium)', 'rss', 'https://medium.com/feed/google-developers', true, 360, 0.7, '{"timeout": 10000}'),
('vercel-blog', 'Vercel Blog', 'rss', 'https://vercel.com/atom', true, 240, 0.7, '{"timeout": 10000}'),
('a-list-apart', 'A List Apart', 'rss', 'https://alistapart.com/main/feed', true, 720, 0.6, '{"timeout": 10000}'),

-- GitHub Source
('github-ai-trending', 'GitHub AI Trending', 'github', 'https://api.github.com/search/repositories', true, 240, 0.9, '{"language": "typescript", "since": "weekly", "query": "ai machine learning"}'),

-- HackerNews Sources
('hn-ai-search', 'HackerNews AI Stories', 'hn', 'https://hacker-news.firebaseio.com/v0/topstories.json', true, 60, 0.8, '{"query": "artificial intelligence machine learning", "count": 5}'),
('hn-top-stories', 'HackerNews Top Stories', 'hn', 'https://hacker-news.firebaseio.com/v0/topstories.json', false, 30, 0.7, '{"count": 10}')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  url = EXCLUDED.url,
  enabled = EXCLUDED.enabled,
  fetch_interval = EXCLUDED.fetch_interval,
  weight = EXCLUDED.weight,
  config = EXCLUDED.config,
  updated_at = NOW();

-- Insert default focus profiles
INSERT INTO focus_profiles (id, name, description, enabled, keywords, sources, processing_config) VALUES
(
  'ai-product',
  'AI Product Builder',
  'Focus on AI product development, user experience, and practical applications',
  true,
  ARRAY[
    -- High priority keywords
    'user experience', 'product launch', 'ai ux', 'chatgpt wrapper', 'ai saas', 
    'ai product', 'product-market fit', 'ai startup',
    -- Medium priority keywords
    'prototype', 'mvp', 'user feedback', 'indie hacker', 'side project', 
    'ai tool', 'automation',
    -- Low priority keywords
    'startup', 'revenue', 'business model', 'marketing', 'growth'
  ],
  ARRAY[
    'hn-rss', 'hn-ai-search', 'dev-to-ai', 'toward-data-science', 
    'ai-news-mit', 'github-ai-trending', 'techcrunch', 'netflix-tech', 
    'meta-engineering', 'google-research', 'google-developers', 
    'vercel-blog', 'a-list-apart'
  ],
  '{
    "generateSummary": true,
    "enhanceTags": true,
    "scoreRelevance": true,
    "checkDuplicates": true,
    "minRelevanceScore": 0.1,
    "maxAgeDays": 7,
    "keywords": {
      "boost": {
        "high": [
          "user experience", "product launch", "ai ux", "chatgpt wrapper", 
          "ai saas", "ai product", "product-market fit", "ai startup"
        ],
        "medium": [
          "prototype", "mvp", "user feedback", "indie hacker", 
          "side project", "ai tool", "automation"
        ],
        "low": [
          "startup", "revenue", "business model", "marketing", "growth"
        ]
      },
      "filter": {
        "exclude": [
          "research paper", "academic", "phd", "arxiv", 
          "theoretical", "mathematical proof"
        ],
        "require": []
      }
    }
  }'::jsonb
),
(
  'ml-engineering',
  'ML Engineering',
  'Machine learning engineering, MLOps, model deployment, and data infrastructure for production AI systems',
  true,
  ARRAY[
    -- High priority keywords
    'machine learning', 'ml engineering', 'mlops', 'model deployment', 
    'data pipeline', 'model training', 'tensorflow', 'pytorch', 
    'kubernetes', 'docker', 'model serving', 'feature engineering', 
    'data science', 'neural networks', 'deep learning', 'model monitoring',
    -- Medium priority keywords
    'python', 'jupyter', 'pandas', 'numpy', 'scikit-learn', 
    'model optimization', 'gpu computing', 'cloud ml', 'data engineering', 
    'etl', 'data warehouse', 'apache spark', 'kafka', 'airflow', 
    'kubeflow', 'mlflow', 'wandb', 'model registry', 'feature store', 
    'data quality',
    -- Low priority keywords
    'data analysis', 'statistics', 'algorithms', 'computing', 
    'engineering', 'automation', 'monitoring', 'deployment', 
    'infrastructure', 'performance', 'scaling', 'optimization'
  ],
  ARRAY[
    'hn-rss', 'toward-data-science', 'ai-news-mit', 
    'github-ai-trending', 'hn-ai-search'
  ],
  '{
    "generateSummary": true,
    "enhanceTags": true,
    "scoreRelevance": true,
    "checkDuplicates": true,
    "minRelevanceScore": 0.2,
    "maxAgeDays": 7,
    "keywords": {
      "boost": {
        "high": [
          "machine learning", "ml engineering", "mlops", "model deployment",
          "data pipeline", "model training", "tensorflow", "pytorch",
          "kubernetes", "docker", "model serving", "feature engineering",
          "data science", "neural networks", "deep learning", "model monitoring"
        ],
        "medium": [
          "python", "jupyter", "pandas", "numpy", "scikit-learn",
          "model optimization", "gpu computing", "cloud ml", "data engineering",
          "etl", "data warehouse", "apache spark", "kafka", "airflow",
          "kubeflow", "mlflow", "wandb", "model registry", "feature store",
          "data quality"
        ],
        "low": [
          "data analysis", "statistics", "algorithms", "computing",
          "engineering", "automation", "monitoring", "deployment",
          "infrastructure", "performance", "scaling", "optimization"
        ]
      },
      "filter": {
        "exclude": [
          "frontend", "ui design", "marketing", "sales", "business development",
          "legal", "finance", "wordpress", "cms", "e-commerce", "seo",
          "social media", "content marketing", "gaming", "entertainment", "lifestyle"
        ],
        "require": []
      }
    }
  }'::jsonb
),
(
  'design-systems',
  'Design Systems & Frontend',
  'Design systems, frontend architecture, component libraries, and modern web development practices',
  true,
  ARRAY[
    -- High priority keywords
    'design systems', 'component library', 'design tokens', 'figma', 
    'storybook', 'frontend architecture', 'react', 'vue', 'svelte', 
    'typescript', 'css', 'scss', 'tailwind', 'styled-components', 
    'web components', 'accessibility', 'a11y', 'user experience', 
    'ui design', 'interaction design',
    -- Medium priority keywords
    'javascript', 'html', 'responsive design', 'mobile-first', 
    'progressive web app', 'pwa', 'webpack', 'vite', 'nextjs', 
    'nuxt', 'sveltekit', 'performance', 'optimization', 'web vitals', 
    'design patterns', 'atomic design', 'css-in-js', 'css modules', 
    'design tools', 'prototyping',
    -- Low priority keywords
    'frontend', 'web development', 'ui', 'ux', 'design', 'interface', 
    'user interface', 'visual design', 'branding', 'color theory', 
    'typography', 'layout', 'grid', 'flexbox'
  ],
  ARRAY[
    'hn-rss', 'dev-to-ai', 'github-ai-trending'
  ],
  '{
    "generateSummary": true,
    "enhanceTags": true,
    "scoreRelevance": true,
    "checkDuplicates": true,
    "minRelevanceScore": 0.25,
    "maxAgeDays": 10,
    "keywords": {
      "boost": {
        "high": [
          "design systems", "component library", "design tokens", "figma",
          "storybook", "frontend architecture", "react", "vue", "svelte",
          "typescript", "css", "scss", "tailwind", "styled-components",
          "web components", "accessibility", "a11y", "user experience",
          "ui design", "interaction design"
        ],
        "medium": [
          "javascript", "html", "responsive design", "mobile-first",
          "progressive web app", "pwa", "webpack", "vite", "nextjs",
          "nuxt", "sveltekit", "performance", "optimization", "web vitals",
          "design patterns", "atomic design", "css-in-js", "css modules",
          "design tools", "prototyping"
        ],
        "low": [
          "frontend", "web development", "ui", "ux", "design", "interface",
          "user interface", "visual design", "branding", "color theory",
          "typography", "layout", "grid", "flexbox"
        ]
      },
      "filter": {
        "exclude": [
          "backend", "database", "server", "devops", "infrastructure",
          "blockchain", "cryptocurrency", "machine learning", "data science",
          "analytics", "business intelligence", "marketing", "sales", "finance"
        ],
        "require": []
      }
    }
  }'::jsonb
)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  enabled = EXCLUDED.enabled,
  keywords = EXCLUDED.keywords,
  sources = EXCLUDED.sources,
  processing_config = EXCLUDED.processing_config,
  updated_at = NOW();

-- Verify the seed data was inserted
SELECT 'Sources:', COUNT(*) as count FROM sources WHERE enabled = true;
SELECT 'Focus Profiles:', COUNT(*) as count FROM focus_profiles WHERE enabled = true;

-- Display active sources
SELECT id, name, type, url, weight, enabled FROM sources ORDER BY weight DESC, name;

-- Display active profiles
SELECT id, name, description, array_length(sources, 1) as source_count, enabled 
FROM focus_profiles 
ORDER BY name;