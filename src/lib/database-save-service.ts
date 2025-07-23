import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence: number
  is_final: boolean
  start_time?: number
  end_time?: number
}

interface SaveResult {
  success: boolean
  savedCount: number
  totalSaved: number
  sessionId?: string
  error?: string
}

export class DatabaseSaveService {
  /**
   * Save transcript entries directly to the database
   */
  async saveTranscriptBatch(
    botId: string,
    entries: TranscriptEntry[],
    userId?: string,
    authenticatedClient?: SupabaseClient,
  ): Promise<SaveResult> {
    try {
      if (!botId || !entries || entries.length === 0) {
        return {
          success: false,
          savedCount: 0,
          totalSaved: 0,
          error: 'botId and entries are required',
        }
      }

      // Use provided authenticated client, service role client for webhooks, or default client
      const supabase = authenticatedClient || this.getServiceRoleClient()

      // Find the coaching session
      let sessionQuery = supabase
        .from('coaching_sessions')
        .select('id, user_id, metadata')
        .eq('bot_id', botId)

      if (userId) {
        sessionQuery = sessionQuery.eq('user_id', userId)
      }

      const { data: coachingSession, error: sessionError } =
        await sessionQuery.single()

      if (sessionError || !coachingSession) {
        console.error(
          'Coaching session not found for bot:',
          botId,
          sessionError,
        )
        return {
          success: false,
          savedCount: 0,
          totalSaved: 0,
          error: 'Coaching session not found',
        }
      }

      const sessionId = coachingSession.id

      // Check what's already been saved to avoid duplicates
      const { data: existingEntries } = await supabase
        .from('transcript_entries')
        .select('id')
        .eq('coaching_session_id', sessionId)
        .order('created_at', { ascending: true })

      const startingIndex = existingEntries?.length || 0

      // Only save entries that haven't been saved yet
      const newEntries = entries.slice(startingIndex).map((entry, index) => ({
        coaching_session_id: sessionId,
        speaker: entry.speaker,
        text: entry.text,
        timestamp: entry.timestamp,
        confidence: entry.confidence,
        is_final: entry.is_final,
        start_time: entry.start_time,
        end_time: entry.end_time,
        entry_index: startingIndex + index, // Track order
      }))

      if (newEntries.length === 0) {
        return {
          success: true,
          savedCount: 0,
          totalSaved: startingIndex,
          sessionId,
        }
      }

      // Save new transcript entries
      const { error: insertError } = await supabase
        .from('transcript_entries')
        .insert(newEntries)

      if (insertError) {
        console.error('Error saving transcript batch:', insertError)
        return {
          success: false,
          savedCount: 0,
          totalSaved: startingIndex,
          error: 'Failed to save transcript batch',
        }
      }

      // Update session's last activity
      const { error: updateError } = await supabase
        .from('coaching_sessions')
        .update({
          updated_at: new Date().toISOString(),
          metadata: {
            ...coachingSession.metadata,
            last_batch_save: new Date().toISOString(),
            total_transcript_entries: startingIndex + newEntries.length,
          },
        })
        .eq('id', sessionId)

      if (updateError) {
        console.error('Error updating session metadata:', updateError)
        // Don't fail the request if metadata update fails
      }

      console.log(
        `Saved transcript batch for session ${sessionId}: ${
          newEntries.length
        } new entries (total: ${startingIndex + newEntries.length})`,
      )

      return {
        success: true,
        savedCount: newEntries.length,
        totalSaved: startingIndex + newEntries.length,
        sessionId,
      }
    } catch (error) {
      console.error('Error in database save service:', error)
      return {
        success: false,
        savedCount: 0,
        totalSaved: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Ensure a coaching session exists for the given bot
   */
  async ensureSession(
    botId: string,
    userId?: string,
    sessionData?: {
      meeting_url?: string
      client_id?: string
      status?: string
      metadata?: any
    },
    authenticatedClient?: SupabaseClient,
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      // Use provided authenticated client or service role client
      const supabase = authenticatedClient || this.getServiceRoleClient()

      // Check if session already exists
      let sessionQuery = supabase
        .from('coaching_sessions')
        .select('id')
        .eq('bot_id', botId)

      if (userId) {
        sessionQuery = sessionQuery.eq('user_id', userId)
      }

      const { data: existingSession } = await sessionQuery.single()

      if (existingSession) {
        return {
          success: true,
          sessionId: existingSession.id,
        }
      }

      // Create new session if it doesn't exist and we have the required data
      if (!sessionData || !sessionData.meeting_url || !userId) {
        return {
          success: false,
          error: 'Session does not exist and insufficient data to create one',
        }
      }

      const { error: insertError, data: newSession } = await supabase
        .from('coaching_sessions')
        .insert({
          user_id: userId,
          bot_id: botId,
          meeting_url: sessionData.meeting_url,
          client_id: sessionData.client_id || null,
          status: sessionData.status || 'created',
          metadata: sessionData.metadata || {},
        })
        .select('id')
        .single()

      if (insertError || !newSession) {
        console.error('Error creating coaching session:', insertError)
        return {
          success: false,
          error: 'Failed to create coaching session',
        }
      }

      return {
        success: true,
        sessionId: newSession.id,
      }
    } catch (error) {
      console.error('Error ensuring session exists:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get a service role Supabase client (bypasses RLS - for server/webhook usage)
   */
  private getServiceRoleClient(): SupabaseClient {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }

  /**
   * Get a default Supabase client (with RLS - for authenticated usage)
   */
  private getDefaultClient(): SupabaseClient {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
}

export const databaseSaveService = new DatabaseSaveService()
