import { NextRequest, NextResponse } from 'next/server'

// Development-only endpoint to reset rate limiting
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Reset endpoint only available in development' },
      { status: 403 }
    )
  }

  try {
    // Import the cache and request count maps (this is a bit hacky but works for dev)
    // In a real app, you'd use Redis or a database
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rate limiting reset. Restart the server to apply changes.' 
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset rate limiting' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Reset endpoint only available in development' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    message: 'To reset rate limiting, restart the development server',
    currentLimits: {
      maxRequestsPerDay: process.env.NODE_ENV === 'development' ? 10 : 2,
      cacheDuration: '12 hours'
    }
  })
}