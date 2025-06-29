import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface AggregatorItem {
  id: string
  title: string
  description?: string
  url: string
  source: string
  sourceName?: string
  author?: string
  publishedAt: string
  relevanceScore: number
  tags?: string[]
  aiSummary?: string
  aiKeyPoints?: string[]
  isRead?: boolean
  engagementData?: {
    views: number
    clicks: number
    ctr: number
    lastEngagement: string
  }
}

export interface AggregatorData {
  profileId: string
  totalItems: number
  processedItems: number
  processedFeedItems?: AggregatorItem[]
  avgRelevanceScore: number
  cached: boolean
  cacheAge?: number
  remainingRequests?: number
  message?: string
}

// Query key factory
export const aggregatorKeys = {
  all: ['aggregator'] as const,
  profile: (profileId: string) => ['aggregator', 'profile', profileId] as const,
  engagement: () => ['aggregator', 'engagement'] as const,
}

// Fetch aggregator data
export async function fetchAggregatorData(
  profileId: string,
  options: {
    includeItems?: boolean
    aiEnabled?: boolean
    forceRefresh?: boolean
  } = {}
): Promise<AggregatorData> {
  const params = new URLSearchParams({
    profile: profileId,
    includeItems: options.includeItems ? 'true' : 'false',
    ai: options.aiEnabled ? 'true' : 'false',
    refresh: options.forceRefresh ? 'true' : 'false',
  })

  const response = await fetch(`/api/aggregator?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch aggregator data: ${response.statusText}`)
  }

  const data = await response.json()
  
  // Add engagement data and read status to items if available
  if (data.processedFeedItems) {
    const [engagementResponse, readStatusResponse] = await Promise.all([
      fetch('/api/aggregator/track'),
      fetch(`/api/aggregator/read-status?profile=${profileId}`)
    ])
    
    let engagementData: any = null
    let readStatusData: any = null
    
    if (engagementResponse.ok) {
      engagementData = await engagementResponse.json()
    }
    
    if (readStatusResponse.ok) {
      readStatusData = await readStatusResponse.json()
    }
    
    data.processedFeedItems = data.processedFeedItems.map((item: any) => ({
      ...item,
      isRead: readStatusData?.readStatus?.[item.id] || false,
      engagementData: engagementData?.topEngaged?.find((e: any) => e.itemId === item.id)
    }))
  }

  return data
}

// Track engagement (view, click, read, unread)
export async function trackEngagement(
  itemId: string,
  action: 'view' | 'click' | 'read' | 'unread',
  profileId: string
): Promise<void> {
  const response = await fetch('/api/aggregator/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemId,
      action,
      profileId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to track engagement: ${response.statusText}`)
  }
}

// Hooks
export function useAggregatorData(
  profileId: string,
  options: {
    includeItems?: boolean
    aiEnabled?: boolean
    enabled?: boolean
    refetchInterval?: number
  } = {}
) {
  return useQuery({
    queryKey: aggregatorKeys.profile(profileId),
    queryFn: () => fetchAggregatorData(profileId, {
      includeItems: options.includeItems ?? true,
      aiEnabled: options.aiEnabled ?? true,
    }),
    enabled: options.enabled !== false,
    refetchInterval: options.refetchInterval ?? 15 * 60 * 1000, // 15 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Disable to prevent interference with optimistic updates
    refetchOnMount: 'always'
  })
}

export function useRefreshAggregator() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ profileId, forceRefresh = false }: { profileId: string; forceRefresh?: boolean }) => {
      return fetchAggregatorData(profileId, { 
        includeItems: true, 
        aiEnabled: true, 
        forceRefresh 
      })
    },
    onSuccess: (data, variables) => {
      // Update the cached data
      queryClient.setQueryData(aggregatorKeys.profile(variables.profileId), data)
      // Invalidate to trigger background refetch
      queryClient.invalidateQueries({ queryKey: aggregatorKeys.profile(variables.profileId) })
    },
  })
}

export function useTrackEngagement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ itemId, action, profileId }: { itemId: string; action: 'view' | 'click' | 'read' | 'unread'; profileId: string }) =>
      trackEngagement(itemId, action, profileId),
    onMutate: async (variables) => {
      // Optimistically update for read/unread actions only
      if (variables.action === 'read' || variables.action === 'unread') {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: aggregatorKeys.profile(variables.profileId) })
        
        // Snapshot the previous value
        const previousData = queryClient.getQueryData(aggregatorKeys.profile(variables.profileId))
        
        // Optimistically update the cache
        queryClient.setQueryData(
          aggregatorKeys.profile(variables.profileId),
          (oldData: AggregatorData | undefined) => {
            if (!oldData?.processedFeedItems) return oldData
            
            return {
              ...oldData,
              processedFeedItems: oldData.processedFeedItems.map(item =>
                item.url === variables.itemId || item.id === variables.itemId
                  ? { ...item, isRead: variables.action === 'read' }
                  : item
              )
            }
          }
        )
        
        return { previousData }
      }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData && (variables.action === 'read' || variables.action === 'unread')) {
        queryClient.setQueryData(aggregatorKeys.profile(variables.profileId), context.previousData)
      }
      console.error('Failed to track engagement:', error)
    },
    onSuccess: (_, variables) => {
      // Invalidate engagement data
      queryClient.invalidateQueries({ queryKey: aggregatorKeys.engagement() })
      
      // For read/unread actions, we don't need to refetch immediately since we've already
      // optimistically updated the UI. The automatic refetch interval will sync eventually.
      if (variables.action !== 'read' && variables.action !== 'unread') {
        // For other actions (view, click), we can invalidate to get fresh data
        queryClient.invalidateQueries({ queryKey: aggregatorKeys.profile(variables.profileId) })
      }
    }
  })
}