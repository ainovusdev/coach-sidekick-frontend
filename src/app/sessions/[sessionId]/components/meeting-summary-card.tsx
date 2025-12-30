import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Clock,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Brain,
  RefreshCw,
  Zap,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { getScoreGradient } from '../utils/session-utils'

interface MeetingSummaryCardProps {
  meetingSummary: any
  sessionStatus: string
  generatingSummary: boolean
  onGenerateSummary: () => void
}

export default function MeetingSummaryCard({
  meetingSummary,
  sessionStatus,
  generatingSummary,
  onGenerateSummary,
}: MeetingSummaryCardProps) {
  const canGenerateSummary =
    sessionStatus === 'completed' || sessionStatus === 'call_ended'

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-gray-900 rounded-lg text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-gray-900 font-bold">Meeting Summary</span>
          </CardTitle>
          {canGenerateSummary && (
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerateSummary}
              disabled={generatingSummary}
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 transition-colors"
            >
              {generatingSummary ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {meetingSummary ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        {!meetingSummary ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Brain className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-base font-medium text-gray-400 mb-2">
              No summary available yet
            </p>
            <p className="text-sm text-gray-400">
              Click &quot;Generate Summary&quot; to create insights for this
              session
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {meetingSummary.duration_minutes && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border border-purple-200/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">
                      Duration
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {meetingSummary.duration_minutes} min
                  </span>
                </div>
              )}
              {meetingSummary.final_overall_score && (
                <div
                  className={`bg-gradient-to-br ${getScoreGradient(
                    meetingSummary.final_overall_score,
                  )} p-3 rounded-xl text-white`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Score</span>
                  </div>
                  <span className="text-lg font-bold">
                    {meetingSummary.final_overall_score}/10
                  </span>
                </div>
              )}
              {meetingSummary.total_transcript_entries && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/50">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">
                      Messages
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {meetingSummary.total_transcript_entries}
                  </span>
                </div>
              )}
              {meetingSummary.total_coaching_suggestions && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 border border-amber-200/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-600">
                      Suggestions
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {meetingSummary.total_coaching_suggestions}
                  </span>
                </div>
              )}
            </div>

            {meetingSummary.meeting_summary && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Overview
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {meetingSummary.meeting_summary}
                </p>
              </div>
            )}

            {meetingSummary.key_insights &&
              meetingSummary.key_insights.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Key Insights
                  </h4>
                  <ul className="space-y-2">
                    {meetingSummary.key_insights.map(
                      (insight: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 flex items-start gap-3 bg-amber-50/50 rounded-lg p-2.5 border border-amber-100"
                        >
                          <ChevronRight className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">{insight}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

            {meetingSummary.action_items &&
              meetingSummary.action_items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Commitments
                  </h4>
                  <ul className="space-y-2">
                    {meetingSummary.action_items.map(
                      (item: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 flex items-start gap-3 bg-green-50/50 rounded-lg p-2.5 border border-green-100 hover:border-green-200 transition-colors duration-200"
                        >
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
