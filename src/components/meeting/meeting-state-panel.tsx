'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Activity,
  Brain,
  Heart,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

interface MeetingState {
  mood: string
  topic: string
  energy: string
  emotion: string
  pattern: string
  shift: string
  timestamp?: string
}

interface MeetingStatePanelProps {
  state: MeetingState | null
  className?: string
}

export function MeetingStatePanel({ state, className, compact = false }: MeetingStatePanelProps & { compact?: boolean }) {
  const getEnergyColor = (energy: string) => {
    switch (energy?.toLowerCase()) {
      case 'high':
        return 'text-green-600'
      case 'low':
        return 'text-red-600'
      case 'building':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const getMoodIcon = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'optimistic':
      case 'excited':
      case 'hopeful':
        return '😊'
      case 'frustrated':
      case 'stuck':
      case 'defensive':
        return '😟'
      case 'confused':
      case 'uncertain':
        return '🤔'
      default:
        return '😐'
    }
  }

  if (!state) {
    return (
      <Card className={className}>
        <CardContent className={compact ? "p-2 text-center text-gray-500" : "p-4 text-center text-gray-500"}>
          <Activity className={compact ? "h-4 w-4 mx-auto mb-1 text-gray-400" : "h-6 w-6 mx-auto mb-2 text-gray-400"} />
          <p className={compact ? "text-xs" : "text-sm"}>Waiting for conversation...</p>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium capitalize">{state.topic}</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className={`h-3 w-3 ${getEnergyColor(state.energy)}`} />
                <span className="text-xs capitalize">{state.energy}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm">{getMoodIcon(state.mood)}</span>
                <span className="text-xs capitalize">{state.mood}</span>
              </div>
            </div>
            {state.pattern && state.pattern !== 'none' && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span className="text-xs text-gray-600 capitalize">{state.pattern}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-purple-600" />
          Meeting Pulse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Topic and Mood Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium capitalize">{state.topic}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">{getMoodIcon(state.mood)}</span>
            <span className="text-xs text-gray-500 capitalize">{state.mood}</span>
          </div>
        </div>

        {/* Energy and Emotion Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`h-4 w-4 ${getEnergyColor(state.energy)}`} />
            <span className="text-sm capitalize">{state.energy} energy</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm capitalize">{state.emotion}</span>
          </div>
        </div>

        {/* Pattern Row */}
        {state.pattern && state.pattern !== 'none' && (
          <div className="flex items-center gap-2 pt-1 border-t">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-gray-600 capitalize">
              Pattern: {state.pattern}
            </span>
          </div>
        )}

        {/* Shift Row */}
        {state.shift && state.shift !== 'none' && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-600 capitalize">
              Shift: {state.shift}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}