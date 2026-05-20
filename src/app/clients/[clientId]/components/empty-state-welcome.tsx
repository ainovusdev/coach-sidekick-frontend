'use client'

import {
  Mic,
  FileText,
  Target,
  CalendarClock,
  ChevronRight,
} from 'lucide-react'

interface EmptyStateWelcomeProps {
  client: any
  onStartSession: () => void
  onScheduleSession: () => void
  onAddPastSession: () => void
  onSetGoals: () => void
}

export function EmptyStateWelcome({
  client,
  onStartSession,
  onScheduleSession,
  onAddPastSession,
  onSetGoals,
}: EmptyStateWelcomeProps) {
  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Client Name Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-ink mb-1">{client.name}</h1>
        <p className="text-ink-3 ">No sessions yet</p>
      </div>

      {/* Primary Action - Start Session */}
      <div className="mb-8">
        <button
          onClick={onStartSession}
          className="w-full group bg-ink hover:bg-ink-2 rounded-xl p-6 text-left transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-1/10 flex items-center justify-center">
                <Mic className="h-6 w-6 text-ink-on-dark" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink-on-dark mb-0.5">
                  Start Live Session
                </h3>
                <p className="text-sm text-ink-4">
                  Join a meeting with real-time AI insights
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-ink-4 group-hover:text-ink-on-dark transition-colors" />
          </div>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-ink-4 uppercase tracking-wide mb-3">
          Or choose another option
        </p>

        <button
          onClick={onScheduleSession}
          className="w-full group flex items-center justify-between p-4 rounded-lg border border-line hover:border-line-strong hover:bg-paper transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-ink-3 " />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-ink ">
                Schedule Session
              </h4>
              <p className="text-xs text-ink-3 ">
                Book a future session and send a questionnaire
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-4 group-hover:text-ink-3 transition-colors" />
        </button>

        <button
          onClick={onAddPastSession}
          className="w-full group flex items-center justify-between p-4 rounded-lg border border-line hover:border-line-strong hover:bg-paper transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center">
              <FileText className="h-5 w-5 text-ink-3 " />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-ink ">
                Add Past Session
              </h4>
              <p className="text-xs text-ink-3 ">Upload notes or recordings</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-4 group-hover:text-ink-3 transition-colors" />
        </button>

        <button
          onClick={onSetGoals}
          className="w-full group flex items-center justify-between p-4 rounded-lg border border-line hover:border-line-strong hover:bg-paper transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center">
              <Target className="h-5 w-5 text-ink-3 " />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-ink ">
                Set a meta performance vision
              </h4>
              <p className="text-xs text-ink-3 ">
                Define outcomes to track progress
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-ink-4 group-hover:text-ink-3 transition-colors" />
        </button>
      </div>
    </div>
  )
}
