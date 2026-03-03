'use client'

import { Program } from '@/types/program'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar } from 'lucide-react'

interface ProgramCardProps {
  program: Program
  onClick?: () => void
}

export function ProgramCard({ program, onClick }: ProgramCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: program.color }}
            />
            <CardTitle className="text-lg">{program.name}</CardTitle>
          </div>
          {program.group_coaching_enabled && (
            <Badge variant="secondary" className="text-xs">
              Group Coaching
            </Badge>
          )}
        </div>
        {program.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {program.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>
              {program.client_count} member
              {program.client_count !== 1 ? 's' : ''}
            </span>
          </div>
          {program.group_session_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {program.group_session_count} group session
                {program.group_session_count !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
