/**
 * Questionnaire Layout
 * Simple layout for the public questionnaire page (no authentication required)
 */

import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/providers/theme-provider'

export default function QuestionnaireLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="questionnaire-theme"
    >
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
        {children}
        <Toaster position="top-center" richColors />
      </div>
    </ThemeProvider>
  )
}
