import type { AppPortal, OfficePortalVariant } from '@/lib/portal-variants'

/** Shared styles: TopBar, sidebar context, and signed-in home banner. */
export type PortalBadge = { label: string; hint: string; className: string }

const BASE: Record<Exclude<AppPortal, 'admin'>, PortalBadge> = {
  owner: {
    label: 'Owner',
    hint: 'Full school control',
    className: 'border-brand-200 bg-brand-50 text-brand-800',
  },
  teacher: {
    label: 'Classroom',
    hint: 'Teaching',
    className: 'border-amber-200 bg-amber-50 text-amber-950',
  },
  superadmin: {
    label: 'Platform owner',
    hint: 'Manage all schools on KinderOS',
    className: 'border-violet-200 bg-violet-50 text-violet-900',
  },
}

const OFFICE: Record<OfficePortalVariant, PortalBadge> = {
  staff: {
    label: 'Staff',
    hint: 'Office & day-to-day school operations',
    className: 'border-teal-300 bg-teal-50 text-teal-950 ring-1 ring-teal-200/80',
  },
  admin: {
    label: 'Admin',
    hint: 'School administrator tools',
    className: 'border-slate-300 bg-slate-100 text-slate-900 ring-1 ring-slate-200/90',
  },
}

export function badgeForAppPortal(
  portal: AppPortal,
  officeVariant: OfficePortalVariant | undefined
): PortalBadge {
  if (portal === 'admin') {
    return OFFICE[officeVariant ?? 'staff']
  }
  return BASE[portal]
}

/**
 * Badge to show on the marketing home banner when signed in (no app shell / TopBar).
 * Aligns with school StaffRole.
 */
export function badgeForSchoolRole(role: string | null): PortalBadge | null {
  if (!role) return null
  switch (role) {
    case 'OWNER':
      return BASE.owner
    case 'ADMIN':
      return OFFICE.admin
    case 'PRINCIPAL':
    case 'ACCOUNTANT':
    case 'SUPPORT_STAFF':
    case 'DRIVER':
      return OFFICE.staff
    case 'CLASS_TEACHER':
    case 'SUBJECT_TEACHER':
      return BASE.teacher
    default:
      return null
  }
}

export const PLATFORM_OWNER_BADGE: PortalBadge = BASE.superadmin
