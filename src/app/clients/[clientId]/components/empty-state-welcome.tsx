'use client'

import { Mic, FileText, Target, ChevronRight } from 'lucide-react'

interface EmptyStateWelcomeProps {
  client: any
  onStartSession: () => void
  onAddPastSession: () => void
  onSetGoals: () => void
}

export function EmptyStateWelcome({
  client,
  onStartSession,
  onAddPastSession,
  onSetGoals,
}: EmptyStateWelcomeProps) {
  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Client Name Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{client.name}</h1>
        <p className="text-gray-500">No sessions yet</p>
      </div>

      {/* Primary Action - Start Session */}
      <div className="mb-8">
        <button
          onClick={onStartSession}
          className="w-full group bg-gray-900 hover:bg-gray-800 rounded-xl p-6 text-left transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-0.5">
                  Start Live Session
                </h3>
                <p className="text-sm text-gray-400">
                  Join a meeting with real-time AI insights
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Or choose another option
        </p>

        <button
          onClick={onAddPastSession}
          className="w-full group flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-gray-900">
                Add Past Session
              </h4>
              <p className="text-xs text-gray-500">
                Upload notes or recordings
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>

        <button
          onClick={onSetGoals}
          className="w-full group flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-gray-900">Set a Goal</h4>
              <p className="text-xs text-gray-500">
                Define outcomes to track progress
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      </div>
    </div>
  )
}
