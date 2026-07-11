'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Quote } from 'lucide-react'
import {
  PROFICIENCY_CRITERIA,
  RUNG_NAMES,
  PROFICIENT_RUNG,
  RUBRIC_LEGEND,
} from '@/config/proficiency-rubric'
import type {
  ProficiencyResult,
  ProficiencyScores,
  ProficiencyCriterionScore,
} from '@/services/analysis-service'

interface Props {
  proficiency: ProficiencyResult
}

function isScored(p: ProficiencyResult): p is ProficiencyScores {
  return (p as ProficiencyScores)?.rubric_type !== undefined
}

// Tone by RUNG (the objective level), not the signed score — avoids confusion
// when graduate scores go negative. Uses DS semantic tokens only.
function rungTone(rung: number): { dot: string; text: string; badge: string } {
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

function fmtScore(score: number): string {
  const rounded = Math.round(score * 10) / 10
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

// A 7-segment ladder with the achieved rung filled and the Proficient bar marked.
function RungLadder({ rung }: { rung: number }) {
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

function CriterionRow({
  label,
  Icon,
  data,
  anchors,
}: {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  data: ProficiencyCriterionScore
  anchors: Record<number, string>
}) {
  const tone = rungTone(data.rung)
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`h-4 w-4 shrink-0 ${tone.text}`} />
          <span className="font-medium text-sm text-ink">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className={tone.badge}>
            {RUNG_NAMES[data.rung]}
          </Badge>
          <span className={`text-sm font-semibold tabular-nums ${tone.text}`}>
            {fmtScore(data.score)}
          </span>
        </div>
      </div>

      <div className="mt-2">
        <RungLadder rung={data.rung} />
      </div>

      <p className="mt-2 text-xs text-ink-3">{anchors[data.rung]}</p>

      {data.evidence ? (
        <p className="mt-2 flex gap-1.5 text-xs italic text-ink-3">
          <Quote className="h-3 w-3 shrink-0 mt-0.5 text-ink-4" />
          <span>{data.evidence}</span>
        </p>
      ) : null}

      {data.justification ? (
        <p className="mt-1.5 text-xs text-ink-2">{data.justification}</p>
      ) : null}
    </div>
  )
}

export function SessionProficiencyAnalysis({ proficiency }: Props) {
  if (!isScored(proficiency)) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-sm text-ink-3">
            Proficiency Ladder: not scored for this session
            {proficiency?.reason ? ` (${proficiency.reason})` : ''}.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isTrainee = proficiency.rubric_type === 'trainee'
  const overallTone =
    proficiency.overall >= PROFICIENT_RUNG ? 'text-forest' : 'text-amber-token'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-ink">
              Proficiency Ladder
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wide"
            >
              Admin preview
            </Badge>
            <Badge
              variant="secondary"
              className={
                isTrainee
                  ? 'bg-indigo-bg text-indigo'
                  : 'bg-surface-3 text-ink-2'
              }
            >
              {isTrainee ? 'Trainee scale' : 'Graduate scale'}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-ink-4">Overall</div>
            <div className={`text-xl font-bold tabular-nums ${overallTone}`}>
              {fmtScore(proficiency.overall)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {PROFICIENCY_CRITERIA.map(c => {
            const data = proficiency[c.key]
            if (!data) return null
            return (
              <CriterionRow
                key={c.key}
                label={c.label}
                Icon={c.icon}
                data={data}
                anchors={c.anchors}
              />
            )
          })}
        </div>

        <p className="pt-2 text-[11px] leading-relaxed text-ink-4">
          {isTrainee ? RUBRIC_LEGEND.trainee : RUBRIC_LEGEND.graduate} The bar
          is rung 4 (Proficient).
        </p>
      </CardContent>
    </Card>
  )
}

export default SessionProficiencyAnalysis
