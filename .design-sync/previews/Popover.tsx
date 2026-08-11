import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Label,
  Switch,
  Separator,
} from 'coach-sidekick'
import { ListFilter, CalendarDays } from 'lucide-react'

export const FilterPopover = () => (
  <div className="flex min-h-[420px] items-start justify-center pt-6">
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <ListFilter /> Filter sessions
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-ink">Filters</h4>
            <p className="text-xs text-ink-3">Applies to your session list.</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="p-completed">Completed only</Label>
            <Switch id="p-completed" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="p-groups">Group sessions</Label>
            <Switch id="p-groups" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="p-recording">Has recording</Label>
            <Switch id="p-recording" defaultChecked />
          </div>
          <Button size="sm" className="w-full">
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
)

export const SessionInfoPopover = () => (
  <div className="flex min-h-[420px] items-start justify-center pt-6">
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="ghost">
          <CalendarDays /> Jun 12, 2026
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-ink">
              Session with Jordan Miles
            </h4>
            <p className="text-xs text-ink-3">Thursday, June 12 — 2:00 PM</p>
          </div>
          <Separator />
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-3">Duration</dt>
              <dd className="text-ink">52 min</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-3">Recording</dt>
              <dd className="text-ink">Available</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-3">Commitments</dt>
              <dd className="text-ink">3 open</dd>
            </div>
          </dl>
        </div>
      </PopoverContent>
    </Popover>
  </div>
)
