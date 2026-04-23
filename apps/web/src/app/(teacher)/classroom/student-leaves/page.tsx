import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { StudentLeaveApprovalsClient } from '@/components/teacher/student-leave-approvals-client'

export const dynamic = 'force-dynamic'

export default async function ClassroomStudentLeavesPage() {
  const { schoolId, userId } = await requireTeacher()

  const teacherClass = await prisma.class.findFirst({
    where: { schoolId, classTeacherId: userId },
    select: { id: true, name: true, section: true },
  })

  if (!teacherClass) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Student Leave Requests"
          description="Review parent leave applications for your class"
        />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No class assigned yet. Once you are assigned as class teacher, leave requests will appear here.
          </CardContent>
        </Card>
      </div>
    )
  }

  const requests = await prisma.studentLeaveRequest.findMany({
    where: { schoolId, classId: teacherClass.id },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      reason: true,
      status: true,
      note: true,
      createdAt: true,
      student: { select: { firstName: true, lastName: true } },
      parent: { select: { firstName: true, lastName: true } },
    },
  })

  const classLabel = [teacherClass.name, teacherClass.section].filter(Boolean).join(' · ')
  const items = requests.map((item) => ({
    id: item.id,
    studentName: `${item.student.firstName} ${item.student.lastName}`.trim(),
    parentName: `${item.parent.firstName} ${item.parent.lastName}`.trim(),
    classLabel,
    startDate: item.startDate.toISOString(),
    endDate: item.endDate.toISOString(),
    reason: item.reason,
    status: item.status,
    note: item.note,
    createdAt: item.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Leave Requests"
        description={`Parent requests for ${classLabel}`}
      />
      <StudentLeaveApprovalsClient items={items} />
    </div>
  )
}
