import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Target,
  Activity,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { getScoreColor, getScoreGradient } from '../utils/session-utils'

interface CoachingAnalysisCardProps {
  analysis: {
    overall_score: number | null
    conversation_phase: string | null
    key_suggestions: string[] | null
    improvement_areas: string[] | null
    positive_feedback: string[] | null
  }
}

export default function CoachingAnalysisCard({ analysis }: CoachingAnalysisCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-gray-900 rounded-lg text-white">
            <Target className="h-5 w-5" />
          </div>
          <span className="text-gray-900 font-bold">
            Coaching Analysis
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        {analysis.overall_score && (
          <div className="text-center py-4">
            <div className="relative inline-flex items-center justify-center">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getScoreGradient(
                  analysis.overall_score,
                )} rounded-full blur-xl opacity-30 animate-pulse`}
              />
              <div
                className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getScoreGradient(
                  analysis.overall_score,
                )} p-1`}
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <div
                    className={`text-3xl font-bold ${getScoreColor(
                      analysis.overall_score,
                    )}`}
                  >
                    {analysis.overall_score}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">
              Overall Score
            </p>
            <Progress
              value={analysis.overall_score * 10}
              className="h-2 mt-2"
            />
          </div>
        )}

        {analysis.conversation_phase && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200/50">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              Conversation Phase
            </h4>
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-3 py-1 shadow-md">
              {analysis.conversation_phase}
            </Badge>
          </div>
        )}

        {analysis.positive_feedback &&
          analysis.positive_feedback.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                Strengths
              </h4>
              <ul className="space-y-2">
                {analysis.positive_feedback.map(
                  (feedback, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start gap-3 bg-white rounded-lg p-2.5 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <span className="text-gray-900 font-bold text-lg leading-4">
                        •
                      </span>
                      <span className="leading-relaxed">
                        {feedback}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

        {analysis.improvement_areas &&
          analysis.improvement_areas.length > 0 && (
            <div>
              <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                Areas for Improvement
              </h4>
              <ul className="space-y-2">
                {analysis.improvement_areas.map(
                  (area, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-start gap-3 bg-gray-50 rounded-lg p-2.5 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <span className="text-gray-500 text-lg leading-4">
                        →
                      </span>
                      <span className="leading-relaxed">{area}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

        {analysis.key_suggestions &&
          analysis.key_suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                Suggestions
              </h4>
              <ul className="space-y-2">
                {analysis.key_suggestions.map(
                  (suggestion, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start gap-3 bg-blue-50/50 rounded-lg p-2.5 border border-blue-100 hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
                    >
                      <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">
                        {suggestion}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
      </CardContent>
    </Card>
  )
}