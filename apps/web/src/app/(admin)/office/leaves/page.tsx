import { getAuthUser, requireSchoolAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { LeaveTracker } from '@/components/staff/leave-tracker'

export const dynamic = 'force-dynamic'

const APPROVER_ROLES = new Set(['OWNER', 'PRINCIPAL', 'ADMIN'])

export default async function OfficeLeavesPage() {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/no-access')
  const { schoolId, userId } = await requireSchoolAuth()
  const canApprove = APPROVER_ROLES.has(authUser.role)

  const items = await prisma.leaveRequest.findMany({
    where: canApprove ? { schoolId } : { schoolId, staffId: userId },
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
        description={canApprove ? 'Approve or reject staff leaves' : 'Request and track your leaves'}
      />
      <LeaveTracker canApprove={canApprove} items={serialized} />
    </div>
  )
}
