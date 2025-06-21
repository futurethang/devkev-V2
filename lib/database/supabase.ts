import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // For server-side usage
  }
})

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      sources: {
        Row: {
          id: string
          name: string
          type: 'rss' | 'github' | 'hn' | 'twitter' | 'reddit' | 'newsletter'
          url: string
          enabled: boolean
          fetch_interval: number
          weight: number
          config: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          type: 'rss' | 'github' | 'hn' | 'twitter' | 'reddit' | 'newsletter'
          url: string
          enabled?: boolean
          fetch_interval?: number
          weight?: number
          config?: Record<string, any>
        }
        Update: {
          id?: string
          name?: string
          type?: 'rss' | 'github' | 'hn' | 'twitter' | 'reddit' | 'newsletter'
          url?: string
          enabled?: boolean
          fetch_interval?: number
          weight?: number
          config?: Record<string, any>
        }
      }
      focus_profiles: {
        Row: {
          id: string
          name: string
          description: string | null
          enabled: boolean
          keywords: string[]
          sources: string[]
          processing_config: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string
          enabled?: boolean
          keywords?: string[]
          sources?: string[]
          processing_config?: Record<string, any>
        }
        Update: {
          id?: string
          name?: string
          description?: string
          enabled?: boolean
          keywords?: string[]
          sources?: string[]
          processing_config?: Record<string, any>
        }
      }
      feed_items: {
        Row: {
          id: string
          source_id: string
          profile_id: string | null
          title: string
          description: string | null
          content: string | null
          url: string
          author: string | null
          published_at: string | null
          guid: string | null
          tags: string[]
          summary: string | null
          ai_tags: string[]
          insights: string | null
          relevance_score: number
          embedding: number[] | null
          raw_data: Record<string, any>
          processing_status: 'pending' | 'processed' | 'failed'
          ai_processed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          source_id: string
          profile_id?: string | null
          title: string
          description?: string | null
          content?: string | null
          url: string
          author?: string | null
          published_at?: string | null
          guid?: string | null
          tags?: string[]
          summary?: string | null
          ai_tags?: string[]
          insights?: string | null
          relevance_score?: number
          embedding?: number[] | null
          raw_data?: Record<string, any>
          processing_status?: 'pending' | 'processed' | 'failed'
          ai_processed?: boolean
        }
        Update: {
          id?: string
          source_id?: string
          profile_id?: string | null
          title?: string
          description?: string | null
          content?: string | null
          url?: string
          author?: string | null
          published_at?: string | null
          guid?: string | null
          tags?: string[]
          summary?: string | null
          ai_tags?: string[]
          insights?: string | null
          relevance_score?: number
          embedding?: number[] | null
          raw_data?: Record<string, any>
          processing_status?: 'pending' | 'processed' | 'failed'
          ai_processed?: boolean
        }
      }
      aggregation_runs: {
        Row: {
          id: string
          profile_id: string | null
          status: 'running' | 'completed' | 'failed'
          total_sources: number
          successful_sources: number
          total_items: number
          processed_items: number
          duplicates_removed: number
          avg_relevance_score: number
          duration_ms: number | null
          error_message: string | null
          metadata: Record<string, any>
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          status?: 'running' | 'completed' | 'failed'
          total_sources?: number
          successful_sources?: number
          total_items?: number
          processed_items?: number
          duplicates_removed?: number
          avg_relevance_score?: number
          duration_ms?: number | null
          error_message?: string | null
          metadata?: Record<string, any>
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          status?: 'running' | 'completed' | 'failed'
          total_sources?: number
          successful_sources?: number
          total_items?: number
          processed_items?: number
          duplicates_removed?: number
          avg_relevance_score?: number
          duration_ms?: number | null
          error_message?: string | null
          metadata?: Record<string, any>
          started_at?: string
          completed_at?: string | null
        }
      }
      user_engagement: {
        Row: {
          id: string
          item_id: string
          profile_id: string | null
          event_type: 'view' | 'click' | 'read' | 'like' | 'share' | 'save'
          session_id: string | null
          user_agent: string | null
          ip_address: string | null
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          profile_id?: string | null
          event_type: 'view' | 'click' | 'read' | 'like' | 'share' | 'save'
          session_id?: string | null
          user_agent?: string | null
          ip_address?: string | null
          metadata?: Record<string, any>
        }
        Update: {
          id?: string
          item_id?: string
          profile_id?: string | null
          event_type?: 'view' | 'click' | 'read' | 'like' | 'share' | 'save'
          session_id?: string | null
          user_agent?: string | null
          ip_address?: string | null
          metadata?: Record<string, any>
        }
      }
      content_duplicates: {
        Row: {
          id: string
          item_id: string
          duplicate_of: string
          similarity_score: number
          detection_method: 'url' | 'title' | 'content' | 'embedding'
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          duplicate_of: string
          similarity_score: number
          detection_method: 'url' | 'title' | 'content' | 'embedding'
        }
        Update: {
          id?: string
          item_id?: string
          duplicate_of?: string
          similarity_score?: number
          detection_method?: 'url' | 'title' | 'content' | 'embedding'
        }
      }
    }
    Views: {
      v_active_sources: {
        Row: {
          id: string
          name: string
          type: 'rss' | 'github' | 'hn' | 'twitter' | 'reddit' | 'newsletter'
          url: string
          enabled: boolean
          fetch_interval: number
          weight: number
          config: Record<string, any>
          created_at: string
          updated_at: string
        }
      }
      v_active_profiles: {
        Row: {
          id: string
          name: string
          description: string | null
          enabled: boolean
          keywords: string[]
          sources: string[]
          processing_config: Record<string, any>
          created_at: string
          updated_at: string
        }
      }
      v_processed_items: {
        Row: {
          id: string
          source_id: string
          profile_id: string | null
          title: string
          description: string | null
          content: string | null
          url: string
          author: string | null
          published_at: string | null
          guid: string | null
          tags: string[]
          summary: string | null
          ai_tags: string[]
          insights: string | null
          relevance_score: number
          embedding: number[] | null
          raw_data: Record<string, any>
          processing_status: 'pending' | 'processed' | 'failed'
          ai_processed: boolean
          created_at: string
          updated_at: string
          source_name: string | null
          source_type: string | null
          profile_name: string | null
        }
      }
      mv_engagement_summary: {
        Row: {
          item_id: string
          title: string | null
          url: string | null
          profile_id: string | null
          total_engagements: number
          views: number
          clicks: number
          reads: number
          ctr: number
          last_engagement: string | null
          is_read: boolean
        }
      }
    }
  }
}

// Typed Supabase client
export type SupabaseClient = typeof supabase
export type SupabaseDatabase = Database