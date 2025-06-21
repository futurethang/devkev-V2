-- Aggregator Database Schema for Supabase
-- This schema supports the AI-powered content aggregator system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Sources table - stores configuration for content sources
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rss', 'github', 'hn', 'twitter', 'reddit', 'newsletter')),
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  fetch_interval INTEGER DEFAULT 3600, -- seconds
  weight REAL DEFAULT 1.0,
  config JSONB DEFAULT '{}', -- source-specific configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Focus profiles table - different content curation profiles
CREATE TABLE focus_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  keywords TEXT[] DEFAULT '{}',
  sources TEXT[] DEFAULT '{}', -- array of source IDs
  processing_config JSONB DEFAULT '{}', -- processing configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feed items table - stores all content items from sources
CREATE TABLE feed_items (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  profile_id TEXT REFERENCES focus_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  guid TEXT, -- unique identifier from source
  tags TEXT[] DEFAULT '{}',
  
  -- AI-enhanced fields
  summary TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  insights TEXT,
  relevance_score REAL DEFAULT 0.0,
  
  -- Vector embedding for similarity search
  embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimension
  
  -- Metadata
  raw_data JSONB DEFAULT '{}', -- original source data
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
  ai_processed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique items per source
  UNIQUE(source_id, guid)
);

-- Aggregation runs table - tracks aggregation executions
CREATE TABLE aggregation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id TEXT REFERENCES focus_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  total_sources INTEGER DEFAULT 0,
  successful_sources INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  duplicates_removed INTEGER DEFAULT 0,
  avg_relevance_score REAL DEFAULT 0.0,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User engagement table - tracks user interactions
CREATE TABLE user_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id TEXT NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  profile_id TEXT REFERENCES focus_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'read', 'like', 'share', 'save')),
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Duplicate detection table - tracks similar/duplicate content
CREATE TABLE content_duplicates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id TEXT NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  duplicate_of TEXT NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  similarity_score REAL NOT NULL,
  detection_method TEXT NOT NULL CHECK (detection_method IN ('url', 'title', 'content', 'embedding')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure we don't duplicate duplicate relationships
  UNIQUE(item_id, duplicate_of)
);

-- Create indexes for performance
CREATE INDEX idx_sources_type_enabled ON sources(type, enabled);
CREATE INDEX idx_sources_enabled ON sources(enabled) WHERE enabled = true;

CREATE INDEX idx_focus_profiles_enabled ON focus_profiles(enabled) WHERE enabled = true;

CREATE INDEX idx_feed_items_source_id ON feed_items(source_id);
CREATE INDEX idx_feed_items_profile_id ON feed_items(profile_id);
CREATE INDEX idx_feed_items_published_at ON feed_items(published_at DESC);
CREATE INDEX idx_feed_items_relevance_score ON feed_items(relevance_score DESC);
CREATE INDEX idx_feed_items_processing_status ON feed_items(processing_status);
CREATE INDEX idx_feed_items_ai_processed ON feed_items(ai_processed);
CREATE INDEX idx_feed_items_tags ON feed_items USING GIN(tags);
CREATE INDEX idx_feed_items_ai_tags ON feed_items USING GIN(ai_tags);

-- Vector similarity search index
CREATE INDEX idx_feed_items_embedding ON feed_items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_aggregation_runs_profile_id ON aggregation_runs(profile_id);
CREATE INDEX idx_aggregation_runs_status ON aggregation_runs(status);
CREATE INDEX idx_aggregation_runs_started_at ON aggregation_runs(started_at DESC);

CREATE INDEX idx_user_engagement_item_id ON user_engagement(item_id);
CREATE INDEX idx_user_engagement_profile_id ON user_engagement(profile_id);
CREATE INDEX idx_user_engagement_event_type ON user_engagement(event_type);
CREATE INDEX idx_user_engagement_created_at ON user_engagement(created_at DESC);

CREATE INDEX idx_content_duplicates_item_id ON content_duplicates(item_id);
CREATE INDEX idx_content_duplicates_duplicate_of ON content_duplicates(duplicate_of);
CREATE INDEX idx_content_duplicates_similarity_score ON content_duplicates(similarity_score DESC);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_focus_profiles_updated_at BEFORE UPDATE ON focus_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feed_items_updated_at BEFORE UPDATE ON feed_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW v_active_sources AS
SELECT * FROM sources WHERE enabled = true;

CREATE VIEW v_active_profiles AS
SELECT * FROM focus_profiles WHERE enabled = true;

CREATE VIEW v_processed_items AS
SELECT 
  fi.*,
  s.name as source_name,
  s.type as source_type,
  fp.name as profile_name
FROM feed_items fi
LEFT JOIN sources s ON fi.source_id = s.id
LEFT JOIN focus_profiles fp ON fi.profile_id = fp.id
WHERE fi.processing_status = 'processed'
ORDER BY fi.published_at DESC;

-- Create materialized view for engagement analytics
CREATE MATERIALIZED VIEW mv_engagement_summary AS
SELECT 
  fi.id as item_id,
  fi.title,
  fi.url,
  fi.profile_id,
  COUNT(ue.id) as total_engagements,
  COUNT(CASE WHEN ue.event_type = 'view' THEN 1 END) as views,
  COUNT(CASE WHEN ue.event_type = 'click' THEN 1 END) as clicks,
  COUNT(CASE WHEN ue.event_type = 'read' THEN 1 END) as reads,
  CASE WHEN COUNT(CASE WHEN ue.event_type = 'view' THEN 1 END) > 0 
       THEN COUNT(CASE WHEN ue.event_type = 'click' THEN 1 END)::REAL / COUNT(CASE WHEN ue.event_type = 'view' THEN 1 END)::REAL 
       ELSE 0 END as ctr,
  MAX(ue.created_at) as last_engagement,
  bool_or(ue.event_type = 'read') as is_read
FROM feed_items fi
LEFT JOIN user_engagement ue ON fi.id = ue.item_id
GROUP BY fi.id, fi.title, fi.url, fi.profile_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_mv_engagement_summary_item_id ON mv_engagement_summary(item_id);

-- Create function to refresh engagement summary
CREATE OR REPLACE FUNCTION refresh_engagement_summary()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_engagement_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view when engagement data changes
CREATE TRIGGER refresh_engagement_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_engagement
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_engagement_summary();

-- Row Level Security (RLS) policies
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_duplicates ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (in production, you'd want more restrictive policies)
CREATE POLICY "Allow all operations on sources" ON sources FOR ALL USING (true);
CREATE POLICY "Allow all operations on focus_profiles" ON focus_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on feed_items" ON feed_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on aggregation_runs" ON aggregation_runs FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_engagement" ON user_engagement FOR ALL USING (true);
CREATE POLICY "Allow all operations on content_duplicates" ON content_duplicates FOR ALL USING (true);