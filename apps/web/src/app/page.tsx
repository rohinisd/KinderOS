import Link from 'next/link'
import { Crown, GraduationCap, ClipboardList, Users } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { SignOutButton } from '@clerk/nextjs'

const ROLE_PORTAL: Record<string, { href: string; label: string }> = {
  OWNER: { href: '/dashboard', label: 'Owner Dashboard' },
  PRINCIPAL: { href: '/dashboard', label: 'Owner Dashboard' },
  CLASS_TEACHER: { href: '/classroom', label: 'Teacher Classroom' },
  SUBJECT_TEACHER: { href: '/classroom', label: 'Teacher Classroom' },
  ADMIN: { href: '/office/fees', label: 'Admin Office' },
  ACCOUNTANT: { href: '/office/fees', label: 'Admin Office' },
  SUPPORT_STAFF: { href: '/office/fees', label: 'Admin Office' },
  DRIVER: { href: '/office/fees', label: 'Admin Office' },
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { userId } = await auth()

  let staffInfo: { firstName: string; role: string; schoolName: string } | null = null
  if (userId) {
    const staff = await prisma.staff.findUnique({
      where: { clerkUserId: userId },
      include: { school: { select: { name: true } } },
    })
    if (staff) {
      staffInfo = {
        firstName: staff.firstName,
        role: staff.role,
        schoolName: staff.school.name,
      }
    }
  }

  const portal = staffInfo ? ROLE_PORTAL[staffInfo.role] : null

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
            K
          </div>
          <span className="text-lg font-semibold text-white">KinderOS</span>
        </div>

        {staffInfo ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70">
              {staffInfo.firstName} ({staffInfo.role})
            </span>
            <SignOutButton>
              <button className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in?redirect_url=/dashboard"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Owner</span>
            </Link>
            <Link
              href="/sign-in?redirect_url=/classroom"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Teacher</span>
            </Link>
            <Link
              href="/sign-in?redirect_url=/office/fees"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Staff</span>
            </Link>
            <Link
              href="/sign-in?redirect_url=/parent"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Parent</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          KinderOS
        </h1>
        <p className="mt-4 max-w-xl text-xl text-white/80">
          Give every kindergarten their own digital school
        </p>
        <p className="mt-2 text-lg text-white/60">
          Multi-tenant school management built for India
        </p>

        {staffInfo && portal ? (
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-sm text-white/60">
              Signed in as <span className="font-medium text-white">{staffInfo.firstName}</span> at{' '}
              <span className="font-medium text-white">{staffInfo.schoolName}</span>
            </p>
            <Link
              href={portal.href}
              className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-purple-700 shadow-lg transition hover:bg-white/90"
            >
              Go to {portal.label}
            </Link>
            <SignOutButton>
              <button className="mt-1 text-sm text-white/60 underline transition hover:text-white">
                Sign out to switch account
              </button>
            </SignOutButton>
          </div>
        ) : userId && !staffInfo ? (
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-sm text-white/60">
              Signed in but not linked to any school.
            </p>
            <Link
              href="/no-access"
              className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-purple-700 shadow-lg transition hover:bg-white/90"
            >
              Check Access
            </Link>
            <SignOutButton>
              <button className="mt-1 text-sm text-white/60 underline transition hover:text-white">
                Sign out to switch account
              </button>
            </SignOutButton>
          </div>
        ) : (
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-in?redirect_url=/dashboard"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-purple-700 shadow-lg transition hover:bg-white/90"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up?redirect_url=/dashboard"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-6 pb-12 sm:grid-cols-4">
        {[
          { icon: Crown, label: 'Owner Portal', desc: 'Full school management' },
          { icon: GraduationCap, label: 'Teacher Portal', desc: 'Classroom & attendance' },
          { icon: ClipboardList, label: 'Staff Portal', desc: 'Fees & admissions' },
          { icon: Users, label: 'Parent Portal', desc: 'Stay connected' },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="rounded-xl bg-white/10 p-4 text-center backdrop-blur"
          >
            <Icon className="mx-auto h-6 w-6 text-white/80" />
            <p className="mt-2 text-sm font-medium text-white">{label}</p>
            <p className="mt-1 text-xs text-white/60">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
