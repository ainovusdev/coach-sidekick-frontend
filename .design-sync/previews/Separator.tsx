import { Separator } from 'coach-sidekick'

export const SectionDivider = () => (
  <div className="w-full max-w-md">
    <div className="space-y-1">
      <h4 className="text-sm font-medium text-ink">Session summary</h4>
      <p className="text-sm text-ink-3">
        AI-generated recap of the July 15 conversation.
      </p>
    </div>
    <Separator className="my-4" />
    <p className="text-sm text-ink-2">
      Maya explored what has kept her from delegating the Q3 roadmap review and
      committed to handing it off to Dana before Friday.
    </p>
  </div>
)

export const SessionMetaRow = () => (
  <div className="flex h-5 items-center gap-3 text-sm text-ink-2">
    <span className="font-medium text-ink">Maya Chen</span>
    <Separator orientation="vertical" />
    <span>52 min</span>
    <Separator orientation="vertical" />
    <span>Zoom</span>
    <Separator orientation="vertical" />
    <span>Transcript ready</span>
  </div>
)
