import { DueDateField } from 'coach-sidekick'

// Closed states only — the calendar popover would escape the grid cell.

export const WithValue = () => (
  <div className="w-80">
    <DueDateField value="2026-07-24" onChange={() => {}} />
  </div>
)

export const Empty = () => (
  <div className="w-80">
    <DueDateField value={null} onChange={() => {}} />
  </div>
)

export const CustomLabel = () => (
  <div className="w-80">
    <DueDateField
      label="Target date for this outcome"
      id="outcome-target-date"
      value="2026-09-30"
      onChange={() => {}}
    />
  </div>
)
