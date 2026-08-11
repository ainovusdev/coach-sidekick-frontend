import { Button, PageHeader } from 'coach-sidekick'
import { Plus, Upload, Users } from 'lucide-react'

export const Full = () => (
  <div className="w-full max-w-2xl">
    <PageHeader
      title="Clients"
      description="Manage your coaching roster and track session health."
      icon={Users}
      actions={
        <>
          <Button variant="outline">
            <Upload /> Import
          </Button>
          <Button>
            <Plus /> New client
          </Button>
        </>
      }
      className="mb-0"
    />
  </div>
)

export const Minimal = () => (
  <div className="w-full max-w-2xl">
    <PageHeader
      title="Session history"
      description="Every recorded conversation across your clients."
      className="mb-0"
    />
  </div>
)
