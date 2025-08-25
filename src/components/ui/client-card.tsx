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
        'border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-gray-900 border border-gray-900">
            <AvatarFallback className="bg-gray-900 text-white text-sm font-bold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{name}</p>
            {notes && (
              <div className="flex items-center gap-1 mt-0.5">
                <FileText className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500 truncate">{notes}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}