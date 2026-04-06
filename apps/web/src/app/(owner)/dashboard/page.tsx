import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap, IndianRupee, UserPlus, CalendarCheck, Clock } from 'lucide-react'
import { formatCurrency, toIST } from '@kinderos/utils'
import Link from 'next/link'

export default async function OwnerDashboard() {
  const { schoolId } = await requireSchoolAuth()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    studentCount,
    staffCount,
    pendingFees,
    recentLeads,
    todayAttendance,
    totalAttendanceToday,
    feeCollected,
    recentAnnouncements,
    recentStudents,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
    prisma.staff.count({ where: { schoolId, status: 'ACTIVE' } }),
    prisma.feeInvoice.count({ where: { schoolId, status: { in: ['PENDING', 'OVERDUE'] } } }),
    prisma.admissionLead.count({ where: { schoolId, stage: 'NEW_ENQUIRY' } }),
    prisma.studentAttendance.count({
      where: { schoolId, date: { gte: today }, status: 'PRESENT' },
    }),
    prisma.studentAttendance.count({
      where: { schoolId, date: { gte: today } },
    }),
    prisma.payment.aggregate({
      where: { schoolId, status: 'SUCCESS' },
      _sum: { amount: true },
    }),
    prisma.announcement.findMany({
      where: { schoolId, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    }),
    prisma.student.findMany({
      where: { schoolId, status: 'ACTIVE' },
      include: { class: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const attendanceRate = totalAttendanceToday > 0
    ? Math.round((todayAttendance / totalAttendanceToday) * 100)
    : 0

  const stats = [
    {
      label: 'Total Students',
      value: studentCount,
      icon: Users,
      href: '/dashboard/students',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Active Staff',
      value: staffCount,
      icon: GraduationCap,
      href: '/dashboard/teachers',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Pending Fees',
      value: pendingFees,
      icon: IndianRupee,
      href: '/dashboard/fees',
      color: 'text-orange-600 bg-orange-50',
    },
    {
      label: 'New Enquiries',
      value: recentLeads,
      icon: UserPlus,
      href: '/dashboard/admissions',
      color: 'text-green-600 bg-green-50',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your school."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4" />
              Today&apos;s Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalAttendanceToday > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold">{attendanceRate}%</span>
                  <span className="text-sm text-muted-foreground">
                    {todayAttendance} / {totalAttendanceToday} present
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No attendance marked yet today.{' '}
                <Link href="/dashboard/attendance" className="text-primary hover:underline">
                  Mark attendance
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IndianRupee className="h-4 w-4" />
              Fee Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">
                {formatCurrency(feeCollected._sum.amount ?? 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total collected to date</p>
              <Link
                href="/dashboard/fees"
                className="inline-block text-sm text-primary hover:underline"
              >
                View all invoices
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-3">
                {recentAnnouncements.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.publishedAt ? toIST(a.publishedAt) : 'Draft'}
                      </p>
                    </div>
                    <Badge variant={a.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentStudents.length > 0 ? (
              <div className="space-y-3">
                {recentStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.class?.name ?? 'Unassigned'} &middot; {s.admissionNumber}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{s.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
