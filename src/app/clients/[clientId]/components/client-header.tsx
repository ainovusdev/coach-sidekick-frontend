import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getClientInitials } from '../utils/client-utils'
import { formatDate } from '@/lib/date-utils'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  Activity,
  UserCheck,
  Users,
  Eye,
  Sparkles,
  Trash2,
  Send,
} from 'lucide-react'

interface ClientHeaderProps {
  client: any
  isViewer: boolean
  totalSessions: number
  avgDuration: number
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function ClientHeader({
  client,
  isViewer,
  totalSessions,
  avgDuration,
  onBack,
  onEdit,
  onDelete,
}: ClientHeaderProps) {
  return (
    <div className="border-b border-line bg-surface-1 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-ink-3 hover:text-ink hover:bg-surface-3 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>

        {/* Client Profile Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="h-16 w-16 bg-ink border-2 border-line shadow-md">
              <AvatarFallback className="bg-ink text-ink-on-dark text-xl font-bold">
                {getClientInitials(client.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-ink ">{client.name}</h1>
                {/* Ownership indicator */}
                {client.is_my_client === false && client.coach_name && (
                  <Badge
                    variant="outline"
                    className="bg-ds-accent-bg border-ds-accent text-ds-accent "
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {client.coach_name}&apos;s Client
                  </Badge>
                )}
              </div>

              {client.meta_performance_vision && (
                <div className="mt-3 p-4  border-l-4 border-indigo rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-indigo mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-indigo uppercase tracking-wider mb-1">
                        Meta Performance Vision
                      </p>
                      <p className="text-sm text-ink-2 italic leading-relaxed">
                        &ldquo;{client.meta_performance_vision}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {client.notes && (
                <p className="text-sm text-ink-3 max-w-2xl mt-2">
                  {client.notes}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="secondary" className="bg-surface-3 text-ink-2 ">
                  <Calendar className="h-3 w-3 mr-1" />
                  Added {formatDate(client.created_at)}
                </Badge>
                <Badge variant="secondary" className="bg-surface-3 text-ink-2 ">
                  <Activity className="h-3 w-3 mr-1" />
                  {totalSessions} Sessions
                </Badge>
                {avgDuration > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-surface-3 text-ink-2 "
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {avgDuration.toFixed(0)}m avg
                  </Badge>
                )}
                {client.invitation_status === 'accepted' && (
                  <Badge
                    variant="secondary"
                    className="bg-forest-bg text-forest "
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Portal Active
                  </Badge>
                )}
                {client.invitation_status === 'invited' && (
                  <Badge
                    variant="secondary"
                    className="bg-indigo-bg text-indigo "
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Invited
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isViewer && (
              <>
                <Button
                  onClick={onEdit}
                  variant="outline"
                  className="border-line-strong hover:bg-paper "
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={onDelete}
                  className="border-vermillion text-vermillion hover:bg-vermillion-bg "
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            {isViewer && (
              <Badge
                variant="outline"
                className="bg-ds-accent-bg border-ds-accent text-ds-accent px-3 py-2"
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View Only Access
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
