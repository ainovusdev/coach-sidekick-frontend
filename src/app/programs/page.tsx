'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrograms } from '@/hooks/queries/use-programs'

import { ProgramCard } from '@/components/programs/program-card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderKanban, Search } from 'lucide-react'

export default function ProgramsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: programsData, isLoading } = usePrograms({
    search: searchQuery || undefined,
  })

  const programs = programsData?.programs ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Programs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your coaching programs and manage group sessions
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search programs..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Programs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No programs found
          </h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Programs will appear here once created by an admin'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(program => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() =>
                router.push(`/admin/programs/${program.id}/dashboard`)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
