import { NextRequest, NextResponse } from 'next/server'
import { personalAIClient } from '@/services/personal-ai-client'

export async function GET(request: NextRequest) {
  try {
    // Check configuration
    const configured = !!(process.env.PERSONAL_AI_API_KEY && process.env.PERSONAL_AI_DOMAIN_NAME)
    
    if (!configured) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'Personal AI not configured - missing API key or domain name',
        configured: false,
      })
    }

    // Test Personal AI connection with a simple message
    const startTime = Date.now()
    
    try {
      const response = await personalAIClient.sendMessage({
        Text: 'Hello, this is a test from Coach Sidekick. Please respond with a simple greeting.',
        DomainName: process.env.PERSONAL_AI_DOMAIN_NAME!,
        SourceName: 'Coach Sidekick Test',
      })

      const responseTime = Date.now() - startTime

      return NextResponse.json({
        status: 'success',
        configured: true,
        responseTime,
        domain: process.env.PERSONAL_AI_DOMAIN_NAME,
        testResponse: response.ai_message,
        score: response.ai_score,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return NextResponse.json({
        status: 'connection_failed',
        configured: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        domain: process.env.PERSONAL_AI_DOMAIN_NAME,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('[Personal AI Test] Error:', error)
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}