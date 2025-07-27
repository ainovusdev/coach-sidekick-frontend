import { useRef, useCallback } from 'react'

export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingRef = useRef(false)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // If already pending, ignore
      if (pendingRef.current) {
        console.log('Debounced: Ignoring duplicate call')
        return
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Mark as pending
      pendingRef.current = true

      // Execute immediately
      const result = callback(...args)

      // Set timeout to reset pending state
      timeoutRef.current = setTimeout(() => {
        pendingRef.current = false
      }, delay)

      return result
    },
    [callback, delay]
  )

  return debouncedCallback as T
}