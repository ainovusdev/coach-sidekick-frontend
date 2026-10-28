import { PROFICIENT_RUNG, RUNG_NAMES } from '@/config/proficiency-rubric'

// Tone by RUNG (the objective level), not the signed score — avoids confusion
// when graduate scores go negative. Uses DS semantic tokens only.
export function rungTone(rung: number): {
  dot: string
  text: string
  badge: string
} {
  if (rung >= 5)
    return {
      dot: 'bg-forest',
      text: 'text-forest',
      badge: 'bg-forest-bg text-forest',
    }
  if (rung >= 4)
    return {
      dot: 'bg-indigo',
      text: 'text-indigo',
      badge: 'bg-indigo-bg text-indigo',
    }
  if (rung >= 2)
    return {
      dot: 'bg-amber-token',
      text: 'text-amber-token',
      badge: 'bg-amber-token-bg text-amber-token',
    }
  return {
    dot: 'bg-vermillion',
    text: 'text-vermillion',
    badge: 'bg-vermillion-bg text-vermillion',
  }
}

// A 7-segment ladder with the achieved rung filled and the Proficient bar marked.
export function RungLadder({ rung }: { rung: number }) {
  const tone = rungTone(rung)
  return (
    <div className="flex items-center gap-1" aria-label={`Rung ${rung} of 7`}>
      {Array.from({ length: 7 }, (_, i) => {
        const r = i + 1
        const filled = r <= rung
        const isBar = r === PROFICIENT_RUNG
        return (
          <div
            key={r}
            title={`${r}. ${RUNG_NAMES[r]}`}
            className={[
              'h-2 w-5 rounded-sm transition-colors',
              filled ? tone.dot : 'bg-line',
              isBar ? 'ring-1 ring-offset-1 ring-indigo' : '',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}
