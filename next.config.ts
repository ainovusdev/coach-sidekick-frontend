import type { NextConfig } from 'next'
import { withPostHogConfig } from '@posthog/nextjs-config'

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

// Upload browser source maps to PostHog at build time so captured exceptions
// show real file/line instead of minified frames. Gated on POSTHOG_API_KEY so
// builds without it (local dev, the pre-PR build hook, Vercel previews) fall
// back to the plain config and never fail. `deleteAfterUpload` keeps the maps
// out of the public bundle. `releaseVersion` defaults to the git commit SHA,
// which matches the deployed bundle automatically.
const posthogApiKey = process.env.POSTHOG_API_KEY

export default posthogApiKey
  ? withPostHogConfig(nextConfig, {
      personalApiKey: posthogApiKey,
      projectId: process.env.POSTHOG_PROJECT_ID, // 515423
      host: 'https://us.posthog.com',
      sourcemaps: { enabled: true, deleteAfterUpload: true },
    })
  : nextConfig
