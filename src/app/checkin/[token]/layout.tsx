/**
 * Check-in Layout
 * Simple layout for the public weekly commitment check-in page (no auth).
 */

import { ThemeProvider } from '@/components/providers/theme-provider'

export default function CheckinLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No local <Toaster> — the root layout already mounts a global one, and a
  // second instance renders every toast twice.
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="checkin-theme"
    >
      <div className="min-h-screen">{children}</div>
    </ThemeProvider>
  )
}
