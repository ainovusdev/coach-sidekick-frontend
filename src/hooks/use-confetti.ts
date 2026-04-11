import confetti from 'canvas-confetti'
import { useCallback } from 'react'

/**
 * Subtle confetti burst for task completion celebrations.
 */
export function useConfetti() {
  const fireConfetti = useCallback(
    (options?: { intensity?: 'subtle' | 'medium' }) => {
      const intensity = options?.intensity ?? 'subtle'

      if (intensity === 'medium') {
        // For moving a task to "Done" column
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.65 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#3b82f6'],
          ticks: 120,
          gravity: 1.2,
          scalar: 0.9,
        })
      } else {
        // For subtask checkbox — quick small pop
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#6ee7b7'],
          ticks: 80,
          gravity: 1.5,
          scalar: 0.7,
        })
      }
    },
    [],
  )

  return { fireConfetti }
}
