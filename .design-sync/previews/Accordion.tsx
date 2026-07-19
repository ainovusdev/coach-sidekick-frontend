import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from 'coach-sidekick'

export const SessionPrepSections = () => (
  <Accordion
    type="single"
    collapsible
    defaultValue="goals"
    className="w-full max-w-md"
  >
    <AccordionItem value="goals">
      <AccordionTrigger>Client goals</AccordionTrigger>
      <AccordionContent>
        <ul className="list-disc pl-5 space-y-1 text-ink-2">
          <li>Delegate the Q3 roadmap review to a direct report</li>
          <li>Hold two skip-level 1:1s before the offsite</li>
          <li>Pause before responding in exec meetings</li>
        </ul>
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="commitments">
      <AccordionTrigger>Open commitments</AccordionTrigger>
      <AccordionContent>
        Three commitments from the last session are still open, including the
        board deck outline due Friday.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="notes">
      <AccordionTrigger>Coach notes</AccordionTrigger>
      <AccordionContent>
        Maya responds well to direct challenges. Revisit the energy score from
        session four before raising the delegation topic again.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

export const ClientPortalFaq = () => (
  <Accordion
    type="single"
    collapsible
    defaultValue="recording"
    className="w-full max-w-md"
  >
    <AccordionItem value="recording">
      <AccordionTrigger>Is my session recorded?</AccordionTrigger>
      <AccordionContent>
        Yes — when your coach starts the meeting bot, the session is recorded
        and transcribed. You can review the transcript and AI summary from your
        portal within an hour of the session ending.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="summary">
      <AccordionTrigger>Where do action items come from?</AccordionTrigger>
      <AccordionContent>
        After each session the AI extracts commitments you made during the
        conversation. Your coach reviews them before they appear here.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="privacy">
      <AccordionTrigger>Who can see my sessions?</AccordionTrigger>
      <AccordionContent>
        Only you and your coach. Group session participants see a personalized
        summary of their own contributions.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)
