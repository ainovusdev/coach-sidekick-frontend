/**
 * Hook for managing pinned coaching suggestions in localStorage
 * Persists suggestions per session (botId) so they survive page refreshes
 */

import { useState, useEffect, useCallback } from 'react'

export interface PinnedSuggestion {
  id: string
  suggestion: string
  rationale?: string
  priority: string
  category: string
  pinnedAt: string
  go_live_emoji?: string
  go_live_value?: string
}

const STORAGE_KEY_PREFIX = 'coach-pinned-'

export function usePinnedSuggestions(botId: string) {
  const [pinnedSuggestions, setPinnedSuggestions] = useState<
    PinnedSuggestion[]
  >([])
  const storageKey = `${STORAGE_KEY_PREFIX}${botId}`

  // Load from localStorage on mount
  useEffect(() => {
    if (!botId) return

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setPinnedSuggestions(parsed)
        }
      }
    } catch (error) {
      console.error('Failed to load pinned suggestions:', error)
    }
  }, [botId, storageKey])

  // Save to localStorage whenever pinnedSuggestions changes
  useEffect(() => {
    if (!botId) return

    try {
      localStorage.setItem(storageKey, JSON.stringify(pinnedSuggestions))
    } catch (error) {
      console.error('Failed to save pinned suggestions:', error)
    }
  }, [pinnedSuggestions, botId, storageKey])

  const pinSuggestion = useCallback(
    (suggestion: Omit<PinnedSuggestion, 'pinnedAt'>) => {
      setPinnedSuggestions(prev => {
        // Don't add duplicates
        if (prev.some(p => p.id === suggestion.id)) {
          return prev
        }
        return [
          ...prev,
          {
            ...suggestion,
            pinnedAt: new Date().toISOString(),
          },
        ]
      })
    },
    [],
  )

  const unpinSuggestion = useCallback((suggestionId: string) => {
    setPinnedSuggestions(prev => prev.filter(p => p.id !== suggestionId))
  }, [])

  const isPinned = useCallback(
    (suggestionId: string) => {
      return pinnedSuggestions.some(p => p.id === suggestionId)
    },
    [pinnedSuggestions],
  )

  const clearAllPinned = useCallback(() => {
    setPinnedSuggestions([])
  }, [])

  const togglePin = useCallback(
    (suggestion: Omit<PinnedSuggestion, 'pinnedAt'>) => {
      if (isPinned(suggestion.id)) {
        unpinSuggestion(suggestion.id)
      } else {
        pinSuggestion(suggestion)
      }
    },
    [isPinned, pinSuggestion, unpinSuggestion],
  )

  return {
    pinnedSuggestions,
    pinSuggestion,
    unpinSuggestion,
    isPinned,
    clearAllPinned,
    togglePin,
    pinnedCount: pinnedSuggestions.length,
  }
}
