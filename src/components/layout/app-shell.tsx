'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * AppShell — one shell, role-aware.
 *
 * Consolidates the three pre-foundation shells (coach top nav · client portal
 * top nav · admin sidebar) into a single primitive. Pick `variant` per
 * surface; everything else is shared tokens, typography, and a right-side
 * action slot. Consumers compose their own `navActions` (theme toggle, role
 * switcher, user menu, role badges) — the shell doesn't impose composition.
 */

export interface AppShellNavItem {
  href: string
  label: string
  icon?: LucideIcon
  /** Use exact path equality instead of prefix match. */
  exact?: boolean
}

export interface AppShellBrand {
  label: string
  /** Eyebrow under the brand label, e.g. "Novus Global". */
  subtitle?: string
  /** Click target for the logo. */
  href: string
  /** Optional logo image source. Defaults to a Fraunces monogram on ink. */
  logoSrc?: string
  /** Single-letter monogram when no logoSrc. Defaults to "S". */
  monogram?: string
}

export interface AppShellProps {
  variant: 'topnav' | 'sidebar'
  brand: AppShellBrand
  navItems: AppShellNavItem[]
  navActions?: ReactNode
  /** Optional banner rendered above the chrome (impersonation notice, etc.). */
  banner?: ReactNode
  children: ReactNode
}

function isItemActive(pathname: string, item: AppShellNavItem): boolean {
  if (item.exact) return pathname === item.href
  if (item.href === '/' || item.href === '/client-portal/dashboard') {
    return pathname === item.href
  }
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

function BrandTopNav({ brand }: { brand: AppShellBrand }) {
  return (
    <Link href={brand.href} className="flex items-center gap-3 group min-w-0">
      <div className="w-10 h-10 rounded-md bg-ink flex items-center justify-center overflow-hidden shrink-0">
        {brand.logoSrc ? (
          <Image
            src={brand.logoSrc}
            alt=""
            width={28}
            height={28}
            className="object-contain filter brightness-0 invert"
          />
        ) : (
          <span className="font-display text-paper text-[16px] font-semibold leading-none">
            {brand.monogram ?? 'S'}
          </span>
        )}
      </div>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="font-sans text-[15px] font-semibold text-ink truncate">
          {brand.label}
        </span>
        {brand.subtitle && (
          <span className="eyebrow tnum mt-0.5">{brand.subtitle}</span>
        )}
      </div>
    </Link>
  )
}

function BrandSidebar({
  brand,
  collapsed,
}: {
  brand: AppShellBrand
  collapsed: boolean
}) {
  return (
    <Link
      href={brand.href}
      className={cn(
        'flex items-center gap-3 group min-w-0',
        collapsed && 'justify-center',
      )}
    >
      <div className="w-9 h-9 rounded-md bg-sidebar-primary flex items-center justify-center shrink-0">
        {brand.logoSrc ? (
          <Image
            src={brand.logoSrc}
            alt=""
            width={24}
            height={24}
            className="object-contain"
          />
        ) : (
          <span className="font-display text-sidebar-primary-foreground text-[14px] font-semibold leading-none">
            {brand.monogram ?? 'S'}
          </span>
        )}
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-tight min-w-0">
          <span className="font-sans text-[14px] font-semibold truncate">
            {brand.label}
          </span>
          {brand.subtitle && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-60 mt-0.5 truncate">
              {brand.subtitle}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

function TopNavShell({
  brand,
  navItems,
  navActions,
  banner,
  children,
}: AppShellProps) {
  const pathname = usePathname() ?? ''

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {banner}
      <header className="bg-paper border-b border-line sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-6">
            <div className="flex items-center gap-8 min-w-0">
              <BrandTopNav brand={brand} />

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map(item => {
                  const active = isItemActive(pathname, item)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex items-center gap-2 h-8 px-3 rounded-sm font-sans text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-surface-2 text-ink'
                          : 'text-ink-3 hover:text-ink hover:bg-surface-2',
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" strokeWidth={1.75} />}
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {navActions && (
              <div className="flex items-center gap-2 shrink-0">
                {navActions}
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

function SidebarShell({
  brand,
  navItems,
  navActions,
  banner,
  children,
}: AppShellProps) {
  const pathname = usePathname() ?? ''
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {banner}
      <div className="flex h-screen bg-bg">
        <aside
          className={cn(
            'bg-sidebar text-sidebar-foreground flex flex-col transition-[width] duration-200 ease-in-out shrink-0',
            collapsed ? 'w-16' : 'w-64',
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16 shrink-0">
            <BrandSidebar brand={brand} collapsed={collapsed} />
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-1 rounded-sm hover:bg-sidebar-accent transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="mx-auto my-2 p-1 rounded-sm hover:bg-sidebar-accent transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {navItems.map(item => {
                const active = isItemActive(pathname, item)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-sm font-sans text-[13px] font-medium transition-colors',
                        'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        active &&
                          'bg-sidebar-accent text-sidebar-foreground border-l-2 border-sidebar-foreground pl-[10px]',
                        collapsed && 'justify-center px-0',
                      )}
                    >
                      {Icon && (
                        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                      )}
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          {navActions && (
            <header className="bg-paper border-b border-line h-16 flex items-center justify-end px-6 shrink-0">
              <div className="flex items-center gap-2">{navActions}</div>
            </header>
          )}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  )
}

export function AppShell(props: AppShellProps) {
  if (props.variant === 'sidebar') return <SidebarShell {...props} />
  return <TopNavShell {...props} />
}
