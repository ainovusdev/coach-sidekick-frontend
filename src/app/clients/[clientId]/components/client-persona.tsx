'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Target,
  AlertCircle,
  Brain,
  TrendingUp,
  Award,
  MapPin,
  Briefcase,
  Users,
  Calendar,
  MessageSquare,
  BookOpen,
  Heart,
  Zap,
  Shield,
  Sparkles,
} from 'lucide-react'
import { PersonaService, type ClientPersona } from '@/services/persona-service'
import { formatDate } from '@/lib/date-utils'

interface ClientPersonaProps {
  clientId: string
}

export function ClientPersonaDisplay({ clientId }: ClientPersonaProps) {
  const [persona, setPersona] = useState<ClientPersona | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPersona = async () => {
      setLoading(true)
      try {
        const data = await PersonaService.getClientPersona(clientId)
        setPersona(data)
      } catch (error) {
        console.error('Failed to fetch persona:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPersona()
  }, [clientId])

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-line">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!persona) {
    return (
      <div className="text-center py-12">
        <Brain className="h-12 w-12 text-ink-4 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-ink mb-2">
          No Persona Data Yet
        </h3>
        <p className="text-ink-3">
          Persona will be built as sessions are analyzed
        </p>
      </div>
    )
  }

  const confidencePercentage = (persona.metadata.confidence_score || 0) * 100

  return (
    <div className="space-y-6">
      {/* Metadata Bar */}
      <div className="bg-paper rounded-lg p-4 border border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-ink-3 uppercase tracking-wider">
                Sessions Analyzed
              </p>
              <p className="text-lg font-semibold text-ink">
                {persona.metadata.sessions_analyzed}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-3 uppercase tracking-wider">
                Confidence Score
              </p>
              <div className="flex items-center gap-2">
                <Progress value={confidencePercentage} className="w-24 h-2" />
                <span className="text-sm font-medium text-ink-2">
                  {confidencePercentage.toFixed(0)}%
                </span>
              </div>
            </div>
            {persona.metadata.last_updated && (
              <div>
                <p className="text-xs text-ink-3 uppercase tracking-wider">
                  Last Updated
                </p>
                <p className="text-sm text-ink-2">
                  {formatDate(persona.metadata.last_updated)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Overview */}
      {(persona.demographics.age_range ||
        persona.demographics.occupation ||
        persona.demographics.location ||
        persona.demographics.family_situation) && (
        <Card className="border-line shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className=" border-b border-line">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <User className="h-5 w-5 text-ink-3" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {persona.demographics.age_range && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-ink-4 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-3 uppercase tracking-wider">
                      Age Range
                    </p>
                    <p className="text-sm font-medium text-ink">
                      {persona.demographics.age_range}
                    </p>
                  </div>
                </div>
              )}
              {persona.demographics.occupation && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-ink-4 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-3 uppercase tracking-wider">
                      Occupation
                    </p>
                    <p className="text-sm font-medium text-ink">
                      {persona.demographics.occupation}
                    </p>
                  </div>
                </div>
              )}
              {persona.demographics.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-ink-4 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-3 uppercase tracking-wider">
                      Location
                    </p>
                    <p className="text-sm font-medium text-ink">
                      {persona.demographics.location}
                    </p>
                  </div>
                </div>
              )}
              {persona.demographics.family_situation && (
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-ink-4 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-3 uppercase tracking-wider">
                      Family
                    </p>
                    <p className="text-sm font-medium text-ink">
                      {persona.demographics.family_situation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vision & Aspirations */}
      {(persona.goals.primary_goals.length > 0 ||
        persona.goals.short_term_goals.length > 0 ||
        persona.goals.long_term_goals.length > 0) && (
        <Card className="border-line shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className=" border-b border-line">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <Target className="h-5 w-5 text-ink-3" />
              Vision & Aspirations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {persona.goals.primary_goals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Primary Vision
                </h4>
                <div className="flex flex-wrap gap-2">
                  {persona.goals.primary_goals.map((goal, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-surface-3 text-ink-2"
                    >
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {persona.goals.short_term_goals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2">
                  Short-term Meta Performance Outcomes (3 months)
                </h4>
                <ul className="space-y-1">
                  {persona.goals.short_term_goals.map((goal, index) => (
                    <li
                      key={index}
                      className="text-sm text-ink-3 flex items-start gap-2"
                    >
                      <span className="text-ink-4 mt-0.5">•</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {persona.goals.long_term_goals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2">
                  Long-term Meta Performance Outcomes (6+ months)
                </h4>
                <ul className="space-y-1">
                  {persona.goals.long_term_goals.map((goal, index) => (
                    <li
                      key={index}
                      className="text-sm text-ink-3 flex items-start gap-2"
                    >
                      <span className="text-ink-4 mt-0.5">•</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Challenges & Growth Areas */}
      {(persona.challenges.main_challenges.length > 0 ||
        persona.challenges.obstacles.length > 0 ||
        persona.patterns.growth_areas.length > 0) && (
        <Card className="border-line shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className=" border-b border-line">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-ink-3" />
              Challenges & Growth Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {persona.challenges.main_challenges.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2">
                  Main Challenges
                </h4>
                <div className="space-y-2">
                  {persona.challenges.main_challenges.map(
                    (challenge, index) => (
                      <div
                        key={index}
                        className="bg-paper rounded-lg p-3 border border-line"
                      >
                        <p className="text-sm text-ink-2">{challenge}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {persona.patterns.growth_areas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2">
                  Growth Areas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {persona.patterns.growth_areas.map((area, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-line-strong text-ink-3"
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {persona.challenges.obstacles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2">
                  Obstacles
                </h4>
                <ul className="space-y-1">
                  {persona.challenges.obstacles.map((obstacle, index) => (
                    <li
                      key={index}
                      className="text-sm text-ink-3 flex items-start gap-2"
                    >
                      <Shield className="h-3.5 w-3.5 text-ink-4 mt-0.5" />
                      <span>{obstacle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personality & Communication */}
      {(persona.personality.communication_style ||
        persona.personality.learning_style ||
        persona.personality.personality_traits.length > 0 ||
        persona.personality.values.length > 0) && (
        <Card className="border-line shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className=" border-b border-line">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <Brain className="h-5 w-5 text-ink-3" />
              Personality & Style
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {persona.personality.communication_style && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 text-ink-4 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-3 uppercase tracking-wider">
                      Communication Style
                    </p>
                    <p className="text-sm font-medium text-ink">
                      {persona.personality.communication_style}
                    </p>
                  </div>
                </div>
              )}
              {persona.personality.learning_style && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 text-ink-4 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-3 uppercase tracking-wider">
                      Learning Style
                    </p>
                    <p className="text-sm font-medium text-ink">
                      {persona.personality.learning_style}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {persona.personality.personality_traits.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2">
                  Personality Traits
                </h4>
                <div className="flex flex-wrap gap-2">
                  {persona.personality.personality_traits.map(
                    (trait, index) => (
                      <Badge
                        key={index}
                        className="bg-surface-3 text-ink-2 border-0"
                      >
                        {trait}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            )}
            {persona.personality.values.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2 flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  Core Values
                </h4>
                <div className="flex flex-wrap gap-2">
                  {persona.personality.values.map((value, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-paper text-ink-2 border border-line"
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Strengths & Patterns */}
      {(persona.patterns.strengths.length > 0 ||
        persona.patterns.recurring_themes.length > 0) && (
        <Card className="border-line shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className=" border-b border-line">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-ink-3" />
              Strengths & Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {persona.patterns.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  Strengths
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {persona.patterns.strengths.map((strength, index) => (
                    <div
                      key={index}
                      className="bg-paper rounded-lg p-3 border border-line"
                    >
                      <p className="text-sm text-ink-2">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {persona.patterns.recurring_themes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2">
                  Recurring Themes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {persona.patterns.recurring_themes.map((theme, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-line-strong text-ink-3"
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress & Achievements */}
      {(persona.progress.achievements.length > 0 ||
        persona.progress.breakthrough_moments.length > 0) && (
        <Card className="border-line shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className=" border-b border-line">
            <CardTitle className="text-base font-semibold text-ink flex items-center gap-2">
              <Award className="h-5 w-5 text-ink-3" />
              Progress & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {persona.progress.achievements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2">
                  Achievements
                </h4>
                <div className="space-y-2">
                  {persona.progress.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Award className="h-4 w-4 text-ink-3 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-ink-2">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {persona.progress.breakthrough_moments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-2 mb-2">
                  Breakthrough Moments
                </h4>
                <div className="space-y-2">
                  {persona.progress.breakthrough_moments.map(
                    (moment, index) => (
                      <div
                        key={index}
                        className="bg-ink rounded-lg p-3 text-ink-on-dark "
                      >
                        <p className="text-sm">{moment}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
