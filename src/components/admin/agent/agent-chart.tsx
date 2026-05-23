'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartSpec } from '@/types/agent'

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
]

interface AgentChartProps {
  spec: ChartSpec
}

export function AgentChart({ spec }: AgentChartProps) {
  const { chart_type, title, description, data, x_key, y_keys } = spec
  const safeData = Array.isArray(data) ? data : []

  return (
    <div className="my-3 rounded-lg border border-line bg-surface-1 p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        {description ? (
          <p className="mt-0.5 text-xs text-ink-3">{description}</p>
        ) : null}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(chart_type, safeData, x_key, y_keys)}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function renderChart(
  type: ChartSpec['chart_type'],
  data: Array<Record<string, unknown>>,
  xKey: string,
  yKeys: string[],
) {
  switch (type) {
    case 'line':
      return (
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {yKeys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      )
    case 'bar':
      return (
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {yKeys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      )
    case 'area':
      return (
        <AreaChart
          data={data}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {yKeys.map((k, i) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
        </AreaChart>
      )
    case 'pie': {
      const valueKey = yKeys[0]
      return (
        <PieChart>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={xKey}
            outerRadius={100}
            label={entry => `${entry[xKey]}`}
          >
            {data.map((_entry, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      )
    }
    case 'scatter':
      return (
        <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey={yKeys[0]} type="number" tick={{ fontSize: 11 }} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Scatter data={data} fill={COLORS[0]} />
        </ScatterChart>
      )
    default:
      return (
        <div className="flex h-full items-center justify-center text-sm text-ink-3">
          Unsupported chart type: {type}
        </div>
      )
  }
}
