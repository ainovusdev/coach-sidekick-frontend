import { Card, CardContent } from './card'
import { Avatar, AvatarFallback } from './avatar'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClientCardProps {
  name: string
  notes?: string | null
  onClick?: () => void
  className?: string
}

export function ClientCard({ name, notes, onClick, className }: ClientCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card
      className={cn(
        'border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-neutral-100 border border-neutral-200">
            <AvatarFallback className="bg-white text-neutral-700 text-sm">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-neutral-900 text-sm">{name}</p>
            {notes && (
              <div className="flex items-center gap-1 mt-0.5">
                <FileText className="h-3 w-3 text-neutral-400" />
                <p className="text-xs text-neutral-500 truncate">{notes}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}