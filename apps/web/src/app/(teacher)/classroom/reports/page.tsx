import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

function attendancePercent(statuses: string[]): number | null {
  const relevant = statuses.filter((s) => s !== 'HOLIDAY')
  if (relevant.length === 0) return null
  const attended = relevant.filter(
    (s) => s === 'PRESENT' || s === 'LATE' || s === 'HALF_DAY'
  ).length
  return Math.round((attended / relevant.length) * 100)
}

export default async function ProgressReportsPage() {
  const { schoolId, userId } = await requireTeacher()

  const teacherClass = await prisma.class.findFirst({
    where: { schoolId, classTeacherId: userId },
    include: {
      students: {
        where: { status: 'ACTIVE', deletedAt: null },
        orderBy: { firstName: 'asc' },
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  if (!teacherClass) {
    return (
      <div>
        <PageHeader
          title="Reports"
          description="Generate progress summaries for your students"
        />
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No class assigned yet. Please contact your school administrator.
          </CardContent>
        </Card>
      </div>
    )
  }

  const studentIds = teacherClass.students.map((s) => s.id)

  const attendanceByStudent: Record<string, string[]> = {}
  studentIds.forEach((id) => {
    attendanceByStudent[id] = []
  })

  if (studentIds.length > 0) {
    const rows = await prisma.studentAttendance.findMany({
      where: { schoolId, studentId: { in: studentIds } },
      select: { studentId: true, status: true },
    })
    rows.forEach((r) => {
      attendanceByStudent[r.studentId]?.push(r.status)
    })
  }

  const classLabel = `${teacherClass.name}${teacherClass.section ? ` ${teacherClass.section}` : ''}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`Attendance overview — ${classLabel}`}
      />

      <div className="grid gap-4">
        {teacherClass.students.map((student) => {
          const pct = attendancePercent(attendanceByStudent[student.id] ?? [])
          return (
            <Card key={student.id}>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {student.firstName} {student.lastName}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{classLabel}</p>
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">Attendance</span>{' '}
                      <span className="font-semibold tabular-nums">
                        {pct === null ? '—' : `${pct}%`}
                      </span>
                    </p>
                  </div>
                </div>
                <Button type="button" disabled className="w-full sm:w-auto">
                  Generate report
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Report generation will be enabled in a future update.
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {teacherClass.students.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No active students in this class.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
