import { getParentPortalUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { StudentLeaveClient } from '@/components/parent/student-leave-client'

export const dynamic = 'force-dynamic'

export default async function ParentLeavesPage() {
  const user = await getParentPortalUser()
  if (!user) redirect('/no-access')

  const parent = await prisma.parent.findFirst({
    where: { id: user.parentId },
    select: {
      id: true,
      students: {
        where: { schoolId: user.schoolId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          class: { select: { name: true, section: true } },
        },
      },
      leaveRequests: {
        where: { schoolId: user.schoolId },
        orderBy: [{ createdAt: 'desc' }],
        take: 50,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          reason: true,
          status: true,
          note: true,
          createdAt: true,
          student: {
            select: {
              firstName: true,
              lastName: true,
              class: { select: { name: true, section: true } },
            },
          },
        },
      },
    },
  })

  const students = (parent?.students ?? []).map((student) => ({
    id: student.id,
    label: `${student.firstName} ${student.lastName}`.trim(),
  }))

  const items = (parent?.leaveRequests ?? []).map((item) => ({
    id: item.id,
    studentName: `${item.student.firstName} ${item.student.lastName}`.trim(),
    classLabel: item.student.class
      ? [item.student.class.name, item.student.class.section].filter(Boolean).join(' · ')
      : 'Class not assigned',
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
        title="Student Leave"
        description="Apply leave for your child and track class teacher updates"
      />
      <StudentLeaveClient students={students} items={items} />
    </div>
  )
}
