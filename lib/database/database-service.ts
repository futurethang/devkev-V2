import { supabase, type Database } from './supabase'
import type { 
  FeedItem, 
  SourceConfig, 
  FocusProfile, 
  FetchResult 
} from '../../aggregator/lib/types/feed'

type Tables = Database['public']['Tables']
type SourceRow = Tables['sources']['Row']
type FeedItemRow = Tables['feed_items']['Row']
type ProfileRow = Tables['focus_profiles']['Row']
type EngagementRow = Tables['user_engagement']['Row']
type AggregationRunRow = Tables['aggregation_runs']['Row']

/**
 * Database service for managing aggregator data in Supabase
 */
export class DatabaseService {
  
  // ===== SOURCES =====
  
  async getSources(): Promise<SourceConfig[]> {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('name')
    
    if (error) throw new Error(`Failed to fetch sources: ${error.message}`)
    
    return data?.map(this.mapSourceRowToConfig) || []
  }
  
  async getActiveSources(): Promise<SourceConfig[]> {
    const { data, error } = await supabase
      .from('v_active_sources')
      .select('*')
      .order('name')
    
    if (error) throw new Error(`Failed to fetch active sources: ${error.message}`)
    
    return data?.map(this.mapSourceRowToConfig) || []
  }
  
  async getSourceById(id: string): Promise<SourceConfig | null> {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch source: ${error.message}`)
    }
    
    return this.mapSourceRowToConfig(data)
  }
  
  async createSource(source: Omit<SourceConfig, 'id'>): Promise<SourceConfig> {
    const sourceData = {
      id: source.id || `${source.type}-${Date.now()}`,
      name: source.name,
      type: source.type,
      url: source.url,
      enabled: source.enabled ?? true,
      fetch_interval: source.fetchInterval || 3600,
      weight: source.weight || 1.0,
      config: source as any // Additional config fields
    }
    
    const { data, error } = await supabase
      .from('sources')
      .insert(sourceData)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create source: ${error.message}`)
    
    return this.mapSourceRowToConfig(data)
  }
  
  async updateSource(id: string, updates: Partial<SourceConfig>): Promise<SourceConfig> {
    const { data, error } = await supabase
      .from('sources')
      .update({
        name: updates.name,
        url: updates.url,
        enabled: updates.enabled,
        fetch_interval: updates.fetchInterval,
        weight: updates.weight
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update source: ${error.message}`)
    
    return this.mapSourceRowToConfig(data)
  }
  
  async deleteSource(id: string): Promise<void> {
    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(`Failed to delete source: ${error.message}`)
  }
  
  // ===== FOCUS PROFILES =====
  
  async getProfiles(): Promise<FocusProfile[]> {
    const { data, error } = await supabase
      .from('focus_profiles')
      .select('*')
      .order('name')
    
    if (error) throw new Error(`Failed to fetch profiles: ${error.message}`)
    
    return data?.map(this.mapProfileRowToConfig) || []
  }
  
  async getActiveProfiles(): Promise<FocusProfile[]> {
    const { data, error } = await supabase
      .from('v_active_profiles')
      .select('*')
      .order('name')
    
    if (error) throw new Error(`Failed to fetch active profiles: ${error.message}`)
    
    return data?.map(this.mapProfileRowToConfig) || []
  }
  
  async getProfileById(id: string): Promise<FocusProfile | null> {
    const { data, error } = await supabase
      .from('focus_profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }
    
    return this.mapProfileRowToConfig(data)
  }
  
  async createProfile(profile: Omit<FocusProfile, 'id'>): Promise<FocusProfile> {
    const profileData = {
      id: profile.id || `profile-${Date.now()}`,
      name: profile.name,
      description: profile.description,
      enabled: profile.enabled ?? true,
      keywords: profile.keywords || [],
      sources: profile.sources || [],
      processing_config: profile.processing || {}
    }
    
    const { data, error } = await supabase
      .from('focus_profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create profile: ${error.message}`)
    
    return this.mapProfileRowToConfig(data)
  }
  
  // ===== FEED ITEMS =====
  
  async getFeedItems(options: {
    profileId?: string
    sourceId?: string
    limit?: number
    offset?: number
    processedOnly?: boolean
  } = {}): Promise<FeedItem[]> {
    // Use optimized function for better performance
    const { data, error } = await supabase
      .rpc('get_aggregator_page_data', {
        p_profile_id: options.profileId || null,
        p_source_id: options.sourceId || null,
        p_limit: options.limit || 50,
        p_offset: options.offset || 0
      })
    
    if (error) throw new Error(`Failed to fetch feed items: ${error.message}`)
    
    return data?.map((row: any) => ({
      id: row.id,
      sourceId: row.source_id,
      profileId: row.profile_id,
      title: row.title,
      description: row.description,
      content: null, // Not included in optimized query for performance
      url: row.url,
      author: row.author,
      publishedAt: row.published_at,
      guid: null, // Not needed for display
      tags: row.tags,
      summary: row.summary,
      aiTags: row.ai_tags,
      insights: row.insights,
      relevanceScore: row.relevance_score,
      embedding: null, // Not needed for display
      rawData: {}, // Not needed for display
      processingStatus: row.processing_status,
      aiProcessed: row.ai_processed,
      // Enhanced fields from view
      sourceName: row.source_name,
      sourceType: row.source_type,
      profileName: row.profile_name,
      engagement: {
        views: row.engagement_views || 0,
        clicks: row.engagement_clicks || 0,
        reads: row.engagement_reads || 0,
        isRead: row.engagement_is_read || false,
        ctr: row.engagement_ctr || 0
      }
    })) || []
  }

  // Fast dashboard stats using optimized function
  async getDashboardStats(profileId?: string): Promise<{
    totalItems: number
    processedItems: number
    aiProcessedItems: number
    avgRelevanceScore: number
    lastUpdated: Date
  }> {
    const { data, error } = await supabase
      .rpc('get_dashboard_stats', {
        p_profile_id: profileId || null
      })
    
    if (error) throw new Error(`Failed to fetch dashboard stats: ${error.message}`)
    
    const stats = data?.[0]
    return {
      totalItems: parseInt(stats?.total_items || '0'),
      processedItems: parseInt(stats?.processed_items || '0'),
      aiProcessedItems: parseInt(stats?.ai_processed_items || '0'),
      avgRelevanceScore: parseFloat(stats?.avg_relevance_score || '0'),
      lastUpdated: stats?.last_updated ? new Date(stats.last_updated) : new Date()
    }
  }
  
  async createFeedItem(item: Omit<FeedItem, 'id'>): Promise<FeedItem> {
    const itemData = {
      id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_id: item.sourceId,
      profile_id: item.profileId || null,
      title: item.title,
      description: item.description || null,
      content: item.content || null,
      url: item.url,
      author: item.author || null,
      published_at: item.publishedAt,
      guid: item.guid || null,
      tags: item.tags || [],
      summary: item.summary || null,
      ai_tags: item.aiTags || [],
      insights: item.insights || null,
      relevance_score: item.relevanceScore || 0,
      embedding: item.embedding || null,
      raw_data: item.rawData || {},
      processing_status: item.processingStatus || 'pending',
      ai_processed: item.aiProcessed || false
    }
    
    const { data, error } = await supabase
      .from('feed_items')
      .insert(itemData)
      .select()
      .single()
    
    if (error) {
      // Handle duplicate items gracefully
      if (error.code === '23505') { // Unique constraint violation
        console.warn(`Duplicate item detected: ${item.title}`)
        return item as FeedItem
      }
      throw new Error(`Failed to create feed item: ${error.message}`)
    }
    
    return this.mapFeedItemRowToItem(data)
  }
  
  async bulkCreateFeedItems(items: Omit<FeedItem, 'id'>[]): Promise<FeedItem[]> {
    if (items.length === 0) return []
    
    const itemsData = items.map(item => ({
      id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_id: item.sourceId,
      profile_id: item.profileId || null,
      title: item.title,
      description: item.description || null,
      content: item.content || null,
      url: item.url,
      author: item.author || null,
      published_at: item.publishedAt,
      guid: item.guid || null,
      tags: item.tags || [],
      summary: item.summary || null,
      ai_tags: item.aiTags || [],
      insights: item.insights || null,
      relevance_score: item.relevanceScore || 0,
      embedding: item.embedding || null,
      raw_data: item.rawData || {},
      processing_status: item.processingStatus || 'pending',
      ai_processed: item.aiProcessed || false
    }))
    
    const { data, error } = await supabase
      .from('feed_items')
      .insert(itemsData)
      .select()
    
    if (error) {
      console.error('Bulk insert error:', error)
      // Fallback to individual inserts to handle duplicates
      const results: FeedItem[] = []
      for (const item of items) {
        try {
          const created = await this.createFeedItem(item)
          results.push(created)
        } catch (err) {
          console.warn(`Failed to create item: ${item.title}`, err)
        }
      }
      return results
    }
    
    return data?.map(this.mapFeedItemRowToItem) || []
  }
  
  async updateFeedItem(id: string, updates: Partial<FeedItem>): Promise<FeedItem> {
    const { data, error } = await supabase
      .from('feed_items')
      .update({
        summary: updates.summary,
        ai_tags: updates.aiTags,
        insights: updates.insights,
        relevance_score: updates.relevanceScore,
        embedding: updates.embedding,
        processing_status: updates.processingStatus,
        ai_processed: updates.aiProcessed
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update feed item: ${error.message}`)
    
    return this.mapFeedItemRowToItem(data)
  }
  
  // ===== ENGAGEMENT TRACKING =====
  
  async trackEngagement(engagement: {
    itemId: string
    profileId?: string
    eventType: 'view' | 'click' | 'read' | 'like' | 'share' | 'save'
    sessionId?: string
    userAgent?: string
    ipAddress?: string
    metadata?: Record<string, any>
  }): Promise<void> {
    const { error } = await supabase
      .from('user_engagement')
      .insert({
        item_id: engagement.itemId,
        profile_id: engagement.profileId || null,
        event_type: engagement.eventType,
        session_id: engagement.sessionId || null,
        user_agent: engagement.userAgent || null,
        ip_address: engagement.ipAddress || null,
        metadata: engagement.metadata || {}
      })
    
    if (error) throw new Error(`Failed to track engagement: ${error.message}`)
  }
  
  async getEngagementSummary(itemIds?: string[]): Promise<Record<string, any>> {
    let query = supabase
      .from('mv_engagement_summary')
      .select('*')
    
    if (itemIds && itemIds.length > 0) {
      query = query.in('item_id', itemIds)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(`Failed to fetch engagement summary: ${error.message}`)
    
    const summary: Record<string, any> = {}
    data?.forEach(item => {
      summary[item.item_id] = {
        views: item.views,
        clicks: item.clicks,
        reads: item.reads,
        isRead: item.is_read,
        ctr: item.ctr,
        profile: item.profile_id,
        lastEngagement: item.last_engagement
      }
    })
    
    return summary
  }
  
  // ===== AGGREGATION RUNS =====
  
  async createAggregationRun(run: {
    profileId?: string
    status?: 'running' | 'completed' | 'failed'
    metadata?: Record<string, any>
  }): Promise<string> {
    const { data, error } = await supabase
      .from('aggregation_runs')
      .insert({
        profile_id: run.profileId || null,
        status: run.status || 'running',
        metadata: run.metadata || {}
      })
      .select('id')
      .single()
    
    if (error) throw new Error(`Failed to create aggregation run: ${error.message}`)
    
    return data.id
  }
  
  async updateAggregationRun(id: string, updates: {
    status?: 'running' | 'completed' | 'failed'
    totalSources?: number
    successfulSources?: number
    totalItems?: number
    processedItems?: number
    duplicatesRemoved?: number
    avgRelevanceScore?: number
    durationMs?: number
    errorMessage?: string
    metadata?: Record<string, any>
  }): Promise<void> {
    const { error } = await supabase
      .from('aggregation_runs')
      .update({
        status: updates.status,
        total_sources: updates.totalSources,
        successful_sources: updates.successfulSources,
        total_items: updates.totalItems,
        processed_items: updates.processedItems,
        duplicates_removed: updates.duplicatesRemoved,
        avg_relevance_score: updates.avgRelevanceScore,
        duration_ms: updates.durationMs,
        error_message: updates.errorMessage,
        metadata: updates.metadata,
        completed_at: updates.status === 'completed' || updates.status === 'failed' ? new Date().toISOString() : undefined
      })
      .eq('id', id)
    
    if (error) throw new Error(`Failed to update aggregation run: ${error.message}`)
  }
  
  // ===== VECTOR SIMILARITY =====
  
  async findSimilarItems(embedding: number[], threshold: number = 0.8, limit: number = 10): Promise<FeedItem[]> {
    // Note: This requires the pgvector extension and proper indexing
    const { data, error } = await supabase
      .rpc('find_similar_items', {
        query_embedding: embedding,
        similarity_threshold: threshold,
        match_count: limit
      })
    
    if (error) {
      console.warn('Vector similarity search failed:', error.message)
      return []
    }
    
    return data?.map(this.mapFeedItemRowToItem) || []
  }
  
  // ===== HELPER METHODS =====
  
  private mapSourceRowToConfig(row: SourceRow): SourceConfig {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      url: row.url,
      enabled: row.enabled,
      fetchInterval: row.fetch_interval,
      weight: row.weight,
      ...row.config // Spread additional config fields
    }
  }
  
  private mapProfileRowToConfig(row: ProfileRow): FocusProfile {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      enabled: row.enabled,
      keywords: row.keywords,
      sources: row.sources,
      processing: row.processing_config as any
    }
  }
  
  private mapFeedItemRowToItem(row: FeedItemRow): FeedItem {
    return {
      id: row.id,
      sourceId: row.source_id,
      profileId: row.profile_id,
      title: row.title,
      description: row.description,
      content: row.content,
      url: row.url,
      author: row.author,
      publishedAt: row.published_at,
      guid: row.guid,
      tags: row.tags,
      summary: row.summary,
      aiTags: row.ai_tags,
      insights: row.insights,
      relevanceScore: row.relevance_score,
      embedding: row.embedding,
      rawData: row.raw_data,
      processingStatus: row.processing_status,
      aiProcessed: row.ai_processed
    }
  }
}