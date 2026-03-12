'use client'

import { useState } from 'react'
import PageLayout from '@/components/layout/page-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { usePermissions } from '@/contexts/permission-context'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { useSessionsData } from './hooks/use-sessions-data'
import { calculateSessionStats } from './utils/session-stats'
import SessionsFilters from './components/sessions-filters'
import SessionsList from './components/sessions-list'
import { ManualSessionModal } from '@/components/sessions/manual-session-modal'
import { StartStandaloneGroupSessionModal } from '@/components/group-session/start-standalone-group-session-modal'
import { History, RefreshCw, Upload, Users } from 'lucide-react'

export default function SessionsHistoryPage() {
  const permissions = usePermissions()
  const isViewer = permissions.isViewer()
  const [isManualSessionModalOpen, setIsManualSessionModalOpen] =
    useState(false)
  const [isGroupSessionModalOpen, setIsGroupSessionModalOpen] = useState(false)
  const pageSize = 12

  const {
    currentPage,
    clients,
    coaches,
    loadingClients,
    loadingCoaches,
    historyLoading,
    historyError,
    filteredSessions,
    selectedClientId,
    selectedClient,
    selectedCoachId,
    selectedCoach,
    sessionType,
    hasActiveFilters,
    hasNextPage,
    hasPrevPage,
    handleNextPage,
    handlePrevPage,
    handleClientFilter,
    handleCoachFilter,
    handleSessionTypeFilter,
    handleClearFilters,
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
                {!isViewer && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsGroupSessionModalOpen(true)}
                      className="flex items-center gap-2 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800"
                    >
                      <Users className="h-4 w-4" />
                      Start Group Session
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsManualSessionModalOpen(true)}
                      className="flex items-center gap-2 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Recording
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetch()
                  }}
                  disabled={historyLoading}
                  className="flex items-center gap-2 border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-800"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>
            }
          />

          {/* Filters */}
          <SessionsFilters
            clients={clients}
            coaches={coaches}
            loadingClients={loadingClients}
            loadingCoaches={loadingCoaches}
            selectedClientId={selectedClientId}
            selectedClient={selectedClient}
            selectedCoachId={selectedCoachId}
            selectedCoach={selectedCoach}
            sessionType={sessionType}
            hasActiveFilters={hasActiveFilters}
            onClientFilter={handleClientFilter}
            onCoachFilter={handleCoachFilter}
            onSessionTypeFilter={handleSessionTypeFilter}
            onClearFilters={handleClearFilters}
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
            onClearFilter={handleClearFilters}
          />
        </div>

        {/* Manual Session Modal */}
        <ManualSessionModal
          isOpen={isManualSessionModalOpen}
          onClose={() => {
            setIsManualSessionModalOpen(false)
            refetch()
          }}
        />

        {/* Standalone Group Session Modal */}
        <StartStandaloneGroupSessionModal
          open={isGroupSessionModalOpen}
          onOpenChange={open => {
            setIsGroupSessionModalOpen(open)
            if (!open) refetch()
          }}
        />
      </PageLayout>
    </ProtectedRoute>
  )
}
