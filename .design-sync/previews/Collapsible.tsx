import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'coach-sidekick'
import { ChevronsUpDown } from 'lucide-react'

export const EarlierSessions = () => (
  <Collapsible defaultOpen className="w-full max-w-md space-y-2">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-medium text-ink">Sessions with Maya Chen</h4>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm">
          Show earlier sessions
          <ChevronsUpDown />
        </Button>
      </CollapsibleTrigger>
    </div>
    <div className="rounded-md border px-4 py-2 text-sm text-ink-2">
      Jul 15, 2026 · Delegation and the Q3 roadmap
    </div>
    <CollapsibleContent className="space-y-2">
      <div className="rounded-md border px-4 py-2 text-sm text-ink-2">
        Jul 1, 2026 · Board presentation dry run
      </div>
      <div className="rounded-md border px-4 py-2 text-sm text-ink-2">
        Jun 17, 2026 · Feedback conversations with direct reports
      </div>
      <div className="rounded-md border px-4 py-2 text-sm text-ink-2">
        Jun 3, 2026 · Kickoff — goals and coaching agreement
      </div>
    </CollapsibleContent>
  </Collapsible>
)

export const CommitmentDetails = () => (
  <Collapsible defaultOpen className="w-full max-w-md space-y-2">
    <div className="flex items-center gap-2">
      <Badge variant="completed">Done</Badge>
      <span className="text-sm font-medium text-ink">
        Hand off roadmap review to Dana
      </span>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-auto">
          <ChevronsUpDown />
        </Button>
      </CollapsibleTrigger>
    </div>
    <CollapsibleContent>
      <p className="rounded-md bg-surface-2 px-4 py-3 text-sm text-ink-2">
        Completed Jul 16 — Dana ran the review solo and Maya stayed out of the
        thread. Maya noted it freed up two mornings for board prep.
      </p>
    </CollapsibleContent>
  </Collapsible>
)
