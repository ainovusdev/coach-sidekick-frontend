import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  Button,
  Input,
  Label,
  Textarea,
} from 'coach-sidekick'
import { UserPlus, Copy } from 'lucide-react'

export const AddClientDialog = () => (
  <Dialog open>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add new client</DialogTitle>
        <DialogDescription>
          Create a coaching profile. Your client will receive an invitation to
          the client portal.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="client-name">Full name</Label>
          <Input id="client-name" defaultValue="Jordan Miles" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="client-email">Email</Label>
          <Input
            id="client-email"
            type="email"
            placeholder="jordan@company.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="client-focus">Coaching focus</Label>
          <Textarea
            id="client-focus"
            rows={3}
            placeholder="Executive presence, delegation, leading through change…"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button>
          <UserPlus /> Add client
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export const ShareRecapDialog = () => (
  <Dialog open>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Share session recap</DialogTitle>
        <DialogDescription>
          Anyone with this link can view the recap for Thursday&apos;s session
          with Jordan Miles.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2">
        <Input
          readOnly
          defaultValue="https://coachsidekick.app/recap/8f3d-a41c"
          className="flex-1"
        />
        <Button variant="secondary">
          <Copy /> Copy
        </Button>
      </div>
      <DialogFooter>
        <Button variant="outline">Done</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export const ClosedWithTrigger = () => (
  <div className="flex min-h-[420px] items-center justify-center">
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus /> Add client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new client</DialogTitle>
          <DialogDescription>
            Create a coaching profile for a new client.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  </div>
)
