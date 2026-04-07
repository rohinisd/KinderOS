import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import { TeacherAttendanceClient } from './teacher-attendance-client'

export const dynamic = 'force-dynamic'

function parseViewDate(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date().toISOString().slice(0, 10)
  }
  const t = new Date(`${raw}T12:00:00.000Z`).getTime()
  if (Number.isNaN(t)) {
    return new Date().toISOString().slice(0, 10)
  }
  return raw
}

function utcDayRange(isoDate: string): { start: Date; end: Date } {
  const start = new Date(`${isoDate}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

type SearchParams = Promise<{ date?: string | string[] }>

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { schoolId, userId } = await requireTeacher()
  const params = await searchParams
  const rawDate = typeof params.date === 'string' ? params.date : undefined
  const selectedDate = parseViewDate(rawDate)
  const { start: dayStart, end: dayEnd } = utcDayRange(selectedDate)

  const teacherClass = await prisma.class.findFirst({
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
        },
      },
    },
  })

  if (!teacherClass) {
    return (
      <div>
        <PageHeader
          title="Attendance"
          description="Mark daily attendance for your class"
        />
        <div className="mt-6 rounded-lg border bg-white p-6 text-center text-sm text-muted-foreground">
          No class assigned yet. Please contact your school administrator.
        </div>
      </div>
    )
  }

  const studentIds = teacherClass.students.map((s) => s.id)

  const todayRecords =
    studentIds.length === 0
      ? []
      : await prisma.studentAttendance.findMany({
          where: {
            schoolId,
            classId: teacherClass.id,
            studentId: { in: studentIds },
            date: { gte: dayStart, lt: dayEnd },
          },
          select: { studentId: true, date: true, status: true },
        })

  const serializedClass = {
    id: teacherClass.id,
    name: teacherClass.name,
    section: teacherClass.section,
    students: teacherClass.students,
  }

  const serializedRecords = todayRecords.map((r) => ({
    studentId: r.studentId,
    date: r.date.toISOString(),
    status: r.status,
  }))

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark daily attendance for your class"
      />
      <div className="mt-6">
        <TeacherAttendanceClient
          classData={serializedClass}
          selectedDate={selectedDate}
          dayRecords={serializedRecords}
        />
      </div>
    </div>
  )
}
