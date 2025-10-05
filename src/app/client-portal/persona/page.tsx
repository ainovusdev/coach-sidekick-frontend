'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ClientPersona,
  clientDashboardAPI,
} from '@/services/client-dashboard-api'
import {
  User,
  Target,
  Brain,
  Heart,
  Shield,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Trophy,
  MessageCircle,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Info,
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
    const token = localStorage.getItem('client_auth_token')
    if (!token) {
      router.push('/client-portal/auth/login')
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
        router.push('/client-portal/auth/login')
      } else {
        setError(err.message || 'Failed to load persona')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8)
      return { label: 'High Confidence', color: 'text-green-600 bg-green-50' }
    if (score >= 0.5)
      return {
        label: 'Moderate Confidence',
        color: 'text-yellow-600 bg-yellow-50',
      }
    return { label: 'Building Profile', color: 'text-blue-600 bg-blue-50' }
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Brain className="h-16 w-16 text-gray-300 mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your Coaching Persona is Being Developed
            </h2>
            <p className="text-center text-gray-600 max-w-md mb-6">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          Your Coaching Persona
        </h1>
        <p className="text-muted-foreground mt-2">
          Your personalized coaching profile based on your sessions and
          interactions
        </p>
      </div>

      {/* Metadata Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className={confidence.color}>{confidence.label}</Badge>
                <Badge variant="secondary">
                  {persona.metadata.sessions_analyzed} sessions analyzed
                </Badge>
              </div>
              <Progress
                value={persona.metadata.confidence_score * 100}
                className="w-64"
              />
              <p className="text-xs text-gray-600">
                Last updated:{' '}
                {persona.metadata.last_updated
                  ? format(
                      new Date(persona.metadata.last_updated),
                      'MMMM d, yyyy',
                    )
                  : 'Never'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4" />
                <span>AI-Generated Profile</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals & Aspirations</TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Basic Info */}
          {(persona.basic_info.age_range ||
            persona.basic_info.occupation ||
            persona.basic_info.location ||
            persona.basic_info.family_situation) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {persona.basic_info.age_range && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Age Range
                      </p>
                      <p className="text-sm">{persona.basic_info.age_range}</p>
                    </div>
                  )}
                  {persona.basic_info.occupation && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Occupation
                      </p>
                      <p className="text-sm">{persona.basic_info.occupation}</p>
                    </div>
                  )}
                  {persona.basic_info.location && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Location
                      </p>
                      <p className="text-sm">{persona.basic_info.location}</p>
                    </div>
                  )}
                  {persona.basic_info.family_situation && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Family Situation
                      </p>
                      <p className="text-sm">
                        {persona.basic_info.family_situation}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Challenges */}
          {persona.challenges.main_challenges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Current Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {persona.challenges.main_challenges.map((challenge, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-orange-400 mt-0.5" />
                      <p className="text-sm">{challenge}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths */}
          {persona.development.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {persona.development.strengths.map((strength, idx) => (
                    <Badge key={idx} className="bg-green-100 text-green-800">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {/* Primary Goals */}
          {persona.goals.primary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Primary Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {persona.goals.primary.map((goal, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-purple-600">
                          {idx + 1}
                        </span>
                      </div>
                      <p className="text-sm">{goal}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Short-term Goals */}
          {persona.goals.short_term.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Short-term Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {persona.goals.short_term.map((goal, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-400 mt-0.5" />
                      <p className="text-sm">{goal}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Long-term Goals */}
          {persona.goals.long_term.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Long-term Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {persona.goals.long_term.map((goal, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-yellow-400 mt-0.5" />
                      <p className="text-sm">{goal}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Obstacles & Fears */}
          {(persona.challenges.obstacles.length > 0 ||
            persona.challenges.fears.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Obstacles & Concerns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {persona.challenges.obstacles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Obstacles
                    </p>
                    <div className="space-y-1">
                      {persona.challenges.obstacles.map((obstacle, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          • {obstacle}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {persona.challenges.fears.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Concerns
                    </p>
                    <div className="space-y-1">
                      {persona.challenges.fears.map((fear, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          • {fear}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="personality" className="space-y-4">
          {/* Communication & Learning Styles */}
          {(persona.personality.communication_style ||
            persona.personality.learning_style) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-indigo-600" />
                  Communication & Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {persona.personality.communication_style && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Communication Style
                      </p>
                      <Badge className="bg-indigo-100 text-indigo-800">
                        {persona.personality.communication_style}
                      </Badge>
                    </div>
                  )}
                  {persona.personality.learning_style && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Learning Style
                      </p>
                      <Badge className="bg-blue-100 text-blue-800">
                        {persona.personality.learning_style}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personality Traits */}
          {persona.personality.traits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Personality Traits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {persona.personality.traits.map((trait, idx) => (
                    <Badge key={idx} variant="secondary">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Values */}
          {persona.personality.values.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  Core Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {persona.personality.values.map((value, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Heart className="h-3 w-3 text-pink-400" />
                      <p className="text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          {/* Growth Areas */}
          {persona.development.growth_areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {persona.development.growth_areas.map((area, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-yellow-400 mt-0.5" />
                      <p className="text-sm">{area}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recurring Themes */}
          {persona.development.recurring_themes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Recurring Themes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {persona.development.recurring_themes.map((theme, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-800">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {persona.development.achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Achievements & Breakthroughs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {persona.development.achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Trophy className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <p className="text-sm">{achievement}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
