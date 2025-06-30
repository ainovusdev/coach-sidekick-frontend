'use client'

interface Bot {
  id: string
  status: string | undefined
  meeting_url: string
  transcript_url?: string
}

interface BotStatusProps {
  bot: Bot
  onStop: () => void
}

export function BotStatus({ bot, onStop }: BotStatusProps) {
  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'blue'

    switch (status.toLowerCase()) {
      case 'joining':
        return 'yellow'
      case 'in_meeting':
        return 'green'
      case 'recording':
        return 'green'
      case 'done':
        return 'gray'
      case 'error':
        return 'red'
      default:
        return 'blue'
    }
  }

  const getStatusText = (status: string | undefined) => {
    if (!status) return 'Connecting...'

    switch (status.toLowerCase()) {
      case 'joining':
        return 'Joining Meeting'
      case 'in_meeting':
        return 'In Meeting'
      case 'recording':
        return 'Recording Active'
      case 'done':
        return 'Recording Complete'
      case 'error':
        return 'Error Occurred'
      default:
        return status
    }
  }

  const statusColor = getStatusColor(bot.status)
  const statusText = getStatusText(bot.status)

  // Debug logging
  console.log('BotStatus render - bot:', bot)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className={`w-4 h-4 rounded-full ${
              statusColor === 'green'
                ? 'bg-green-500 animate-pulse'
                : statusColor === 'yellow'
                ? 'bg-yellow-500 animate-pulse'
                : statusColor === 'red'
                ? 'bg-red-500'
                : statusColor === 'gray'
                ? 'bg-gray-400'
                : 'bg-blue-500 animate-pulse'
            }`}
          ></div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Meeting Bot Active
            </h3>
            <p className="text-sm text-gray-600">
              Status:{' '}
              <span
                className={`font-medium ${
                  statusColor === 'green'
                    ? 'text-green-600'
                    : statusColor === 'yellow'
                    ? 'text-yellow-600'
                    : statusColor === 'red'
                    ? 'text-red-600'
                    : statusColor === 'gray'
                    ? 'text-gray-600'
                    : 'text-blue-600'
                }`}
              >
                {statusText}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onStop}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            <span>Stop Recording</span>
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Bot ID:</span>
            <span className="ml-2 font-mono text-gray-900">
              {bot.id || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Meeting URL:</span>
            <a
              href={bot.meeting_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:text-blue-800 truncate block"
            >
              {bot.meeting_url || 'N/A'}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
