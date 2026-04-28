import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { LeaveTracker } from '@/components/staff/leave-tracker'

export const dynamic = 'force-dynamic'

export default async function OwnerLeavesPage() {
  const user = await requireAuth()
  if (user.role !== 'OWNER') redirect('/no-access')

  const schoolId = user.school.id
  const year = new Date().getFullYear()

  const [items, balances, staff, school] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { schoolId },
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
    }),
    prisma.leaveBalance.findMany({
      where: { schoolId, year },
      include: { staff: { select: { firstName: true, lastName: true, designation: true } } },
      orderBy: { staff: { firstName: 'asc' } },
    }),
    prisma.staff.findMany({
      where: { schoolId, deletedAt: null, role: { not: 'OWNER' } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { leavePolicy: true },
    }),
  ])

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

  const policy =
    school?.leavePolicy && typeof school.leavePolicy === 'object'
      ? (school.leavePolicy as { clTotal?: number; slTotal?: number; elTotal?: number })
      : null
  const leaveDefaults = {
    clTotal: typeof policy?.clTotal === 'number' ? policy.clTotal : 12,
    slTotal: typeof policy?.slTotal === 'number' ? policy.slTotal : 7,
    elTotal: typeof policy?.elTotal === 'number' ? policy.elTotal : 15,
  }

  const balanceRows = balances.map((b) => ({
    id: b.id,
    staffId: b.staffId,
    staffName: `${b.staff.firstName} ${b.staff.lastName}`.trim(),
    designation: b.staff.designation,
    clTotal: b.clTotal,
    clUsed: b.clUsed,
    slTotal: b.slTotal,
    slUsed: b.slUsed,
    elTotal: b.elTotal,
    elUsed: b.elUsed,
  }))

  const balancedStaffIds = new Set(balanceRows.map((r) => r.staffId))
  const missingStaff = staff
    .filter((s) => !balancedStaffIds.has(s.id))
    .map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`.trim(),
    }))

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Tracker" description="Approve leaves and manage CL/SL/EL balances" />
      <LeaveTracker
        canApprove
        items={serialized}
        canManageBalances
        balanceRows={balanceRows}
        missingStaff={missingStaff}
        balanceYear={year}
        leaveDefaults={leaveDefaults}
      />
    </div>
  )
}
