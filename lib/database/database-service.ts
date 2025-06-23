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
    // Use the base table with enabled filter instead of view
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('enabled', true)
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
    // Generate a stable ID based on the source URL to prevent duplicates
    const urlHash = source.url.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toLowerCase()
    const sourceData = {
      id: `${source.type}-${urlHash}`,
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
    // Use the base table with enabled filter instead of view
    const { data, error } = await supabase
      .from('focus_profiles')
      .select('*')
      .eq('enabled', true)
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
      id: `profile-${Date.now()}`,
      name: profile.name,
      description: profile.description,
      enabled: profile.enabled ?? true,
      keywords: [], // Keep empty for now due to schema constraint
      sources: profile.sources || [],
      processing_config: {
        ...(profile.processing || {}),
        // Store structured keywords in processing_config as workaround
        keywords: profile.keywords || {
          boost: { high: [], medium: [], low: [] },
          filter: { exclude: [], require: [] }
        }
      }
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
    // Build query without RPC function
    let query = supabase
      .from('feed_items')
      .select(`
        *,
        sources!inner (
          id,
          name,
          type,
          url
        ),
        focus_profiles (
          id,
          name
        )
      `)
      .order('published_at', { ascending: false })
      .limit(options.limit || 50)
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }
    
    if (options.profileId) {
      query = query.eq('profile_id', options.profileId)
    }
    
    if (options.sourceId) {
      query = query.eq('source_id', options.sourceId)
    }
    
    if (options.processedOnly) {
      query = query.eq('processing_status', 'processed')
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(`Failed to fetch feed items: ${error.message}`)
    
    // Get engagement data separately (handle missing materialized view)
    const itemIds = data?.map(item => item.id) || []
    let engagementData: Record<string, any> = {}
    
    if (itemIds.length > 0) {
      try {
        const { data: engagementRows } = await supabase
          .from('mv_engagement_summary')
          .select('*')
          .in('item_id', itemIds)
        
        if (engagementRows) {
          engagementData = engagementRows.reduce((acc, row) => {
            acc[row.item_id] = row
            return acc
          }, {} as Record<string, any>)
        }
      } catch (err) {
        // Materialized view might not exist, continue without engagement data
        console.warn('Could not fetch engagement data:', err)
      }
    }
    
    return data?.map((row: any) => ({
      id: row.id,
      source: row.sources?.type || 'rss',
      sourceId: row.source_id,
      sourceName: row.sources?.name || '',
      sourceUrl: row.sources?.url || '',
      title: row.title,
      description: row.description,
      content: row.content,
      url: row.url,
      author: row.author || '',
      publishedAt: new Date(row.published_at || Date.now()),
      guid: row.guid,
      tags: row.tags || [],
      summary: row.summary,
      aiTags: row.ai_tags || [],
      insights: row.insights,
      relevanceScore: row.relevance_score || 0,
      embedding: row.embedding,
      rawData: row.raw_data || {},
      processingStatus: row.processing_status,
      aiProcessed: row.ai_processed || false,
      sourceType: row.sources?.type || 'rss',
      profileName: row.focus_profiles?.name || '',
      engagement: engagementData[row.id] ? {
        views: engagementData[row.id].views || 0,
        clicks: engagementData[row.id].clicks || 0,
        reads: engagementData[row.id].reads || 0,
        isRead: engagementData[row.id].is_read || false,
        ctr: engagementData[row.id].ctr || 0
      } : {
        views: 0,
        clicks: 0,
        reads: 0,
        isRead: false,
        ctr: 0
      }
    })) || []
  }

  // Fast dashboard stats using direct queries
  async getDashboardStats(profileId?: string): Promise<{
    totalItems: number
    processedItems: number
    aiProcessedItems: number
    avgRelevanceScore: number
    lastUpdated: Date
  }> {
    // Build query for stats
    let query = supabase
      .from('feed_items')
      .select('id, processing_status, ai_processed, relevance_score, published_at', { count: 'exact' })
    
    if (profileId) {
      query = query.eq('profile_id', profileId)
    }
    
    // Only get recent items for stats
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', oneDayAgo)
    
    const { data, error, count } = await query
    
    if (error) throw new Error(`Failed to fetch dashboard stats: ${error.message}`)
    
    // Calculate stats from the data
    const totalItems = count || 0
    const processedItems = data?.filter(item => item.processing_status === 'processed').length || 0
    const aiProcessedItems = data?.filter(item => item.ai_processed === true).length || 0
    
    const relevanceScores = data
      ?.filter(item => item.relevance_score && item.relevance_score > 0)
      ?.map(item => item.relevance_score) || []
    
    const avgRelevanceScore = relevanceScores.length > 0
      ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length
      : 0
    
    const lastUpdated = data && data.length > 0
      ? new Date(Math.max(...data.map(item => new Date(item.published_at).getTime())))
      : new Date()
    
    return {
      totalItems,
      processedItems,
      aiProcessedItems,
      avgRelevanceScore,
      lastUpdated
    }
  }
  
  async createFeedItem(item: Omit<FeedItem, 'id'>): Promise<FeedItem> {
    const itemData = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_id: (item as any).sourceId || item.source,
      profile_id: (item as any).profileId || null,
      title: item.title,
      description: (item as any).description || null,
      content: item.content || null,
      url: item.url,
      author: item.author || null,
      published_at: item.publishedAt,
      guid: (item as any).guid || null,
      tags: item.tags || [],
      summary: (item as any).summary || null,
      ai_tags: (item as any).aiTags || [],
      insights: (item as any).insights || null,
      relevance_score: item.relevanceScore || 0,
      embedding: (item as any).embedding || null,
      raw_data: (item as any).rawData || {},
      processing_status: (item as any).processingStatus || 'pending',
      ai_processed: (item as any).aiProcessed || false
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
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_id: (item as any).sourceId || item.source,
      profile_id: (item as any).profileId || null,
      title: item.title,
      description: (item as any).description || null,
      content: item.content || null,
      url: item.url,
      author: item.author || null,
      published_at: item.publishedAt,
      guid: (item as any).guid || null,
      tags: item.tags || [],
      summary: (item as any).summary || null,
      ai_tags: (item as any).aiTags || [],
      insights: (item as any).insights || null,
      relevance_score: item.relevanceScore || 0,
      embedding: (item as any).embedding || null,
      raw_data: (item as any).rawData || {},
      processing_status: (item as any).processingStatus || 'pending',
      ai_processed: (item as any).aiProcessed || false
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
        summary: (updates as any).summary,
        ai_tags: (updates as any).aiTags,
        insights: (updates as any).insights,
        relevance_score: updates.relevanceScore,
        embedding: (updates as any).embedding,
        processing_status: (updates as any).processingStatus,
        ai_processed: (updates as any).aiProcessed
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
    try {
      let query = supabase
        .from('mv_engagement_summary')
        .select('*')
      
      if (itemIds && itemIds.length > 0) {
        query = query.in('item_id', itemIds)
      }
      
      const { data, error } = await query
      
      if (error) {
        // If materialized view doesn't exist, return empty summary
        console.warn('Could not fetch engagement summary:', error.message)
        return {}
      }
      
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
    } catch (err) {
      console.warn('Error fetching engagement summary:', err)
      return {}
    }
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
    try {
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
    } catch (err) {
      // RPC function might not exist
      console.warn('Vector similarity search not available:', err)
      return []
    }
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
    // Handle keywords - could be either an array or stored as JSON in processing_config
    let validKeywords: any = {
      boost: {
        high: [],
        medium: [],
        low: []
      },
      filter: {
        exclude: [],
        require: []
      }
    }
    
    // Check if keywords are stored in processing_config (temporary workaround)
    if (row.processing_config?.keywords && typeof row.processing_config.keywords === 'object') {
      const configKeywords = row.processing_config.keywords
      validKeywords = {
        boost: {
          high: configKeywords.boost?.high || [],
          medium: configKeywords.boost?.medium || [],
          low: configKeywords.boost?.low || []
        },
        filter: {
          exclude: configKeywords.filter?.exclude || [],
          require: configKeywords.filter?.require || []
        }
      }
    } else if (Array.isArray(row.keywords) && row.keywords.length > 0) {
      // Legacy: if keywords are just an array, treat them as medium boost keywords
      validKeywords.boost.medium = row.keywords
    }
    
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      enabled: row.enabled,
      weight: (row as any).weight || 1.0,
      keywords: validKeywords,
      sources: row.sources,
      processing: {
        generateSummary: row.processing_config?.generateSummary ?? false,
        enhanceTags: row.processing_config?.enhanceTags ?? false,
        scoreRelevance: row.processing_config?.scoreRelevance ?? true,
        checkDuplicates: row.processing_config?.checkDuplicates ?? true,
        minRelevanceScore: row.processing_config?.minRelevanceScore ?? 0.3,
        maxAgeDays: row.processing_config?.maxAgeDays ?? 7
      }
    }
  }
  
  private mapFeedItemRowToItem(row: FeedItemRow): FeedItem {
    return {
      id: row.id,
      title: row.title,
      content: row.content || '',
      url: row.url,
      author: row.author || '',
      publishedAt: new Date(row.published_at || Date.now()),
      source: (row.source_id as any) || 'rss',
      sourceName: (row as any).source_name,
      sourceUrl: (row as any).source_url || '',
      tags: row.tags || [],
      relevanceScore: row.relevance_score || 0,
      aiSummary: row.summary || undefined, // Convert null to undefined to match FeedItem type
      metadata: {
        guid: row.guid,
        insights: row.insights,
        aiTags: row.ai_tags,
        embedding: row.embedding,
        rawData: row.raw_data,
        processingStatus: row.processing_status,
        aiProcessed: row.ai_processed
      }
    }
  }
}