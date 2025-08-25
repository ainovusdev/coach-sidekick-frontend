export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-gray-900 text-white border-gray-900'
    case 'in_progress':
      return 'bg-gray-700 text-white border-gray-700'
    case 'error':
      return 'bg-gray-200 text-gray-900 border-gray-300'
    case 'pending_upload':
      return 'bg-white text-gray-900 border-gray-400'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-gray-900 font-bold'
  if (score >= 6) return 'text-gray-700 font-medium'
  return 'text-gray-500'
}

export const getScoreGradient = (score: number) => {
  if (score >= 8) return 'from-gray-800 to-gray-900'
  if (score >= 6) return 'from-gray-600 to-gray-700'
  return 'from-gray-400 to-gray-500'
}