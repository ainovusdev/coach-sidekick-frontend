'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  User,
  Target,
  AlertCircle,
  Brain,
  TrendingUp,
  Award,
  MapPin,
  Briefcase,
  MessageSquare,
  Heart,
  Zap,
  Shield,
  Sparkles,
  Activity,
  Mountain,
  Lightbulb,
  Flag,
  ArrowUp,
  Star,
  Trophy,
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { PersonaService, type ClientPersona } from '@/services/persona-service'
import { PersonaHistoryTimeline } from '@/components/persona/persona-history-timeline'
import { PersonaEvolutionTimeline } from '@/components/persona/persona-evolution-timeline'
import { ClientService } from '@/services/client-service'
import type { Client } from '@/types/meeting'

interface ClientPersonaProps {
  clientId: string
}

export function ClientPersonaModern({ clientId }: ClientPersonaProps) {
  const [persona, setPersona] = useState<ClientPersona | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [personaData, clientData] = await Promise.all([
          PersonaService.getClientPersona(clientId),
          ClientService.getClient(clientId),
        ])
        setPersona(personaData)
        setClient(clientData)
      } catch (error) {
        console.error('Failed to fetch persona:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [clientId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!persona) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="p-6 bg-gray-50 rounded-2xl">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Building Client Persona
            </h3>
            <p className="text-gray-600">
              The AI is learning about your client. Persona insights will appear
              here after analyzing coaching sessions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const confidencePercentage = (persona.metadata.confidence_score || 0) * 100

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="bg-gray-100 p-1 rounded-lg">
        <TabsTrigger value="overview" className="data-[state=active]:bg-white">
          <Brain className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="history" className="data-[state=active]:bg-white">
          <Clock className="h-4 w-4 mr-2" />
          Change History
        </TabsTrigger>
        <TabsTrigger value="timeline" className="data-[state=active]:bg-white">
          <TrendingUp className="h-4 w-4 mr-2" />
          Evolution Timeline
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8">
        {/* Meta Performance Vision */}
        {client?.meta_performance_vision && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Meta Performance Vision</h2>
                  <p className="text-gray-300 text-sm">
                    Ultimate transformation and legacy
                  </p>
                </div>
              </div>

              <p className="text-lg leading-relaxed text-gray-100 italic">
                &ldquo;{client.meta_performance_vision}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 opacity-60" />
              <span className="text-2xl font-bold">
                {persona.metadata.sessions_analyzed}
              </span>
            </div>
            <p className="text-xs opacity-80">Sessions Analyzed</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-gray-600" />
              <span className="text-2xl font-bold text-gray-900">
                {confidencePercentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={confidencePercentage} className="h-1.5 mb-1" />
            <p className="text-xs text-gray-600">Confidence Score</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <span className="text-lg font-bold text-gray-900">
                {persona.patterns.strengths.length +
                  persona.progress.achievements.length}
              </span>
            </div>
            <p className="text-xs text-gray-600">Strengths & Wins</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Flag className="h-5 w-5 text-gray-600" />
              <span className="text-lg font-bold text-gray-900">
                {persona.goals.primary_goals.length +
                  persona.goals.short_term_goals.length}
              </span>
            </div>
            <p className="text-xs text-gray-600">Active Outcomes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          {(persona.demographics.occupation ||
            persona.demographics.location) && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {persona.demographics.occupation && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Briefcase className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
                          Role
                        </p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {persona.demographics.occupation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {persona.demographics.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{persona.demographics.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Primary Goals - Visual Cards */}
          {persona.goals.primary_goals.length > 0 && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-gray-600" />
                  Primary Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {persona.goals.primary_goals.map((goal, index) => (
                    <div key={index} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg transform transition-transform group-hover:scale-105" />
                      <div className="relative p-4 flex items-start gap-3">
                        <div className="p-2 bg-gray-900 rounded-lg flex-shrink-0">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 leading-relaxed">
                          {goal}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personality Traits - Circular Design */}
          {persona.personality.personality_traits.length > 0 && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-gray-600" />
                  Personality Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 justify-center">
                  {persona.personality.personality_traits.map(
                    (trait, index) => (
                      <div
                        key={index}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium',
                          index === 0
                            ? 'bg-gray-900 text-white'
                            : index === 1
                              ? 'bg-gray-700 text-white'
                              : index === 2
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-gray-100 text-gray-700',
                        )}
                      >
                        {trait}
                      </div>
                    ),
                  )}
                </div>
                {persona.personality.communication_style && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                    <MessageSquare className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Communication Style</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {persona.personality.communication_style}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Main Challenges - Problem Cards */}
          {persona.challenges.main_challenges.length > 0 && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-gray-600" />
                  Current Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {persona.challenges.main_challenges
                    .slice(0, 3)
                    .map((challenge, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200"
                      >
                        <div className="p-1.5 bg-gray-100 rounded">
                          <AlertCircle className="h-3.5 w-3.5 text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-700 flex-1">
                          {challenge}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Core Values - Icon Grid */}
          {persona.personality.values.length > 0 && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-gray-600" />
                  Core Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {persona.personality.values.map((value, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-900 text-white rounded-lg text-center"
                    >
                      <Star className="h-4 w-4 mx-auto mb-1 opacity-60" />
                      <p className="text-xs font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths - Power Cards */}
          {persona.patterns.strengths.length > 0 && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gray-600" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {persona.patterns.strengths.map((strength, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200"
                    >
                      <CheckCircle2 className="h-4 w-4 text-gray-700 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Growth Areas - Development Focus */}
          {persona.patterns.growth_areas.length > 0 && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-gray-600" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {persona.patterns.growth_areas.map((area, index) => (
                    <div
                      key={index}
                      className="p-3 border-l-2 border-gray-400 bg-gray-50 rounded-r-lg"
                    >
                      <p className="text-sm text-gray-700">{area}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Short-term Goals - Timeline */}
          {persona.goals.short_term_goals.length > 0 && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-gray-600" />
                  Short-term Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {persona.goals.short_term_goals.map((goal, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="relative">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              index === 0 ? 'bg-gray-900' : 'bg-gray-200',
                            )}
                          >
                            <span
                              className={cn(
                                'text-xs font-bold',
                                index === 0 ? 'text-white' : 'text-gray-600',
                              )}
                            >
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-sm text-gray-700">{goal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Breakthrough Moments & Achievements */}
          {(persona.progress.achievements.length > 0 ||
            persona.progress.breakthrough_moments.length > 0) && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gray-600" />
                  Milestones & Breakthroughs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {persona.progress.achievements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Achievements
                      </h4>
                      <div className="space-y-2">
                        {persona.progress.achievements.map(
                          (achievement, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="p-1 bg-gray-100 rounded mt-0.5">
                                <Award className="h-3 w-3 text-gray-600" />
                              </div>
                              <p className="text-sm text-gray-700">
                                {achievement}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {persona.progress.breakthrough_moments.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Breakthrough Moments
                      </h4>
                      <div className="space-y-2">
                        {persona.progress.breakthrough_moments.map(
                          (moment, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-900 text-white rounded-lg"
                            >
                              <div className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 opacity-80 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">{moment}</p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recurring Themes - Tag Cloud */}
          {persona.patterns.recurring_themes.length > 0 && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-600" />
                  Recurring Themes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {persona.patterns.recurring_themes.map((theme, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={cn(
                        'px-3 py-1.5',
                        index < 2
                          ? 'bg-gray-900 text-white border-gray-900'
                          : index < 4
                            ? 'bg-gray-200 text-gray-800 border-gray-200'
                            : 'bg-gray-100 text-gray-700 border-gray-100',
                      )}
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fears & Obstacles - Warning Cards */}
          {(persona.challenges.fears.length > 0 ||
            persona.challenges.obstacles.length > 0) && (
            <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-600" />
                  Concerns & Obstacles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {persona.challenges.fears.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Fears
                      </h4>
                      <div className="space-y-2">
                        {persona.challenges.fears.map((fear, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border-l-2 border-gray-400"
                          >
                            <p className="text-sm text-gray-700">{fear}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {persona.challenges.obstacles.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Obstacles
                      </h4>
                      <div className="space-y-2">
                        {persona.challenges.obstacles.map((obstacle, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border-l-2 border-gray-300"
                          >
                            <p className="text-sm text-gray-700">{obstacle}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        <PersonaHistoryTimeline clientId={clientId} limit={100} />
      </TabsContent>

      <TabsContent value="timeline" className="space-y-4">
        <PersonaEvolutionTimeline clientId={clientId} />
      </TabsContent>
    </Tabs>
  )
}
