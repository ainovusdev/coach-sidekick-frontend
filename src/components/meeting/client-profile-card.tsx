'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  User,
  Target,
  MessageSquare,
  Brain,
  TrendingUp,
  Award,
  AlertCircle,
  Sparkles
} from 'lucide-react'

interface ClientProfile {
  client_id: string
  personality_traits?: string[]
  communication_style?: string
  learning_style?: string
  primary_goals?: string[]
  short_term_goals?: string[]
  long_term_goals?: string[]
  main_challenges?: string[]
  obstacles?: string[]
  values?: string[]
  strengths?: string[]
  growth_areas?: string[]
  recurring_themes?: string[]
  breakthrough_moments?: string[]
  achievements?: string[]
  sessions_analyzed?: number
  last_updated?: string
}

interface ClientProfileCardProps {
  profile: ClientProfile | null
  insights?: {
    client_journey?: string
    key_patterns?: string[]
    suggested_focus?: string[]
    breakthrough_potential?: string
  }
  compact?: boolean
}

export function ClientProfileCard({ profile, insights, compact = false }: ClientProfileCardProps) {
  if (!profile) {
    return (
      <Card className={compact ? "h-auto" : "h-full"}>
        <CardHeader className={compact ? "pb-2 py-2" : "pb-3"}>
          <h3 className={compact ? "text-xs font-medium flex items-center gap-1" : "text-sm font-medium flex items-center gap-2"}>
            <User className={compact ? "h-3 w-3 text-gray-500" : "h-4 w-4 text-gray-500"} />
            Client Profile
          </h3>
        </CardHeader>
        <CardContent className={compact ? "pt-0" : ""}>
          <p className="text-xs text-gray-500">
            {compact ? "No profile yet" : "No client profile available yet. Profile will be built as sessions progress."}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getJourneyProgress = () => {
    const sessions = profile.sessions_analyzed || 0
    if (sessions < 3) return 20
    if (sessions < 10) return 50
    return Math.min(80 + (sessions - 10) * 2, 100)
  }

  const getBreakthroughColor = (potential: string) => {
    if (potential?.includes('High')) return 'text-green-600 bg-green-50'
    if (potential?.includes('Emerging')) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <Card className={compact ? "h-auto" : "h-full overflow-hidden"}>
      <CardHeader className={compact ? "pb-2 py-2" : "pb-3"}>
        <div className="flex items-center justify-between">
          <h3 className={compact ? "text-xs font-medium flex items-center gap-1" : "text-sm font-medium flex items-center gap-2"}>
            <User className={compact ? "h-3 w-3 text-gray-500" : "h-4 w-4 text-gray-500"} />
            Client Profile
          </h3>
          {profile.sessions_analyzed && !compact && (
            <Badge variant="outline" className="text-xs">
              {profile.sessions_analyzed} sessions
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-2 pt-0" : "space-y-4 overflow-y-auto max-h-[600px]"}>
        {/* Journey Progress */}
        {insights?.client_journey && !compact && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Journey Stage</span>
              <span className="text-xs text-gray-500">{getJourneyProgress()}%</span>
            </div>
            <Progress value={getJourneyProgress()} className="h-1.5" />
            <p className="text-xs text-gray-600">{insights.client_journey}</p>
          </div>
        )}

        {/* Communication & Learning Style */}
        <div className="grid grid-cols-2 gap-2">
          {profile.communication_style && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-gray-400" />
                <span className="text-xs font-medium text-gray-700">Communication</span>
              </div>
              <Badge variant="outline" className="text-xs w-full justify-center">
                {profile.communication_style}
              </Badge>
            </div>
          )}
          {profile.learning_style && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Brain className="h-3 w-3 text-gray-400" />
                <span className="text-xs font-medium text-gray-700">Learning</span>
              </div>
              <Badge variant="outline" className="text-xs w-full justify-center">
                {profile.learning_style}
              </Badge>
            </div>
          )}
        </div>

        {/* Goals Section */}
        {(profile.primary_goals?.length > 0 || 
          profile.short_term_goals?.length > 0 || 
          profile.long_term_goals?.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-green-500" />
              <span className="text-xs font-medium text-gray-700">Goals</span>
            </div>
            <div className="space-y-1">
              {profile.primary_goals?.slice(0, 2).map((goal, i) => (
                <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{goal}</span>
                </div>
              ))}
              {profile.short_term_goals?.slice(0, 1).map((goal, i) => (
                <div key={`st-${i}`} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{goal} <span className="text-gray-400">(short-term)</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges Section */}
        {(profile.main_challenges?.length > 0 || profile.obstacles?.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-medium text-gray-700">Current Challenges</span>
            </div>
            <div className="space-y-1">
              {[...(profile.main_challenges || []), ...(profile.obstacles || [])]
                .slice(0, 3)
                .map((challenge, i) => (
                  <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{challenge}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {profile.strengths?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3 text-purple-500" />
              <span className="text-xs font-medium text-gray-700">Strengths</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.strengths.slice(0, 4).map((strength, i) => (
                <Badge key={i} className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Growth Areas */}
        {(profile.growth_areas?.length > 0 || insights?.suggested_focus?.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium text-gray-700">Focus Areas</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(insights?.suggested_focus || profile.growth_areas || []).slice(0, 3).map((area, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Breakthrough Potential */}
        {insights?.breakthrough_potential && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium text-gray-700">Breakthrough Potential</span>
            </div>
            <Badge className={`text-xs ${getBreakthroughColor(insights.breakthrough_potential)}`}>
              {insights.breakthrough_potential}
            </Badge>
          </div>
        )}

        {/* Recurring Themes */}
        {profile.recurring_themes?.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-gray-700">Recurring Themes</span>
            <div className="flex flex-wrap gap-1">
              {profile.recurring_themes.slice(0, 5).map((theme, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {profile.achievements?.length > 0 && (
          <div className="space-y-2 border-t pt-2">
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3 text-gold-500" />
              <span className="text-xs font-medium text-gray-700">Recent Achievements</span>
            </div>
            <div className="space-y-1">
              {profile.achievements.slice(0, 2).map((achievement, i) => (
                <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-yellow-500">★</span>
                  <span>{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}