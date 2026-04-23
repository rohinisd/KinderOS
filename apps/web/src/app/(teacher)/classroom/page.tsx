import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CalendarCheck, UserX, ClipboardList, Megaphone, Clock, CalendarDays } from 'lucide-react'
import { toIST } from '@kinderos/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ClassroomPage() {
  const { schoolId, userId } = await requireTeacher()

  const [staff, teacherClass] = await Promise.all([
    prisma.staff.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    }),
    prisma.class.findFirst({
      where: { schoolId, classTeacherId: userId },
      include: {
        students: {
          where: { status: 'ACTIVE', deletedAt: null },
          orderBy: { firstName: 'asc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            status: true,
          },
        },
      },
    }),
  ])

  const teacherName = staff
    ? `${staff.firstName} ${staff.lastName}`.trim()
    : 'Teacher'

  if (!teacherClass) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Classroom"
          description={`Welcome, ${teacherName}`}
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No class assigned yet. Please contact your school administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const studentIds = teacherClass.students.map((s) => s.id)
  const isoToday = new Date().toISOString().slice(0, 10)
  const dayStart = new Date(`${isoToday}T00:00:00.000Z`)
  const dayEnd = new Date(dayStart)
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)

  const [todayAttendance, recentAnnouncements, pendingHomeworkCount, pendingStudentLeaveCount] = await Promise.all([
    prisma.studentAttendance.findMany({
      where: {
        schoolId,
        classId: teacherClass.id,
        studentId: { in: studentIds },
        date: { gte: dayStart, lt: dayEnd },
      },
      select: { status: true },
    }),
    prisma.announcement.findMany({
      where: { schoolId, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        body: true,
        status: true,
        publishedAt: true,
      },
    }),
    prisma.assignment.count({
      where: {
        schoolId,
        classId: teacherClass.id,
        dueDate: { gte: dayStart },
      },
    }),
    prisma.studentLeaveRequest.count({
      where: {
        schoolId,
        classId: teacherClass.id,
        status: 'PENDING',
      },
    }),
  ])

  const presentToday = todayAttendance.filter((a) => a.status === 'PRESENT').length
  const absentToday = todayAttendance.filter((a) => a.status === 'ABSENT').length
  const totalStudents = teacherClass.students.length

  const stats = [
    {
      label: 'Students in class',
      value: totalStudents,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Present today',
      value: presentToday,
      icon: CalendarCheck,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Absent today',
      value: absentToday,
      icon: UserX,
      color: 'text-red-600 bg-red-50',
    },
    {
      label: 'Pending homework',
      value: pendingHomeworkCount,
      icon: ClipboardList,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Pending leave requests',
      value: pendingStudentLeaveCount,
      icon: CalendarDays,
      color: 'text-purple-600 bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classroom"
        description={`Welcome, ${teacherName} — ${teacherClass.name}${teacherClass.section ? ` · ${teacherClass.section}` : ''}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
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
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Student leave requests
            </CardTitle>
            <Link href="/classroom/student-leaves" className="text-sm text-primary hover:underline">
              Review now
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {pendingStudentLeaveCount > 0
                ? `${pendingStudentLeaveCount} leave request(s) pending your review.`
                : 'No pending leave requests right now.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Your students
            </CardTitle>
            <Link
              href="/classroom/attendance"
              className="text-sm text-primary hover:underline"
            >
              Mark attendance
            </Link>
          </CardHeader>
          <CardContent>
            {teacherClass.students.length > 0 ? (
              <div className="space-y-3">
                {teacherClass.students.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {s.firstName[0]}
                        {s.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.admissionNumber}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{s.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active students in this class.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4" />
              Recent announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-3">
                {recentAnnouncements.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {a.publishedAt ? toIST(a.publishedAt) : '—'}
                      </p>
                    </div>
                    <Badge variant="success">{a.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
