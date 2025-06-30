'use client'

import { useState } from 'react'

interface MeetingFormProps {
  onSubmit: (meetingUrl: string) => void
  loading: boolean
}

export function MeetingForm({ onSubmit, loading }: MeetingFormProps) {
  const [meetingUrl, setMeetingUrl] = useState('')
  const [error, setError] = useState('')

  const validateUrl = (url: string) => {
    const zoomRegex = /^https:\/\/.*zoom\.us\/j\/\d+/
    const meetRegex = /^https:\/\/meet\.google\.com\/[a-z0-9-]+/
    const teamsRegex = /^https:\/\/teams\.microsoft\.com/

    return zoomRegex.test(url) || meetRegex.test(url) || teamsRegex.test(url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!meetingUrl.trim()) {
      setError('Please enter a meeting URL')
      return
    }

    if (!validateUrl(meetingUrl.trim())) {
      setError('Please enter a valid Zoom, Google Meet, or Teams meeting URL')
      return
    }

    onSubmit(meetingUrl.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="meeting-url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Meeting URL
          </label>
          <div className="relative">
            <input
              id="meeting-url"
              type="url"
              value={meetingUrl}
              onChange={e => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/j/123456789 or https://meet.google.com/xyz-abc-def"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !meetingUrl.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Creating Bot...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Start Recording</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Supported platforms: Zoom, Google Meet, Microsoft Teams
        </p>
      </div>
    </form>
  )
}
