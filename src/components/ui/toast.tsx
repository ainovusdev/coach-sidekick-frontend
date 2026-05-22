import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor =
    type === 'success'
      ? 'bg-forest-bg border-forest/20'
      : 'bg-vermillion-bg border-vermillion/20'
  const textColor = type === 'success' ? 'text-forest' : 'text-vermillion'
  const iconColor = type === 'success' ? 'text-forest' : 'text-vermillion'
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColor} ${textColor} shadow-lg animate-in slide-in-from-top-2`}
    >
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className={`ml-2 ${iconColor} hover:opacity-70`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Simple hook for managing toast state
export function useToast() {
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast(null)
  }

  return {
    toast,
    showToast,
    closeToast,
  }
}
