import { AIProviderSelector } from 'coach-sidekick'

export const RadioCards = () => (
  <div className="w-96">
    <AIProviderSelector variant="radio" value="openai" onChange={() => {}} />
  </div>
)

export const DropdownClosed = () => (
  <div className="w-80">
    <AIProviderSelector variant="dropdown" value="claude" onChange={() => {}} />
  </div>
)
