import { LoadingSpinner } from 'coach-sidekick'

export const Sizes = () => (
  <div className="flex items-end gap-10">
    <div className="flex flex-col items-center gap-2">
      <LoadingSpinner size="sm" />
      <span className="text-xs text-ink-3">sm</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <LoadingSpinner size="md" />
      <span className="text-xs text-ink-3">md</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <LoadingSpinner size="lg" />
      <span className="text-xs text-ink-3">lg</span>
    </div>
  </div>
)

export const InlineWithLabel = () => (
  <div className="flex items-center gap-3">
    <LoadingSpinner size="sm" />
    <span className="text-sm text-ink-2">Generating session analysis…</span>
  </div>
)
