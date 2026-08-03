import { toast } from 'sonner'

/** Canonical URL for a commitment's full page. */
export function commitmentHref(commitmentId: string) {
  return `/commitments/${commitmentId}`
}

/**
 * Copy a shareable link to the clipboard.
 *
 * This is the thing the new route unlocks that nothing else could: pasting a
 * specific commitment into Slack. Before, a commitment had no address at all.
 */
export async function copyCommitmentLink(commitmentId: string) {
  const url = `${window.location.origin}${commitmentHref(commitmentId)}`
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Link copied')
  } catch {
    // Clipboard API is unavailable over plain http and in some embedded views.
    toast.error('Could not copy link')
  }
}
