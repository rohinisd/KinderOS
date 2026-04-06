import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { FeesClient } from './fees-client'

export default async function FeesPage() {
  const { schoolId } = await requireSchoolAuth()

  const [invoices, statsRaw, students] = await Promise.all([
    prisma.feeInvoice.findMany({
      where: { schoolId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNumber: true },
        },
        payments: {
          select: { id: true, amount: true, status: true },
        },
      },
      orderBy: { dueDate: 'desc' },
      take: 100,
    }),
    prisma.feeInvoice.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.student.findMany({
      where: { schoolId, status: 'ACTIVE', deletedAt: null },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true },
      orderBy: { firstName: 'asc' },
    }),
  ])

  const serializedInvoices = invoices.map((inv) => ({
    ...inv,
    dueDate: inv.dueDate.toISOString(),
    createdAt: undefined,
    updatedAt: undefined,
  }))

  const stats = statsRaw.map((s) => ({
    status: s.status,
    count: s._count,
    total: s._sum.totalAmount ?? 0,
  }))

  return (
    <div>
      <PageHeader
        title="Fee Management"
        description="Invoices, payments, and collection tracking"
      />
      <div className="mt-6">
        <FeesClient
          invoices={serializedInvoices as never}
          students={students}
          stats={stats}
        />
      </div>
    </div>
  )
}
