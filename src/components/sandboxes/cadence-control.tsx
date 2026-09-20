'use client'

import { useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CADENCE_PRESETS,
  cadenceAgreement,
  cadenceEquals,
  presetFor,
  sessionsPerMonth,
} from '@/lib/sandbox/cadence'
import { cn } from '@/lib/utils'
import type { Cadence, CadencePer } from '@/types/sandbox'

const PER_OPTIONS: { value: CadencePer; label: string }[] = [
  { value: 'week', label: 'week' },
  { value: 'fortnight', label: '2 weeks' },
  { value: 'month', label: 'month' },
]

interface CustomState {
  shape: Cadence['shape']
  range: { min: number; max: number; per: CadencePer }
  rate: { count: number; per: CadencePer }
  total: { count: number; span_months: number }
}

function customFrom(cadence: Cadence | null, termMonths: number): CustomState {
  const base: CustomState = {
    shape: 'range',
    range: { min: 2, max: 3, per: 'month' },
    rate: { count: 1, per: 'week' },
    total: {
      count: Math.max(1, Math.round(termMonths * 2)),
      span_months: termMonths,
    },
  }
  if (!cadence) return base
  if (cadence.shape === 'range')
    return {
      ...base,
      shape: 'range',
      range: { min: cadence.min, max: cadence.max, per: cadence.per },
    }
  if (cadence.shape === 'rate')
    return {
      ...base,
      shape: 'rate',
      rate: { count: cadence.count, per: cadence.per },
    }
  return {
    ...base,
    shape: 'total',
    total: { count: cadence.count, span_months: cadence.span_months },
  }
}

function toCadence(c: CustomState): Cadence {
  if (c.shape === 'range') return { shape: 'range', ...c.range }
  if (c.shape === 'rate') return { shape: 'rate', ...c.rate }
  return { shape: 'total', ...c.total }
}

export function CadenceControl({
  value,
  onChange,
  termMonths,
  expectedSessions,
}: {
  value: Cadence | null
  onChange: (cadence: Cadence | null) => void
  termMonths: number
  /** Derived from hours ÷ session length; null while hours are blank. */
  expectedSessions: number | null
}) {
  const [custom, setCustom] = useState<CustomState>(() =>
    customFrom(value, termMonths),
  )
  const [customMode, setCustomMode] = useState<boolean>(
    () => !!value && presetFor(value) === null,
  )
  const activePreset = customMode ? null : presetFor(value)

  const agreement = useMemo(
    () => cadenceAgreement(value, termMonths, expectedSessions),
    [value, termMonths, expectedSessions],
  )

  const pickPreset = (cadence: Cadence) => {
    setCustomMode(false)
    onChange(cadence)
  }

  const openCustom = () => {
    const next = customFrom(value, termMonths)
    setCustom(next)
    setCustomMode(true)
    onChange(toCadence(next))
  }

  const patchCustom = (patch: Partial<CustomState>) => {
    const next = { ...custom, ...patch }
    setCustom(next)
    onChange(toCadence(next))
  }

  return (
    <div className="space-y-3" data-testid="cadence-control">
      <div className="flex flex-wrap gap-2">
        {CADENCE_PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            onClick={() => pickPreset(p.cadence)}
            aria-pressed={activePreset === p.key}
            data-testid={`cadence-${p.key}`}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              activePreset === p.key
                ? 'border-ink bg-ink text-ink-on-dark'
                : 'border-line text-ink-2 hover:border-ink hover:text-ink',
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={openCustom}
          aria-pressed={customMode}
          data-testid="cadence-custom"
          className={cn(
            'rounded-full border px-3 py-1 text-sm transition-colors',
            customMode
              ? 'border-ink bg-ink text-ink-on-dark'
              : 'border-dashed border-ink-4 text-ink-2 hover:border-ink hover:text-ink',
          )}
        >
          Set my own…
        </button>
      </div>

      {customMode && (
        <RadioGroup
          value={custom.shape}
          onValueChange={v => patchCustom({ shape: v as Cadence['shape'] })}
          className="space-y-2 rounded-lg border border-line bg-surface-2 p-3"
        >
          <ShapeRow id="shape-range" active={custom.shape === 'range'}>
            <Stepper
              value={custom.range.min}
              min={1}
              max={custom.range.max}
              onChange={min => patchCustom({ range: { ...custom.range, min } })}
              label="Minimum sessions"
            />
            <span>to</span>
            <Stepper
              value={custom.range.max}
              min={custom.range.min}
              max={30}
              onChange={max => patchCustom({ range: { ...custom.range, max } })}
              label="Maximum sessions"
            />
            <span>sessions per</span>
            <PerSelect
              value={custom.range.per}
              onChange={per => patchCustom({ range: { ...custom.range, per } })}
            />
          </ShapeRow>
          <ShapeRow id="shape-rate" active={custom.shape === 'rate'}>
            <Stepper
              value={custom.rate.count}
              min={1}
              max={30}
              onChange={count =>
                patchCustom({ rate: { ...custom.rate, count } })
              }
              label="Sessions"
            />
            <span>{custom.rate.count === 1 ? 'session' : 'sessions'} per</span>
            <PerSelect
              value={custom.rate.per}
              onChange={per => patchCustom({ rate: { ...custom.rate, per } })}
            />
          </ShapeRow>
          <ShapeRow id="shape-total" active={custom.shape === 'total'}>
            <Stepper
              value={custom.total.count}
              min={1}
              max={200}
              onChange={count =>
                patchCustom({ total: { ...custom.total, count } })
              }
              label="Total sessions"
            />
            <span>sessions over</span>
            <Stepper
              value={custom.total.span_months}
              min={1}
              max={24}
              onChange={span_months =>
                patchCustom({ total: { ...custom.total, span_months } })
              }
              label="Months"
            />
            <span>months</span>
          </ShapeRow>
        </RadioGroup>
      )}

      <TickRail cadence={value} termMonths={termMonths} />

      <p
        className={cn(
          'text-sm',
          !value
            ? 'text-ink-3'
            : agreement?.agrees
              ? 'text-forest'
              : 'text-amber-token',
        )}
        data-testid="cadence-agreement"
      >
        {!value
          ? 'Pick a cadence to check it against the hours.'
          : agreement?.sentence}
      </p>
    </div>
  )
}

function ShapeRow({
  id,
  active,
  children,
}: {
  id: string
  active: boolean
  children: React.ReactNode
}) {
  const value = id.replace('shape-', '')
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink-2',
        active ? 'bg-paper text-ink' : 'opacity-70',
      )}
    >
      <RadioGroupItem value={value} id={id} />
      {children}
    </label>
  )
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <span
      className="inline-flex items-center rounded-md border border-line bg-paper"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className="px-1.5 py-1 text-ink-3 hover:text-ink disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="min-w-6 text-center font-mono text-sm text-ink">
        {value}
      </span>
      <button
        type="button"
        className="px-1.5 py-1 text-ink-3 hover:text-ink disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus className="h-3 w-3" />
      </button>
    </span>
  )
}

function PerSelect({
  value,
  onChange,
}: {
  value: CadencePer
  onChange: (v: CadencePer) => void
}) {
  return (
    <Select value={value} onValueChange={v => onChange(v as CadencePer)}>
      <SelectTrigger className="h-8 w-28 bg-paper" aria-label="Period">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PER_OPTIONS.map(o => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Tick marks across the term: one tick per projected session, month boundaries taller. */
function TickRail({
  cadence,
  termMonths,
}: {
  cadence: Cadence | null
  termMonths: number
}) {
  const perMonth = sessionsPerMonth(cadence)
  const total = Math.min(120, Math.round(perMonth * termMonths))
  const width = 600
  const height = 26
  const ticks =
    total > 0
      ? Array.from({ length: total }, (_, i) => ((i + 0.5) / total) * width)
      : []
  const months = Array.from(
    { length: termMonths + 1 },
    (_, i) => (i / termMonths) * width,
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-7 w-full text-ink-4"
      preserveAspectRatio="none"
      aria-hidden
    >
      <line
        x1={0}
        y1={height - 6}
        x2={width}
        y2={height - 6}
        stroke="currentColor"
        strokeWidth={1}
      />
      {months.map((x, i) => (
        <line
          key={`m${i}`}
          x1={x}
          y1={height - 14}
          x2={x}
          y2={height - 2}
          stroke="currentColor"
          strokeWidth={1}
        />
      ))}
      {ticks.map((x, i) => (
        <line
          key={`t${i}`}
          x1={x}
          y1={height - 12}
          x2={x}
          y2={height - 6}
          className="text-ink"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

export { cadenceEquals }
