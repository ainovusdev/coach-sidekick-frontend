import { Badge } from 'coach-sidekick'

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge>Completed</Badge>
    <Badge variant="secondary">Draft</Badge>
    <Badge variant="destructive">Overdue</Badge>
    <Badge variant="outline">Scheduled</Badge>
  </div>
)

export const SessionStatus = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge className="bg-forest-bg text-forest border-forest/20">Live</Badge>
    <Badge className="bg-indigo-bg text-indigo border-indigo/20">
      Scheduled
    </Badge>
    <Badge className="bg-amber-token-bg text-amber-token border-amber-token/20">
      Processing
    </Badge>
    <Badge className="bg-surface-2 text-ink-2 border-line">Completed</Badge>
    <Badge className="bg-vermillion-bg text-vermillion border-vermillion/20">
      Failed
    </Badge>
  </div>
)
