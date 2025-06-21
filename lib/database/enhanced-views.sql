-- Enhanced database views for fast aggregator queries
-- These views optimize common aggregator page queries for instant loading

-- Enhanced feed items view with pre-joined source and profile data
CREATE OR REPLACE VIEW v_enriched_feed_items AS
SELECT 
  fi.id,
  fi.source_id,
  fi.profile_id,
  fi.title,
  fi.description,
  fi.content,
  fi.url,
  fi.author,
  fi.published_at,
  fi.guid,
  fi.tags,
  fi.summary,
  fi.ai_tags,
  fi.insights,
  fi.relevance_score,
  fi.embedding,
  fi.raw_data,
  fi.processing_status,
  fi.ai_processed,
  fi.created_at,
  fi.updated_at,
  
  -- Source information
  s.name as source_name,
  s.type as source_type,
  s.enabled as source_enabled,
  s.weight as source_weight,
  
  -- Profile information  
  fp.name as profile_name,
  fp.description as profile_description,
  fp.keywords as profile_keywords,
  
  -- Engagement metrics (from materialized view)
  COALESCE(mes.views, 0) as engagement_views,
  COALESCE(mes.clicks, 0) as engagement_clicks,
  COALESCE(mes.reads, 0) as engagement_reads,
  COALESCE(mes.is_read, false) as engagement_is_read,
  COALESCE(mes.ctr, 0) as engagement_ctr,
  mes.last_engagement as engagement_last_engagement
  
FROM feed_items fi
LEFT JOIN sources s ON fi.source_id = s.id
LEFT JOIN focus_profiles fp ON fi.profile_id = fp.id
LEFT JOIN mv_engagement_summary mes ON fi.id = mes.item_id
WHERE fi.processing_status = 'processed'
ORDER BY fi.published_at DESC;

-- Fast dashboard stats view
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN processing_status = 'processed' THEN 1 END) as processed_items,
  COUNT(CASE WHEN ai_processed = true THEN 1 END) as ai_processed_items,
  AVG(CASE WHEN relevance_score > 0 THEN relevance_score END) as avg_relevance_score,
  MAX(published_at) as last_item_date,
  MAX(created_at) as last_sync_date
FROM feed_items 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Profile performance view
CREATE OR REPLACE VIEW v_profile_performance AS
SELECT 
  fp.id as profile_id,
  fp.name as profile_name,
  fp.enabled,
  COUNT(fi.id) as total_items,
  COUNT(CASE WHEN fi.processing_status = 'processed' THEN 1 END) as processed_items,
  COUNT(CASE WHEN fi.ai_processed = true THEN 1 END) as ai_processed_items,
  AVG(CASE WHEN fi.relevance_score > 0 THEN fi.relevance_score END) as avg_relevance_score,
  MAX(fi.published_at) as latest_item_date,
  
  -- Engagement metrics
  SUM(COALESCE(mes.views, 0)) as total_views,
  SUM(COALESCE(mes.clicks, 0)) as total_clicks,
  SUM(COALESCE(mes.reads, 0)) as total_reads,
  CASE WHEN SUM(COALESCE(mes.views, 0)) > 0 
       THEN SUM(COALESCE(mes.clicks, 0))::REAL / SUM(COALESCE(mes.views, 0))::REAL 
       ELSE 0 END as avg_ctr
       
FROM focus_profiles fp
LEFT JOIN feed_items fi ON fp.id = fi.profile_id
LEFT JOIN mv_engagement_summary mes ON fi.id = mes.item_id
WHERE fp.enabled = true 
  AND (fi.id IS NULL OR fi.created_at >= NOW() - INTERVAL '30 days')
GROUP BY fp.id, fp.name, fp.enabled;

-- Source performance view
CREATE OR REPLACE VIEW v_source_performance AS
SELECT 
  s.id as source_id,
  s.name as source_name,
  s.type as source_type,
  s.enabled,
  s.weight,
  COUNT(fi.id) as total_items,
  COUNT(CASE WHEN fi.processing_status = 'processed' THEN 1 END) as processed_items,
  COUNT(CASE WHEN fi.ai_processed = true THEN 1 END) as ai_processed_items,
  AVG(CASE WHEN fi.relevance_score > 0 THEN fi.relevance_score END) as avg_relevance_score,
  MAX(fi.published_at) as latest_item_date,
  
  -- Engagement metrics
  SUM(COALESCE(mes.views, 0)) as total_views,
  SUM(COALESCE(mes.clicks, 0)) as total_clicks,
  SUM(COALESCE(mes.reads, 0)) as total_reads,
  CASE WHEN SUM(COALESCE(mes.views, 0)) > 0 
       THEN SUM(COALESCE(mes.clicks, 0))::REAL / SUM(COALESCE(mes.views, 0))::REAL 
       ELSE 0 END as avg_ctr
       
FROM sources s
LEFT JOIN feed_items fi ON s.id = fi.source_id
LEFT JOIN mv_engagement_summary mes ON fi.id = mes.item_id
WHERE s.enabled = true 
  AND (fi.id IS NULL OR fi.created_at >= NOW() - INTERVAL '30 days')
GROUP BY s.id, s.name, s.type, s.enabled, s.weight;

-- Recent aggregation runs view for monitoring
CREATE OR REPLACE VIEW v_recent_aggregation_runs AS
SELECT 
  ar.id,
  ar.profile_id,
  fp.name as profile_name,
  ar.status,
  ar.total_sources,
  ar.successful_sources,
  ar.total_items,
  ar.processed_items,
  ar.duplicates_removed,
  ar.avg_relevance_score,
  ar.duration_ms,
  ar.error_message,
  ar.metadata,
  ar.started_at,
  ar.completed_at,
  
  -- Performance metrics
  CASE WHEN ar.total_sources > 0 
       THEN ar.successful_sources::REAL / ar.total_sources::REAL 
       ELSE 0 END as success_rate,
  CASE WHEN ar.duration_ms > 0 AND ar.total_items > 0
       THEN ar.total_items::REAL / (ar.duration_ms::REAL / 1000) 
       ELSE 0 END as items_per_second
       
FROM aggregation_runs ar
LEFT JOIN focus_profiles fp ON ar.profile_id = fp.id
WHERE ar.started_at >= NOW() - INTERVAL '7 days'
ORDER BY ar.started_at DESC;

-- Trending content view (high engagement, recent)
CREATE OR REPLACE VIEW v_trending_content AS
SELECT 
  fi.id,
  fi.title,
  fi.description,
  fi.url,
  fi.published_at,
  fi.source_id,
  fi.profile_id,
  fi.relevance_score,
  fi.ai_tags,
  
  -- Source info
  s.name as source_name,
  s.type as source_type,
  
  -- Profile info
  fp.name as profile_name,
  
  -- Engagement metrics
  mes.views,
  mes.clicks,
  mes.reads,
  mes.ctr,
  mes.total_engagements,
  
  -- Trending score (combination of engagement and recency)
  (
    COALESCE(mes.total_engagements, 0) * 
    GREATEST(0.1, 1.0 - EXTRACT(EPOCH FROM (NOW() - fi.published_at)) / (7 * 24 * 3600))
  ) as trending_score
  
FROM feed_items fi
LEFT JOIN sources s ON fi.source_id = s.id
LEFT JOIN focus_profiles fp ON fi.profile_id = fp.id
LEFT JOIN mv_engagement_summary mes ON fi.id = mes.item_id
WHERE fi.processing_status = 'processed'
  AND fi.published_at >= NOW() - INTERVAL '7 days'
  AND fi.relevance_score >= 0.3
ORDER BY trending_score DESC, fi.published_at DESC;

-- AI insights summary for dashboard
CREATE OR REPLACE VIEW v_ai_insights_summary AS
SELECT 
  COUNT(*) as total_ai_processed,
  COUNT(CASE WHEN insights IS NOT NULL AND insights != '' THEN 1 END) as items_with_insights,
  COUNT(CASE WHEN ai_tags IS NOT NULL AND array_length(ai_tags, 1) > 0 THEN 1 END) as items_with_ai_tags,
  COUNT(CASE WHEN summary IS NOT NULL AND summary != '' THEN 1 END) as items_with_summary,
  
  -- Top AI tags
  unnest(ai_tags) as ai_tag,
  COUNT(*) as tag_frequency
  
FROM feed_items 
WHERE ai_processed = true 
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY unnest(ai_tags)
ORDER BY tag_frequency DESC
LIMIT 20;

-- Create indexes for the new views
CREATE INDEX IF NOT EXISTS idx_feed_items_published_created ON feed_items(published_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_relevance_processed ON feed_items(relevance_score DESC) WHERE processing_status = 'processed';
CREATE INDEX IF NOT EXISTS idx_aggregation_runs_profile_started ON aggregation_runs(profile_id, started_at DESC);

-- Function to get fast aggregator page data
CREATE OR REPLACE FUNCTION get_aggregator_page_data(
  p_profile_id TEXT DEFAULT NULL,
  p_source_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id TEXT,
  source_id TEXT,
  profile_id TEXT,
  title TEXT,
  description TEXT,
  url TEXT,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  summary TEXT,
  ai_tags TEXT[],
  insights TEXT,
  relevance_score REAL,
  processing_status TEXT,
  ai_processed BOOLEAN,
  source_name TEXT,
  source_type TEXT,
  profile_name TEXT,
  engagement_views BIGINT,
  engagement_clicks BIGINT,
  engagement_reads BIGINT,
  engagement_is_read BOOLEAN,
  engagement_ctr REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    efi.id,
    efi.source_id,
    efi.profile_id,
    efi.title,
    efi.description,
    efi.url,
    efi.author,
    efi.published_at,
    efi.tags,
    efi.summary,
    efi.ai_tags,
    efi.insights,
    efi.relevance_score,
    efi.processing_status,
    efi.ai_processed,
    efi.source_name,
    efi.source_type,
    efi.profile_name,
    efi.engagement_views,
    efi.engagement_clicks,
    efi.engagement_reads,
    efi.engagement_is_read,
    efi.engagement_ctr
  FROM v_enriched_feed_items efi
  WHERE (p_profile_id IS NULL OR efi.profile_id = p_profile_id)
    AND (p_source_id IS NULL OR efi.source_id = p_source_id)
  ORDER BY efi.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard stats quickly
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_profile_id TEXT DEFAULT NULL)
RETURNS TABLE (
  total_items BIGINT,
  processed_items BIGINT,
  ai_processed_items BIGINT,
  avg_relevance_score REAL,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN fi.processing_status = 'processed' THEN 1 END) as processed_items,
    COUNT(CASE WHEN fi.ai_processed = true THEN 1 END) as ai_processed_items,
    AVG(CASE WHEN fi.relevance_score > 0 THEN fi.relevance_score END) as avg_relevance_score,
    MAX(fi.published_at) as last_updated
  FROM feed_items fi
  WHERE (p_profile_id IS NULL OR fi.profile_id = p_profile_id)
    AND fi.created_at >= NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;