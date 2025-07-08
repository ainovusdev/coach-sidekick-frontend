'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Lightbulb,
  AlertCircle,
  Clock,
  Brain,
  Heart,
  Target,
  BarChart3,
  RefreshCw,
  Zap,
} from 'lucide-react'

interface CoachingSuggestion {
  id: string
  type: 'immediate' | 'reflection' | 'improvement'
  priority: 'high' | 'medium' | 'low'
  category: string
  suggestion: string
  rationale: string
  timing: 'now' | 'next_pause' | 'end_of_call'
  timestamp: string
}

interface CoachingAnalysis {
  overallScore: number
  conversationPhase:
    | 'opening'
    | 'exploration'
    | 'insight'
    | 'commitment'
    | 'closing'
  coachEnergyLevel: number
  clientEngagementLevel: number
  timestamp: string
}

interface CoachingPanelProps {
  botId: string
  className?: string
}

export function CoachingPanel({ botId, className }: CoachingPanelProps) {
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([])
  const [analysis, setAnalysis] = useState<CoachingAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [metadata, setMetadata] = useState<any>(null)

  const fetchSuggestions = async (autoAnalyze: boolean = true) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        auto_analyze: autoAnalyze.toString(),
        only_active: 'true',
      })

      const response = await fetch(
        `/api/coaching/suggestions/${botId}?${params}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch suggestions')
      }

      setSuggestions(data.suggestions || [])
      setAnalysis(data.analysis || null)
      setMetadata(data.metadata || null)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const triggerAnalysis = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/coaching/analyze/${botId}`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Analysis failed')
      }

      // Refresh suggestions after analysis
      await fetchSuggestions(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh suggestions every 15 seconds
  useEffect(() => {
    fetchSuggestions()
    const interval = setInterval(() => fetchSuggestions(), 15000)
    return () => clearInterval(interval)
  }, [botId])

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Lightbulb className="h-4 w-4 text-blue-500" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getTimingBadgeColor = (timing: string) => {
    switch (timing) {
      case 'now':
        return 'destructive'
      case 'next_pause':
        return 'default'
      case 'end_of_call':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'opening':
        return '🌅'
      case 'exploration':
        return '🔍'
      case 'insight':
        return '💡'
      case 'commitment':
        return '🎯'
      case 'closing':
        return '🏁'
      default:
        return '💬'
    }
  }

  if (error && error.includes('OpenAI API key')) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            OpenAI Configuration Required
          </h3>
          <p className="text-gray-600 text-sm">
            Add your OPENAI_API_KEY to the .env.local file to enable coaching
            analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Coaching Assistant
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSuggestions()}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={triggerAnalysis}
                disabled={loading}
              >
                <Zap className="h-4 w-4" />
                Analyze
              </Button>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="suggestions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="suggestions">
                Suggestions ({suggestions.length})
              </TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="space-y-3 mt-4">
              {loading && (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Analyzing conversation...
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {suggestions.length === 0 && !loading && !error && (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No active suggestions available.</p>
                  <p className="text-xs mt-1">
                    {metadata?.transcriptLength
                      ? 'Keep the conversation going for more insights.'
                      : 'Waiting for conversation to begin...'}
                  </p>
                </div>
              )}

              {suggestions.map(suggestion => (
                <Card
                  key={suggestion.id}
                  className="border-l-4 border-l-purple-500"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(suggestion.priority)}
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                        <Badge
                          variant={getTimingBadgeColor(suggestion.timing)}
                          className="text-xs"
                        >
                          {suggestion.timing.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(suggestion.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="font-medium text-gray-900 mb-2">
                      {suggestion.suggestion}
                    </p>

                    {suggestion.rationale && (
                      <p className="text-sm text-gray-600">
                        <strong>Why:</strong> {suggestion.rationale}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              {analysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-1">
                          {getPhaseIcon(analysis.conversationPhase)}
                        </div>
                        <p className="text-sm font-medium capitalize">
                          {analysis.conversationPhase.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Conversation Phase
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-1 font-bold text-purple-600">
                          {analysis.overallScore}/10
                        </div>
                        <p className="text-sm font-medium">Overall Score</p>
                        <p className="text-xs text-gray-500">
                          Coaching Quality
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          Coach Energy
                        </span>
                        <span className="text-sm font-medium">
                          {analysis.coachEnergyLevel}/10
                        </span>
                      </div>
                      <Progress
                        value={analysis.coachEnergyLevel * 10}
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          Client Engagement
                        </span>
                        <span className="text-sm font-medium">
                          {analysis.clientEngagementLevel}/10
                        </span>
                      </div>
                      <Progress
                        value={analysis.clientEngagementLevel * 10}
                        className="h-2"
                      />
                    </div>
                  </div>

                  {metadata && (
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                      <div className="grid grid-cols-2 gap-2">
                        <div>Session: {metadata.sessionAge} minutes</div>
                        <div>
                          Transcript: {metadata.transcriptLength} entries
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No analysis data available yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerAnalysis}
                    className="mt-3"
                    disabled={loading}
                  >
                    Start Analysis
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="scores" className="mt-4">
              {analysis ? (
                <div className="space-y-3">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {analysis.overallScore}/10
                    </div>
                    <p className="text-sm text-gray-600">
                      Overall Coaching Score
                    </p>
                  </div>

                  <Separator />

                  <div className="text-center text-sm text-gray-500">
                    <p>Detailed criteria scoring will be available</p>
                    <p>as the conversation progresses.</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No scoring data available yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
