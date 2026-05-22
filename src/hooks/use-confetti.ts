import confetti from 'canvas-confetti'
import { useCallback } from 'react'

/**
 * Subtle confetti burst for task completion celebrations.
 *
 * Colors map to DS tokens: forest (success), ds-accent (action). Hex literals
 * here because canvas-confetti renders on a <canvas> element and cannot read
 * CSS variables — these values mirror --forest and --ds-accent.
 */
const FOREST = '#15803D'
const FOREST_BG = '#ECFDF5'
const ACCENT = '#2563EB'

export function useConfetti() {
  const fireConfetti = useCallback(
    (options?: { intensity?: 'subtle' | 'medium' }) => {
      const intensity = options?.intensity ?? 'subtle'

      if (intensity === 'medium') {
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.65 },
          colors: [FOREST, FOREST_BG, ACCENT],
          ticks: 120,
          gravity: 1.2,
          scalar: 0.9,
        })
      } else {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.7 },
          colors: [FOREST, FOREST_BG],
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
