import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function OwnerDashboard() {
  const { schoolId } = await requireSchoolAuth()

  const [studentCount, staffCount, pendingFees, recentLeads] =
    await Promise.all([
      prisma.student.count({
        where: { schoolId, status: 'ACTIVE' },
      }),
      prisma.staff.count({
        where: { schoolId, status: 'ACTIVE' },
      }),
      prisma.feeInvoice.count({
        where: { schoolId, status: { in: ['PENDING', 'OVERDUE'] } },
      }),
      prisma.admissionLead.count({
        where: { schoolId, stage: 'NEW_ENQUIRY' },
      }),
    ])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your school"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={studentCount} />
        <StatCard label="Active Staff" value={staffCount} />
        <StatCard label="Pending Fees" value={pendingFees} />
        <StatCard label="New Enquiries" value={recentLeads} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  )
}
