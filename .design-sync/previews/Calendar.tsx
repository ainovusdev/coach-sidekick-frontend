import { Calendar } from 'coach-sidekick'

// Fixed dates keep the screenshots deterministic (July 2026).
const july = new Date(2026, 6, 1)

export const SingleDate = () => (
  <Calendar
    mode="single"
    defaultMonth={july}
    selected={new Date(2026, 6, 21)}
    className="rounded-md border border-line"
  />
)

export const DateRange = () => (
  <Calendar
    mode="range"
    defaultMonth={july}
    selected={{ from: new Date(2026, 6, 13), to: new Date(2026, 6, 17) }}
    className="rounded-md border border-line"
  />
)

export const DropdownNavigation = () => (
  <Calendar
    mode="single"
    captionLayout="dropdown"
    defaultMonth={july}
    selected={new Date(2026, 6, 9)}
    startMonth={new Date(2025, 0)}
    endMonth={new Date(2027, 11)}
    className="rounded-md border border-line"
  />
)
