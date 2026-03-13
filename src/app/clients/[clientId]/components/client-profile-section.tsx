'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useClientPersona } from '@/hooks/queries/use-personas'
import {
  Mail,
  Phone,
  Edit,
  User2,
  Calendar,
  MessageSquare,
  Clock,
  TrendingUp,
  Target,
  CheckCircle2,
  Briefcase,
  MapPin,
  Sparkles,
  Heart,
  Send,
  UserCheck,
  MoreVertical,
  Trash2,
  XCircle,
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface ClientProfileSectionProps {
  client: any
  totalSessions: number
  avgDuration: number
  avgScore: number | null
  completedCommitments: number
  totalCommitments: number
  activeGoals: number
  onEdit: () => void
  onInvite: () => void
  onDelete: () => void
  onCancelInvite?: () => void
  isViewer?: boolean
}

export function ClientProfileSection({
  client,
  totalSessions,
  avgDuration,
  avgScore,
  completedCommitments,
  totalCommitments,
  activeGoals,
  onEdit,
  onInvite,
  onDelete,
  onCancelInvite,
  isViewer = false,
}: ClientProfileSectionProps) {
  const { data: persona, isLoading: personaLoading } = useClientPersona(
    client.id,
  )

  const commitmentCompletionRate =
    totalCommitments > 0
      ? Math.round((completedCommitments / totalCommitments) * 100)
      : 0

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              Client Profile
            </CardTitle>
            {client.invitation_status === 'invited' && (
              <Badge
                variant="secondary"
                className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs"
              >
                Invited
              </Badge>
            )}
            {client.invitation_status === 'accepted' && (
              <Badge
                variant="secondary"
                className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs"
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Portal Active
              </Badge>
            )}
          </div>
          {!isViewer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4 mr-1" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </DropdownMenuItem>
                {client.invitation_status !== 'accepted' && !client.user_id && (
                  <DropdownMenuItem onClick={onInvite}>
                    <Send className="h-4 w-4 mr-2" />
                    Invite to Portal
                  </DropdownMenuItem>
                )}
                {client.invitation_status === 'invited' && onCancelInvite && (
                  <DropdownMenuItem
                    onClick={onCancelInvite}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/30"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Invitation
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="space-y-6">
          {/* Client Info */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                {client.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {client.name}
              </h3>

              {/* Contact Info */}
              <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.created_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      Client since {formatDate(client.created_at, 'MMM yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Persona Quick Info */}
              {personaLoading ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : persona ? (
                <div className="mt-3 space-y-1.5 text-sm">
                  {persona.demographics?.occupation && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>{persona.demographics.occupation}</span>
                    </div>
                  )}
                  {persona.demographics?.location && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{persona.demographics.location}</span>
                    </div>
                  )}
                  {persona.personality?.values &&
                    persona.personality.values.length > 0 && (
                      <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                        <Heart className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="flex-1">
                          {persona.personality.values.slice(0, 3).join(', ')}
                        </span>
                      </div>
                    )}
                </div>
              ) : null}

              {/* Tags */}
              {client.tags && client.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {client.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Insights from Persona */}
          {persona && persona.patterns && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Insights
              </h4>
              <div className="space-y-2 text-sm">
                {persona.patterns.strengths &&
                  persona.patterns.strengths.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                        Strengths:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                        {persona.patterns.strengths.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  )}
                {persona.patterns.growth_areas &&
                  persona.patterns.growth_areas.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                        Growth Areas:
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                        {persona.patterns.growth_areas.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Coaching Statistics */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Coaching Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Total Sessions */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Sessions
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {totalSessions}
                  </p>
                </div>
              </div>

              {/* Avg Duration */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Avg Duration
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDuration(avgDuration)}
                  </p>
                </div>
              </div>

              {/* Avg Score */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Avg Score
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {avgScore !== null ? `${avgScore.toFixed(1)}/10` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Commitments */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30">
                  <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Commitments
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {completedCommitments}/{totalCommitments}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {commitmentCompletionRate}% complete
                  </p>
                </div>
              </div>
            </div>

            {/* Active Goals */}
            {activeGoals > 0 && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-primary/5 rounded-lg">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>{activeGoals}</strong> active goal
                  {activeGoals !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Meta Performance Vision */}
          {client.meta_performance_vision && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Meta Performance Vision
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {client.meta_performance_vision}
              </p>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
