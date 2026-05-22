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
      <div className="flex items-center gap-3 bg-surface-1 p-4 rounded-xl border border-line shadow-sm">
        <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-ink-on-dark" />
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{myClientsCount}</p>
          <p className="text-xs text-ink-3">My Clients</p>
        </div>
      </div>

      {/* Assigned Clients */}
      <div className="flex items-center gap-3 bg-surface-1 p-4 rounded-xl border border-line shadow-sm">
        <div className="w-12 h-12  rounded-xl flex items-center justify-center">
          <UserCheck className="h-5 w-5 text-ink-on-dark" />
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{assignedClientsCount}</p>
          <p className="text-xs text-ink-3">Assigned</p>
        </div>
      </div>

      {/* Total Sessions */}
      <div className="flex items-center gap-3 bg-surface-1 p-4 rounded-xl border border-line shadow-sm">
        <div className="w-12 h-12 bg-surface-3 rounded-xl flex items-center justify-center">
          <Calendar className="h-5 w-5 text-ink-3" />
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{totalSessions}</p>
          <p className="text-xs text-ink-3">Total Sessions</p>
        </div>
      </div>

      {/* Active This Week */}
      <div className="flex items-center gap-3 bg-surface-1 p-4 rounded-xl border border-line shadow-sm">
        <div className="w-12 h-12 bg-forest-bg rounded-xl flex items-center justify-center">
          <Clock className="h-5 w-5 text-forest" />
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{activeThisWeek}</p>
          <p className="text-xs text-ink-3">Active This Week</p>
        </div>
      </div>
    </div>
  )
}
