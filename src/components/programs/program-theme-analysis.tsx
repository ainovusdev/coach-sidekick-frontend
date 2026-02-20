'use client'

import { useState } from 'react'
import { useProgramThemeAnalysis } from '@/hooks/queries/use-programs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Sparkles, Network } from 'lucide-react'
import { formatRelativeTime, formatDate } from '@/lib/date-utils'

interface ProgramThemeAnalysisProps {
  programId: string
}

export function ProgramThemeAnalysis({ programId }: ProgramThemeAnalysisProps) {
  const [days, setDays] = useState(90)
  const { data: themes, isLoading } = useProgramThemeAnalysis(programId, days)

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

  if (!themes) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-600">No theme data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Theme Analysis</h2>
          <p className="text-gray-600 mt-1">
            Track conversation topics and patterns over time
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

      {/* Emerging Themes */}
      {themes.emerging_themes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <CardTitle>Emerging Themes</CardTitle>
            </div>
            <CardDescription>
              New topics that appeared in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {themes.emerging_themes.map(theme => (
                <Badge
                  key={theme}
                  variant="secondary"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending and Declining Themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trending Up */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle>Trending Topics</CardTitle>
            </div>
            <CardDescription>Themes becoming more frequent</CardDescription>
          </CardHeader>
          <CardContent>
            {themes.trending_themes.length === 0 ? (
              <p className="text-sm text-gray-600">
                No trending themes identified
              </p>
            ) : (
              <div className="space-y-4">
                {themes.trending_themes.map(theme => (
                  <div key={theme.theme} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {theme.theme}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        {theme.total_count} mentions
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      <span>
                        First seen {formatRelativeTime(theme.first_seen)}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        Last seen {formatRelativeTime(theme.last_seen)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Declining */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <CardTitle>Declining Topics</CardTitle>
            </div>
            <CardDescription>Themes becoming less frequent</CardDescription>
          </CardHeader>
          <CardContent>
            {themes.declining_themes.length === 0 ? (
              <p className="text-sm text-gray-600">
                No declining themes identified
              </p>
            ) : (
              <div className="space-y-4">
                {themes.declining_themes.map(theme => (
                  <div key={theme.theme} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {theme.theme}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        {theme.total_count} mentions
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      <span>
                        First seen {formatRelativeTime(theme.first_seen)}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        Last seen {formatRelativeTime(theme.last_seen)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Theme Evolution Charts */}
      {themes.trending_themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Theme Evolution Over Time</CardTitle>
            <CardDescription>
              How top themes have changed in frequency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {themes.trending_themes.slice(0, 3).map(theme => {
                const chartData = theme.occurrences.map(point => ({
                  date: formatDate(point.date, 'MMM d'),
                  count: point.value,
                }))

                return (
                  <div key={theme.theme}>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      {theme.theme}
                    </h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#10B981"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Correlations */}
      {Object.keys(themes.theme_correlations).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-purple-600" />
              <CardTitle>Related Themes</CardTitle>
            </div>
            <CardDescription>
              Topics that frequently appear together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(themes.theme_correlations).map(
                ([theme, related]) => (
                  <div key={theme} className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{theme}</h4>
                    <div className="flex flex-wrap gap-2">
                      {related.map(relatedTheme => (
                        <Badge
                          key={relatedTheme}
                          variant="secondary"
                          className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {relatedTheme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
