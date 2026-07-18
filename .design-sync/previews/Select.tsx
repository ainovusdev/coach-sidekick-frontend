import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from 'coach-sidekick'

// cardMode:single — the FIRST export is what the card renders, so it is the
// open state (dropdown content visible inside the 700x560 viewport).
export const OpenClientPicker = () => (
  <div className="w-80">
    <Select open defaultValue="amy-turner">
      <SelectTrigger aria-label="Client">
        <SelectValue placeholder="Choose a client" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Active clients</SelectLabel>
          <SelectItem value="amy-turner">Maya Chen</SelectItem>
          <SelectItem value="kimber-liu">Nadia Osei</SelectItem>
          <SelectItem value="adam-duguay">Tom Alvarez</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Paused</SelectLabel>
          <SelectItem value="mallory-reeves">Elena Brooks</SelectItem>
          <SelectItem value="derek-osei" disabled>
            Derek Osei (offboarded)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
)

export const ClosedWithValue = () => (
  <div className="w-80">
    <Select defaultValue="one-on-one">
      <SelectTrigger aria-label="Session type">
        <SelectValue placeholder="Session type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="one-on-one">1:1 coaching session</SelectItem>
        <SelectItem value="group">Group session (Pod)</SelectItem>
        <SelectItem value="intake">Intake call</SelectItem>
        <SelectItem value="review">Quarterly review</SelectItem>
      </SelectContent>
    </Select>
  </div>
)

export const Placeholder = () => (
  <div className="w-80">
    <Select>
      <SelectTrigger aria-label="Meeting platform">
        <SelectValue placeholder="Choose a meeting platform" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="zoom">Zoom</SelectItem>
        <SelectItem value="meet">Google Meet</SelectItem>
        <SelectItem value="teams">Microsoft Teams</SelectItem>
      </SelectContent>
    </Select>
  </div>
)

export const Disabled = () => (
  <div className="w-80">
    <Select disabled defaultValue="weekly">
      <SelectTrigger aria-label="Cadence">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="weekly">Weekly cadence</SelectItem>
        <SelectItem value="biweekly">Every two weeks</SelectItem>
      </SelectContent>
    </Select>
  </div>
)
