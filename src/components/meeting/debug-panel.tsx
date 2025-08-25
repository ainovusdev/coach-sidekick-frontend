'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDebugAnalysis, useDebugSuggestions, useConversationAnalysis } from '@/hooks/use-debug-analysis'
import {
  Bug,
  RefreshCw,
  Clock,
  Brain,
  Search,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DebugPanelProps {
  sessionId: string
  className?: string
}

export function DebugPanel({ sessionId, className }: DebugPanelProps) {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    transcript: false,
    semantic: true,
    topic: true,
    suggestions: true,
    analysis: false,
    metadata: false,
  })

  const { data, loading, error, refresh, lastRefresh } = useDebugAnalysis(sessionId, autoRefresh)
  const { generateSuggestions, loading: suggestionsLoading } = useDebugSuggestions(sessionId)
  const { analyzeConversation, loading: analysisLoading } = useConversationAnalysis(sessionId)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadDebugData = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-${sessionId}-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <Card className={cn('bg-red-50 border-red-200', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            Debug Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={refresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading && !data) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading debug data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('bg-gray-50 overflow-hidden flex flex-col', className)}>
      <CardHeader className="bg-gray-900 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug Analysis Panel
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                className="data-[state=checked]:bg-green-600"
              />
              <span className="text-sm">Auto-refresh (10s)</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadDebugData}
              disabled={!data}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        {lastRefresh && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-300">
            <Clock className="h-3 w-3" />
            Last refresh: {lastRefresh.toLocaleTimeString()}
            {data && (
              <span className="ml-2">
                Processing time: {data.processing_time_ms}ms
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6 overflow-auto flex-1">
        {data && (
          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="similar">Similar Conversations</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Full Transcript
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Total: {data.transcript.total_entries} entries</span>
                  <span>Final: {data.transcript.final_entries} entries</span>
                  <span>Window: {data.transcript.window_size}</span>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Current Window Text</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(data.transcript.window_text)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-32">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {data.transcript.window_text}
                  </pre>
                </ScrollArea>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <button
                  className="flex items-center justify-between w-full"
                  onClick={() => toggleSection('transcript')}
                >
                  <h4 className="font-medium">Full Transcript Entries</h4>
                  {expandedSections.transcript ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.transcript && (
                  <ScrollArea className="h-64 mt-4">
                    <div className="space-y-2">
                      {data.transcript.full_transcript.map((entry, idx) => (
                        <div key={idx} className="text-xs border-b pb-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-600">
                              {entry.speaker}
                            </span>
                            <span className="text-gray-400">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-700">{entry.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Confidence: {(entry.confidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="similar" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Similar Conversations
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">
                    Semantic: {data.similar_conversations.search_metrics.semantic_found}
                  </Badge>
                  <Badge variant="secondary">
                    Topic: {data.similar_conversations.search_metrics.topic_found}
                  </Badge>
                </div>
              </div>

              {data.similar_conversations.search_metrics.topics_extracted.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Extracted Topics:</span>
                  {data.similar_conversations.search_metrics.topics_extracted.map((topic, idx) => (
                    <Badge key={idx} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Semantic Similar */}
                <div className="border rounded-lg p-4 bg-white">
                  <button
                    className="flex items-center justify-between w-full mb-3"
                    onClick={() => toggleSection('semantic')}
                  >
                    <h4 className="font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Semantic Similarity
                    </h4>
                    {expandedSections.semantic ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedSections.semantic && (
                    <div className="space-y-3">
                      {data.similar_conversations.semantic.length > 0 ? (
                        data.similar_conversations.semantic.map((conv, idx) => (
                          <div key={idx} className="border rounded p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">
                                {new Date(conv.date).toLocaleDateString()}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                Score: {(conv.similarity_score * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{conv.summary}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {conv.topics.map((topic, tidx) => (
                                <Badge key={tidx} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-gray-600 italic">
                              {conv.relevance_reason}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  conv.sentiment === 'positive' && 'bg-green-50',
                                  conv.sentiment === 'negative' && 'bg-red-50'
                                )}
                              >
                                {conv.sentiment}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Effectiveness: {conv.effectiveness}/10
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No semantically similar conversations found</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Topic Similar */}
                <div className="border rounded-lg p-4 bg-white">
                  <button
                    className="flex items-center justify-between w-full mb-3"
                    onClick={() => toggleSection('topic')}
                  >
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Topic-based Similarity
                    </h4>
                    {expandedSections.topic ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedSections.topic && (
                    <div className="space-y-3">
                      {data.similar_conversations.topic_based.length > 0 ? (
                        data.similar_conversations.topic_based.map((conv, idx) => (
                          <div key={idx} className="border rounded p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">
                                {new Date(conv.date).toLocaleDateString()}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                Score: {(conv.similarity_score * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{conv.summary}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {conv.topics.map((topic, tidx) => (
                                <Badge key={tidx} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-gray-600 italic">
                              {conv.relevance_reason}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  conv.sentiment === 'positive' && 'bg-green-50',
                                  conv.sentiment === 'negative' && 'bg-red-50'
                                )}
                              >
                                {conv.sentiment}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Effectiveness: {conv.effectiveness}/10
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No topic-similar conversations found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Window Suggestions
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {data.suggestions.suggestion_count} suggestions
                  </Badge>
                  <Badge variant="outline">
                    Based on {data.suggestions.based_on_entries} entries
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateSuggestions()}
                    disabled={suggestionsLoading}
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-2', suggestionsLoading && 'animate-spin')} />
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <button
                  className="flex items-center justify-between w-full mb-3"
                  onClick={() => toggleSection('suggestions')}
                >
                  <h4 className="font-medium">Current Window Suggestions</h4>
                  {expandedSections.suggestions ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.suggestions && (
                  <div className="space-y-3">
                    {data.suggestions.window_suggestions.length > 0 ? (
                      data.suggestions.window_suggestions.map((suggestion) => (
                        <div key={suggestion.id} className="border rounded p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {suggestion.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.timing}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(suggestion.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 mb-2">
                            {suggestion.content}
                          </p>
                          {suggestion.rationale && (
                            <p className="text-xs text-gray-600 italic">
                              Rationale: {suggestion.rationale}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No suggestions generated yet</p>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analysis State
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => analyzeConversation()}
                  disabled={analysisLoading}
                >
                  <Brain className={cn('h-4 w-4 mr-2', analysisLoading && 'animate-spin')} />
                  Deep Analysis
                </Button>
              </div>

              {data.analysis_state ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium mb-3">Coaching Scores</h4>
                    <div className="space-y-2">
                      {Object.entries(data.analysis_state.coaching_scores).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={cn(
                                  'h-2 rounded-full',
                                  value >= 7 ? 'bg-green-500' : value >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                                )}
                                style={{ width: `${value * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">
                              {value.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium mb-3">GO LIVE Scores</h4>
                    <div className="space-y-2">
                      {Object.entries(data.analysis_state.go_live_scores).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">
                            {key}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={cn(
                                  'h-2 rounded-full',
                                  value >= 7 ? 'bg-green-500' : value >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                                )}
                                style={{ width: `${value * 10}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8">
                              {value.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium mb-3">Sentiment Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            data.analysis_state.sentiment.overall === 'positive' && 'bg-green-50',
                            data.analysis_state.sentiment.overall === 'negative' && 'bg-red-50'
                          )}
                        >
                          {data.analysis_state.sentiment.overall}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Score</span>
                        <span className="text-sm font-medium">
                          {data.analysis_state.sentiment.score.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Engagement</span>
                        <Badge variant="secondary">
                          {data.analysis_state.sentiment.engagement}
                        </Badge>
                      </div>
                      {data.analysis_state.sentiment.emotions.length > 0 && (
                        <div>
                          <span className="text-sm">Emotions:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {data.analysis_state.sentiment.emotions.map((emotion, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {emotion}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium mb-3">Meeting State</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Phase</span>
                        <Badge variant="secondary">
                          {data.meeting_state.phase}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Energy</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            data.meeting_state.energy === 'high' && 'bg-green-50',
                            data.meeting_state.energy === 'low' && 'bg-red-50'
                          )}
                        >
                          {data.meeting_state.energy}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Focus</span>
                        <span className="text-sm text-gray-600">
                          {data.meeting_state.focus}
                        </span>
                      </div>
                      {data.meeting_state.next_steps && (
                        <div>
                          <span className="text-sm">Next Steps:</span>
                          <p className="text-xs text-gray-600 mt-1">
                            {data.meeting_state.next_steps}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No analysis state available. The conversation may be too short or analysis hasn&apos;t been triggered yet.
                  </AlertDescription>
                </Alert>
              )}

              {/* Metadata Section */}
              <div className="border rounded-lg p-4 bg-white">
                <button
                  className="flex items-center justify-between w-full"
                  onClick={() => toggleSection('metadata')}
                >
                  <h4 className="font-medium">Session Metadata</h4>
                  {expandedSections.metadata ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.metadata && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Session ID</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {sessionId}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Bot ID</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {data.metadata.bot_id}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Client ID</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {data.metadata.client_id || 'Not linked'}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Redis Status</span>
                      <Badge variant="secondary">
                        {data.metadata.redis_session_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Created</span>
                      <span className="text-xs">
                        {new Date(data.metadata.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Updated</span>
                      <span className="text-xs">
                        {new Date(data.metadata.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}