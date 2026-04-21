import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { badgeForSchoolRole, PLATFORM_OWNER_BADGE } from '@/lib/portal-badges'

const ROLE_PORTAL: Record<string, { href: string; label: string }> = {
  OWNER: { href: '/dashboard', label: 'Owner dashboard' },
  /** Principal cannot use owner-only `/dashboard` layout — send to office. */
  PRINCIPAL: { href: '/office/students', label: 'Staff office' },
  CLASS_TEACHER: { href: '/classroom', label: 'Classroom' },
  SUBJECT_TEACHER: { href: '/classroom', label: 'Classroom' },
  ADMIN: { href: '/office/students', label: 'Staff office' },
  ACCOUNTANT: { href: '/office/fees', label: 'Staff office' },
  SUPPORT_STAFF: { href: '/office/fees', label: 'Staff office' },
  DRIVER: { href: '/office/fees', label: 'Staff office' },
}

export function HomeAuthBanner({
  staffFirstName,
  schoolName,
  role,
  isSuperAdmin,
}: {
  staffFirstName: string | null
  schoolName: string | null
  role: string | null
  isSuperAdmin: boolean
}) {
  const portal = role ? ROLE_PORTAL[role] : null
  const roleBadge = badgeForSchoolRole(role)
  const superBadge = isSuperAdmin && !role ? PLATFORM_OWNER_BADGE : null
  const headerBadge = roleBadge ?? superBadge

  return (
    <div className="border-b border-brand-700 bg-brand-600 px-4 py-2.5 text-sm text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-white/90">
            {staffFirstName ? (
              <>
                Signed in as <strong className="font-semibold text-white">{staffFirstName}</strong>
                {schoolName && (
                  <>
                    {' '}
                    at <strong className="font-semibold text-white">{schoolName}</strong>
                  </>
                )}
              </>
            ) : isSuperAdmin ? (
              <>
                Signed in as <strong className="font-semibold text-white">platform admin</strong>
              </>
            ) : (
              <>Your account is not linked to a school yet.</>
            )}
          </span>
          {headerBadge && (
            <span
              title={headerBadge.hint}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm',
                headerBadge.className
              )}
            >
              {headerBadge.label}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <Link
              href="/admin/tenants"
              className="rounded-md bg-white/15 px-3 py-1 text-xs font-medium transition hover:bg-white/25"
            >
              Super admin
            </Link>
          )}
          {portal && (
            <Link
              href={portal.href}
              className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-brand-700 transition hover:bg-white/90"
            >
              {portal.label}
            </Link>
          )}
          <SignOutButton>
            <button type="button" className="rounded-md px-2 py-1 text-xs text-white/80 underline hover:text-white">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  )
}
