import { Checkbox, Label } from 'coach-sidekick'

export const Default = () => (
  <div className="flex items-center gap-2">
    <Checkbox id="checkbox-send-summary" />
    <Label htmlFor="checkbox-send-summary">
      Send session summary to client
    </Label>
  </div>
)

export const States = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-state-unchecked" />
      <Label htmlFor="checkbox-state-unchecked">Share transcript</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-state-checked" defaultChecked />
      <Label htmlFor="checkbox-state-checked">Include action items</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-state-disabled" disabled />
      <Label htmlFor="checkbox-state-disabled">Notify team (unavailable)</Label>
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-state-disabled-checked" disabled defaultChecked />
      <Label htmlFor="checkbox-state-disabled-checked">
        Record session (locked by admin)
      </Label>
    </div>
  </div>
)

export const WithDescription = () => (
  <div className="flex max-w-sm items-start gap-3">
    <Checkbox id="checkbox-email-recap" defaultChecked className="mt-0.5" />
    <div className="space-y-1">
      <Label htmlFor="checkbox-email-recap">
        Email recap after each session
      </Label>
      <p className="text-sm text-ink-3">
        Clients receive the summary, action items, and key topics within an hour
        of the session ending.
      </p>
    </div>
  </div>
)

export const ChecklistGroup = () => (
  <div className="max-w-sm space-y-3">
    <p className="text-sm font-medium text-ink">Session prep checklist</p>
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-prep-goals" defaultChecked />
        <Label htmlFor="checkbox-prep-goals">Review client goals</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-prep-commitments" defaultChecked />
        <Label htmlFor="checkbox-prep-commitments">
          Check last week&apos;s commitments
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-prep-transcript" />
        <Label htmlFor="checkbox-prep-transcript">
          Skim previous transcript
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-prep-agenda" />
        <Label htmlFor="checkbox-prep-agenda">Draft session agenda</Label>
      </div>
    </div>
  </div>
)
