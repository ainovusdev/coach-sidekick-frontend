import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'coach-sidekick'
import { ArrowRight, Calendar } from 'lucide-react'

export const SessionCard = () => (
  <Card className="max-w-md">
    <CardHeader>
      <CardTitle>Leadership coaching with Maya Chen</CardTitle>
      <CardDescription>Tomorrow at 2:00 PM · Zoom</CardDescription>
      <CardAction>
        <Badge variant="secondary">Scheduled</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-ink-2">
        Third session this quarter. Maya wants to revisit the delegation
        commitments from last week and prep for her board presentation.
      </p>
    </CardContent>
    <CardFooter className="gap-2">
      <Button size="sm">
        <Calendar /> Join session
      </Button>
      <Button size="sm" variant="outline">
        View prep notes
      </Button>
    </CardFooter>
  </Card>
)

export const SimpleCard = () => (
  <Card className="max-w-sm">
    <CardHeader>
      <CardTitle>Sessions this month</CardTitle>
      <CardDescription>Across all active clients</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-semibold text-ink">24</div>
      <p className="text-sm text-forest mt-1">+6 from last month</p>
    </CardContent>
  </Card>
)

export const WithFooterLink = () => (
  <Card className="max-w-md">
    <CardHeader>
      <CardTitle>Commitments due this week</CardTitle>
      <CardDescription>3 of 5 completed</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      <p className="text-sm text-ink-2">
        Schedule 1:1s with direct reports · Draft the Q3 vision doc · Block two
        deep-work mornings
      </p>
    </CardContent>
    <CardFooter>
      <Button variant="link" className="px-0">
        Review all commitments <ArrowRight />
      </Button>
    </CardFooter>
  </Card>
)
