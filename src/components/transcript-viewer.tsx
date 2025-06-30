'use client'

import { useEffect, useRef } from 'react'

interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
  confidence?: number
}

interface TranscriptViewerProps {
  transcript: TranscriptEntry[]
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  // Debug logging
  console.log('TranscriptViewer render - transcript:', transcript)

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return timestamp
    }
  }

  const getSpeakerColor = (speaker: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-yellow-100 text-yellow-800',
    ]

    const hash = speaker.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return colors[Math.abs(hash) % colors.length]
  }

  if (!transcript || transcript.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3M7 4H5a1 1 0 00-1 1v14a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1h-2m-5 3v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Waiting for Transcript
          </h3>
          <p className="text-gray-600 mb-4">
            The bot is connecting to the meeting. Transcript will appear here
            once participants start speaking.
          </p>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>Troubleshooting Tips:</strong>
            <ul className="mt-2 text-left space-y-1">
              <li>• Make sure participants are unmuted and speaking</li>
              <li>
                • Check that meeting captions are enabled in your meeting
                platform
              </li>
              <li>• It may take 1-2 minutes for transcription to begin</li>
            </ul>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Live Transcript
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Recording</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-96 overflow-y-auto p-6 space-y-4">
        {transcript.map((entry, index) => (
          <div key={index} className="flex space-x-3">
            <div className="flex-shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpeakerColor(
                  entry.speaker,
                )}`}
              >
                {entry.speaker}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(entry.timestamp)}
                </span>
                {entry.confidence && (
                  <span className="text-xs text-gray-400">
                    {Math.round(entry.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <p className="text-gray-900 leading-relaxed">{entry.text}</p>
            </div>
          </div>
        ))}
      </div>

      {transcript.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <span className="text-sm text-gray-600">
            {transcript.length} transcript{' '}
            {transcript.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      )}
    </div>
  )
}
