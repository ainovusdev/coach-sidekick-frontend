import { useState, useEffect } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'destructive'
}

interface ToastOptions {
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'destructive'
}

const toastListeners: Set<(toast: Toast) => void> = new Set()
let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 5000)
    }

    toastListeners.add(listener)
    return () => {
      toastListeners.delete(listener)
    }
  }, [])

  const toast = (options: ToastOptions) => {
    const newToast: Toast = {
      id: `toast-${++toastCounter}`,
      ...options,
    }

    toastListeners.forEach((listener) => listener(newToast))
    
    return {
      id: newToast.id,
      dismiss: () => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      },
    }
  }

  return {
    toast,
    toasts,
  }
}