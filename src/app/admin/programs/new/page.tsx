'use client'

import { ProgramForm } from '@/components/programs/program-form'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function NewProgramPage() {
  const router = useRouter()

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-ink ">Create New Sandbox</h1>
        <p className="text-ink-3 mt-1">
          Set up a new coaching sandbox and assign clients
        </p>
      </div>

      <ProgramForm mode="create" />
    </>
  )
}
