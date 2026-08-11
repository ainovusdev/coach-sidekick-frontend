import { ClientCard } from 'coach-sidekick'

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

export const RosterHealth = () => (
  <div className="grid w-full max-w-md gap-3">
    <ClientCard
      name="Maya Chen"
      email="maya.chen@example.com"
      isMyClient
      lastSessionDate={daysAgo(5)}
    />
    <ClientCard
      name="Marcus Webb"
      email="marcus.webb@example.com"
      isMyClient
      lastSessionDate={daysAgo(24)}
    />
    <ClientCard
      name="Priya Sharma"
      email="priya.sharma@example.com"
      isMyClient
    />
  </div>
)

export const SharedClient = () => (
  <div className="w-full max-w-md">
    <ClientCard
      name="Jordan Blake"
      isMyClient={false}
      coachName="Dana Whitfield"
    />
  </div>
)
