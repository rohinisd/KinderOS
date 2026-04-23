import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import { LeaveTracker } from '@/components/staff/leave-tracker'

export const dynamic = 'force-dynamic'

export default async function ClassroomLeavesPage() {
  const { schoolId, userId } = await requireTeacher()

  const items = await prisma.leaveRequest.findMany({
    where: { schoolId, staffId: userId },
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      leaveType: true,
      startDate: true,
      endDate: true,
      reason: true,
      status: true,
      note: true,
      staff: { select: { firstName: true, lastName: true } },
    },
  })

  const serialized = items.map((item) => ({
    id: item.id,
    leaveType: item.leaveType,
    startDate: item.startDate.toISOString(),
    endDate: item.endDate.toISOString(),
    reason: item.reason,
    status: item.status,
    note: item.note,
    staffName: `${item.staff.firstName} ${item.staff.lastName}`.trim(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Tracker"
        description="Request and track your leaves"
      />
      <LeaveTracker canApprove={false} items={serialized} />
    </div>
  )
}
