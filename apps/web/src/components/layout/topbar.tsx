'use client'

import { UserButton } from '@clerk/nextjs'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppPortal, OfficePortalVariant } from '@/lib/portal-variants'
import { badgeForAppPortal } from '@/lib/portal-badges'
import { InstallAppButton } from '@/components/pwa/install-app-button'

export type { AppPortal, OfficePortalVariant } from '@/lib/portal-variants'

export function TopBar({
  schoolName,
  portal,
  officeVariant,
}: {
  schoolName?: string
  portal?: AppPortal
  /** On `/office`: `StaffRole.ADMIN` → Admin pill; defaults to Staff. */
  officeVariant?: OfficePortalVariant
}) {
  const badge = portal ? badgeForAppPortal(portal, officeVariant) : null

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-y-2 border-b bg-white px-4 py-2 sm:px-6 sm:py-0">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
        {schoolName && (
          <span className="truncate text-sm font-medium text-gray-900">{schoolName}</span>
        )}
        {badge && (
          <span
            title={badge.hint}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm',
              badge.className
            )}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <InstallAppButton />
        <button type="button" className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  )
}
