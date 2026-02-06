'use client'

import { useState, useMemo } from 'react'
import { useProgramCalendar } from '@/hooks/queries/use-programs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  format,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface ProgramCalendarProps {
  programId: string
}

export function ProgramCalendar({ programId }: ProgramCalendarProps) {
  const router = useRouter()
  const [daysAhead, setDaysAhead] = useState(30)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>([])
  const { data: calendar, isLoading } = useProgramCalendar(programId, daysAhead)

  // Get unique clients and coaches for filtering
  const { uniqueClients, uniqueCoaches } = useMemo(() => {
    if (!calendar) return { uniqueClients: [], uniqueCoaches: [] }

    const clientsMap = new Map<string, string>()
    const coachesMap = new Map<string, string>()

    calendar.upcoming_sessions.forEach(session => {
      clientsMap.set(session.client_id, session.client_name)
      if (session.coach_id && session.coach_name) {
        coachesMap.set(session.coach_id, session.coach_name)
      }
    })

    return {
      uniqueClients: Array.from(clientsMap, ([id, name]) => ({
        id,
        name,
      })).sort((a, b) => a.name.localeCompare(b.name)),
      uniqueCoaches: Array.from(coachesMap, ([id, name]) => ({
        id,
        name,
      })).sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [calendar])

  // Filter sessions based on selected filters
  const filteredSessions = useMemo(() => {
    if (!calendar) return []

    return calendar.upcoming_sessions.filter(session => {
      const clientMatch =
        selectedClients.length === 0 ||
        selectedClients.includes(session.client_id)
      const coachMatch =
        selectedCoaches.length === 0 ||
        selectedCoaches.includes(session.coach_id)
      return clientMatch && coachMatch
    })
  }, [calendar, selectedClients, selectedCoaches])

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, typeof filteredSessions>()

    filteredSessions.forEach(session => {
      const dateKey = format(new Date(session.scheduled_date), 'yyyy-MM-dd')
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(session)
    })

    return grouped
  }, [filteredSessions])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const toggleClientFilter = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId],
    )
  }

  const toggleCoachFilter = (coachId: string) => {
    setSelectedCoaches(prev =>
      prev.includes(coachId)
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId],
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!calendar) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-gray-600">No calendar data available</p>
        </CardContent>
      </Card>
    )
  }

  const getSessionsForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd')
    return sessionsByDate.get(dateKey) || []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sandbox Calendar</h2>
          <p className="text-gray-600 mt-1">
            Upcoming sessions and coach workload
          </p>
        </div>
        <Select
          value={daysAhead.toString()}
          onValueChange={value => setDaysAhead(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Next 7 days</SelectItem>
            <SelectItem value="14">Next 2 weeks</SelectItem>
            <SelectItem value="30">Next 30 days</SelectItem>
            <SelectItem value="60">Next 60 days</SelectItem>
            <SelectItem value="90">Next 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Week
            </CardTitle>
            <Calendar className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {calendar.sessions_this_week}
            </div>
            <p className="text-xs text-gray-600 mt-1">sessions scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Next Week
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {calendar.sessions_next_week}
            </div>
            <p className="text-xs text-gray-600 mt-1">sessions scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Upcoming
            </CardTitle>
            <Clock className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {filteredSessions.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              in next {daysAhead} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter sessions by client or coach</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Filters */}
          {uniqueClients.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Clients</p>
              <div className="flex flex-wrap gap-2">
                {uniqueClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => toggleClientFilter(client.id)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      selectedClients.includes(client.id)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                    }`}
                  >
                    {client.name}
                  </button>
                ))}
                {selectedClients.length > 0 && (
                  <button
                    onClick={() => setSelectedClients([])}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Coach Filters */}
          {uniqueCoaches.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Coaches</p>
              <div className="flex flex-wrap gap-2">
                {uniqueCoaches.map(coach => (
                  <button
                    key={coach.id}
                    onClick={() => toggleCoachFilter(coach.id)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      selectedCoaches.includes(coach.id)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                    }`}
                  >
                    {coach.name}
                  </button>
                ))}
                {selectedCoaches.length > 0 && (
                  <button
                    onClick={() => setSelectedCoaches([])}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calendar View</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-700"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map(day => {
              const daySessionsCount = getSessionsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isCurrentDay = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`bg-white p-2 min-h-[100px] ${
                    !isCurrentMonth ? 'text-gray-400' : ''
                  } ${isCurrentDay ? 'ring-2 ring-gray-900 ring-inset' : ''}`}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {daySessionsCount.slice(0, 3).map(session => (
                      <div
                        key={session.session_id}
                        className="text-xs p-1 rounded bg-gray-50 border border-gray-300 cursor-pointer hover:bg-gray-100 truncate"
                        onClick={() =>
                          router.push(`/clients/${session.client_id}`)
                        }
                        title={`${format(new Date(session.scheduled_date), 'h:mm a')} - ${session.client_name} with ${session.coach_name || 'Unknown'}`}
                      >
                        <div className="font-medium truncate">
                          {format(new Date(session.scheduled_date), 'h:mm a')}
                        </div>
                        <div className="truncate text-gray-600">
                          {session.client_name}
                        </div>
                      </div>
                    ))}
                    {daySessionsCount.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{daySessionsCount.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Coach Workload */}
      {Object.keys(calendar.coach_workload).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle>Coach Workload</CardTitle>
            </div>
            <CardDescription>
              Session distribution across coaches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(calendar.coach_workload)
                .sort(([, a], [, b]) => b - a)
                .map(([coach, count]) => (
                  <div key={coach} className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 truncate" title={coach}>
                      {coach}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">sessions</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
