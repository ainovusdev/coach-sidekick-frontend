import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getClientInitials, formatDate } from '../utils/client-utils'
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
    <div className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>

        {/* Client Profile Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="h-16 w-16 bg-gray-900 border-2 border-gray-200 shadow-md">
              <AvatarFallback className="bg-gray-900 text-white text-xl font-bold">
                {getClientInitials(client.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {client.name}
                </h1>
                {/* Ownership indicator */}
                {client.is_my_client === false && client.coach_name && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 border-blue-300 text-blue-700"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {client.coach_name}&apos;s Client
                  </Badge>
                )}
              </div>

              {client.meta_performance_vision && (
                <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider mb-1">
                        Meta Performance Vision
                      </p>
                      <p className="text-sm text-gray-800 italic leading-relaxed">
                        &ldquo;{client.meta_performance_vision}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {client.notes && (
                <p className="text-sm text-gray-600 max-w-2xl mt-2">
                  {client.notes}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Added {formatDate(client.created_at)}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  {totalSessions} Sessions
                </Badge>
                {avgDuration > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-700"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {avgDuration.toFixed(0)}m avg
                  </Badge>
                )}
                {client.invitation_status === 'accepted' && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    Portal Active
                  </Badge>
                )}
                {client.invitation_status === 'invited' && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700"
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
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={onDelete}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            {isViewer && (
              <Badge
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 px-3 py-2"
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
