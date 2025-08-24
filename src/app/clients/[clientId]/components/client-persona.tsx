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
  Sparkles
} from 'lucide-react'
import { PersonaService, type ClientPersona } from '@/services/persona-service'

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
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-gray-200">
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
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Persona Data Yet</h3>
        <p className="text-gray-500">Persona will be built as sessions are analyzed</p>
      </div>
    )
  }

  const confidencePercentage = (persona.metadata.confidence_score || 0) * 100

  return (
    <div className="space-y-6">
      {/* Metadata Bar */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Sessions Analyzed</p>
              <p className="text-lg font-semibold text-gray-900">{persona.metadata.sessions_analyzed}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Confidence Score</p>
              <div className="flex items-center gap-2">
                <Progress value={confidencePercentage} className="w-24 h-2" />
                <span className="text-sm font-medium text-gray-700">{confidencePercentage.toFixed(0)}%</span>
              </div>
            </div>
            {persona.metadata.last_updated && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Last Updated</p>
                <p className="text-sm text-gray-700">
                  {new Date(persona.metadata.last_updated).toLocaleDateString()}
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
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {persona.demographics.age_range && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Age Range</p>
                    <p className="text-sm font-medium text-gray-900">{persona.demographics.age_range}</p>
                  </div>
                </div>
              )}
              {persona.demographics.occupation && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Occupation</p>
                    <p className="text-sm font-medium text-gray-900">{persona.demographics.occupation}</p>
                  </div>
                </div>
              )}
              {persona.demographics.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
                    <p className="text-sm font-medium text-gray-900">{persona.demographics.location}</p>
                  </div>
                </div>
              )}
              {persona.demographics.family_situation && (
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Family</p>
                    <p className="text-sm font-medium text-gray-900">{persona.demographics.family_situation}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals & Aspirations */}
      {(persona.goals.primary_goals.length > 0 || 
        persona.goals.short_term_goals.length > 0 || 
        persona.goals.long_term_goals.length > 0) && (
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-600" />
              Goals & Aspirations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {persona.goals.primary_goals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Primary Goals
                </h4>
                <div className="flex flex-wrap gap-2">
                  {persona.goals.primary_goals.map((goal, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {persona.goals.short_term_goals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Short-term Goals (3 months)</h4>
                <ul className="space-y-1">
                  {persona.goals.short_term_goals.map((goal, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {persona.goals.long_term_goals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Long-term Goals (6+ months)</h4>
                <ul className="space-y-1">
                  {persona.goals.long_term_goals.map((goal, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
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
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              Challenges & Growth Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {persona.challenges.main_challenges.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Main Challenges</h4>
                <div className="space-y-2">
                  {persona.challenges.main_challenges.map((challenge, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-sm text-gray-700">{challenge}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {persona.patterns.growth_areas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Growth Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {persona.patterns.growth_areas.map((area, index) => (
                    <Badge key={index} variant="outline" className="border-gray-300 text-gray-600">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {persona.challenges.obstacles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Obstacles</h4>
                <ul className="space-y-1">
                  {persona.challenges.obstacles.map((obstacle, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <Shield className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
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
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Brain className="h-5 w-5 text-gray-600" />
              Personality & Style
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {persona.personality.communication_style && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Communication Style</p>
                    <p className="text-sm font-medium text-gray-900">{persona.personality.communication_style}</p>
                  </div>
                </div>
              )}
              {persona.personality.learning_style && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Learning Style</p>
                    <p className="text-sm font-medium text-gray-900">{persona.personality.learning_style}</p>
                  </div>
                </div>
              )}
            </div>
            {persona.personality.personality_traits.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Personality Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {persona.personality.personality_traits.map((trait, index) => (
                    <Badge key={index} className="bg-gray-100 text-gray-700 border-0">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {persona.personality.values.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  Core Values
                </h4>
                <div className="flex flex-wrap gap-2">
                  {persona.personality.values.map((value, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-50 text-gray-700 border border-gray-200">
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
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              Strengths & Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {persona.patterns.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  Strengths
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {persona.patterns.strengths.map((strength, index) => (
                    <div key={index} className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-sm text-green-800">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {persona.patterns.recurring_themes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recurring Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {persona.patterns.recurring_themes.map((theme, index) => (
                    <Badge key={index} variant="outline" className="border-gray-300 text-gray-600">
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
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-gray-600" />
              Progress & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {persona.progress.achievements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Achievements</h4>
                <div className="space-y-2">
                  {persona.progress.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Award className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {persona.progress.breakthrough_moments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Breakthrough Moments</h4>
                <div className="space-y-2">
                  {persona.progress.breakthrough_moments.map((moment, index) => (
                    <div key={index} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-sm text-purple-800">{moment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}