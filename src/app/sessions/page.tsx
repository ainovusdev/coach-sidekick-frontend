'use client'

import { useState } from 'react'
import PageLayout from '@/components/layout/page-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { useSessionsData } from './hooks/use-sessions-data'
import { calculateSessionStats } from './utils/session-stats'
import ClientFilter from './components/client-filter'
import SessionsList from './components/sessions-list'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import { History, RefreshCw, Upload } from 'lucide-react'

export default function SessionsHistoryPage() {
  const [isManualSessionModalOpen, setIsManualSessionModalOpen] = useState(false)
  const pageSize = 12

  const {
    currentPage,
    clients,
    loadingClients,
    historyLoading,
    historyError,
    filteredSessions,
    selectedClientId,
    selectedClient,
    hasNextPage,
    hasPrevPage,
    handleNextPage,
    handlePrevPage,
    handleClientFilter,
    refetch,
  } = useSessionsData(pageSize)

  // Calculate stats
  const stats = calculateSessionStats(filteredSessions)

  return (
    <ProtectedRoute loadingMessage="Loading sessions...">
      <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Session History"
          description="Track your coaching progress and performance over time"
          icon={History}
          iconVariant="gradient"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsManualSessionModalOpen(true)}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" />
                Upload Recording
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetch()
                }}
                disabled={historyLoading}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          }
        />

        {/* Client Filter */}
        <ClientFilter
          clients={clients}
          loadingClients={loadingClients}
          selectedClientId={selectedClientId}
          selectedClient={selectedClient}
          onClientFilter={handleClientFilter}
        />

        {/* Sessions List */}
        <SessionsList
          sessions={filteredSessions}
          loading={historyLoading}
          error={historyError}
          totalSessions={stats.totalSessions}
          currentPage={currentPage}
          pageSize={pageSize}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          selectedClientName={selectedClient?.name}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          onRefetch={refetch}
          onClearFilter={() => handleClientFilter(null)}
        />
      </div>

      {/* Manual Session Modal */}
      <ManualSessionModal
        isOpen={isManualSessionModalOpen}
        onClose={() => {
          setIsManualSessionModalOpen(false)
          refetch() // Refresh sessions list after creating a new session
        }}
      />
    </PageLayout>
    </ProtectedRoute>
  )
}