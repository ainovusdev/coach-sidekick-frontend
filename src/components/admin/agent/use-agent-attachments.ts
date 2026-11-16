'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AttachmentUploadError,
  deleteAgentAttachment,
  uploadAgentAttachment,
  type AgentApiScope,
} from '@/services/agent-service'
import type { AgentAttachmentInfo } from '@/types/agent'

export const MAX_ATTACHMENTS = 5
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024
/** What the file picker offers. The server validates by content regardless. */
export const ATTACHMENT_ACCEPT =
  '.pdf,.docx,.txt,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv'
const SUPPORTED_EXT = new Set(['pdf', 'docx', 'txt', 'csv'])
const IMAGE_EXT = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'heic',
  'bmp',
  'tif',
  'tiff',
])
/** After this long in "Reading…", tell the coach a scan can take a while. */
const SLOW_READ_MS = 5000

export type PendingStatus = 'uploading' | 'reading' | 'ready' | 'error'

export interface PendingAttachment {
  localId: string
  file: File
  name: string
  size: number
  status: PendingStatus
  /** Upload progress 0–100 while `uploading`. */
  progress: number
  /** `reading` for longer than SLOW_READ_MS (likely OCR on a scan). */
  slow: boolean
  info?: AgentAttachmentInfo
  errorCode?: string
  errorMessage?: string
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

/** Coach-facing copy for an upload failure code. */
export function attachmentErrorCopy(
  code: string | undefined,
  file?: File,
): string {
  switch (code) {
    case 'unsupported_type':
      return 'Sidekick can read PDF, Word (.docx), text and CSV files.'
    case 'image_not_supported':
      return "Images aren't supported yet."
    case 'too_large':
      return file
        ? `That file is ${formatFileSize(file.size)}. The limit is 25 MB.`
        : 'That file is larger than the 25 MB limit.'
    case 'empty_text':
      return "We couldn't find readable text in this file. If it's a scan, try a clearer copy."
    case 'password_protected':
      return 'This PDF is password-protected. Remove the password and try again.'
    case 'invalid_file':
      return "This file couldn't be opened. It may be damaged."
    case 'network':
      return 'The connection dropped. Try again.'
    case 'not_allowed':
      return "File uploads aren't available here yet."
    default:
      return 'Something went wrong reading this file. Try again.'
  }
}

/** Errors worth a Retry button (transient) vs. ones the file itself causes. */
export function isRetryable(code: string | undefined): boolean {
  return (
    !code || ['network', 'upload_failed', 'extraction_failed'].includes(code)
  )
}

function precheck(file: File): string | null {
  const ext = extensionOf(file.name)
  if (IMAGE_EXT.has(ext) || file.type.startsWith('image/'))
    return 'image_not_supported'
  if (!SUPPORTED_EXT.has(ext)) return 'unsupported_type'
  if (file.size > MAX_ATTACHMENT_BYTES) return 'too_large'
  if (file.size === 0) return 'empty_text'
  return null
}

interface Options {
  scope: AgentApiScope
  /** Announced through the chat's aria-live region. */
  onAnnounce?: (message: string) => void
  /** Non-chip notices (e.g. "up to 5 files"). */
  onNotice?: (message: string) => void
}

/**
 * Pending attachments for the next message. Uploads start the moment a file is
 * added; each chip carries its own progress / reading / ready / error state.
 */
export function useAgentAttachments({ scope, onAnnounce, onNotice }: Options) {
  const [items, setItems] = useState<PendingAttachment[]>([])
  const itemsRef = useRef(items)
  itemsRef.current = items
  const controllers = useRef(new Map<string, AbortController>())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const patch = useCallback(
    (localId: string, next: Partial<PendingAttachment>) => {
      setItems(prev =>
        prev.map(it => (it.localId === localId ? { ...it, ...next } : it)),
      )
    },
    [],
  )

  const clearTimer = (localId: string) => {
    const t = timers.current.get(localId)
    if (t) clearTimeout(t)
    timers.current.delete(localId)
  }

  const startUpload = useCallback(
    (item: PendingAttachment) => {
      const controller = new AbortController()
      controllers.current.set(item.localId, controller)
      uploadAgentAttachment(scope, item.file, {
        signal: controller.signal,
        onProgress: progress => patch(item.localId, { progress }),
        onUploaded: () => {
          patch(item.localId, { status: 'reading', progress: 100 })
          clearTimer(item.localId)
          timers.current.set(
            item.localId,
            setTimeout(() => patch(item.localId, { slow: true }), SLOW_READ_MS),
          )
        },
      })
        .then(info => {
          patch(item.localId, { status: 'ready', info, slow: false })
          onAnnounce?.(`${item.name} is ready.`)
        })
        .catch((e: unknown) => {
          const err = e instanceof AttachmentUploadError ? e : null
          if (err?.code === 'aborted') return // removed by the coach
          const code = err?.code ?? 'upload_failed'
          const message = attachmentErrorCopy(code, item.file)
          patch(item.localId, {
            status: 'error',
            errorCode: code,
            errorMessage: message,
            slow: false,
          })
          onAnnounce?.(`${item.name} couldn't be attached. ${message}`)
        })
        .finally(() => {
          controllers.current.delete(item.localId)
          clearTimer(item.localId)
        })
    },
    [scope, patch, onAnnounce],
  )

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      const current = itemsRef.current
      const seen = new Set(current.map(it => `${it.name}:${it.size}`))
      const fresh = files.filter(f => !seen.has(`${f.name}:${f.size}`))
      const room = MAX_ATTACHMENTS - current.length
      if (fresh.length > room) {
        onNotice?.(`You can attach up to ${MAX_ATTACHMENTS} files per message.`)
      }
      const accepted = fresh.slice(0, Math.max(0, room))
      if (accepted.length === 0) return
      const created: PendingAttachment[] = accepted.map(file => {
        const code = precheck(file)
        return {
          localId: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          status: code ? 'error' : 'uploading',
          progress: 0,
          slow: false,
          errorCode: code ?? undefined,
          errorMessage: code ? attachmentErrorCopy(code, file) : undefined,
        }
      })
      setItems(prev => [...prev, ...created])
      for (const item of created) {
        if (item.status === 'uploading') startUpload(item)
        else
          onAnnounce?.(
            `${item.name} couldn't be attached. ${item.errorMessage}`,
          )
      }
    },
    [startUpload, onAnnounce, onNotice],
  )

  const remove = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find(it => it.localId === localId)
      if (!item) return
      controllers.current.get(localId)?.abort()
      clearTimer(localId)
      setItems(prev => prev.filter(it => it.localId !== localId))
      if (item.info) {
        // Best effort — a leftover unsent file is harmless.
        deleteAgentAttachment(scope, item.info.id).catch(() => undefined)
      }
      onAnnounce?.(`Removed ${item.name}.`)
    },
    [scope, onAnnounce],
  )

  const retry = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find(it => it.localId === localId)
      if (!item) return
      const reset: PendingAttachment = {
        ...item,
        status: 'uploading',
        progress: 0,
        slow: false,
        errorCode: undefined,
        errorMessage: undefined,
      }
      patch(localId, reset)
      startUpload(reset)
    },
    [patch, startUpload],
  )

  /** Hand the ready files to a send and clear the tray. */
  const takeAll = useCallback((): PendingAttachment[] => {
    const taken = itemsRef.current
    setItems([])
    return taken
  }, [])

  /** Put files back after a send failed before the server accepted it. */
  const restore = useCallback((restored: PendingAttachment[]) => {
    setItems(prev => [...restored, ...prev].slice(0, MAX_ATTACHMENTS))
  }, [])

  // Abort uploads still in flight when the chat unmounts (e.g. modal closed).
  useEffect(() => {
    const c = controllers.current
    const t = timers.current
    return () => {
      c.forEach(ctrl => ctrl.abort())
      t.forEach(timer => clearTimeout(timer))
    }
  }, [])

  const derived = useMemo(() => {
    const busy = items.some(
      it => it.status === 'uploading' || it.status === 'reading',
    )
    const failed = items.some(it => it.status === 'error')
    const ready = items.filter(it => it.status === 'ready')
    return { busy, failed, readyCount: ready.length }
  }, [items])

  return { items, addFiles, remove, retry, takeAll, restore, ...derived }
}
