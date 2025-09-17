/**
 * TypeScript types for OpenAI Realtime API integration
 */

// Audio formats supported by Realtime API
export type AudioFormat = 'pcm16' | 'g711_ulaw' | 'g711_alaw'

// Voice options available in Realtime API
export type VoiceOption =
  | 'alloy'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'shimmer'

// Message types from Realtime API
export type RealtimeMessageType =
  | 'session.created'
  | 'session.updated'
  | 'conversation.created'
  | 'conversation.item.created'
  | 'conversation.item.deleted'
  | 'conversation.item.truncated'
  | 'input_audio_buffer.committed'
  | 'input_audio_buffer.cleared'
  | 'input_audio_buffer.speech_started'
  | 'input_audio_buffer.speech_stopped'
  | 'response.created'
  | 'response.done'
  | 'response.cancelled'
  | 'response.audio.delta'
  | 'response.audio.done'
  | 'response.audio_transcript.delta'
  | 'response.audio_transcript.done'
  | 'response.text.delta'
  | 'response.text.done'
  | 'response.function_call_arguments.delta'
  | 'response.function_call_arguments.done'
  | 'error'

// Base message structure
export interface RealtimeMessage {
  type: RealtimeMessageType
  event_id?: string
  [key: string]: any
}

// Session configuration
export interface RealtimeSessionConfig {
  modalities: ('text' | 'audio')[]
  instructions: string
  voice: VoiceOption
  input_audio_format: AudioFormat
  output_audio_format: AudioFormat
  input_audio_transcription?: {
    model: string
  }
  turn_detection?: {
    type: 'server_vad' | 'none'
    threshold?: number
    prefix_padding_ms?: number
    silence_duration_ms?: number
  }
  tools?: RealtimeTool[]
  tool_choice?: 'auto' | 'none' | 'required'
  temperature?: number
  max_response_output_tokens?: number
}

// Tool definition for function calling
export interface RealtimeTool {
  type: 'function'
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

// Conversation item types
export interface ConversationItem {
  id: string
  type: 'message' | 'function_call' | 'function_call_output'
  role?: 'user' | 'assistant' | 'system'
  content?: any
  call_id?: string
  name?: string
  arguments?: string
  output?: string
}

// Audio delta message
export interface AudioDeltaMessage extends RealtimeMessage {
  type: 'response.audio.delta'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  delta: string // Base64 encoded audio
}

// Audio transcript message
export interface AudioTranscriptMessage extends RealtimeMessage {
  type: 'response.audio_transcript.delta' | 'response.audio_transcript.done'
  response_id: string
  item_id: string
  output_index: number
  content_index: number
  delta?: string
  transcript?: string
}

// Function call message
export interface FunctionCallMessage extends RealtimeMessage {
  type: 'response.function_call_arguments.done'
  response_id: string
  item_id: string
  output_index: number
  call_id: string
  name: string
  arguments: string
}

// Error message
export interface ErrorMessage extends RealtimeMessage {
  type: 'error'
  error: {
    type: string
    code?: string
    message: string
    param?: string
  }
}

// Client-to-server message types
export interface ClientMessage {
  type: string
  [key: string]: any
}

export interface AudioAppendMessage extends ClientMessage {
  type: 'input_audio_buffer.append'
  audio: string // Base64 encoded audio
}

export interface AudioCommitMessage extends ClientMessage {
  type: 'input_audio_buffer.commit'
}

export interface AudioClearMessage extends ClientMessage {
  type: 'input_audio_buffer.clear'
}

export interface ResponseCreateMessage extends ClientMessage {
  type: 'response.create'
  response?: {
    modalities?: ('text' | 'audio')[]
    instructions?: string
    voice?: VoiceOption
    output_audio_format?: AudioFormat
    tools?: RealtimeTool[]
    tool_choice?: 'auto' | 'none' | 'required'
    temperature?: number
    max_output_tokens?: number
  }
}

export interface ResponseCancelMessage extends ClientMessage {
  type: 'response.cancel'
}

export interface ConversationItemCreateMessage extends ClientMessage {
  type: 'conversation.item.create'
  item: Partial<ConversationItem>
}

export interface SessionUpdateMessage extends ClientMessage {
  type: 'session.update'
  session: Partial<RealtimeSessionConfig>
}

// Connection state
export interface RealtimeConnectionState {
  isConnected: boolean
  isRecording: boolean
  isSpeaking: boolean
  reconnectAttempts: number
  lastError?: Error
}

// Audio processing state
export interface AudioState {
  isPlaying: boolean
  queueLength: number
  contextState?: AudioContextState
}

// Source information from RAG
export interface RealtimeSource {
  session_id?: string
  date: string
  topics: string[]
  relevance: number
  content?: string
}

// Chat message for display
export interface RealtimeChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: RealtimeSource[]
  isVoice?: boolean
  confidence?: 'high' | 'medium' | 'low'
}

// Realtime service status
export interface RealtimeStatus {
  available: boolean
  model: string
  features: {
    audio_input: boolean
    audio_output: boolean
    function_calling: boolean
    turn_detection: boolean
    transcription: boolean
  }
  voices: VoiceOption[]
  pricing: {
    audio_input_per_minute: string
    audio_output_per_minute: string
    text_input_per_1m_tokens: string
    text_output_per_1m_tokens: string
  }
}

// Hook configuration
export interface RealtimeConfig {
  clientId: string
  token: string
  onMessage?: (message: RealtimeMessage) => void
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onSources?: (sources: RealtimeSource[]) => void
  onError?: (error: Error) => void
  onConnectionChange?: (connected: boolean) => void
}

// Hook return type
export interface UseRealtimeChatReturn {
  // State
  isConnected: boolean
  isRecording: boolean
  isSpeaking: boolean
  transcript: string
  interimTranscript: string
  sources: RealtimeSource[]

  // Actions
  connect: () => void
  disconnect: () => void
  startRecording: () => Promise<void>
  stopRecording: () => void
  sendText: (text: string) => void
  stopSpeaking: () => void
  clearConversation: () => void
  sendMessage: (message: RealtimeMessage) => void
}
