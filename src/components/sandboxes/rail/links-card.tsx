'use client'

import { useState } from 'react'
import { ExternalLink, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSandboxView } from '@/components/sandboxes/sandbox-view-context'
import { useUpdateSandbox } from '@/hooks/mutations/use-sandbox-mutations'
import { cn } from '@/lib/utils'
import type { SandboxLink, SandboxOverview } from '@/types/sandbox'

export function LinksCard({ overview }: { overview: SandboxOverview }) {
  const { sandbox } = overview
  const update = useUpdateSandbox(sandbox.id)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  const links = sandbox.links ?? []
  const view = useSandboxView()
  const canEdit = view.can.editSandbox

  // Our working links are not the client's business; and a read-only
  // viewer with nothing to read gets no card at all.
  if (!view.can.seeLinks) return null
  if (!canEdit && links.length === 0) return null

  const save = async (next: SandboxLink[]) => {
    await update.mutateAsync({ links: next })
  }

  const add = async () => {
    if (!label.trim() || !url.trim()) return
    await save([...links, { label: label.trim(), url: url.trim() }])
    setLabel('')
    setUrl('')
    setAdding(false)
  }

  const remove = (index: number) => save(links.filter((_, i) => i !== index))

  return (
    <div
      className={cn(
        'rounded-xl border bg-paper p-5',
        links.length === 0 && !adding && canEdit
          ? 'border-dashed border-ink-4'
          : 'border-line',
      )}
      data-testid="links-card"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-3">
          Links
        </h2>
        {!adding && canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-ink-2"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {links.length === 0 && !adding && canEdit && (
        <p className="mt-2 text-xs text-ink-3">
          Proposal, HubSpot, Slack channel — wherever this contract lives
          elsewhere.
        </p>
      )}

      {links.length > 0 && (
        <ul className="mt-3 space-y-1">
          {links.map((l, i) => (
            <li key={`${l.url}-${i}`} className="group flex items-center gap-2">
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-w-0 flex-1 items-center gap-1 text-sm text-ds-accent hover:underline"
              >
                <span className="truncate">{l.label}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Remove ${l.label}`}
                  onClick={() => remove(i)}
                  className="rounded p-0.5 text-ink-4 opacity-0 transition-opacity hover:text-ink group-hover:opacity-100 focus:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <form
          className="mt-3 space-y-2"
          onSubmit={e => {
            e.preventDefault()
            add()
          }}
        >
          <Input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Label, e.g. Proposal"
            className="h-8 text-sm"
            autoFocus
            aria-label="Link label"
          />
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://…"
            inputMode="url"
            className="h-8 text-sm"
            aria-label="Link URL"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 bg-ink text-xs text-ink-on-dark hover:bg-ink/90"
              disabled={!label.trim() || !url.trim() || update.isPending}
            >
              Save
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
