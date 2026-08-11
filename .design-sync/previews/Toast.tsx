import { Toast } from 'coach-sidekick'

// duration is huge so the auto-dismiss timer never fires during capture;
// onClose is a stub either way, so the toast cannot unmount itself.
export const Success = () => (
  <Toast
    message="Session summary sent to Maya Chen"
    type="success"
    onClose={() => {}}
    duration={10_000_000}
  />
)

export const ErrorToast = () => (
  <Toast
    message="Could not start the recording bot — check the meeting link"
    type="error"
    onClose={() => {}}
    duration={10_000_000}
  />
)
