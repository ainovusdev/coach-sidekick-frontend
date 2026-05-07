/**
 * Detect whether an AWS-style presigned URL is at or past expiry.
 *
 * Handles both common shapes:
 *  - SigV4 (boto3 default): `X-Amz-Date=YYYYMMDDTHHMMSSZ` + `X-Amz-Expires=<seconds>`
 *  - SigV2 / classic:       `Expires=<unix-epoch-seconds>`
 *
 * `bufferSec` is grace before actual expiry — refresh slightly early to avoid
 * a race where the player tries to fetch an about-to-expire URL.
 *
 * Returns `false` for URLs we can't parse, so callers don't refresh URLs that
 * weren't presigned to begin with (e.g. plain public URLs).
 */
export function isPresignedUrlExpired(
  url: string | null | undefined,
  bufferSec = 60,
): boolean {
  if (!url) return false
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  const params = parsed.searchParams
  const nowMs = Date.now()
  const horizonMs = nowMs + bufferSec * 1000

  // SigV4
  const amzDate = params.get('X-Amz-Date')
  const amzExpires = params.get('X-Amz-Expires')
  if (amzDate && amzExpires) {
    const m = amzDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
    if (!m) return true
    const [, y, mo, d, h, mi, s] = m
    const startedMs = Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`)
    if (Number.isNaN(startedMs)) return true
    const expirySec = parseInt(amzExpires, 10)
    if (!Number.isFinite(expirySec)) return true
    return horizonMs >= startedMs + expirySec * 1000
  }

  // SigV2 / classic
  const expires = params.get('Expires')
  if (expires) {
    const epoch = parseInt(expires, 10)
    if (!Number.isFinite(epoch)) return true
    return horizonMs >= epoch * 1000
  }

  // Not a recognizable presigned URL — leave it alone.
  return false
}
