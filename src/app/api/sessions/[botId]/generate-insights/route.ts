import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { transcriptStore } from '@/lib/transcript-store'
import { coachingAnalysisService, COACHING_CRITERIA, GO_LIVE_VALUES } from '@/lib/coaching-analysis'
import OpenAI from 'openai'
import { personalAIHistoryService } from '@/services/personal-ai-history'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface SessionInsightData {
  transcript_duration_minutes: number
  total_word_count: number
  speaker_word_counts: Record<string, number>
  overall_score: number
  conversation_phase: 'opening' | 'exploration' | 'insight' | 'commitment' | 'closing'
  coach_energy_level: number
  client_engagement_level: number
  criteria_scores: Record<string, number>
  go_live_alignment: Record<string, number>
  key_insights: string[]
  patterns_detected: string[]
  breakthrough_moments: string[]
  resistance_patterns: string[]
  client_commitments: string[]
  suggested_followups: string[]
  homework_assignments: string[]
  most_effective_interventions: string[]
  missed_opportunities: string[]
  coaching_strengths: string[]
  areas_for_improvement: string[]
  executive_summary: string
  session_theme: string
  key_topics_discussed: string[]
  emotional_journey: string
  progress_since_last_session?: string
  recurring_themes: string[]
  evolution_of_challenges?: string
  recommended_resources: string[]
  suggested_tools: string[]
  next_session_focus: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params
    console.log(`[Generate Insights] Starting for bot ${botId}`)

    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    let user = null
    let authToken = null

    if (authHeader?.startsWith('Bearer ')) {
      authToken = authHeader.substring(7)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser(authToken)
      if (!authError && authUser) {
        user = authUser
      }
    }

    if (!user || !authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create an authenticated Supabase client with the JWT token
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    )

    // Get session data from transcript store
    const session = transcriptStore.getSession(botId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if session is complete
    if (session.bot.status !== 'done' && session.bot.status !== 'completed') {
      return NextResponse.json({ error: 'Session is not complete' }, { status: 400 })
    }

    // Get the coaching session from database
    const { data: coachingSession, error: sessionError } = await authenticatedSupabase
      .from('coaching_sessions')
      .select('*')
      .eq('bot_id', botId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !coachingSession) {
      console.error('[Generate Insights] Session not found in database:', sessionError)
      return NextResponse.json({ error: 'Coaching session not found' }, { status: 404 })
    }

    // Check if insights already exist
    const { data: existingInsights } = await authenticatedSupabase
      .from('session_insights')
      .select('id')
      .eq('session_id', coachingSession.id)
      .single()

    if (existingInsights) {
      return NextResponse.json({ 
        error: 'Insights already generated for this session',
        insights_id: existingInsights.id 
      }, { status: 400 })
    }

    // Get final transcripts
    const transcripts = session.transcript.filter(t => t.is_final)
    if (transcripts.length === 0) {
      return NextResponse.json({ error: 'No transcripts available' }, { status: 400 })
    }

    // Calculate basic metrics
    const transcriptText = transcripts.map(t => `${t.speaker}: ${t.text}`).join('\n')
    const wordCount = transcriptText.split(/\s+/).length
    const speakerWordCounts: Record<string, number> = {}
    
    transcripts.forEach(t => {
      const words = t.text.split(/\s+/).length
      speakerWordCounts[t.speaker] = (speakerWordCounts[t.speaker] || 0) + words
    })

    // Calculate duration in minutes
    const startTime = transcripts[0]?.start_time || 0
    const endTime = transcripts[transcripts.length - 1]?.end_time || 0
    const durationMinutes = Math.round((endTime - startTime) / 60)

    // Get the latest coaching analysis
    const latestAnalysis = coachingAnalysisService.getLatestAnalysis(botId)
    
    // Get historical context if client is linked
    const clientId = coachingSession.client_id
    let historicalContext: string | null = null
    let progressSummary: string | null = null

    if (clientId) {
      try {
        historicalContext = await personalAIHistoryService.getRelevantContext(clientId)
        progressSummary = await personalAIHistoryService.getClientProgressSummary(clientId)
      } catch (error) {
        console.warn('[Generate Insights] Failed to get historical context:', error)
      }
    }

    // Get user's coaching preference
    const { data: profile } = await authenticatedSupabase
      .from('profiles')
      .select('coaching_preference')
      .eq('id', user.id)
      .single()

    // Generate comprehensive insights using OpenAI
    const insights = await generateComprehensiveInsights(
      transcriptText,
      latestAnalysis,
      historicalContext,
      progressSummary,
      profile?.coaching_preference
    )

    // Prepare data for database
    const insightData = {
      session_id: coachingSession.id,
      bot_id: botId,
      user_id: user.id,
      client_id: clientId || null,
      transcript_duration_minutes: durationMinutes,
      total_word_count: wordCount,
      speaker_word_counts: speakerWordCounts,
      overall_score: latestAnalysis?.overallScore || insights.overall_score,
      conversation_phase: latestAnalysis?.conversationPhase || insights.conversation_phase,
      coach_energy_level: latestAnalysis?.coachEnergyLevel || insights.coach_energy_level,
      client_engagement_level: latestAnalysis?.clientEngagementLevel || insights.client_engagement_level,
      criteria_scores: latestAnalysis?.criteriaScores || insights.criteria_scores,
      go_live_alignment: latestAnalysis?.goLiveAlignment || insights.go_live_alignment,
      key_insights: insights.key_insights,
      patterns_detected: latestAnalysis?.patternsDetected || insights.patterns_detected,
      breakthrough_moments: insights.breakthrough_moments,
      resistance_patterns: insights.resistance_patterns,
      client_commitments: insights.client_commitments,
      suggested_followups: insights.suggested_followups,
      homework_assignments: insights.homework_assignments,
      most_effective_interventions: insights.most_effective_interventions,
      missed_opportunities: latestAnalysis?.urgentMoments || insights.missed_opportunities,
      coaching_strengths: insights.coaching_strengths,
      areas_for_improvement: insights.areas_for_improvement,
      executive_summary: insights.executive_summary,
      session_theme: insights.session_theme,
      key_topics_discussed: insights.key_topics_discussed,
      emotional_journey: insights.emotional_journey,
      progress_since_last_session: progressSummary || insights.progress_since_last_session,
      recurring_themes: insights.recurring_themes,
      evolution_of_challenges: insights.evolution_of_challenges,
      recommended_resources: insights.recommended_resources,
      suggested_tools: insights.suggested_tools,
      next_session_focus: insights.next_session_focus,
      generation_model: 'gpt-4o',
      analysis_version: '1.0',
      raw_analysis_data: {
        latestAnalysis,
        insights,
        historicalContext: historicalContext ? 'available' : 'none'
      }
    }

    // Save to database
    const { data: savedInsights, error: saveError } = await authenticatedSupabase
      .from('session_insights')
      .insert(insightData)
      .select()
      .single()

    if (saveError) {
      console.error('[Generate Insights] Failed to save insights:', saveError)
      return NextResponse.json({ error: 'Failed to save insights' }, { status: 500 })
    }

    console.log(`[Generate Insights] Successfully generated insights for bot ${botId}`)
    return NextResponse.json({ 
      success: true,
      insights: savedInsights
    })

  } catch (error) {
    console.error('[Generate Insights] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

async function generateComprehensiveInsights(
  transcriptText: string,
  latestAnalysis: any,
  historicalContext: string | null,
  progressSummary: string | null,
  coachingPreference: string | null
): Promise<SessionInsightData> {
  const criteriaDescriptions = Object.entries(COACHING_CRITERIA)
    .map(([key, desc]) => `- ${key}: ${desc}`)
    .join('\n')

  const goLiveDescriptions = Object.entries(GO_LIVE_VALUES)
    .map(([key, desc]) => `- ${key}: ${desc}`)
    .join('\n')

  const prompt = `
You are an expert coaching analyst generating comprehensive post-session insights. Analyze the following coaching session transcript and provide detailed insights.

${coachingPreference ? `COACH'S STYLE PREFERENCE:\n${coachingPreference}\n` : ''}

COACHING CRITERIA:
${criteriaDescriptions}

GO LIVE VALUES:
${goLiveDescriptions}

TRANSCRIPT:
${transcriptText}

${latestAnalysis ? `
REAL-TIME ANALYSIS DATA:
- Overall Score: ${latestAnalysis.overallScore}/10
- Phase: ${latestAnalysis.conversationPhase}
- Coach Energy: ${latestAnalysis.coachEnergyLevel}/10
- Client Engagement: ${latestAnalysis.clientEngagementLevel}/10
- Patterns: ${latestAnalysis.patternsDetected?.join(', ')}
- Meta Opportunities: ${latestAnalysis.metaOpportunities?.join(', ')}
` : ''}

${historicalContext ? `
CLIENT HISTORY:
${historicalContext}
` : ''}

${progressSummary ? `
PROGRESS SUMMARY:
${progressSummary}
` : ''}

Generate comprehensive insights in the following JSON format:
{
  "overall_score": 7.5,
  "conversation_phase": "commitment",
  "coach_energy_level": 8,
  "client_engagement_level": 7,
  "criteria_scores": {
    "clear_vision": 7,
    "max_value": 8,
    "client_participation": 7,
    "expand_possibilities": 6,
    "commitments_awareness": 8,
    "powerful_questions": 9,
    "listening_levels": 7,
    "client_ownership": 6,
    "be_do_have": 5,
    "disrupt_beliefs": 7,
    "insights_to_actions": 8,
    "energy_dance": 7
  },
  "go_live_alignment": {
    "growth": 7,
    "ownership": 6,
    "love": 8,
    "integrity": 8,
    "vision": 7,
    "energy": 7
  },
  "key_insights": [
    "Client discovered their limiting belief about...",
    "Major breakthrough when client realized...",
    "Coach successfully challenged the pattern of..."
  ],
  "patterns_detected": [
    "Client tends to deflect responsibility",
    "Recurring theme of perfectionism"
  ],
  "breakthrough_moments": [
    "At 15:30, client had an 'aha' moment about...",
    "Shift in energy when discussing..."
  ],
  "resistance_patterns": [
    "Client showed resistance when discussing...",
    "Avoided going deeper into..."
  ],
  "client_commitments": [
    "Will have conversation with team by Friday",
    "Daily meditation practice for 10 minutes"
  ],
  "suggested_followups": [
    "Check on progress with team conversation",
    "Explore the fear around delegation further"
  ],
  "homework_assignments": [
    "Journal about moments of resistance",
    "Practice new communication framework"
  ],
  "most_effective_interventions": [
    "The question 'What would your future self say?' opened new perspective",
    "Silence after discussing the fear allowed processing"
  ],
  "missed_opportunities": [
    "Could have explored the emotion when client mentioned...",
    "Opportunity to challenge the belief about..."
  ],
  "coaching_strengths": [
    "Excellent use of powerful questions",
    "Strong presence and holding space"
  ],
  "areas_for_improvement": [
    "Could push more on ownership",
    "Explore emotions more deeply"
  ],
  "executive_summary": "This session focused on the client's leadership challenges and fear of delegation. Through powerful questioning, the client discovered their perfectionism pattern and committed to specific actions. The conversation moved from exploration to commitment with strong energy throughout.",
  "session_theme": "Leadership transformation through delegation",
  "key_topics_discussed": [
    "Team dynamics",
    "Delegation fears",
    "Personal growth",
    "Communication patterns"
  ],
  "emotional_journey": "Started anxious and overwhelmed, moved through frustration and discovery, ended with hope and determination",
  "progress_since_last_session": "Client has made significant progress on communication, still working on delegation",
  "recurring_themes": [
    "Perfectionism",
    "Fear of losing control",
    "Desire for team harmony"
  ],
  "evolution_of_challenges": "Moving from tactical problems to deeper leadership transformation",
  "recommended_resources": [
    "Book: 'The Five Dysfunctions of a Team'",
    "Article on delegation frameworks"
  ],
  "suggested_tools": [
    "DISC assessment for team",
    "Weekly 1-on-1 template"
  ],
  "next_session_focus": "Review delegation progress and explore deeper patterns around control"
}

Provide comprehensive, actionable insights that will help both the coach and client. Be specific and reference actual moments from the conversation when possible.
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert coaching analyst providing comprehensive post-session insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No insights generated')
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format')
    }

    const insights = JSON.parse(jsonMatch[0])
    
    // Ensure all required fields have default values
    return {
      overall_score: insights.overall_score || 5,
      conversation_phase: insights.conversation_phase || 'exploration',
      coach_energy_level: insights.coach_energy_level || 5,
      client_engagement_level: insights.client_engagement_level || 5,
      criteria_scores: insights.criteria_scores || {},
      go_live_alignment: insights.go_live_alignment || {},
      key_insights: insights.key_insights || [],
      patterns_detected: insights.patterns_detected || [],
      breakthrough_moments: insights.breakthrough_moments || [],
      resistance_patterns: insights.resistance_patterns || [],
      client_commitments: insights.client_commitments || [],
      suggested_followups: insights.suggested_followups || [],
      homework_assignments: insights.homework_assignments || [],
      most_effective_interventions: insights.most_effective_interventions || [],
      missed_opportunities: insights.missed_opportunities || [],
      coaching_strengths: insights.coaching_strengths || [],
      areas_for_improvement: insights.areas_for_improvement || [],
      executive_summary: insights.executive_summary || 'Session analysis pending',
      session_theme: insights.session_theme || 'General coaching session',
      key_topics_discussed: insights.key_topics_discussed || [],
      emotional_journey: insights.emotional_journey || 'Not analyzed',
      progress_since_last_session: insights.progress_since_last_session,
      recurring_themes: insights.recurring_themes || [],
      evolution_of_challenges: insights.evolution_of_challenges,
      recommended_resources: insights.recommended_resources || [],
      suggested_tools: insights.suggested_tools || [],
      next_session_focus: insights.next_session_focus || 'Continue current work',
      transcript_duration_minutes: 0,
      total_word_count: 0,
      speaker_word_counts: {}
    }
  } catch (error) {
    console.error('[Generate Insights] OpenAI error:', error)
    // Return minimal default insights
    return {
      overall_score: 5,
      conversation_phase: 'exploration',
      coach_energy_level: 5,
      client_engagement_level: 5,
      criteria_scores: {},
      go_live_alignment: {},
      key_insights: [],
      patterns_detected: [],
      breakthrough_moments: [],
      resistance_patterns: [],
      client_commitments: [],
      suggested_followups: [],
      homework_assignments: [],
      most_effective_interventions: [],
      missed_opportunities: [],
      coaching_strengths: [],
      areas_for_improvement: [],
      executive_summary: 'Analysis could not be completed',
      session_theme: 'Session completed',
      key_topics_discussed: [],
      emotional_journey: 'Not analyzed',
      recurring_themes: [],
      recommended_resources: [],
      suggested_tools: [],
      next_session_focus: 'Review session outcomes',
      transcript_duration_minutes: 0,
      total_word_count: 0,
      speaker_word_counts: {}
    }
  }
}

// GET endpoint to retrieve insights for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params
    
    // Get user from Supabase auth
    const authHeader = request.headers.get('authorization')
    let user = null
    let authToken = null

    if (authHeader?.startsWith('Bearer ')) {
      authToken = authHeader.substring(7)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser(authToken)
      if (!authError && authUser) {
        user = authUser
      }
    }

    if (!user || !authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create an authenticated Supabase client with the JWT token
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    )

    // Get the coaching session
    const { data: coachingSession, error: sessionError } = await authenticatedSupabase
      .from('coaching_sessions')
      .select('id')
      .eq('bot_id', botId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !coachingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get insights
    const { data: insights, error: insightsError } = await authenticatedSupabase
      .from('session_insights')
      .select('*')
      .eq('session_id', coachingSession.id)
      .single()

    if (insightsError) {
      if (insightsError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Insights not generated yet' }, { status: 404 })
      }
      throw insightsError
    }

    return NextResponse.json({ insights })

  } catch (error) {
    console.error('[Get Insights] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve insights' },
      { status: 500 }
    )
  }
}