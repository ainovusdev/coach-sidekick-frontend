import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from 'coach-sidekick'

export const DeleteSessionAlert = () => (
  <AlertDialog open>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete this session?</AlertDialogTitle>
        <AlertDialogDescription>
          The transcript and analysis will be permanently removed for you and
          your client. This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep session</AlertDialogCancel>
        <AlertDialogAction className="bg-vermillion text-ink-on-dark hover:bg-vermillion">
          Delete session
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

export const StopRecordingAlert = () => (
  <AlertDialog open>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Stop the recording bot?</AlertDialogTitle>
        <AlertDialogDescription>
          The bot will leave the meeting and the transcript will be finalized.
          Post-session analysis starts once the recording is processed.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep recording</AlertDialogCancel>
        <AlertDialogAction>Stop bot</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

export const DiscardNotesAlert = () => (
  <AlertDialog open>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Discard unsaved notes?</AlertDialogTitle>
        <AlertDialogDescription>
          Your prep notes for Jordan Miles have unsaved changes. Leaving now
          will discard them.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep editing</AlertDialogCancel>
        <AlertDialogAction>Discard changes</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
