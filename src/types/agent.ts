/**
 * Types for the admin data-analyst agent.
 *
 * The server streams typed SSE events as the agent thinks and uses tools.
 * The frontend accumulates these into `AgentMessage` records for rendering.
 */

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'scatter'

export interface ChartSpec {
  chart_type: ChartType
  title: string
  description?: string | null
  data: Array<Record<string, unknown>>
  x_key: string
  y_keys: string[]
}

export interface SqlResult {
  columns: string[]
  rows: Array<Array<unknown>>
  row_count: number
  truncated: boolean
  duration_ms: number
  final_query: string
}

export interface SchemaListResult {
  tables: string[]
}

export interface SchemaDescribeResult {
  description: string
}

export interface ToolError {
  error: string
  message: string
}

export interface TranscriptChunk {
  content: string
  session_id?: string
  client_id?: string
  client_name?: string
  coach_name?: string
  session_date?: string
  topics?: string[]
  score?: number
  chunk_index?: number
}

export interface SearchConversationsResult {
  chunks: TranscriptChunk[]
  result_count: number
  scope?: string
  truncated?: boolean
}

export interface SessionTranscriptResult {
  session_id: string
  session_meta: Record<string, unknown>
  chunks: TranscriptChunk[]
  chunk_count: number
  truncated?: boolean
}

export type ToolResultPayload =
  | SqlResult
  | SchemaListResult
  | SchemaDescribeResult
  | SearchConversationsResult
  | SessionTranscriptResult
  | ToolError
  | { ok: boolean; rendered?: boolean }
  | Record<string, unknown>

export interface AgentMetrics {
  total_cost_usd?: number
  duration_ms?: number
  num_turns?: number
}

/** SSE event payloads emitted by the backend. */
export type AgentEvent =
  | { type: 'session_init'; session_id: string }
  | { type: 'message_start'; iteration?: number }
  | { type: 'assistant_text_delta'; text: string }
  | { type: 'assistant_thinking'; text: string }
  | { type: 'tool_use_start'; id: string; name: ToolName }
  | { type: 'tool_input_delta'; id: string; partial_json: string }
  | {
      type: 'tool_use_end'
      id: string
      name: ToolName
      input: Record<string, unknown>
    }
  | {
      type: 'tool_result'
      id: string
      result: ToolResultPayload
      is_error?: boolean
    }
  | { type: 'chart'; spec: ChartSpec }
  | { type: 'message_stop'; stop_reason: string }
  | { type: 'error'; message: string }
  | { type: 'done'; session_id?: string; metrics?: AgentMetrics }

export type ToolName =
  | 'run_sql_query'
  | 'describe_schema'
  | 'generate_chart'
  | 'search_conversations'
  | 'get_session_transcript'

/** A block within an assistant message, in render order. */
export type MessageBlock =
  | { kind: 'text'; text: string }
  | {
      kind: 'tool_call'
      id: string
      name: ToolName
      input: Record<string, unknown>
      partialInput: string
      status: 'running' | 'done' | 'error'
      result?: ToolResultPayload
    }
  | { kind: 'chart'; spec: ChartSpec }

export interface AgentMessage {
  /** Stable id for React keying. */
  id: string
  role: 'user' | 'assistant'
  blocks: MessageBlock[]
  /** Populated when the assistant turn ends; renders a small footer in the UI. */
  metrics?: AgentMetrics
}

export interface ModelOption {
  id: string
  label: string
  description: string
}

export interface ModelsResponse {
  models: ModelOption[]
  default: string
}
