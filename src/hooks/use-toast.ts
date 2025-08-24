import { useState, useCallback } from 'react'

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

let toastIdCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback((props: Omit<ToastProps, 'id'>) => {
    const id = String(++toastIdCounter)
    const newToast = { ...props, id }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto dismiss after duration (default 5 seconds)
    const duration = props.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
    
    return id
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    setToasts((prev) => {
      if (toastId) {
        return prev.filter((t) => t.id !== toastId)
      }
      return []
    })
  }, [])

  return {
    toast,
    toasts,
    dismiss,
  }
}

// Export a singleton instance for global usage
const toastState = {
  toasts: [] as ToastProps[],
  listeners: new Set<(toasts: ToastProps[]) => void>(),
}

export function toast(props: Omit<ToastProps, 'id'>) {
  const id = String(++toastIdCounter)
  const newToast = { ...props, id }
  
  toastState.toasts = [...toastState.toasts, newToast]
  toastState.listeners.forEach((listener) => listener(toastState.toasts))
  
  // Auto dismiss after duration (default 5 seconds)
  const duration = props.duration ?? 5000
  if (duration > 0) {
    setTimeout(() => {
      toastState.toasts = toastState.toasts.filter((t) => t.id !== id)
      toastState.listeners.forEach((listener) => listener(toastState.toasts))
    }, duration)
  }
  
  return id
}