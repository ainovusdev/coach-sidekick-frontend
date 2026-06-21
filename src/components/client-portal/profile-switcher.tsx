'use client'

import { Check, ChevronsUpDown, Users } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import {
  useClientProfiles,
  type ClientProfile,
} from '@/hooks/queries/use-client-profiles'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Multi-profile switcher (Phase 5c). Lets a client coached by more than one
 * coach switch which profile is "active". Renders NOTHING for a single-profile
 * client (the 99% case) — zero change for them. Distinct from super-admin
 * impersonation (the amber "Viewing portal as" banner).
 */
export function ProfileSwitcher() {
  const { isClient } = useAuth()
  const { data: profiles } = useClientProfiles({ enabled: isClient() })

  // Hidden unless the user genuinely has more than one profile.
  if (!profiles || profiles.length <= 1) return null

  const active = profiles.find(p => p.is_active) ?? profiles[0]
  const label = active.coach_name || active.name || 'Profile'

  const switchTo = (profile: ClientProfile) => {
    if (profile.is_active) return
    sessionStorage.setItem('active_client_id', profile.client_id)
    sessionStorage.setItem(
      'active_client_name',
      profile.coach_name || profile.name || '',
    )
    // Full navigation to the dashboard so EVERY query + raw-fetch page re-reads
    // the new active profile from sessionStorage (the header is read at request
    // time, not reactively).
    window.location.assign('/client-portal/dashboard')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 px-2.5 text-[13px] font-medium"
          aria-label="Switch coaching profile"
        >
          <Users className="h-3.5 w-3.5 text-ink-3" strokeWidth={1.75} />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {label}
          </span>
          <ChevronsUpDown
            className="h-3.5 w-3.5 text-ink-3 opacity-70"
            strokeWidth={1.75}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Coaching profile
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map(profile => (
          <DropdownMenuItem
            key={profile.client_id}
            onSelect={() => switchTo(profile)}
            className="cursor-pointer gap-2"
          >
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm">
                {profile.coach_name || 'Coach'}
              </span>
              {profile.name && (
                <span className="truncate text-xs text-muted-foreground">
                  {profile.name}
                </span>
              )}
            </div>
            {profile.is_active && (
              <Check className="ml-auto h-4 w-4 shrink-0" strokeWidth={2} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
