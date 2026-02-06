'use client'

import { use } from 'react'
import { useProgram } from '@/hooks/queries/use-programs'
import { ProgramForm } from '@/components/programs/program-form'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function EditProgramPage({
  params,
}: {
  params: Promise<{ programId: string }>
}) {
  const { programId } = use(params)
  const router = useRouter()
  const { data: program, isLoading, error } = useProgram(programId)

  if (isLoading) {
    return (
      <>
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <Skeleton className="h-96" />
      </>
    )
  }

  if (error || !program) {
    return (
      <>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sandbox Not Found
            </h3>
            <p className="text-gray-600 text-center mb-6">
              The sandbox you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to edit it.
            </p>
            <Button onClick={() => router.push('/admin/programs')}>
              Back to Sandboxes
            </Button>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Sandbox</h1>
        <p className="text-gray-600 mt-1">
          Update the details for {program.name}
        </p>
      </div>

      <ProgramForm mode="edit" program={program} />
    </>
  )
}
