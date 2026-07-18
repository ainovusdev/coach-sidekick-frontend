import { Checkbox, Input, Label } from 'coach-sidekick'

export const Default = () => (
  <div className="max-w-sm space-y-2">
    <Label htmlFor="label-client-name">Client name</Label>
    <Input id="label-client-name" placeholder="Maya Chen" />
  </div>
)

export const Required = () => (
  <div className="max-w-sm space-y-2">
    <Label htmlFor="label-session-title">
      Session title <span className="text-vermillion">*</span>
    </Label>
    <Input
      id="label-session-title"
      placeholder="Leadership coaching — week 12"
    />
  </div>
)

export const WithCheckbox = () => (
  <div className="flex items-center gap-2">
    <Checkbox id="label-share-summary" defaultChecked />
    <Label htmlFor="label-share-summary">Send session summary to client</Label>
  </div>
)

export const DisabledControl = () => (
  <div className="flex items-center gap-2">
    <Checkbox id="label-auto-analyze" disabled />
    <Label htmlFor="label-auto-analyze">
      Auto-analyze transcript (requires a recorded session)
    </Label>
  </div>
)
