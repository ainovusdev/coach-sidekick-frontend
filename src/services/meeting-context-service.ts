import { ApiClient } from '@/lib/api-client'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://coach-sidekick-backend-production.up.railway.app/api/v1'

export interface ClientProfile {
  client_id: string
  personality_traits?: string[]
  communication_style?: string
  learning_style?: string
  primary_goals?: string[]
  short_term_goals?: string[]
  long_term_goals?: string[]
  main_challenges?: string[]
  obstacles?: string[]
  values?: string[]
  strengths?: string[]
  growth_areas?: string[]
  recurring_themes?: string[]
  breakthrough_moments?: string[]
  achievements?: string[]
  sessions_analyzed?: number
  last_updated?: string
}

export interface SimilarSession {
  session_date: string
  session_id?: string
  duration_minutes?: number
  summary?: string
  content_preview: string
  topics: string[]
  sentiment?: string
  certainty: number
  key_topics?: string[]
  action_items?: string[]
  relevance_reason?: string
}

export interface SessionSummary {
  session_date: string
  summary: string
  key_points: string[]
  relevance_reason: string
}

export interface PatternHistory {
  date: string
  patterns: string[]
  dominant_pattern?: string
  intensity?: Record<string, number>
  context?: string
}

export interface RecurringTheme {
  theme: string
  count: number
  last_seen: string
}

export interface ConversationSegment {
  speaker: 'coach' | 'client' | 'assistant'
  text: string
  timestamp?: string
  relevance?: number
}

export interface AnalysisConversation {
  id: string
  segments: ConversationSegment[]
  summary?: string
  relevance_score?: number
  analysis_reason?: string
  key_moments?: string[]
  timestamp?: string
}

export interface MeetingContext {
  client_profile?: ClientProfile
  similar_sessions?: SimilarSession[]
  session_summaries?: SessionSummary[]
  pattern_history?: PatternHistory[]
  recurring_themes?: RecurringTheme[]
  patterns?: string[]
  analysis_conversations?: AnalysisConversation[]
  insights?: {
    client_journey?: string
    key_patterns?: string[]
    suggested_focus?: string[]
    breakthrough_potential?: string
  }
}

export class MeetingContextService {
  /**
   * Get full context for a meeting session when clientId is already known
   * This avoids re-fetching the session just to get clientId
   */
  static async getMeetingContextWithClientId(
    botId: string,
    clientId: string,
  ): Promise<MeetingContext | null> {
    try {
      // Get session ID from bot ID (we still need this for some queries)
      const session = await ApiClient.get(
        `${BACKEND_URL}/sessions/by-bot/${botId}`,
      )

      const sessionId = session?.id

      // Fetch client profile/persona
      const clientProfile = await this.getClientProfile(clientId)

      // Fetch similar sessions (needs sessionId to exclude current)
      const similarSessions = sessionId
        ? await this.getSimilarSessions(clientId, sessionId)
        : { sessions: [], summaries: [] }

      // Fetch patterns and insights
      const patterns = sessionId
        ? await this.getPatterns(clientId, sessionId)
        : { current: [], history: [], themes: [], insights: {} }

      // Fetch analysis conversations
      const analysisConversations = sessionId
        ? await this.getAnalysisConversations(sessionId)
        : []

      return {
        client_profile: clientProfile || undefined,
        similar_sessions: similarSessions.sessions,
        session_summaries: similarSessions.summaries,
        pattern_history: patterns.history,
        recurring_themes: patterns.themes,
        patterns: patterns.current,
        analysis_conversations: analysisConversations,
        insights: patterns.insights,
      }
    } catch (error) {
      console.error('Failed to fetch meeting context with clientId:', error)
      return null
    }
  }

  /**
   * Get full context for a meeting session
   */
  static async getMeetingContext(
    botId: string,
  ): Promise<MeetingContext | null> {
    try {
      // First get session ID from bot ID
      const session = await ApiClient.get(
        `${BACKEND_URL}/sessions/by-bot/${botId}`,
      )

      if (!session || !session.id) {
        console.error('Session not found for bot:', botId)
        return null
      }

      // Get the client ID from session
      const clientId = session.client_id

      if (!clientId) {
        console.error('No client associated with session:', session.id)
        return null
      }

      // Fetch client profile/persona
      const clientProfile = await this.getClientProfile(clientId)

      // Fetch similar sessions
      const similarSessions = await this.getSimilarSessions(
        clientId,
        session.id,
      )

      // Fetch patterns and insights
      const patterns = await this.getPatterns(clientId, session.id)

      // Fetch analysis conversations
      const analysisConversations = await this.getAnalysisConversations(
        session.id,
      )

      return {
        client_profile: clientProfile || undefined,
        similar_sessions: similarSessions.sessions,
        session_summaries: similarSessions.summaries,
        pattern_history: patterns.history,
        recurring_themes: patterns.themes,
        patterns: patterns.current,
        analysis_conversations: analysisConversations,
        insights: patterns.insights,
      }
    } catch (error) {
      console.error('Failed to fetch meeting context:', error)
      return null
    }
  }

  /**
   * Get client profile data
   */
  static async getClientProfile(
    clientId: string,
  ): Promise<ClientProfile | null> {
    try {
      const response = await ApiClient.get(
        `${BACKEND_URL}/clients/${clientId}/persona`,
      )

      // Transform the persona response to the expected format
      if (response) {
        return {
          client_id: clientId,
          personality_traits: response.personality?.personality_traits || [],
          communication_style: response.personality?.communication_style,
          learning_style: response.personality?.learning_style,
          primary_goals: response.goals?.primary_goals || [],
          short_term_goals: response.goals?.short_term_goals || [],
          long_term_goals: response.goals?.long_term_goals || [],
          main_challenges: response.challenges?.main_challenges || [],
          obstacles: response.challenges?.obstacles || [],
          values: response.personality?.values || [],
          strengths: response.patterns?.strengths || [],
          growth_areas: response.patterns?.growth_areas || [],
          recurring_themes: response.patterns?.recurring_themes || [],
          breakthrough_moments: response.progress?.breakthrough_moments || [],
          achievements: response.progress?.achievements || [],
          sessions_analyzed: response.metadata?.sessions_analyzed,
          last_updated: response.metadata?.last_updated,
        }
      }

      return null
    } catch (error) {
      console.error('Failed to fetch client profile:', error)
      return null
    }
  }

  /**
   * Get similar sessions for context
   */
  static async getSimilarSessions(
    clientId: string,
    currentSessionId: string,
  ): Promise<{
    sessions: SimilarSession[]
    summaries: SessionSummary[]
  }> {
    try {
      // Fetch recent sessions for the client
      const response = await ApiClient.post(`${BACKEND_URL}/sessions/list`, {
        client_id: clientId,
        limit: 10,
      })

      const sessions: SimilarSession[] = []
      const summaries: SessionSummary[] = []

      // Handle response which might have a sessions array
      const sessionsList = response?.sessions || response || []

      if (Array.isArray(sessionsList)) {
        // Filter out current session and transform to expected format
        sessionsList
          .filter((s: any) => s.id !== currentSessionId)
          .slice(0, 5) // Get top 5 similar sessions
          .forEach((session: any) => {
            // Calculate duration in minutes
            const durationMinutes = session.duration_seconds
              ? Math.round(session.duration_seconds / 60)
              : session.duration_minutes

            // Create similar session entry
            sessions.push({
              session_date: session.started_at || session.created_at,
              session_id: session.id,
              duration_minutes: durationMinutes,
              summary: session.summary || '',
              content_preview:
                session.transcript_preview ||
                session.summary ||
                'No transcript available',
              topics: session.key_topics || session.topics || [],
              sentiment: session.sentiment,
              certainty: 0.75, // Default certainty
              key_topics: session.key_topics || session.topics || [],
              action_items: session.action_items || [],
              relevance_reason:
                session.relevance_reason || 'Recent session with this client',
            })

            // Create summary if available
            if (session.summary) {
              summaries.push({
                session_date: session.started_at || session.created_at,
                summary: session.summary,
                key_points: session.key_points || session.key_topics || [],
                relevance_reason:
                  session.relevance_reason || 'Related session content',
              })
            }
          })
      }

      return { sessions, summaries }
    } catch (error) {
      console.error('Failed to fetch similar sessions:', error)
      return { sessions: [], summaries: [] }
    }
  }

  /**
   * Get analysis conversations from the last analysis
   */
  static async getAnalysisConversations(
    sessionId: string,
  ): Promise<AnalysisConversation[]> {
    try {
      // Fetch the latest analysis which might contain conversation context
      const analysis = await ApiClient.get(
        `${BACKEND_URL}/analysis/${sessionId}/latest`,
      )

      const conversations: AnalysisConversation[] = []

      if (analysis && analysis.conversation_context) {
        // Transform conversation context from analysis
        if (Array.isArray(analysis.conversation_context)) {
          analysis.conversation_context.forEach(
            (context: any, index: number) => {
              const segments: ConversationSegment[] = []

              // Parse conversation segments
              if (context.segments) {
                context.segments.forEach((segment: any) => {
                  segments.push({
                    speaker: segment.speaker || 'coach',
                    text: segment.text || segment.content || '',
                    timestamp: segment.timestamp,
                    relevance: segment.relevance,
                  })
                })
              } else if (context.transcript) {
                // Handle transcript format
                context.transcript.forEach((entry: any) => {
                  segments.push({
                    speaker: entry.speaker === 'Coach' ? 'coach' : 'client',
                    text: entry.text || entry.content || '',
                    timestamp: entry.timestamp,
                  })
                })
              }

              conversations.push({
                id: `conv_${sessionId}_${index}`,
                segments,
                summary: context.summary,
                relevance_score: context.relevance_score || context.relevance,
                analysis_reason:
                  context.reason ||
                  context.analysis_reason ||
                  'Used in coaching analysis',
                key_moments: context.key_moments || context.highlights || [],
                timestamp: context.timestamp || analysis.created_at,
              })
            },
          )
        } else if (analysis.conversation_context.conversations) {
          // Handle nested conversations structure
          const convs = analysis.conversation_context.conversations
          if (Array.isArray(convs)) {
            convs.forEach((conv: any, index: number) => {
              const segments: ConversationSegment[] = []

              if (conv.messages || conv.segments) {
                ;(conv.messages || conv.segments).forEach((msg: any) => {
                  segments.push({
                    speaker:
                      msg.role === 'coach'
                        ? 'coach'
                        : msg.role === 'client'
                          ? 'client'
                          : 'assistant',
                    text: msg.content || msg.text || '',
                    timestamp: msg.timestamp,
                  })
                })
              }

              conversations.push({
                id: `conv_${sessionId}_${index}`,
                segments,
                summary: conv.summary,
                relevance_score: conv.relevance,
                analysis_reason: conv.reason || 'Relevant conversation segment',
                key_moments: conv.key_moments || [],
                timestamp: conv.timestamp,
              })
            })
          }
        }
      }

      // If no conversation context in analysis, try to extract from suggestions
      if (conversations.length === 0 && analysis && analysis.results) {
        if (analysis.results.conversation_samples) {
          // Some backends might store conversation samples separately
          analysis.results.conversation_samples.forEach(
            (sample: any, index: number) => {
              const segments: ConversationSegment[] = []

              if (sample.exchange) {
                segments.push({
                  speaker: 'coach',
                  text: sample.exchange.coach || '',
                })
                segments.push({
                  speaker: 'client',
                  text: sample.exchange.client || '',
                })
              }

              conversations.push({
                id: `sample_${sessionId}_${index}`,
                segments,
                summary: sample.context,
                relevance_score: sample.relevance || 0.7,
                analysis_reason: sample.reason || 'Example conversation',
                key_moments: sample.tags || [],
                timestamp: analysis.created_at,
              })
            },
          )
        }
      }

      return conversations
    } catch (error) {
      console.error('Failed to fetch analysis conversations:', error)
      return []
    }
  }

  /**
   * Get patterns and insights
   */
  static async getPatterns(
    clientId: string,
    sessionId: string,
  ): Promise<{
    current: string[]
    history: PatternHistory[]
    themes: RecurringTheme[]
    insights: {
      client_journey?: string
      key_patterns?: string[]
      suggested_focus?: string[]
      breakthrough_potential?: string
    }
  }> {
    try {
      // Fetch analysis data which might contain patterns
      const analysis = await ApiClient.get(
        `${BACKEND_URL}/analysis/${sessionId}/latest`,
      )

      const current: string[] = []
      const history: PatternHistory[] = []
      const themes: RecurringTheme[] = []
      const insights: any = {}

      if (analysis && analysis.results) {
        // Extract patterns from analysis
        if (analysis.results.patterns) {
          current.push(...analysis.results.patterns)
        }

        // Extract insights
        if (analysis.results.insights) {
          insights.client_journey = analysis.results.insights.journey
          insights.key_patterns = analysis.results.insights.patterns || []
          insights.suggested_focus = analysis.results.insights.focus_areas || []
          insights.breakthrough_potential =
            analysis.results.insights.breakthrough_potential
        }

        // Extract themes from improvement areas and strengths
        const themeMap = new Map<string, number>()

        if (analysis.results.improvement_areas) {
          analysis.results.improvement_areas.forEach((area: string) => {
            themeMap.set(area, (themeMap.get(area) || 0) + 1)
          })
        }

        if (analysis.results.strengths) {
          analysis.results.strengths.forEach((strength: string) => {
            themeMap.set(strength, (themeMap.get(strength) || 0) + 1)
          })
        }

        // Convert to recurring themes
        themeMap.forEach((count, theme) => {
          themes.push({
            theme,
            count,
            last_seen: new Date().toISOString(),
          })
        })
      }

      return {
        current,
        history,
        themes,
        insights,
      }
    } catch (error) {
      console.error('Failed to fetch patterns:', error)
      return {
        current: [],
        history: [],
        themes: [],
        insights: {},
      }
    }
  }
}
