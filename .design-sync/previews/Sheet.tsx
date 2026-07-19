import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Badge,
  Separator,
  Label,
  Switch,
} from 'coach-sidekick'

export const SessionPrepSheet = () => (
  <Sheet open>
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle>Session prep notes</SheetTitle>
        <SheetDescription>Jordan Miles — Thursday, 2:00 PM</SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-ink">Focus areas</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Delegation</Badge>
            <Badge variant="secondary">Executive presence</Badge>
            <Badge variant="secondary">Team conflict</Badge>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-ink">Open commitments</h4>
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-ink-3">
            <li>Hold the delegation conversation with the ops lead</li>
            <li>Draft the Q3 team-charter one-pager</li>
            <li>Block two deep-work mornings per week</li>
          </ul>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-ink">From last session</h4>
          <p className="text-sm leading-relaxed text-ink-3">
            Jordan named a pattern of stepping in too early when the team
            stalls. Revisit how the 48-hour pause experiment went.
          </p>
        </div>
      </div>
      <SheetFooter className="mt-8">
        <Button variant="outline">Close</Button>
        <Button>Save notes</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
)

export const FilterSheetLeft = () => (
  <Sheet open>
    <SheetContent side="left">
      <SheetHeader>
        <SheetTitle>Filter sessions</SheetTitle>
        <SheetDescription>
          Narrow the session list to what you need.
        </SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-5">
        <div className="flex items-center justify-between">
          <Label htmlFor="f-completed">Completed only</Label>
          <Switch id="f-completed" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="f-groups">Group sessions</Label>
          <Switch id="f-groups" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="f-recording">Has recording</Label>
          <Switch id="f-recording" defaultChecked />
        </div>
      </div>
      <SheetFooter className="mt-8">
        <Button variant="ghost">Reset</Button>
        <Button>Apply filters</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
)
