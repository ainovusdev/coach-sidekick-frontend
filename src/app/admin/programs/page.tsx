'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrograms, useDeleteProgram } from '@/hooks/queries/use-programs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Search,
  Users,
  Trash2,
  Edit,
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Program } from '@/types/program'

export default function ProgramsListPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteProgram, setDeleteProgram] = useState<Program | null>(null)

  const { data: programsData, isLoading } = usePrograms({
    search: searchQuery || undefined,
  })

  const deleteProgramMutation = useDeleteProgram({
    onSuccess: () => {
      setDeleteProgram(null)
    },
  })

  const programs = programsData?.programs ?? []

  const handleDelete = () => {
    if (deleteProgram) {
      deleteProgramMutation.mutate(deleteProgram.id)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600 mt-1">
            Manage coaching programs and track client progress
          </p>
        </div>
        <Button onClick={() => router.push('/admin/programs/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Program
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Programs Grid */}
      {programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No programs found
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first program'}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push('/admin/programs/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Program
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map(program => (
            <Card
              key={program.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() =>
                router.push(`/admin/programs/${program.id}/dashboard`)
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: program.color }}
                      />
                      <CardTitle className="text-xl">{program.name}</CardTitle>
                    </div>
                    {program.description && (
                      <CardDescription className="line-clamp-2">
                        {program.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {program.client_count} client
                        {program.client_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {program.coach_count} coach
                      {program.coach_count !== 1 ? 'es' : ''}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={e => {
                        e.stopPropagation()
                        router.push(`/admin/programs/${program.id}/dashboard`)
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        router.push(`/admin/programs/${program.id}/edit`)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        setDeleteProgram(program)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteProgram}
        onOpenChange={() => setDeleteProgram(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteProgram?.name}&quot;?
              This will remove all client assignments from this program. Clients
              and their data will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
