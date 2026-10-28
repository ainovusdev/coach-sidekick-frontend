'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Search,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PROFICIENCY_CRITERIA,
  PROFICIENT_RUNG,
  RUNG_NAMES,
  formatAverageRung,
  formatProficiencyScore as fmtScore,
  rungLevel,
  type ProficiencyCriterionKey,
} from '@/config/proficiency-rubric'
import { RungLadder } from '@/components/proficiency/rung-ladder'
import type { ProficiencyTrendPoint } from '@/services/analysis-service'
import { useProficiencyTrend } from '@/hooks/queries/use-proficiency-trend'
import { cn } from '@/lib/utils'

type Metric = 'overall' | ProficiencyCriterionKey
type Range = '3m' | '6m' | '12m' | 'all'
type SessionType = 'all' | '1:1' | 'group'

// The trailing average smooths run-to-run noise in the rubric; it is drawn
// once a session has at least MIN_WINDOW sessions behind it (itself included).
const ROLLING = 5
const MIN_WINDOW = 3
const DEFAULTS = {
  metric: 'overall' as Metric,
  range: '12m' as Range,
  sessionType: 'all' as SessionType,
  clientId: null as string | null,
}
const RANGES: { value: Range; label: string; months?: number }[] = [
  { value: '3m', label: '3M', months: 3 },
  { value: '6m', label: '6M', months: 6 },
  { value: '12m', label: '12M', months: 12 },
  { value: 'all', label: 'All' },
]
const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '1:1', label: '1:1' },
  { value: 'group', label: 'Group' },
]
const DAY = 24 * 60 * 60 * 1000

interface Row {
  t: number
  value: number
  avg: number | null
  // Overall: the mean of the session's eight rungs. Criterion: its rung.
  rung: number
  point: ProficiencyTrendPoint
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

function metricLabel(metric: Metric) {
  return metric === 'overall'
    ? 'Overall'
    : (PROFICIENCY_CRITERIA.find(c => c.key === metric)?.label ?? metric)
}

// Overall averages eight rungs; a criterion is a single whole rung.
function levelText(rung: number, metric: Metric) {
  const name = RUNG_NAMES[rungLevel(rung)]
  return metric === 'overall'
    ? `${name} (${formatAverageRung(rung)})`
    : `${name} (${rung})`
}

function fmtDate(t: number, withYear = true) {
  return new Date(t).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

// Month starts across the domain, thinned to at most six labels.
function monthTicks(from: number, to: number) {
  const ticks: number[] = []
  const d = new Date(from)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  if (d.getTime() < from) d.setMonth(d.getMonth() + 1)
  while (d.getTime() <= to) {
    ticks.push(d.getTime())
    d.setMonth(d.getMonth() + 1)
  }
  const step = Math.ceil(ticks.length / 6) || 1
  return ticks.filter((_, i) => i % step === 0)
}

// Graduate scores run −3..7 and trainee scores 1..9.1; both put the bar at 4.
function yScale(types: Set<string>) {
  const lo = types.has('graduate') ? -4 : 0
  const hi = types.has('trainee') ? 10 : 8
  const ticks: number[] = []
  for (let v = lo; v <= hi; v += 2) ticks.push(v)
  return { domain: [lo, hi] as [number, number], ticks }
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div
      className="flex rounded-lg border border-line bg-paper p-0.5"
      role="group"
      aria-label={label}
    >
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs transition-colors',
            value === o.value
              ? 'bg-surface-2 font-medium text-ink'
              : 'text-ink-3 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ClientPicker({
  clients,
  value,
  onChange,
}: {
  clients: { id: string; name: string }[]
  value: string | null
  onChange: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = clients.find(c => c.id === value)
  const q = search.trim().toLowerCase()
  const shown = q
    ? clients.filter(c => c.name.toLowerCase().includes(q))
    : clients
  const pick = (id: string | null) => {
    onChange(id)
    setOpen(false)
    setSearch('')
  }
  const option = (id: string | null, name: string, icon: React.ReactNode) => (
    <button
      key={id ?? 'all'}
      type="button"
      onClick={() => pick(id)}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs hover:bg-surface-3',
        value === id && 'bg-surface-3 font-medium',
      )}
    >
      {icon}
      <span className="flex-1 truncate text-left">{name}</span>
      {value === id && <Check className="h-3 w-3 text-ink-3" />}
    </button>
  )
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 min-w-[160px] justify-between text-xs"
          aria-label="Filter by client"
        >
          <span className="flex min-w-0 items-center gap-2">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {selected ? selected.name : 'All clients'}
            </span>
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <div className="border-b border-line p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-4" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {!q && option(null, 'All clients', <Users className="h-3 w-3" />)}
          {shown.map(c => option(c.id, c.name, <User className="h-3 w-3" />))}
          {shown.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-ink-3">
              No clients found
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ProficiencyTrendCard() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useProficiencyTrend()
  const [metric, setMetric] = useState<Metric>(DEFAULTS.metric)
  const [range, setRange] = useState<Range>(DEFAULTS.range)
  const [sessionType, setSessionType] = useState<SessionType>(
    DEFAULTS.sessionType,
  )
  const [clientId, setClientId] = useState<string | null>(DEFAULTS.clientId)
  const [now] = useState(() => Date.now())

  const points = useMemo(() => data?.points ?? [], [data])
  const clientNames = useMemo(
    () => new Map((data?.clients ?? []).map(c => [c.id, c.name])),
    [data],
  )

  // Everything but the date range: the rolling average must see sessions
  // just before the range so the line doesn't restart at its left edge.
  const series = useMemo<Row[]>(() => {
    const matching = points.filter(p => {
      if (sessionType === '1:1' && p.is_group_session) return false
      if (sessionType === 'group' && !p.is_group_session) return false
      if (
        clientId &&
        p.client_id !== clientId &&
        !p.participant_client_ids.includes(clientId)
      )
        return false
      return true
    })
    const values = matching.map(p =>
      metric === 'overall' ? p.overall : p.criteria[metric].score,
    )
    return matching.map((p, i) => {
      const window = values.slice(Math.max(0, i - ROLLING + 1), i + 1)
      return {
        t: Date.parse(p.started_at),
        value: values[i],
        avg: window.length >= MIN_WINDOW ? mean(window) : null,
        rung:
          metric === 'overall'
            ? mean(PROFICIENCY_CRITERIA.map(c => p.criteria[c.key].rung))
            : p.criteria[metric].rung,
        point: p,
      }
    })
  }, [points, metric, sessionType, clientId])

  const since = useMemo(() => {
    const months = RANGES.find(r => r.value === range)?.months
    if (!months) return null
    const d = new Date(now)
    d.setMonth(d.getMonth() - months)
    return d.getTime()
  }, [range, now])
  const rows = useMemo(
    () => (since ? series.filter(r => r.t >= since) : series),
    [series, since],
  )

  const recent = rows.slice(-ROLLING)
  const prior = rows.slice(-2 * ROLLING, -ROLLING)
  const recentAvg = recent.length ? mean(recent.map(r => r.value)) : null
  const recentRung = recent.length ? mean(recent.map(r => r.rung)) : null
  const delta =
    recentAvg != null && prior.length >= MIN_WINDOW
      ? recentAvg - mean(prior.map(r => r.value))
      : null
  const atBar = rows.filter(r => r.value >= PROFICIENT_RUNG).length

  const allTypes = new Set(points.map(p => p.rubric_type))
  const visibleTypes = new Set(rows.map(r => r.point.rubric_type))
  const y = yScale(visibleTypes.size ? visibleTypes : allTypes)
  // "All" fits the data, padded so the end dots don't sit on the plot edges.
  const first = rows.length ? rows[0].t : now - 30 * DAY
  const last = rows.length ? rows[rows.length - 1].t : now
  const pad = Math.max(7 * DAY, (last - first) * 0.03)
  const xFrom = since ?? first - pad
  const xTo = since ? now : last + pad
  const spansYears =
    new Date(xFrom).getFullYear() !== new Date(xTo).getFullYear()
  const filtered =
    metric !== DEFAULTS.metric ||
    range !== DEFAULTS.range ||
    sessionType !== DEFAULTS.sessionType ||
    clientId !== DEFAULTS.clientId
  const reset = () => {
    setMetric(DEFAULTS.metric)
    setRange(DEFAULTS.range)
    setSessionType(DEFAULTS.sessionType)
    setClientId(DEFAULTS.clientId)
  }

  const who = (p: ProficiencyTrendPoint) => {
    if (!p.is_group_session)
      return (p.client_id && clientNames.get(p.client_id)) || 'No client'
    const names = p.participant_client_ids
      .map(id => clientNames.get(id))
      .filter(Boolean)
    if (names.length === 0) return 'Group session'
    return names.length <= 3
      ? `Group: ${names.join(', ')}`
      : `Group: ${names.length} clients`
  }

  const scale =
    allTypes.size > 1
      ? 'Mixed scales'
      : allTypes.has('trainee')
        ? 'Trainee scale'
        : 'Graduate scale'

  const ChartTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    const row = active ? (payload?.[0]?.payload as Row | undefined) : undefined
    if (!row) return null
    return (
      <div className="max-w-[240px] rounded-lg border border-line bg-paper px-3 py-2 text-xs shadow-sm">
        <p className="text-ink-3">{fmtDate(row.t)}</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-semibold text-ink">
            {fmtScore(row.value)}
          </span>
          <span className="text-ink-2">
            {metricLabel(metric)}
            {metric !== 'overall' &&
              ` · ${RUNG_NAMES[row.rung]} (rung ${row.rung})`}
          </span>
        </p>
        {metric === 'overall' && (
          <p className="mt-0.5 text-ink-2">
            {RUNG_NAMES[rungLevel(row.rung)]} · average rung{' '}
            {formatAverageRung(row.rung)}
          </p>
        )}
        {row.avg != null && (
          <p className="mt-0.5 flex items-center gap-2 text-ink-2">
            <span className="h-0.5 w-3 rounded-full bg-ds-accent" />
            <span className="font-medium text-ink">{fmtScore(row.avg)}</span>
            {ROLLING}-session average
          </p>
        )}
        <p className="mt-1 text-ink-3">{who(row.point)}</p>
        <p className="mt-1 text-ink-4">Click to open the session</p>
      </div>
    )
  }

  return (
    <Card className="mb-6 border-line" data-testid="proficiency-trend-card">
      <CardHeader className="border-b border-line pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <TrendingUp className="h-4 w-4 text-ink-3" />
          <h3 className="text-base font-semibold text-ink">
            Your Proficiency Ladder
          </h3>
          <Badge variant="outline" className="text-[10px]">
            Preview
          </Badge>
          {points.length > 0 && (
            <Badge
              variant="outline"
              className="ml-auto border-line text-[10px] text-ink-3"
            >
              {scale}
            </Badge>
          )}
        </div>
        <p className="text-xs text-ink-3">
          Each dot is a scored session. The line is the average of the last{' '}
          {ROLLING} sessions. 4 is the Proficient bar on both scales. Your level
          is the rung your areas reach on average; the score also applies your
          trainee or graduate scale, so the two can differ.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-8 w-full max-w-xl" />
            <Skeleton className="h-16 w-full max-w-md" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 py-6 text-sm text-ink-3">
            Couldn&apos;t load your proficiency scores.
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : points.length === 0 ? (
          <p className="py-8 text-sm text-ink-3">
            No scored sessions yet. Scores appear here once a recorded session
            has been analysed.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                label="Date range"
                value={range}
                options={RANGES}
                onChange={setRange}
              />
              <ClientPicker
                clients={data?.clients ?? []}
                value={clientId}
                onChange={setClientId}
              />
              <Segmented
                label="Session type"
                value={sessionType}
                options={SESSION_TYPES}
                onChange={setSessionType}
              />
              <Select
                value={metric}
                onValueChange={v => setMetric(v as Metric)}
              >
                <SelectTrigger
                  className="h-8 w-[170px] text-xs"
                  aria-label="Metric"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall" className="text-xs">
                    Overall
                  </SelectItem>
                  {PROFICIENCY_CRITERIA.map(c => (
                    <SelectItem key={c.key} value={c.key} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filtered && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-ink-3 underline underline-offset-4 hover:text-ink"
                >
                  Reset
                </button>
              )}
            </div>

            {rows.length === 0 ? (
              <div className="flex items-center gap-3 py-8 text-sm text-ink-3">
                No scored sessions match these filters.
                <Button variant="outline" size="sm" onClick={reset}>
                  Reset filters
                </Button>
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs text-ink-3">
                      {metricLabel(metric)}, last {recent.length}{' '}
                      {recent.length === 1 ? 'session' : 'sessions'}
                    </dt>
                    <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                      <span className="text-2xl font-semibold text-ink">
                        {recentAvg != null ? fmtScore(recentAvg) : '–'}
                      </span>
                      {delta != null && Math.abs(delta) >= 0.05 && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 text-xs font-medium',
                            delta > 0 ? 'text-forest' : 'text-vermillion',
                          )}
                        >
                          {delta > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {fmtScore(delta)} vs previous {prior.length}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-3">
                      {metricLabel(metric)} level
                    </dt>
                    {recentRung != null && (
                      <dd className="mt-0.5 space-y-1.5">
                        <span className="block text-2xl font-semibold text-ink">
                          {RUNG_NAMES[rungLevel(recentRung)]}
                        </span>
                        <RungLadder rung={rungLevel(recentRung)} />
                        <span className="block text-xs text-ink-3">
                          Average rung {formatAverageRung(recentRung)} of 7
                        </span>
                      </dd>
                    )}
                  </div>
                  <div>
                    <dt className="text-xs text-ink-3">Sessions scored</dt>
                    <dd className="mt-0.5 text-2xl font-semibold text-ink">
                      {rows.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-3">At or above the bar</dt>
                    <dd className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-ink">
                        {Math.round((atBar / rows.length) * 100)}%
                      </span>
                      <span className="text-xs text-ink-3">
                        {atBar} of {rows.length}
                      </span>
                    </dd>
                  </div>
                </dl>

                <div
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2"
                  aria-hidden="true"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-ink-3" />
                    Session score
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-ds-accent" />
                    {ROLLING}-session average
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 border-t border-dashed border-indigo" />
                    Proficient bar
                  </span>
                </div>

                <div
                  className="h-64 min-w-0 sm:h-72"
                  role="img"
                  aria-label={`${metricLabel(metric)} proficiency score for ${rows.length} sessions with a ${ROLLING}-session average. Exact values in the data table below.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={rows}
                      margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                      onClick={state => {
                        const row = state?.activePayload?.[0]?.payload as
                          | Row
                          | undefined
                        if (row)
                          router.push(`/sessions/${row.point.session_id}`)
                      }}
                      style={{ cursor: 'pointer' }}
                      accessibilityLayer
                    >
                      <CartesianGrid stroke="var(--line)" vertical={false} />
                      <XAxis
                        dataKey="t"
                        type="number"
                        scale="time"
                        domain={[xFrom, xTo]}
                        ticks={monthTicks(xFrom, xTo)}
                        tickFormatter={v => {
                          const d = new Date(v)
                          const month = d.toLocaleDateString(undefined, {
                            month: 'short',
                          })
                          // "Nov ’25", never "Nov 25" (reads as a day).
                          return spansYears
                            ? `${month} ’${String(d.getFullYear()).slice(-2)}`
                            : month
                        }}
                        stroke="var(--ink-3)"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        domain={y.domain}
                        ticks={y.ticks}
                        allowDataOverflow
                        stroke="var(--ink-3)"
                        tick={{ fontSize: 11 }}
                      />
                      <ReferenceLine
                        y={PROFICIENT_RUNG}
                        stroke="var(--indigo)"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Proficient',
                          position: 'insideTopRight',
                          fill: 'var(--ink-3)',
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{
                          stroke: 'var(--line-strong)',
                          strokeWidth: 1,
                        }}
                        isAnimationActive={false}
                      />
                      <Line
                        dataKey="value"
                        name="Session score"
                        stroke="transparent"
                        dot={{
                          r: 4,
                          fill: 'var(--ink-3)',
                          stroke: 'var(--paper)',
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 6,
                          fill: 'var(--ds-accent)',
                          stroke: 'var(--paper)',
                          strokeWidth: 2,
                        }}
                        isAnimationActive={false}
                      />
                      <Line
                        dataKey="avg"
                        name={`${ROLLING}-session average`}
                        type="monotone"
                        stroke="var(--ds-accent)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {visibleTypes.size > 1 && (
                  <p className="text-xs text-ink-3">
                    These sessions mix the trainee and graduate scales, which
                    score the same rung differently. Compare rungs on the
                    session pages for like-for-like.
                  </p>
                )}

                <details>
                  <summary className="w-fit cursor-pointer text-xs text-ink-2 underline underline-offset-4">
                    View chart data table
                  </summary>
                  <div className="mt-3 max-h-80 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <caption className="sr-only">
                        {metricLabel(metric)} proficiency score per session
                      </caption>
                      <thead>
                        <tr>
                          {[
                            'Date',
                            'Client',
                            metricLabel(metric),
                            'Level',
                            `${ROLLING}-session average`,
                          ].map(h => (
                            <th
                              scope="col"
                              key={h}
                              className="px-3 py-2 font-medium"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...rows].reverse().map(row => (
                          <tr
                            className="border-t border-line"
                            key={row.point.session_id}
                          >
                            <th
                              scope="row"
                              className="whitespace-nowrap px-3 py-2 font-normal"
                            >
                              <Link
                                href={`/sessions/${row.point.session_id}`}
                                className="underline underline-offset-4 hover:text-ink"
                              >
                                {fmtDate(row.t)}
                              </Link>
                            </th>
                            <td className="px-3 py-2">{who(row.point)}</td>
                            <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                              {fmtScore(row.value)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {levelText(row.rung, metric)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                              {row.avg != null ? fmtScore(row.avg) : '–'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
