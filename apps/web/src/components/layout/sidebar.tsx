'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
} from 'lucide-react'

type Portal = 'owner' | 'teacher' | 'admin' | 'superadmin'

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
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  teacher: [
    { label: 'My Classroom', href: '/classroom', icon: LayoutDashboard },
    { label: 'Attendance', href: '/classroom/attendance', icon: CalendarCheck },
    { label: 'Assignments', href: '/classroom/assignments', icon: BookOpen },
    { label: 'Parents', href: '/classroom/parents', icon: MessageSquare },
    { label: 'Reports', href: '/classroom/reports', icon: FileText },
  ],
  admin: [
    { label: 'Students', href: '/office/students', icon: Users },
    { label: 'Staff', href: '/office/staff', icon: GraduationCap },
    { label: 'Fee Collection', href: '/office/fees', icon: IndianRupee },
    { label: 'Receipts', href: '/office/receipts', icon: Receipt },
    { label: 'Attendance', href: '/office/attendance', icon: CalendarCheck },
    { label: 'Admissions', href: '/office/admissions', icon: UserPlus },
    { label: 'Announcements', href: '/office/announcements', icon: Megaphone },
  ],
  superadmin: [
    { label: 'Schools', href: '/admin/tenants', icon: Building2 },
    { label: 'Billing', href: '/admin/billing', icon: CreditCard },
    { label: 'Feature Flags', href: '/admin/feature-flags', icon: ToggleLeft },
  ],
}

export function Sidebar({ portal }: { portal: Portal }) {
  const pathname = usePathname()
  const items = navItems[portal]

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-white lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            K
          </div>
          <span className="text-lg font-semibold">KinderOS</span>
        </Link>
      </div>

      <nav className="mt-4 space-y-1 px-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              item.href !== '/classroom' &&
              pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
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
