import { ThemeToggle } from 'coach-sidekick'

export const InHeader = () => (
  <div className="flex w-64 items-center justify-between rounded-lg border border-line bg-surface-1 px-4 py-2">
    <span className="text-sm font-medium text-ink">Appearance</span>
    <ThemeToggle />
  </div>
)
