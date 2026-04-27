'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { OfficePortalVariant } from '@/lib/portal-variants'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  IndianRupee,
  CalendarCheck,
  UserPlus,
  Megaphone,
  Palette,
  BarChart3,
  Settings,
  BookOpen,
  MessageSquare,
  FileText,
  Receipt,
  Building2,
  CreditCard,
  ToggleLeft,
  Globe,
  Clock,
  CalendarDays,
  ImageIcon,
  Database,
} from 'lucide-react'

type Portal = 'owner' | 'teacher' | 'admin' | 'superadmin'

const PORTAL_RIBBON: Record<
  Exclude<Portal, 'admin'>,
  { title: string; subtitle: string; box: string; kicker: string }
> = {
  owner: {
    title: 'Owner portal',
    subtitle: 'Fees, staff, branding & analytics',
    box: 'border-brand-200 bg-brand-50',
    kicker: 'text-brand-800',
  },
  teacher: {
    title: 'Classroom portal',
    subtitle: 'Your classes, attendance & parents',
    box: 'border-amber-200 bg-amber-50',
    kicker: 'text-amber-950',
  },
  superadmin: {
    title: 'Platform owner',
    subtitle: 'Schools, billing & feature flags',
    box: 'border-violet-200 bg-violet-50',
    kicker: 'text-violet-900',
  },
}

const OFFICE_RIBBON: Record<
  OfficePortalVariant,
  { title: string; subtitle: string; box: string; kicker: string }
> = {
  staff: {
    title: 'Staff portal',
    subtitle: 'Students, fees, attendance & day-to-day',
    box: 'border-teal-200 bg-teal-50',
    kicker: 'text-teal-900',
  },
  admin: {
    title: 'Admin portal',
    subtitle: 'School-wide administration & office oversight',
    box: 'border-slate-200 bg-slate-50',
    kicker: 'text-slate-900',
  },
}

const navItems: Record<Portal, { label: string; href: string; icon: React.ElementType }[]> = {
  owner: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/dashboard/students', icon: Users },
    { label: 'Staff', href: '/dashboard/teachers', icon: GraduationCap },
    { label: 'Fees', href: '/dashboard/fees', icon: IndianRupee },
    { label: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
    { label: 'Admissions', href: '/dashboard/admissions', icon: UserPlus },
    { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
    { label: 'Customize', href: '/dashboard/customize', icon: Palette },
    { label: 'School website', href: '/office/website', icon: Globe },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  teacher: [
    { label: 'My Classroom', href: '/classroom', icon: LayoutDashboard },
    { label: 'Punch In / Out', href: '/classroom/punch', icon: Clock },
    { label: 'Attendance', href: '/classroom/attendance', icon: CalendarCheck },
    { label: 'Homework', href: '/classroom/homework', icon: BookOpen },
    { label: 'Class Events', href: '/classroom/events', icon: ImageIcon },
    { label: 'Leaves', href: '/classroom/leaves', icon: CalendarDays },
    { label: 'Student Leaves', href: '/classroom/student-leaves', icon: CalendarDays },
    { label: 'Parents', href: '/classroom/parents', icon: MessageSquare },
    { label: 'Reports', href: '/classroom/reports', icon: FileText },
  ],
  admin: [
    { label: 'Students', href: '/office/students', icon: Users },
    { label: 'Staff Punch', href: '/office/punch', icon: Clock },
    { label: 'Staff', href: '/office/staff', icon: GraduationCap },
    { label: 'Leaves', href: '/office/leaves', icon: CalendarDays },
    { label: 'Fee Collection', href: '/office/fees', icon: IndianRupee },
    { label: 'Receipts', href: '/office/receipts', icon: Receipt },
    { label: 'Attendance', href: '/office/attendance', icon: CalendarCheck },
    { label: 'Admissions', href: '/office/admissions', icon: UserPlus },
    { label: 'Announcements', href: '/office/announcements', icon: Megaphone },
    { label: 'School Events', href: '/office/events', icon: ImageIcon },
    { label: 'School website', href: '/office/website', icon: Globe },
  ],
  superadmin: [
    { label: 'Schools', href: '/admin/tenants', icon: Building2 },
    { label: 'Billing', href: '/admin/billing', icon: CreditCard },
    { label: 'Feature Flags', href: '/admin/feature-flags', icon: ToggleLeft },
    { label: 'Backups', href: '/admin/backups', icon: Database },
  ],
}

export function Sidebar({
  portal,
  officeVariant = 'staff',
}: {
  portal: Portal
  /** On `/office`: `ADMIN` role → admin styling; else staff. Ignored for other portals. */
  officeVariant?: OfficePortalVariant
}) {
  const pathname = usePathname()
  const items = navItems[portal]

  const ribbon =
    portal === 'admin'
      ? OFFICE_RIBBON[officeVariant]
      : PORTAL_RIBBON[portal]

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-white lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white',
              portal === 'admin' && officeVariant === 'admin' && 'bg-slate-700',
              portal === 'admin' && officeVariant === 'staff' && 'bg-teal-600',
              portal === 'teacher' && 'bg-amber-600',
              portal === 'superadmin' && 'bg-violet-600',
              portal === 'owner' && 'bg-brand-500'
            )}
          >
            VP
          </div>
          <span className="text-lg font-semibold">VidyaPrabandha</span>
        </Link>
      </div>

      <div className={cn('mx-3 mt-3 rounded-lg border px-3 py-2.5', ribbon.box)}>
        <p className={cn('text-xs font-semibold', ribbon.kicker)}>{ribbon.title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-600">{ribbon.subtitle}</p>
      </div>

      <nav className="mt-3 space-y-1 px-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              item.href !== '/classroom' &&
              item.href !== '/office/website' &&
              pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? portal === 'admin'
                    ? officeVariant === 'admin'
                      ? 'bg-slate-200/80 text-slate-950'
                      : 'bg-teal-50 text-teal-900'
                    : portal === 'teacher'
                      ? 'bg-amber-50 text-amber-950'
                      : portal === 'superadmin'
                        ? 'bg-violet-50 text-violet-900'
                        : 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
