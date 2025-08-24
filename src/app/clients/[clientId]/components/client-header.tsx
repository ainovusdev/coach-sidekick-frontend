import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Edit, FileText, Upload } from 'lucide-react'
import { Client } from '@/types/meeting'
import { getClientInitials, formatDate } from '../utils/client-utils'

interface ClientHeaderProps {
  client: Client
  onEditClick: () => void
  onUploadClick: () => void
}

export default function ClientHeader({ client, onEditClick, onUploadClick }: ClientHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clients">
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      <Card className="border-neutral-200">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <Avatar className="h-16 w-16 bg-neutral-100 border border-neutral-200">
                <AvatarFallback className="bg-white text-neutral-700 text-lg font-medium">
                  {getClientInitials(client.name)}
                </AvatarFallback>
              </Avatar>

              <div>
                <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                  {client.name}
                </h1>
                
                {client.notes && (
                  <div className="flex items-start gap-2 mt-4">
                    <FileText className="h-4 w-4 text-neutral-400 mt-0.5" />
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {client.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                  <span>Added {formatDate(client.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={onUploadClick}
                variant="outline"
                className="border-neutral-300 hover:bg-neutral-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Recording
              </Button>
              <Button 
                onClick={onEditClick}
                className="bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}