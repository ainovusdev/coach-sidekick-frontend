/**
 * SSE client for the admin data-analyst agent.
 *
 * The standard ApiClient doesn't support streaming, so we use raw fetch + ReadableStream
 * and inject the Bearer token manually.
 */

import authService from '@/services/auth-service'
import type { AgentEvent, ModelsResponse } from '@/types/agent'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface StreamAgentArgs {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  model: string
  /** If set, the Agent SDK resumes that conversation — tool history from prior turns is preserved. */
  resume_session_id?: string | null
  signal?: AbortSignal
}

export async function fetchModels(): Promise<ModelsResponse> {
  const token = authService.getToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`${API_BASE}/admin/agent/models`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`Failed to load models: ${res.status}`)
  }
  return (await res.json()) as ModelsResponse
}

/**
 * Open a streaming agent run. Yields parsed AgentEvent objects until the stream ends
 * or the AbortSignal fires.
 */
export async function* streamAgent({
  messages,
  model,
  resume_session_id,
  signal,
}: StreamAgentArgs): AsyncGenerator<AgentEvent, void, unknown> {
  const token = authService.getToken()
  if (!token) throw new Error('Not authenticated')

  const body: Record<string, unknown> = { messages, model }
  if (resume_session_id) body.resume_session_id = resume_session_id

  const res = await fetch(`${API_BASE}/admin/agent/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const j = await res.json()
      if (j?.detail)
        detail =
          typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)
    } catch {
      /* ignore */
    }
    throw new Error(detail)
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
