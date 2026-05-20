'use client'

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
import { useClientPersona } from '@/hooks/queries/use-personas'
import { useClient } from '@/hooks/queries/use-clients'
import { PersonaHistoryTimeline } from '@/components/persona/persona-history-timeline'
import { PersonaEvolutionTimeline } from '@/components/persona/persona-evolution-timeline'

interface ClientPersonaProps {
  clientId: string
}

/**
 * Client Persona Modern - Now using TanStack Query
 *
 * Benefits:
 * - Persona and client data cached
 * - Instant display if already loaded
 * - Parallel queries with shared cache
 */
export function ClientPersonaModern({ clientId }: ClientPersonaProps) {
  // Use TanStack Query for persona and client data
  const { data: persona, isLoading: personaLoading } =
    useClientPersona(clientId)
  const { data: client, isLoading: clientLoading } = useClient(clientId)

  const loading = personaLoading || clientLoading

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="border-line">
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
          <div className="p-6 bg-paper rounded-2xl">
            <Brain className="h-16 w-16 text-ink-4 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-ink mb-2">
              Building Client Persona
            </h3>
            <p className="text-ink-3">
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
      <TabsList className="bg-surface-3 p-1 rounded-lg">
        <TabsTrigger
          value="overview"
          className="data-[state=active]:bg-surface-1"
        >
          <Brain className="h-4 w-4 mr-2" />
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="data-[state=active]:bg-surface-1"
        >
          <Clock className="h-4 w-4 mr-2" />
          Change History
        </TabsTrigger>
        <TabsTrigger
          value="timeline"
          className="data-[state=active]:bg-surface-1"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Evolution Timeline
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-8">
        {/* Meta Performance Vision */}
        {client?.meta_performance_vision && (
          <div className="relative overflow-hidden rounded-2xl bg-ink p-8 text-ink-on-dark">
            <div className="absolute top-0 right-0 w-64 h-64 bg-surface-1 opacity-5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-surface-1 opacity-5 rounded-full -ml-24 -mb-24" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-surface-1/10 rounded-xl backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Meta Performance Vision</h2>
                  <p className="text-ink-2 text-sm">
                    Ultimate transformation and legacy
                  </p>
                </div>
              </div>

              <p className="text-lg leading-relaxed text-ink-2 italic">
                &ldquo;{client.meta_performance_vision}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Hero Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className=" rounded-xl p-4 text-ink-on-dark">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 opacity-60" />
              <span className="text-2xl font-bold">
                {persona.metadata.sessions_analyzed}
              </span>
            </div>
            <p className="text-xs opacity-80">Sessions Analyzed</p>
          </div>

          <div className="bg-surface-1 border border-line rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-ink-3" />
              <span className="text-2xl font-bold text-ink">
                {confidencePercentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={confidencePercentage} className="h-1.5 mb-1" />
            <p className="text-xs text-ink-3">Confidence Score</p>
          </div>

          <div className="bg-surface-1 border border-line rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-ink-3" />
              <span className="text-lg font-bold text-ink">
                {persona.patterns.strengths.length +
                  persona.progress.achievements.length}
              </span>
            </div>
            <p className="text-xs text-ink-3">Strengths & Wins</p>
          </div>

          <div className="bg-surface-1 border border-line rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Flag className="h-5 w-5 text-ink-3" />
              <span className="text-lg font-bold text-ink">
                {persona.goals.primary_goals.length +
                  persona.goals.short_term_goals.length}
              </span>
            </div>
            <p className="text-xs text-ink-3">
              Active Meta Performance Outcomes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          {(persona.demographics.occupation ||
            persona.demographics.location) && (
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <User className="h-4 w-4 text-ink-3" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {persona.demographics.occupation && (
                  <div className="p-3 bg-paper rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-surface-1 rounded-lg shadow-sm">
                        <Briefcase className="h-4 w-4 text-ink-3" />
                      </div>
                      <div>
                        <p className="text-xs text-ink-3 uppercase tracking-wider mb-0.5">
                          Role
                        </p>
                        <p className="text-sm font-medium text-ink capitalize">
                          {persona.demographics.occupation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {persona.demographics.location && (
                  <div className="flex items-center gap-2 text-sm text-ink-3">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{persona.demographics.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Primary Goals - Visual Cards */}
          {persona.goals.primary_goals.length > 0 && (
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-ink-3" />
                  Primary Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {persona.goals.primary_goals.map((goal, index) => (
                    <div key={index} className="group relative">
                      <div className="absolute inset-0  rounded-lg transform transition-transform group-hover:scale-105" />
                      <div className="relative p-4 flex items-start gap-3">
                        <div className="p-2 bg-ink rounded-lg flex-shrink-0">
                          <Target className="h-4 w-4 text-ink-on-dark" />
                        </div>
                        <p className="text-sm font-medium text-ink leading-relaxed">
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
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Brain className="h-4 w-4 text-ink-3" />
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
                            ? 'bg-ink text-ink-on-dark '
                            : index === 1
                              ? 'bg-ink-2 text-ink-on-dark'
                              : index === 2
                                ? 'bg-surface-3 text-ink-2'
                                : 'bg-surface-3 text-ink-2',
                        )}
                      >
                        {trait}
                      </div>
                    ),
                  )}
                </div>
                {persona.personality.communication_style && (
                  <div className="mt-4 p-3 bg-paper rounded-lg text-center">
                    <MessageSquare className="h-4 w-4 text-ink-3 mx-auto mb-1" />
                    <p className="text-xs text-ink-3">Communication Style</p>
                    <p className="text-sm font-semibold text-ink capitalize">
                      {persona.personality.communication_style}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Main Challenges - Problem Cards */}
          {persona.challenges.main_challenges.length > 0 && (
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-ink-3" />
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
                        className="flex items-start gap-3 p-3  rounded-lg border border-line"
                      >
                        <div className="p-1.5 bg-surface-3 rounded">
                          <AlertCircle className="h-3.5 w-3.5 text-ink-3" />
                        </div>
                        <p className="text-sm text-ink-2 flex-1">{challenge}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Core Values - Icon Grid */}
          {persona.personality.values.length > 0 && (
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Heart className="h-4 w-4 text-ink-3" />
                  Core Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {persona.personality.values.map((value, index) => (
                    <div
                      key={index}
                      className="p-3 bg-ink text-ink-on-dark rounded-lg text-center"
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
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Zap className="h-4 w-4 text-ink-3" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {persona.patterns.strengths.map((strength, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3  rounded-lg border border-line"
                    >
                      <CheckCircle2 className="h-4 w-4 text-ink-2 flex-shrink-0" />
                      <p className="text-sm text-ink-2">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Growth Areas - Development Focus */}
          {persona.patterns.growth_areas.length > 0 && (
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-ink-3" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {persona.patterns.growth_areas.map((area, index) => (
                    <div
                      key={index}
                      className="p-3 border-l-2 border-line-strong bg-paper rounded-r-lg"
                    >
                      <p className="text-sm text-ink-2">{area}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Short-term Goals - Timeline */}
          {persona.goals.short_term_goals.length > 0 && (
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Flag className="h-4 w-4 text-ink-3" />
                  Short-term Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-3" />
                  <div className="space-y-4">
                    {persona.goals.short_term_goals.map((goal, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="relative">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              index === 0 ? 'bg-ink' : 'bg-surface-3',
                            )}
                          >
                            <span
                              className={cn(
                                'text-xs font-bold',
                                index === 0 ? 'text-ink-on-dark' : 'text-ink-3',
                              )}
                            >
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-sm text-ink-2">{goal}</p>
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
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-ink-3" />
                  Milestones & Breakthroughs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {persona.progress.achievements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3">
                        Achievements
                      </h4>
                      <div className="space-y-2">
                        {persona.progress.achievements.map(
                          (achievement, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="p-1 bg-surface-3 rounded mt-0.5">
                                <Award className="h-3 w-3 text-ink-3" />
                              </div>
                              <p className="text-sm text-ink-2">
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
                      <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3">
                        Breakthrough Moments
                      </h4>
                      <div className="space-y-2">
                        {persona.progress.breakthrough_moments.map(
                          (moment, index) => (
                            <div
                              key={index}
                              className="p-3 bg-ink text-ink-on-dark rounded-lg"
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
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ink-3" />
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
                          ? 'bg-ink text-ink-on-dark border-line '
                          : index < 4
                            ? 'bg-surface-3 text-ink-2 border-line'
                            : 'bg-surface-3 text-ink-2 border-line',
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
            <Card className="border-line shadow-sm hover:shadow-lg transition-all duration-300 lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Shield className="h-4 w-4 text-ink-3" />
                  Concerns & Obstacles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {persona.challenges.fears.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Fears
                      </h4>
                      <div className="space-y-2">
                        {persona.challenges.fears.map((fear, index) => (
                          <div
                            key={index}
                            className="p-3 bg-paper rounded-lg border-l-2 border-line-strong"
                          >
                            <p className="text-sm text-ink-2">{fear}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {persona.challenges.obstacles.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Obstacles
                      </h4>
                      <div className="space-y-2">
                        {persona.challenges.obstacles.map((obstacle, index) => (
                          <div
                            key={index}
                            className="p-3 bg-paper rounded-lg border-l-2 border-line-strong"
                          >
                            <p className="text-sm text-ink-2">{obstacle}</p>
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
