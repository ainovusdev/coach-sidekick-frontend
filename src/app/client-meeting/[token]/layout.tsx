/**
 * Client Meeting Layout
 * Simple layout for the client live meeting page (no authentication required)
 */

import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/providers/theme-provider'

export default function ClientMeetingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="client-meeting-theme"
    >
      <div className="min-h-screen bg-background">
        {children}
        <Toaster position="top-right" richColors />
      </div>
    </ThemeProvider>
  )
}
