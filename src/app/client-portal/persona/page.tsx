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
} from 'lucide-react'
import { format } from 'date-fns'

export default function ClientPersonaPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<ClientPersona | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [noPersona, setNoPersona] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchPersona()
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
        <Card className="border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16 px-8">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <Brain className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 text-center">
              Your Coaching Persona is Being Developed
            </h2>
            <p className="text-center text-gray-600 max-w-md mb-8">
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-2">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">
            AI-Generated Profile
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            Your Coaching Persona
          </h1>
          <p className="text-gray-500 mt-1">
            Based on your coaching journey and sessions
          </p>
        </div>

        <div className="flex items-center gap-6 md:gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {persona.metadata.sessions_analyzed}
            </p>
            <p className="text-xs text-gray-500">Sessions</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{confidence}</p>
            <p className="text-xs text-gray-500">Confidence</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-sm text-gray-900">
              {persona.metadata.last_updated
                ? format(new Date(persona.metadata.last_updated), 'MMM d')
                : '-'}
            </p>
            <p className="text-xs text-gray-500">Updated</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      {hasBasicInfo && (
        <div className="flex flex-wrap gap-3">
          {persona.basic_info.occupation && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {persona.basic_info.occupation}
              </span>
            </div>
          )}
          {persona.basic_info.location && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {persona.basic_info.location}
              </span>
            </div>
          )}
          {persona.basic_info.age_range && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {persona.basic_info.age_range}
              </span>
            </div>
          )}
          {persona.basic_info.family_situation && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
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
            <Target className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Vision</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasPrimaryGoals && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Primary Vision
                  </h3>
                  <div className="space-y-3">
                    {persona.goals.primary.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-gray-600">
                            {idx + 1}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{goal}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasShortTermGoals && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 mb-3">Short-term</h3>
                  <div className="space-y-2">
                    {persona.goals.short_term.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{goal}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasLongTermGoals && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Long-term Vision
                  </h3>
                  <div className="space-y-2">
                    {persona.goals.long_term.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{goal}</p>
                      </div>
                    ))}
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
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      Your Strengths
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {persona.development.strengths.map((strength, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700"
                      >
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasGrowthAreas && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      Growth Opportunities
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {persona.development.growth_areas.map((area, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{area}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Challenges & Obstacles */}
      {(hasChallenges || hasObstacles) && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Challenges to Overcome
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasChallenges && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Current Challenges
                  </h3>
                  <div className="space-y-2">
                    {persona.challenges.main_challenges.map(
                      (challenge, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{challenge}</p>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasObstacles && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  {persona.challenges.obstacles.length > 0 && (
                    <div
                      className={
                        persona.challenges.fears.length > 0 ? 'mb-4' : ''
                      }
                    >
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        Obstacles
                      </h3>
                      <div className="space-y-2">
                        {persona.challenges.obstacles.map((obstacle, idx) => (
                          <p key={idx} className="text-sm text-gray-600 pl-6">
                            {obstacle}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {persona.challenges.fears.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        Concerns
                      </h3>
                      <div className="space-y-2">
                        {persona.challenges.fears.map((fear, idx) => (
                          <p key={idx} className="text-sm text-gray-600 pl-6">
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
            <Brain className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Personality & Style
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasStyles && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="h-4 w-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Style</h3>
                  </div>
                  <div className="space-y-3">
                    {persona.personality.communication_style && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Communication
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-700"
                        >
                          {persona.personality.communication_style}
                        </Badge>
                      </div>
                    )}
                    {persona.personality.learning_style && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Learning
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-700"
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
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <h3 className="font-medium text-gray-900 mb-3">Traits</h3>
                  <div className="flex flex-wrap gap-2">
                    {persona.personality.traits.map((trait, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasValues && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Core Values</h3>
                  </div>
                  <div className="space-y-2">
                    {persona.personality.values.map((value, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        <span className="text-sm text-gray-600">{value}</span>
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
      {(hasAchievements || hasThemes) && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hasAchievements && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      Achievements & Breakthroughs
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {persona.development.achievements.map(
                      (achievement, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Trophy className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{achievement}</p>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {hasThemes && (
              <Card className="border-gray-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      Recurring Themes
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {persona.development.recurring_themes.map((theme, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-gray-100 text-gray-700"
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
