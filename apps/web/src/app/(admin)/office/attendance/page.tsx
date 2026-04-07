import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { AttendanceClient } from '@/app/(owner)/dashboard/attendance/attendance-client'

export const dynamic = 'force-dynamic'

export default async function OfficeAttendancePage() {
  const { schoolId } = await requireSchoolAuth()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [classes, todayRecords] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId },
      include: {
        students: {
          where: { status: 'ACTIVE', deletedAt: null },
          select: { id: true, firstName: true, lastName: true, admissionNumber: true },
          orderBy: { firstName: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.studentAttendance.findMany({
      where: { schoolId, date: { gte: today } },
      select: { studentId: true, date: true, status: true },
    }),
  ])

  const serializedClasses = classes.map((c) => ({
    id: c.id,
    name: c.name,
    students: c.students,
  }))

  const serializedRecords = todayRecords.map((r) => ({
    studentId: r.studentId,
    date: r.date.toISOString(),
    status: r.status,
  }))

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark and manage daily attendance"
      />
      <div className="mt-6">
        <AttendanceClient classes={serializedClasses} todayRecords={serializedRecords} />
      </div>
    </div>
  )
}
