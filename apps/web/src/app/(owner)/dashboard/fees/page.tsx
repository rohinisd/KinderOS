import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function FeesPage() {
  const { schoolId } = await requireSchoolAuth()

  const [invoices, stats] = await Promise.all([
    prisma.feeInvoice.findMany({
      where: { schoolId },
      include: { student: true, payments: true },
      orderBy: { dueDate: 'asc' },
      take: 50,
    }),
    prisma.feeInvoice.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ])

  return (
    <div>
      <PageHeader
        title="Fee Management"
        description="Invoices, payments, and collection tracking"
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Fee management dashboard — coming soon
        </p>
      </div>
    </div>
  )
}
