/**
 * Coach Meeting Layout
 * Provides ThemeProvider for dark mode support
 */

import { ThemeProvider } from '@/components/providers/theme-provider'

export default function MeetingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="coach-meeting-theme"
    >
      {children}
    </ThemeProvider>
  )
}
