'use client'

import { Suspense, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Palette, User } from 'lucide-react'

import { ProtectedRoute } from '@/components/auth/protected-route'
import Navigation from '@/components/layout/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ProfileSection } from './components/profile-section'
import { PreferencesSection } from './components/preferences-section'

const TAB_VALUES = ['profile', 'preferences'] as const
type TabValue = (typeof TAB_VALUES)[number]

function isTabValue(v: string | null): v is TabValue {
  return !!v && (TAB_VALUES as readonly string[]).includes(v)
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  // Backward-compat: ?tab=integrations now lands on Profile (integrations
  // moved into that tab) and scrolls to the integrations section.
  useEffect(() => {
    if (tabParam === 'integrations') {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', 'profile')
      router.replace(`/settings?${params.toString()}#integrations`, {
        scroll: false,
      })
    }
  }, [tabParam, router, searchParams])

  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : 'profile'

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', value)
      router.replace(`/settings?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink">Settings</h1>
        <p className="text-ink-3 mt-2">
          Manage your account, coaching style, and connected integrations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="h-10 mb-6">
          <TabsTrigger value="profile" className="px-4">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="px-4">
            <Palette className="h-4 w-4" />
            Coaching Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSection />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute loadingMessage="Loading settings...">
      <Navigation />
      <Suspense fallback={null}>
        <SettingsContent />
      </Suspense>
    </ProtectedRoute>
  )
}
