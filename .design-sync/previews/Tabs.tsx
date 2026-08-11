import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from 'coach-sidekick'

export const SessionDetailTabs = () => (
  <Tabs defaultValue="overview" className="w-full max-w-md">
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="transcript">Transcript</TabsTrigger>
      <TabsTrigger value="analysis">Analysis</TabsTrigger>
    </TabsList>
    <TabsContent value="overview" className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium text-ink">
          Leadership coaching — Maya Chen
        </h4>
        <Badge variant="completed">Completed</Badge>
      </div>
      <p className="text-sm text-ink-2">
        Maya explored what has kept her from delegating the Q3 roadmap review
        and committed to handing it off to Dana before Friday. Energy was
        noticeably higher in the second half of the session.
      </p>
      <p className="text-xs text-ink-3">Jul 15, 2026 · 52 min · Zoom</p>
    </TabsContent>
    <TabsContent value="transcript">
      <p className="text-sm text-ink-2">
        Full transcript with speaker labels appears here once processing
        finishes.
      </p>
    </TabsContent>
    <TabsContent value="analysis">
      <p className="text-sm text-ink-2">
        Coaching scores and GO LIVE breakdown for this session.
      </p>
    </TabsContent>
  </Tabs>
)

export const FullWidthTabs = () => (
  <Tabs defaultValue="commitments" className="w-full max-w-md">
    <TabsList className="w-full">
      <TabsTrigger value="commitments">Commitments</TabsTrigger>
      <TabsTrigger value="goals">Goals</TabsTrigger>
      <TabsTrigger value="resources">Resources</TabsTrigger>
    </TabsList>
    <TabsContent value="commitments" className="space-y-2">
      <div className="flex items-center justify-between rounded-md border px-4 py-2">
        <span className="text-sm text-ink">
          Hand off roadmap review to Dana
        </span>
        <Badge variant="success">Done</Badge>
      </div>
      <div className="flex items-center justify-between rounded-md border px-4 py-2">
        <span className="text-sm text-ink">Block two deep-work mornings</span>
        <Badge variant="warning">Due Jul 25</Badge>
      </div>
    </TabsContent>
    <TabsContent value="goals">
      <p className="text-sm text-ink-2">Quarterly goals appear here.</p>
    </TabsContent>
    <TabsContent value="resources">
      <p className="text-sm text-ink-2">Shared resources appear here.</p>
    </TabsContent>
  </Tabs>
)
