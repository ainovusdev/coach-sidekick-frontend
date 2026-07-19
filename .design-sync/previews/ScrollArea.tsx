import { Badge, ScrollArea, ScrollBar, Separator } from 'coach-sidekick'

const sessionHistory = [
  { date: 'Jul 15, 2026', topic: 'Delegation and the Q3 roadmap' },
  { date: 'Jul 1, 2026', topic: 'Board presentation dry run' },
  { date: 'Jun 17, 2026', topic: 'Feedback conversations with directs' },
  { date: 'Jun 3, 2026', topic: 'Kickoff — goals and coaching agreement' },
  { date: 'May 20, 2026', topic: 'Managing up to the new CEO' },
  { date: 'May 6, 2026', topic: 'Energy audit and calendar redesign' },
  { date: 'Apr 22, 2026', topic: 'Difficult conversation rehearsal' },
  { date: 'Apr 8, 2026', topic: 'Quarterly goals retrospective' },
  { date: 'Mar 25, 2026', topic: 'Team offsite planning' },
  { date: 'Mar 11, 2026', topic: 'First 90 days as VP' },
]

export const SessionHistoryList = () => (
  <ScrollArea className="h-48 w-80 rounded-md border">
    <div className="p-4">
      <h4 className="mb-3 text-sm font-medium text-ink">
        Session history — Maya Chen (10)
      </h4>
      {sessionHistory.map(session => (
        <div key={session.date}>
          <div className="py-2">
            <p className="text-sm text-ink">{session.topic}</p>
            <p className="text-xs text-ink-3">{session.date}</p>
          </div>
          <Separator />
        </div>
      ))}
    </div>
  </ScrollArea>
)

export const HorizontalClientStrip = () => (
  <ScrollArea className="w-80 rounded-md border">
    <div className="flex w-max gap-2 p-4">
      <Badge variant="live">Maya Chen</Badge>
      <Badge variant="completed">Marcus Bell</Badge>
      <Badge variant="scheduled">Priya Sharma</Badge>
      <Badge variant="completed">Nadia Osei</Badge>
      <Badge variant="processing">Dana Ortiz</Badge>
      <Badge variant="completed">Jordan Reyes</Badge>
      <Badge variant="scheduled">Sofia Nakamura</Badge>
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
)
