'use client'

import { Users, UserCheck, Calendar, Clock } from 'lucide-react'

interface ClientsStatsProps {
  myClientsCount: number
  assignedClientsCount: number
  totalSessions: number
  activeThisWeek: number
}

export default function ClientsStats({
  myClientsCount,
  assignedClientsCount,
  totalSessions,
  activeThisWeek,
}: ClientsStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* My Clients */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{myClientsCount}</p>
          <p className="text-xs text-gray-500">My Clients</p>
        </div>
      </div>

      {/* Assigned Clients */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <UserCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {assignedClientsCount}
          </p>
          <p className="text-xs text-gray-500">Assigned</p>
        </div>
      </div>

      {/* Total Sessions */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
          <Calendar className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          <p className="text-xs text-gray-500">Total Sessions</p>
        </div>
      </div>

      {/* Active This Week */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <Clock className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{activeThisWeek}</p>
          <p className="text-xs text-gray-500">Active This Week</p>
        </div>
      </div>
    </div>
  )
}
