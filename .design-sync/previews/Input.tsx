import { Input, Label } from 'coach-sidekick'

export const Default = () => (
  <div className="max-w-sm">
    <Input placeholder="Search clients..." />
  </div>
)

export const WithLabel = () => (
  <div className="max-w-sm space-y-2">
    <Label htmlFor="input-client-email">Client email</Label>
    <Input
      id="input-client-email"
      type="email"
      placeholder="maya.chen@example.com"
    />
  </div>
)

export const Types = () => (
  <div className="max-w-sm space-y-3">
    <Input type="text" defaultValue="Leadership coaching — Q3 kickoff" />
    <Input type="email" placeholder="coach@novus.global" />
    <Input type="password" defaultValue="coaching-secret" />
    <Input type="number" defaultValue={45} min={15} step={15} />
  </div>
)

export const Disabled = () => (
  <div className="max-w-sm space-y-2">
    <Label htmlFor="input-meeting-url">Meeting URL</Label>
    <Input
      id="input-meeting-url"
      defaultValue="https://zoom.us/j/93841207765"
      disabled
    />
    <p className="text-sm text-ink-3">Locked while the bot is recording.</p>
  </div>
)

export const Invalid = () => (
  <div className="max-w-sm space-y-2">
    <Label htmlFor="input-invalid-email">Client email</Label>
    <Input
      id="input-invalid-email"
      type="email"
      defaultValue="maya.chen@"
      aria-invalid="true"
    />
    <p className="text-sm text-vermillion">
      Enter a valid email address to send the invite.
    </p>
  </div>
)
