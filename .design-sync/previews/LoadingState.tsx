import { LoadingState } from 'coach-sidekick'

/* LoadingState renders min-h-[60vh] by default; the previews bound it via
   className (cn lets the later min-h win) so cells stay compact. */

export const Default = () => (
  <LoadingState message="Loading your sessions..." className="min-h-[220px]" />
)

export const Compact = () => (
  <LoadingState
    message="Loading transcript..."
    size="sm"
    className="min-h-[140px]"
  />
)

export const FullPage = () => (
  <LoadingState
    message="Preparing your dashboard..."
    size="lg"
    className="min-h-[280px]"
  />
)
