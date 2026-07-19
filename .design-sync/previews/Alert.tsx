import { Alert, AlertDescription, AlertTitle } from 'coach-sidekick'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

export const Default = () => (
  <Alert className="max-w-lg">
    <Info />
    <AlertTitle>Transcript processing</AlertTitle>
    <AlertDescription>
      The session recording is being transcribed. Analysis and coaching insights
      will appear here in a few minutes.
    </AlertDescription>
  </Alert>
)

export const Success = () => (
  <Alert className="max-w-lg">
    <CheckCircle2 />
    <AlertTitle>Session summary ready</AlertTitle>
    <AlertDescription>
      The AI summary and action items for your session with Nadia Osei have been
      generated.
    </AlertDescription>
  </Alert>
)

export const Destructive = () => (
  <Alert variant="destructive" className="max-w-lg">
    <AlertCircle />
    <AlertTitle>Recording failed</AlertTitle>
    <AlertDescription>
      The bot was never admitted from the waiting room, so nothing was recorded.
      Ask the host to admit the bot, then restart it from the session page.
    </AlertDescription>
  </Alert>
)
