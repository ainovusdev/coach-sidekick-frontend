'use client'

import Image from 'next/image'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PersonAvatar } from '@/components/ui/person-avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/contexts/auth-context'

/**
 * The minimal header for client-side management roles — a primary client,
 * their admin, a supervisor. They have no coach nav and no portal; the
 * sandbox is the whole product for them. Same 64px geometry as the other two
 * headers, so the cockpit's sticky rail offset works everywhere.
 */
export function SandboxHeader({ showIndexLink }: { showIndexLink: boolean }) {
  const { user, signOut } = useAuth()

  return (
    <header
      className="sticky top-0 z-50 border-b border-line bg-paper"
      data-testid="sandbox-header"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/sandboxes" className="group flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-tile p-1.5 transition-transform group-hover:scale-105">
                <Image
                  src="/novus-global-logo.webp"
                  alt="Novus Global"
                  width={32}
                  height={32}
                  className="object-contain brightness-0 invert filter"
                />
              </div>
              <span className="text-xl font-bold text-ink">Coach Sidekick</span>
            </Link>
            {showIndexLink && (
              <Link
                href="/sandboxes"
                className="hidden text-sm font-medium text-ink-3 hover:text-ink sm:block"
              >
                Sandboxes
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  aria-label="Account"
                >
                  <PersonAvatar
                    name={user?.full_name ?? null}
                    email={user?.email ?? ''}
                    size="sm"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium text-ink">
                    {user?.full_name || user?.email}
                  </p>
                  {user?.full_name && (
                    <p className="truncate text-xs text-ink-3">{user.email}</p>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
