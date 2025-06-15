import { NextRequest, NextResponse } from 'next/server'
import { ConfigLoader } from '../../../../aggregator/lib/config/config-loader'
import path from 'path'

const configPath = path.join(process.cwd(), 'aggregator', 'config')
const configLoader = new ConfigLoader(configPath)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    
    switch (type) {
      case 'sources':
        const sources = await configLoader.loadSources()
        return NextResponse.json({
          sources: sources.map(source => ({
            id: source.id,
            name: source.name,
            type: source.type,
            enabled: source.enabled,
            fetchInterval: source.fetchInterval,
            weight: source.weight,
            url: source.url
          }))
        })
        
      case 'profiles':
        const profiles = await configLoader.getActiveProfiles()
        return NextResponse.json({
          profiles: profiles.map(profile => ({
            id: profile.id,
            name: profile.name,
            enabled: profile.enabled,
            sources: profile.sources,
            focus: {
              description: profile.focus?.description || profile.description || 'No description available'
            },
            processing: profile.processing
          }))
        })
        
      case 'status':
        const allSources = await configLoader.loadSources()
        const allProfiles = await configLoader.getAllProfiles()
        const activeProfiles = await configLoader.getActiveProfiles()
        
        return NextResponse.json({
          status: {
            sources: {
              total: allSources.length,
              enabled: allSources.filter(s => s.enabled).length,
              byType: allSources.reduce((acc, source) => {
                acc[source.type] = (acc[source.type] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            },
            profiles: {
              total: allProfiles.length,
              active: activeProfiles.length
            },
            configDir: configPath,
            isReady: true
          }
        })
        
      case 'all':
      default:
        const [allSourcesData, allProfilesData] = await Promise.all([
          configLoader.loadSources(),
          configLoader.getAllProfiles()
        ])
        
        return NextResponse.json({
          sources: allSourcesData.map(source => ({
            id: source.id,
            name: source.name,
            type: source.type,
            enabled: source.enabled,
            fetchInterval: source.fetchInterval,
            weight: source.weight,
            url: source.url
          })),
          profiles: allProfilesData.map(profile => ({
            id: profile.id,
            name: profile.name,
            enabled: profile.enabled,
            sources: profile.sources,
            focus: {
              description: profile.focus?.description || profile.description || 'No description available'
            },
            processing: profile.processing
          }))
        })
    }
    
  } catch (error) {
    console.error('Config API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sourceId, profileId, enabled } = body
    
    switch (action) {
      case 'toggle_source':
        if (!sourceId) {
          return NextResponse.json(
            { error: 'sourceId required for toggle_source action' },
            { status: 400 }
          )
        }
        
        // Note: In a production system, you'd want to implement
        // actual configuration file updates here
        return NextResponse.json({
          message: 'Source toggle would be implemented in production',
          sourceId,
          enabled
        })
        
      case 'toggle_profile':
        if (!profileId) {
          return NextResponse.json(
            { error: 'profileId required for toggle_profile action' },
            { status: 400 }
          )
        }
        
        // Note: In a production system, you'd want to implement
        // actual configuration file updates here
        return NextResponse.json({
          message: 'Profile toggle would be implemented in production',
          profileId,
          enabled
        })
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Config POST API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}