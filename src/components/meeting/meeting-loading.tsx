export function MeetingLoading() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ds-accent mx-auto"></div>
        <p className="mt-4 text-ink-3">Loading meeting data...</p>
      </div>
    </div>
  )
}
