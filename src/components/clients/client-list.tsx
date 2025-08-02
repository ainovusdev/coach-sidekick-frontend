'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Client, ClientSessionStats } from '@/types/meeting'
import { ClientService } from '@/services/client-service'
import {
  Search,
  Filter,
  Plus,
  Users,
  Eye,
  Edit,
  Mail,
  Phone,
  Building,
  Calendar,
  TrendingUp,
  Clock,
  BarChart3,
  User,
  Grid3X3,
  Loader2,
} from 'lucide-react'

interface ClientWithStats extends Client {
  client_session_stats?: ClientSessionStats[]
}

export default function ClientList() {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)

      const response = await ClientService.listClients({
        search: searchTerm.trim() || undefined,
      })

      console.log('Client list response:', response)
      console.log('Response clients:', response.clients)
      console.log('First client status:', response.clients[0]?.status)

      // Note: Backend doesn't support status filtering yet
      // Filter clients by status on the frontend for now
      let filteredClients = response.clients
      if (statusFilter !== 'all') {
        filteredClients = response.clients.filter(
          client => client.status === statusFilter,
        )
      }

      console.log('Filtered clients:', filteredClients)
      console.log('Status filter:', statusFilter)

      setClients(filteredClients)
      setError(null)
    } catch (error) {
      console.error('Error fetching clients:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchTerm])

  useEffect(() => {
    fetchClients()
  }, [statusFilter, fetchClients])

  const handleSearch = () => {
    fetchClients()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: '🟢',
          label: 'Active',
        }
      case 'inactive':
        return {
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: '⏸️',
          label: 'Inactive',
        }
      case 'archived':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '📁',
          label: 'Archived',
        }
      default:
        return {
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: '❓',
          label: status,
        }
    }
  }

  const formatLastSession = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 h-10 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-slate-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Clients
          </h1>
          <p className="text-slate-600 mt-1">
            Manage your coaching clients and track their progress
          </p>
        </div>
        <Link href="/clients/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add New Client
          </Button>
        </Link>
      </div>

      {/* Enhanced Filters */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <Button
                onClick={handleSearch}
                variant="outline"
                className="border-slate-200 hover:bg-slate-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Grid */}
      {clients.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm || statusFilter !== 'all'
                ? 'No clients found'
                : 'No clients yet'}
            </h3>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Add your first coaching client to get started with session tracking and insights.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link href="/clients/new">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Client
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Grid3X3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xl font-bold text-blue-900">
                      {clients.length}
                    </p>
                    <p className="text-xs text-blue-600">Total Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xl font-bold text-emerald-900">
                      {clients.filter(c => c.status === 'active').length}
                    </p>
                    <p className="text-xs text-emerald-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xl font-bold text-purple-900">
                      {clients.reduce(
                        (acc, c) =>
                          acc +
                          (c.client_session_stats?.[0]?.total_sessions || 0),
                        0,
                      )}
                    </p>
                    <p className="text-xs text-purple-600">Total Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-xl font-bold text-orange-900">
                      {Math.round(
                        (clients.reduce(
                          (acc, c) =>
                            acc +
                            (c.client_session_stats?.[0]
                              ?.average_overall_score || 0),
                          0,
                        ) /
                          Math.max(
                            clients.filter(
                              c =>
                                c.client_session_stats?.[0]
                                  ?.average_overall_score,
                            ).length,
                            1,
                          )) *
                          10,
                      ) / 10 || '—'}
                    </p>
                    <p className="text-xs text-orange-600">Avg Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map(client => {
              const stats = client.client_session_stats?.[0]
              const statusConfig = getStatusConfig(client.status)

              return (
                <Card
                  key={client.id}
                  className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-slate-200 group"
                >
                  <CardContent className="p-6">
                    {/* Client Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                            {getClientInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-slate-900 truncate mb-1">
                            {client.name}
                          </h3>
                          <Badge
                            className={`${statusConfig.color} text-xs font-medium border`}
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-2 mb-4 text-sm">
                      {client.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.company && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building className="h-3 w-3 text-slate-400" />
                          <span className="truncate">
                            {client.company}
                            {client.position ? ` • ${client.position}` : ''}
                          </span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {client.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {client.tags.slice(0, 2).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-slate-300 text-slate-600"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {client.tags.length > 2 && (
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-300 text-slate-600"
                          >
                            +{client.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    {stats && (
                      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              Sessions
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900">
                            {stats.total_sessions}
                          </p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">Last</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-xs">
                            {formatLastSession(stats.last_session_date)}
                          </p>
                        </div>

                        {stats.average_overall_score && (
                          <div className="text-center col-span-2">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <BarChart3 className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-500">
                                Avg Score
                              </span>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {stats.average_overall_score.toFixed(1)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/clients/${client.id}`} className="flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-slate-200 hover:bg-slate-50 group-hover:border-blue-300"
                        >
                          <Eye className="h-3 w-3 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link
                        href={`/clients/${client.id}/edit`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-slate-200 hover:bg-slate-50 group-hover:border-purple-300"
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
