import { EmptyState } from 'coach-sidekick'
import { Calendar, Plus, SearchX, Users, Video } from 'lucide-react'

export const NoClients = () => (
  <EmptyState
    icon={Users}
    title="No clients yet"
    description="Add your first client to start scheduling sessions and tracking commitments."
    action={{ label: 'Add client', onClick: () => {}, icon: Plus }}
    secondaryAction={{ label: 'Import from CSV', onClick: () => {} }}
  />
)

export const NoSessions = () => (
  <EmptyState
    icon={Calendar}
    title="No sessions scheduled"
    description="Connect your calendar or start a bot to capture your next coaching conversation."
    action={{ label: 'Start session', onClick: () => {}, icon: Video }}
  />
)

export const NoResults = () => (
  <EmptyState
    icon={SearchX}
    title="No matching commitments"
    description="Try a different search term or clear the status filter."
  />
)
