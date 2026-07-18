import { Button } from 'coach-sidekick'
import { Plus, Video, Trash2, ChevronRight, Download } from 'lucide-react'

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>Start session</Button>
    <Button variant="secondary">Save draft</Button>
    <Button variant="outline">Cancel</Button>
    <Button variant="ghost">Skip</Button>
    <Button variant="link">View transcript</Button>
    <Button variant="destructive">Delete session</Button>
  </div>
)

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" aria-label="Add client">
      <Plus />
    </Button>
  </div>
)

export const WithIcons = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>
      <Video /> Start bot
    </Button>
    <Button variant="outline">
      <Download /> Export notes
    </Button>
    <Button variant="secondary">
      Review session <ChevronRight />
    </Button>
    <Button variant="destructive" size="sm">
      <Trash2 /> Remove
    </Button>
  </div>
)

export const Disabled = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button disabled>Start session</Button>
    <Button variant="outline" disabled>
      Cancel
    </Button>
    <Button variant="destructive" disabled>
      Delete session
    </Button>
  </div>
)
