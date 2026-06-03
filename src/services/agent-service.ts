/**
 * SSE client for the admin data-analyst agent.
 *
 * The standard ApiClient doesn't support streaming, so we use raw fetch + ReadableStream
 * and inject the Bearer token manually.
 */

import authService from '@/services/auth-service'
import type {
  AgentEvent,
  AgentThreadDetail,
  AgentThreadListResponse,
  ModelsResponse,
} from '@/types/agent'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Which agent mount to hit. The same endpoints live under three prefixes; the
 * backend scopes the data by role (admin = everything, coach = their clients,
 * client = their own). See coach-sidekick-backend/app/api/v1/agent_router.py.
 */
export type AgentApiScope = 'admin' | 'coach' | 'client'

function agentBase(scope: AgentApiScope): string {
  return `${API_BASE}/${scope}/agent`
}

export interface StreamAgentArgs {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  model: string
  /** If set, the Agent SDK resumes that conversation — tool history from prior turns is preserved. */
  resume_session_id?: string | null
  /** DB-backed thread id. Omitted on the first turn; the server creates a thread and emits `thread_init`. */
  thread_id?: string | null
  /** Agent mount to stream from. Defaults to the admin mount. */
  scope?: AgentApiScope
  signal?: AbortSignal
}

function authHeader(): Record<string, string> {
  const token = authService.getToken()
  if (!token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${token}` }
}

/**
 * Super-admin impersonation headers, mirroring ApiClient. The backend scope deps
 * (`get_current_user_with_roles` / `get_client_context`) read these to view the
 * agent as a given coach/client, so insight cards must forward them.
 */
function viewAsHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const headers: Record<string, string> = {}
  const viewAsClient = sessionStorage.getItem('view_as_client_id')
  if (viewAsClient) headers['X-View-As-Client'] = viewAsClient
  const viewAsCoach = sessionStorage.getItem('view_as_coach_id')
  if (viewAsCoach) headers['X-View-As-Coach'] = viewAsCoach
  return headers
}

async function unwrapError(res: Response, fallback: string): Promise<string> {
  try {
    const j = await res.json()
    if (j?.detail) {
      return typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
    }
  } catch {
    /* ignore */
  }
  return fallback
}

// ---------------------------------------------------------------------------
// Thread persistence
// ---------------------------------------------------------------------------

export async function listAgentThreads(
  scope: AgentApiScope = 'admin',
): Promise<AgentThreadListResponse> {
  const res = await fetch(`${agentBase(scope)}/threads`, {
    headers: authHeader(),
  })
  if (!res.ok) {
    throw new Error(
      await unwrapError(res, `Failed to load threads: ${res.status}`),
    )
  }
  return (await res.json()) as AgentThreadListResponse
}

export async function getAgentThread(
  threadId: string,
  scope: AgentApiScope = 'admin',
): Promise<AgentThreadDetail> {
  const res = await fetch(`${agentBase(scope)}/threads/${threadId}`, {
    headers: authHeader(),
  })
  if (!res.ok) {
    throw new Error(
      await unwrapError(res, `Failed to load thread: ${res.status}`),
    )
  }
  return (await res.json()) as AgentThreadDetail
}

export async function deleteAgentThread(
  threadId: string,
  scope: AgentApiScope = 'admin',
): Promise<void> {
  const res = await fetch(`${agentBase(scope)}/threads/${threadId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  if (!res.ok && res.status !== 204) {
    throw new Error(
      await unwrapError(res, `Failed to delete thread: ${res.status}`),
    )
  }
}

export async function fetchModels(
  scope: AgentApiScope = 'admin',
): Promise<ModelsResponse> {
  const res = await fetch(`${agentBase(scope)}/models`, {
    headers: authHeader(),
  })
  if (!res.ok) {
    throw new Error(`Failed to load models: ${res.status}`)
  }
  return (await res.json()) as ModelsResponse
}

// ---------------------------------------------------------------------------
// One-shot insights (passive "insight cards")
// ---------------------------------------------------------------------------

export interface AgentInsightResult {
  markdown: string
  model: string
  cached: boolean
  generated_at: string
}

export interface FetchAgentInsightArgs {
  /** Fully-composed prompt — date + identifiers are baked in by the caller. */
  prompt: string
  scope: AgentApiScope
  /** Optional model override; the backend defaults to Sonnet for insights. */
  model?: string
  /** Bypass the server cache and force a fresh run. */
  regenerate?: boolean
  signal?: AbortSignal
}

/**
 * Run a single, stateless insight against the agent brain and return the
 * synthesized markdown. No thread is created or stored. Deliberately uses raw
 * fetch (not ApiClient) so a failed passive card stays silent — the card renders
 * its own inline retry instead of firing a global error toast — and so there's no
 * 30s client timeout cutting off a longer synthesis.
 */
export async function fetchAgentInsight({
  prompt,
  scope,
  model,
  regenerate,
  signal,
}: FetchAgentInsightArgs): Promise<AgentInsightResult> {
  const body: Record<string, unknown> = { prompt }
  if (model) body.model = model
  if (regenerate) body.regenerate = true

  const res = await fetch(`${agentBase(scope)}/insight`, {
    method: 'POST',
    headers: {
      ...authHeader(),
      ...viewAsHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    throw new Error(
      await unwrapError(res, `Failed to generate insight: ${res.status}`),
    )
  }
  return (await res.json()) as AgentInsightResult
}

/**
 * Open a streaming agent run. Yields parsed AgentEvent objects until the stream ends
 * or the AbortSignal fires.
 */
export async function* streamAgent({
  messages,
  model,
  resume_session_id,
  thread_id,
  scope = 'admin',
  signal,
}: StreamAgentArgs): AsyncGenerator<AgentEvent, void, unknown> {
  const body: Record<string, unknown> = { messages, model }
  if (resume_session_id) body.resume_session_id = resume_session_id
  if (thread_id) body.thread_id = thread_id

  const res = await fetch(`${agentBase(scope)}/stream`, {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    throw new Error(await unwrapError(res, `HTTP ${res.status}`))
  }

  if (!res.body) {
    throw new Error('No response body')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE messages are separated by blank lines.
      let sep = buffer.indexOf('\n\n')
      while (sep !== -1) {
        const raw = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        const parsed = parseSseChunk(raw)
        if (parsed) yield parsed
        sep = buffer.indexOf('\n\n')
      }
    }
    // Flush any trailing chunk (rare).
    if (buffer.trim()) {
      const parsed = parseSseChunk(buffer)
      if (parsed) yield parsed
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      /* ignore */
    }
  }
}

function parseSseChunk(raw: string): AgentEvent | null {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
    // ignore comments (lines starting with ":") and id: lines
  }
  if (dataLines.length === 0) return null
  const data = dataLines.join('\n')
  try {
    const payload = JSON.parse(data) as Record<string, unknown>
    return { type: event, ...payload } as AgentEvent
  } catch {
    return null
  }
}
