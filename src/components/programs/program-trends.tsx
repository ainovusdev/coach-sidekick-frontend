'use client'

import { useState } from 'react'
import { useProgramTrends } from '@/hooks/queries/use-programs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, Calendar, Activity } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface ProgramTrendsProps {
  programId: string
}

export function ProgramTrends({ programId }: ProgramTrendsProps) {
  const [days, setDays] = useState(90)
  const { data: trends, isLoading } = useProgramTrends(programId, days)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!trends) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-600">No trend data available</p>
        </CardContent>
      </Card>
    )
  }

  // Format data for charts
  const sessionFrequencyData = trends.session_frequency.map(point => ({
    date: formatDate(point.date, 'MMM d'),
    sessions: point.value,
  }))

  const completionRateData = trends.completion_rate_trend.map(point => ({
    date: formatDate(point.date, 'MMM d'),
    rate: point.value,
  }))

  const weekdayData = Object.entries(trends.attendance_by_weekday).map(
    ([day, count]) => ({
      day: day.substring(0, 3), // Mon, Tue, etc.
      sessions: count,
    }),
  )

  // Sort weekdays properly
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  weekdayData.sort(
    (a, b) => weekdayOrder.indexOf(a.day) - weekdayOrder.indexOf(b.day),
  )

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trend Analysis</h2>
          <p className="text-gray-600 mt-1">
            Session frequency and completion patterns over time
          </p>
        </div>
        <Select
          value={days.toString()}
          onValueChange={value => setDays(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Session Frequency Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle>Session Frequency</CardTitle>
          </div>
          <CardDescription>Number of sessions per week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sessionFrequencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#3B82F6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Completion Rate and Weekday Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Rate Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle>Completion Rate</CardTitle>
            </div>
            <CardDescription>
              Percentage of completed sessions over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={completionRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={value => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Completion %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekday Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <CardTitle>Sessions by Weekday</CardTitle>
            </div>
            <CardDescription>Which days have the most activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#8B5CF6" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      {Object.keys(trends.monthly_summary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>Sessions per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(trends.monthly_summary).map(([month, count]) => (
                <div key={month} className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-600">{month}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">sessions</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
