export default function SystemStatus() {
  return (
    <div className="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-neutral-900 dark:bg-neutral-100 rounded-full"></div>
        <span>System Online</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-neutral-900 dark:bg-neutral-100 rounded-full"></div>
        <span>AI Ready</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-neutral-900 dark:bg-neutral-100 rounded-full"></div>
        <span>Transcription Active</span>
      </div>
    </div>
  )
}
