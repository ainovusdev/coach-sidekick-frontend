'use client'

import React from 'react'
import {
  TrendingUp,
  Activity,
  Zap,
  Battery,
  BatteryLow,
  Smile,
  Frown,
  Meh,
} from 'lucide-react'

interface SentimentGaugeProps {
  sentiment: {
    overall: string
    score: number
    progression?: string
    emotions?: string[]
    engagement?: string
    energy_level?: string
  }
}

export function SentimentGauge({ sentiment }: SentimentGaugeProps) {
  // Calculate gauge rotation based on score (0-10 maps to -90 to 90 degrees)
  const rotation = (sentiment.score / 10) * 180 - 90

  // Get sentiment icon
  const getSentimentIcon = () => {
    if (sentiment.score >= 7) return <Smile className="h-8 w-8 text-ink-2 " />
    if (sentiment.score >= 4) return <Meh className="h-8 w-8 text-ink-3 " />
    return <Frown className="h-8 w-8 text-ink-3 " />
  }

  // Get energy icon
  const getEnergyIcon = () => {
    const energy = sentiment.energy_level?.toLowerCase()
    if (energy?.includes('high')) return <Zap className="h-4 w-4 text-ink-2 " />
    if (energy?.includes('low'))
      return <BatteryLow className="h-4 w-4 text-ink-3 " />
    return <Battery className="h-4 w-4 text-ink-3 " />
  }

  // Get engagement color
  const getEngagementColor = () => {
    const engagement = sentiment.engagement?.toLowerCase()
    if (engagement === 'high') return 'text-ink bg-surface-3 '
    if (engagement === 'medium') return 'text-ink-2 bg-paper '
    return 'text-ink-3 bg-paper '
  }

  return (
    <div className="space-y-6">
      {/* Main Gauge */}
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-24 mb-4">
          {/* Background arc */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              className="stroke-ink-2 "
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Colored segments */}
            <path
              d="M 20 90 A 80 80 0 0 1 73 30"
              fill="none"
              className="stroke-ink-4 "
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 73 30 A 80 80 0 0 1 127 30"
              fill="none"
              className="stroke-ink-3 "
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 127 30 A 80 80 0 0 1 180 90"
              fill="none"
              className="stroke-ink-2 "
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>

          {/* Needle */}
          <div
            className="absolute bottom-0 left-1/2 origin-bottom bg-ink "
            style={{
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              transition: 'transform 1s ease-out',
              width: '2px',
              height: '75px',
            }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-ink rounded-full" />
          </div>

          {/* Center dot */}
          <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-ink rounded-full transform -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Score and Icon */}
        <div className="flex items-center gap-3">
          {getSentimentIcon()}
          <div className="text-center">
            <div className="text-3xl font-bold text-ink ">
              {sentiment.score.toFixed(1)}
            </div>
            <div className="text-sm font-medium text-ink-3 capitalize">
              {sentiment.overall}
            </div>
          </div>
        </div>
      </div>

      {/* Progression */}
      {sentiment.progression && (
        <div className="bg-paper rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Activity className="h-4 w-4 text-ink-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-ink-2 mb-1">
                Session Progression
              </p>
              <p className="text-xs text-ink-3 ">{sentiment.progression}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Engagement */}
        {sentiment.engagement && (
          <div className="bg-surface-1 border border-line rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-ink-3 ">
                Engagement
              </span>
              <TrendingUp className="h-3 w-3 text-ink-4 " />
            </div>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${getEngagementColor()}`}
            >
              {sentiment.engagement}
            </span>
          </div>
        )}

        {/* Energy */}
        {sentiment.energy_level && (
          <div className="bg-surface-1 border border-line rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-ink-3 ">Energy</span>
              {getEnergyIcon()}
            </div>
            <span className="text-xs font-medium text-ink-2 capitalize">
              {sentiment.energy_level}
            </span>
          </div>
        )}
      </div>

      {/* Emotions */}
      {sentiment.emotions && sentiment.emotions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-3 mb-2">
            Detected Emotions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sentiment.emotions.map((emotion, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-1 bg-surface-3 text-ink-2 rounded text-xs capitalize"
              >
                {emotion}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
