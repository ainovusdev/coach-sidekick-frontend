'use client'

import { useEffect, useRef, useState } from 'react'
import { FileUp, Link2, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useClientSessions } from '@/hooks/queries/use-client-sessions'
import { useUploadClientResource } from '@/hooks/mutations/use-client-resource-mutations'
import { formatDate } from '@/lib/date-utils'

// Mirrors app/core/upload_limits.py on the backend.
const MAX_BYTES = 25 * 1024 * 1024
const ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.docx,.txt'
const ALLOWED_EXTENSIONS = new Set(ACCEPT.split(','))
const NO_SESSION = 'none'

function extensionOf(name: string) {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

function titleFromFilename(name: string) {
  const dot = name.lastIndexOf('.')
  return (dot > 0 ? name.slice(0, dot) : name).replace(/[_-]+/g, ' ').trim()
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface UploadResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the upload is tied to this session and the picker is hidden. */
  sessionId?: string
}

export function UploadResourceDialog({
  open,
  onOpenChange,
  sessionId,
}: UploadResourceDialogProps) {
  const [mode, setMode] = useState<'file' | 'link'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [pickedSession, setPickedSession] = useState(NO_SESSION)
  const [shared, setShared] = useState(true)
  const [progress, setProgress] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const upload = useUploadClientResource()

  const { data: sessions = [] } = useClientSessions(1, 50, {
    enabled: open && !sessionId,
  })

  useEffect(() => {
    if (!open) {
      setMode('file')
      setFile(null)
      setUrl('')
      setTitle('')
      setTitleTouched(false)
      setDescription('')
      setPickedSession(NO_SESSION)
      setShared(true)
      setProgress(null)
    }
  }, [open])

  const pickFile = (f: File | undefined) => {
    if (!f) return
    if (!ALLOWED_EXTENSIONS.has(extensionOf(f.name))) {
      toast.error('That file type isn’t supported', {
        description: 'Use a PDF, Word (.docx), text file or image.',
      })
      return
    }
    if (f.size > MAX_BYTES) {
      toast.error('That file is too large', {
        description: 'The limit is 25 MB.',
      })
      return
    }
    setFile(f)
    if (!titleTouched) setTitle(titleFromFilename(f.name))
  }

  const linkValid = /^https?:\/\/\S+$/i.test(url.trim())
  const canSubmit =
    title.trim().length > 0 &&
    (mode === 'file' ? !!file : linkValid) &&
    !upload.isPending

  const submit = () => {
    if (!canSubmit) return
    const form = new FormData()
    form.append('title', title.trim())
    if (description.trim()) form.append('description', description.trim())
    const session =
      sessionId || (pickedSession !== NO_SESSION ? pickedSession : '')
    if (session) form.append('session_id', session)
    form.append('is_private', shared ? 'false' : 'true')
    if (mode === 'file' && file) form.append('file', file)
    else form.append('content_url', url.trim())

    upload.mutate(
      {
        formData: form,
        onProgress: mode === 'file' ? setProgress : undefined,
      },
      {
        onSuccess: () => onOpenChange(false),
        onSettled: () => setProgress(null),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={o => !upload.isPending && onOpenChange(o)}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a resource</DialogTitle>
          <DialogDescription>
            {sessionId
              ? 'Attach a file or link to this session.'
              : 'Upload a file or save a link to your coaching profile.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-2 p-1">
            {(['file', 'link'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-paper text-ink shadow-sm'
                    : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                {m === 'file' ? (
                  <FileUp className="h-4 w-4" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {m === 'file' ? 'File' : 'Link'}
              </button>
            ))}
          </div>

          {mode === 'file' ? (
            <div>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={e => {
                  pickFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              {file ? (
                <div className="flex items-center gap-3 rounded-lg border border-line bg-paper p-3">
                  <FileUp className="h-5 w-5 shrink-0 text-ink-3" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {file.name}
                    </p>
                    <p className="text-xs text-ink-4">
                      {formatSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setFile(null)}
                    disabled={upload.isPending}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    pickFile(e.dataTransfer.files?.[0])
                  }}
                  className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-line bg-paper px-4 py-6 text-center hover:bg-surface-2"
                >
                  <Upload className="h-5 w-5 text-ink-3" />
                  <span className="text-sm font-medium text-ink-2">
                    Choose a file or drop it here
                  </span>
                  <span className="text-xs text-ink-4">
                    PDF, Word, text or image · up to 25 MB
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="resource-url">Link</Label>
              <Input
                id="resource-url"
                inputMode="url"
                placeholder="https://"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              {url.trim() && !linkValid && (
                <p className="text-xs text-ink-3">
                  Links start with http:// or https://
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="resource-title">Title</Label>
            <Input
              id="resource-title"
              maxLength={255}
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                setTitleTouched(true)
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resource-description">
              Note <span className="font-normal text-ink-4">(optional)</span>
            </Label>
            <Textarea
              id="resource-description"
              rows={2}
              placeholder="What is it, or why are you sharing it?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {!sessionId && (
            <div className="space-y-1.5">
              <Label>
                Session{' '}
                <span className="font-normal text-ink-4">(optional)</span>
              </Label>
              <Select value={pickedSession} onValueChange={setPickedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="Not tied to a session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SESSION}>
                    Not tied to a session
                  </SelectItem>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.is_group_session ? 'Group session' : 'Session'} ·{' '}
                      {formatDate(s.session_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 rounded-lg border border-line p-3">
            <div className="min-w-0">
              <Label htmlFor="resource-shared" className="text-sm">
                Share with my coach
              </Label>
              <p className="mt-0.5 text-xs text-ink-3">
                {shared
                  ? 'Your coach will see this on your profile.'
                  : 'Private files are only visible to you.'}
              </p>
            </div>
            <Switch
              id="resource-shared"
              checked={shared}
              onCheckedChange={setShared}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={upload.isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {upload.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {progress !== null && progress < 100
                  ? `Uploading ${progress}%`
                  : 'Saving…'}
              </>
            ) : mode === 'file' ? (
              'Upload'
            ) : (
              'Save link'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
