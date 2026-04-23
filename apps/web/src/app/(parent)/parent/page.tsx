import { getParentPortalUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { formatCurrency, toIST } from '@kinderos/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AttendanceStatus, Prisma } from '@kinderos/db'

export const dynamic = 'force-dynamic'

const PENDING_FEE_STATUSES = ['PENDING', 'PARTIAL', 'OVERDUE'] as const

function attendanceDayUtc(): Date {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return new Date(`${ymd}T00:00:00Z`)
}

function attendanceLabel(status: AttendanceStatus): { text: string; variant: 'success' | 'destructive' | 'warning' | 'secondary' | 'info' } {
  switch (status) {
    case 'PRESENT':
      return { text: 'Present', variant: 'success' }
    case 'ABSENT':
      return { text: 'Absent', variant: 'destructive' }
    case 'LATE':
      return { text: 'Late', variant: 'warning' }
    case 'HALF_DAY':
      return { text: 'Half day', variant: 'info' }
    case 'HOLIDAY':
      return { text: 'Holiday', variant: 'secondary' }
  }
}

export default async function ParentDashboard() {
  const user = await getParentPortalUser()
  if (!user) redirect('/no-access')

  const noChildrenMessage = 'No children linked to your account. Please contact your school.'

  const parentRows = await prisma.parent.findMany({
    where: { email: { equals: user.email, mode: 'insensitive' } },
    include: {
      students: {
        where: { schoolId: user.schoolId, deletedAt: null },
        include: { class: true },
      },
    },
  })

  const byId = new Map<
    string,
    {
      id: string
      firstName: string
      lastName: string
      admissionNumber: string
      classId: string | null
      class: { name: string; section: string | null } | null
    }
  >()
  for (const p of parentRows) {
    for (const s of p.students) {
      byId.set(s.id, {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        admissionNumber: s.admissionNumber,
        classId: s.classId,
        class: s.class,
      })
    }
  }
  const children = [...byId.values()]
  const childIds = children.map((c) => c.id)
  const childClassIds = [...new Set(children.map((c) => c.classId).filter((id): id is string => Boolean(id)))]

  if (children.length === 0) {
    return (
      <div>
        <PageHeader
          title="My Child's Day"
          description="A gentle snapshot of attendance, news, and fees for your little one"
        />
        <Card className="mt-6 border-amber-100 bg-amber-50/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-amber-900">Welcome to your family dashboard</CardTitle>
            <CardDescription className="text-amber-800/90">{noChildrenMessage}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const todayAt = attendanceDayUtc()

  const audienceOr: Prisma.AnnouncementWhereInput[] = [
    { targetAudience: 'ALL' },
    { targetAudience: 'PARENTS' },
  ]
  if (childClassIds.length > 0) {
    audienceOr.push({
      targetAudience: 'SPECIFIC_CLASSES',
      classIds: { hasSome: childClassIds },
    })
  }

  const [attendanceToday, announcements, pendingFees] = await Promise.all([
    prisma.studentAttendance.findMany({
      where: { studentId: { in: childIds }, date: todayAt },
      select: { studentId: true, status: true },
    }),
    prisma.announcement.findMany({
      where: {
        schoolId: user.schoolId,
        status: 'PUBLISHED',
        publishedAt: { not: null },
        OR: audienceOr,
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, body: true, publishedAt: true },
    }),
    prisma.feeInvoice.aggregate({
      where: {
        schoolId: user.schoolId,
        studentId: { in: childIds },
        status: { in: [...PENDING_FEE_STATUSES] },
      },
      _sum: { totalAmount: true },
    }),
  ])

  const attendanceByStudent = new Map(attendanceToday.map((a) => [a.studentId, a.status]))

  const pendingTotal = pendingFees._sum.totalAmount ?? 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Child's Day"
        description="A gentle snapshot of attendance, news, and fees for your little one"
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => {
          const classLabel = child.class
            ? [child.class.name, child.class.section].filter(Boolean).join(' · ')
            : 'Class not assigned'
          const rawStatus = attendanceByStudent.get(child.id)
          const badge = rawStatus
            ? attendanceLabel(rawStatus)
            : { text: 'Not marked', variant: 'secondary' as const }

          return (
            <Card
              key={child.id}
              className="overflow-hidden border-violet-100 bg-gradient-to-br from-white to-violet-50/40 shadow-sm"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl font-semibold text-violet-950">
                      {child.firstName} {child.lastName}
                    </CardTitle>
                    <CardDescription className="mt-1 text-violet-800/80">{classLabel}</CardDescription>
                  </div>
                  <Badge variant={badge.variant}>{badge.text}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-violet-900/85">
                <p>
                  <span className="font-medium text-violet-950">Admission no.</span>{' '}
                  {child.admissionNumber}
                </p>
                <p>
                  <span className="font-medium text-violet-950">Today&apos;s attendance</span>{' '}
                  <span className="text-violet-800">{badge.text}</span>
                </p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-rose-100 bg-rose-50/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg text-rose-900">Fees at a glance</CardTitle>
            <CardDescription className="text-rose-800/85">Total pending across your children</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold tracking-tight text-rose-950">{formatCurrency(pendingTotal)}</p>
            <p className="text-sm text-rose-800/90">
              Pay when you&apos;re ready — your school can help with questions anytime.
            </p>
            <Button asChild variant="secondary" className="bg-white/90 text-rose-900 hover:bg-white">
              <Link href="/parent/fees">View fee details</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/parent/homework">View homework</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-sky-100 bg-sky-50/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-sky-950">From the school</CardTitle>
            <CardDescription className="text-sky-900/75">Latest announcements for families</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-sky-900/70">No announcements yet — check back soon for updates.</p>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-sky-100/80 bg-white/80 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-sky-950">{a.title}</h3>
                    {a.publishedAt ? (
                      <span className="text-xs text-sky-800/75">{toIST(a.publishedAt)}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-sky-900/85">{a.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
