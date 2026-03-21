'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import {
  ClientPersona,
  clientDashboardAPI,
} from '@/services/client-dashboard-api'
import {
  User,
  Target,
  Brain,
  Heart,
  Sparkles,
  AlertTriangle,
  Trophy,
  MessageCircle,
  BookOpen,
  Lightbulb,
  Briefcase,
  MapPin,
  Users,
  Shield,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Flame,
  Star,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

export default function ClientPersonaPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<ClientPersona | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [noPersona, setNoPersona] = useState(false)
  const [progress, setProgress] = useState<any>(null)
  const [dashboard, setDashboard] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [commitmentStats, setCommitmentStats] = useState<{
    active: number
    completed: number
    total: number
  }>({ active: 0, completed: 0, total: 0 })

  useEffect(() => {
    checkAuth()
    fetchPersona()
    fetchAdditionalData()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
    }
  }

  const fetchPersona = async () => {
    try {
      const response = await clientDashboardAPI.getPersona()

      if ('message' in response) {
        setNoPersona(true)
        setError(response.message)
      } else {
        setPersona(response)
      }
    } catch (err: any) {
      console.error('Persona fetch error:', err)
      if (err.message.includes('authentication')) {
      } else {
        setError(err.message || 'Failed to load persona')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdditionalData = async () => {
    try {
      const [progressData, dashboardData, goalsData, commitmentsData] =
        await Promise.all([
          clientDashboardAPI.getProgress().catch(() => null),
          clientDashboardAPI.getDashboard().catch(() => null),
          clientDashboardAPI.getGoals().catch(() => []),
          clientDashboardAPI.getClientCommitments().catch(() => []),
        ])
      setProgress(progressData)
      setDashboard(dashboardData)
      setGoals(goalsData)

      // Calculate commitment stats
      if (Array.isArray(commitmentsData)) {
        const active = commitmentsData.filter(
          (c: any) => c.status === 'active' || c.status === 'in_progress',
        ).length
        const completed = commitmentsData.filter(
          (c: any) => c.status === 'completed',
        ).length
        setCommitmentStats({ active, completed, total: commitmentsData.length })
      }
    } catch (err) {
      console.error('Additional data fetch error:', err)
    }
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High'
    if (score >= 0.5) return 'Moderate'
    return 'Building'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  if (noPersona || !persona) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-16 px-8">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
              <Brain className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
              Your Coaching Persona is Being Developed
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 max-w-md mb-8">
              {error ||
                'Your personalized coaching profile will be available after a few sessions with your coach. This helps us provide better, more tailored coaching suggestions.'}
            </p>
            <Button onClick={() => router.push('/client-portal/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const confidence = getConfidenceLabel(persona.metadata.confidence_score)

  // Check if sections have data
  const hasBasicInfo =
    persona.basic_info.age_range ||
    persona.basic_info.occupation ||
    persona.basic_info.location ||
    persona.basic_info.family_situation
  const hasPrimaryGoals = persona.goals.primary.length > 0
  const hasShortTermGoals = persona.goals.short_term.length > 0
  const hasLongTermGoals = persona.goals.long_term.length > 0
  const hasStrengths = persona.development.strengths.length > 0
  const hasGrowthAreas = persona.development.growth_areas.length > 0
  const hasChallenges = persona.challenges.main_challenges.length > 0
  const hasObstacles =
    persona.challenges.obstacles.length > 0 ||
    persona.challenges.fears.length > 0
  const hasTraits = persona.personality.traits.length > 0
  const hasValues = persona.personality.values.length > 0
  const hasStyles =
    persona.personality.communication_style ||
    persona.personality.learning_style
  const hasAchievements = persona.development.achievements.length > 0
  const hasThemes = persona.development.recurring_themes.length > 0
  const hasTriggers = (persona.development.triggers?.length ?? 0) > 0
  const hasBreakthroughMoments =
    (persona.development.breakthrough_moments?.length ?? 0) > 0
  const hasProgress =
    progress &&
    (progress.timeline?.length > 0 || progress.milestones?.length > 0)
  const activeGoals = goals.filter((g: any) => g.status === 'active')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-2">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
            AI-Generated Profile
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Coaching Persona
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Based on your coaching journey and sessions
          </p>
        </div>

        <div className="flex items-center gap-6 md:gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {persona.metadata.sessions_analyzed}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {confidence}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Confidence
            </p>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <p className="text-sm text-gray-900 dark:text-white">
              {persona.metadata.last_updated
                ? formatDate(persona.metadata.last_updated, 'MMM d')
                : '-'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Updated</p>
          </div>
          {dashboard?.stats?.current_streak_days > 0 && (
            <>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5 text-orange-500" />
                  {Math.floor(dashboard.stats.current_streak_days / 7) > 0
                    ? `${Math.floor(dashboard.stats.current_streak_days / 7)}w`
                    : `${dashboard.stats.current_streak_days}d`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Streak
                </p>
              </div>
            </>
          )}
          {dashboard?.stats?.total_sessions > 0 && (
            <>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboard.stats.total_sessions}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Your Journey */}
      {hasProgress && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Journey
            </h2>
          </div>
          <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="p-5 space-y-5">
              {/* Overall Trend */}
              {progress.overall_trend && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Overall Trend:
                  </span>
                  <Badge
                    className={`${
                      progress.overall_trend === 'improving'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : progress.overall_trend === 'declining'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {progress.overall_trend === 'improving' && (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    )}
                    {progress.overall_trend === 'declining' && (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {progress.overall_trend === 'stable' && (
                      <Minus className="h-3 w-3 mr-1" />
                    )}
                    {progress.overall_trend.charAt(0).toUpperCase() +
                      progress.overall_trend.slice(1)}
                  </Badge>
                </div>
              )}

              {/* Milestones */}
              {progress.milestones && progress.milestones.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    Milestones
                  </p>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {progress.milestones.map((milestone: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 flex-shrink-0"
                      >
                        {idx > 0 && (
                          <div className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
                        )}
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5">
                          <div className="h-2 w-2 rounded-full bg-gray-900 dark:bg-white" />
                          <span className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {milestone.type === 'first_session'
                              ? 'First Session'
                              : `${milestone.count} Sessions`}
                            {milestone.date &&
                              ` - ${formatDate(milestone.date, 'MMM d')}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagement Dots */}
              {progress.timeline && progress.timeline.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    Session Engagement
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {progress.timeline.map((entry: any, idx: number) => (
                      <div
                        key={idx}
                        className={`h-3 w-3 rounded-full ${
                          entry.sentiment === 'positive' ||
                          entry.engagement_score > 7
                            ? 'bg-green-500 dark:bg-green-400'
                            : entry.sentiment === 'negative' ||
                                entry.engagement_score < 4
                              ? 'bg-amber-500 dark:bg-amber-400'
                              : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        title={`${formatDate(entry.date, 'MMM d')} - ${entry.sentiment || 'neutral'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Last 90 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Basic Info */}
      {hasBasicInfo && (
        <div className="flex flex-wrap gap-3">
          {persona.basic_info.occupation && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2">
              <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {persona.basic_info.occupation}
              </span>
            </div>
          )}
          {persona.basic_info.location && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2">
              <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {persona.basic_info.location}
              </span>
            </div>
          )}
          {persona.basic_info.age_range && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2">
              <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {persona.basic_info.age_range}
              </span>
            </div>
          )}
          {persona.basic_info.family_situation && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2">
              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {persona.basic_info.family_situation}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Vision Section */}
      {(hasPrimaryGoals || hasShortTermGoals || hasLongTermGoals) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasPrimaryGoals && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Primary Vision
                  </h3>
                  <div className="space-y-3">
                    {persona.goals.primary.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {idx + 1}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {goal}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasShortTermGoals && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Short-term
                  </h3>
                  <div className="space-y-2">
                    {persona.goals.short_term.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {goal}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasLongTermGoals && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Long-term Vision
                  </h3>
                  <div className="space-y-2">
                    {persona.goals.long_term.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {goal}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Goals & Commitments Overview */}
      {(activeGoals.length > 0 || commitmentStats.total > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Goals & Commitments
              </h2>
            </div>
            <Link href="/client-portal/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
              >
                View full board
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    Active Goals
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs ml-auto"
                    >
                      {activeGoals.length}
                    </Badge>
                  </h3>
                  <div className="space-y-3">
                    {activeGoals.slice(0, 4).map((goal: any) => (
                      <div key={goal.id}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                            {goal.title}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {goal.progress}%
                          </span>
                        </div>
                        <Progress value={goal.progress} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {commitmentStats.total > 0 && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    Commitments
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {commitmentStats.active} active
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      {commitmentStats.completed} completed
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    >
                      {commitmentStats.total} total
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Strengths & Growth */}
      {(hasStrengths || hasGrowthAreas) && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hasStrengths && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Your Strengths
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {persona.development.strengths.map((strength, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasGrowthAreas && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Growth Opportunities
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {persona.development.growth_areas.map((area, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {area}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Behavioral Insights */}
      {hasTriggers && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Patterns to Watch
            </h2>
          </div>
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-5">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Self-awareness insights from your coaching sessions
              </p>
              <div className="space-y-2">
                {persona.development.triggers.map((trigger, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {trigger}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Challenges & Obstacles */}
      {(hasChallenges || hasObstacles) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Challenges to Overcome
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasChallenges && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Current Challenges
                  </h3>
                  <div className="space-y-2">
                    {persona.challenges.main_challenges.map(
                      (challenge, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 flex-shrink-0" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {challenge}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasObstacles && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  {persona.challenges.obstacles.length > 0 && (
                    <div
                      className={
                        persona.challenges.fears.length > 0 ? 'mb-4' : ''
                      }
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        Obstacles
                      </h3>
                      <div className="space-y-2">
                        {persona.challenges.obstacles.map((obstacle, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-gray-600 dark:text-gray-400 pl-6"
                          >
                            {obstacle}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {persona.challenges.fears.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        Concerns
                      </h3>
                      <div className="space-y-2">
                        {persona.challenges.fears.map((fear, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-gray-600 dark:text-gray-400 pl-6"
                          >
                            {fear}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Personality & Communication */}
      {(hasTraits || hasValues || hasStyles) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Personality & Style
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasStyles && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Style
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {persona.personality.communication_style && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Communication
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          {persona.personality.communication_style}
                        </Badge>
                      </div>
                    )}
                    {persona.personality.learning_style && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Learning
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          {persona.personality.learning_style}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasTraits && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Traits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {persona.personality.traits.map((trait, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasValues && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Core Values
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {persona.personality.values.map((value, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Achievements & Themes */}
      {(hasAchievements || hasBreakthroughMoments || hasThemes) && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hasAchievements && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Achievements & Breakthroughs
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {persona.development.achievements.map(
                      (achievement, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Trophy className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {achievement}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasBreakthroughMoments && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Breakthrough Moments
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {persona.development.breakthrough_moments.map(
                      (moment, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Sparkles className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {moment}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasThemes && (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Recurring Themes
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {persona.development.recurring_themes.map((theme, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
