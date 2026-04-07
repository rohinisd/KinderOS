import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { ReceiptsClient } from './receipts-client'

export const dynamic = 'force-dynamic'

export default async function OfficeReceiptsPage() {
  const { schoolId } = await requireSchoolAuth()

  const payments = await prisma.payment.findMany({
    where: { schoolId, status: 'SUCCESS' },
    orderBy: { paidAt: 'desc' },
    take: 500,
    include: {
      invoice: {
        include: {
          student: {
            select: { firstName: true, lastName: true, admissionNumber: true },
          },
        },
      },
    },
  })

  const rows = payments.map((p) => ({
    id: p.id,
    receiptNumber: p.receiptNumber,
    amount: p.amount,
    method: p.method,
    referenceNumber: p.referenceNumber,
    paidAt: p.paidAt?.toISOString() ?? null,
    studentName: `${p.invoice.student.firstName} ${p.invoice.student.lastName}`,
    admissionNumber: p.invoice.student.admissionNumber,
  }))

  return (
    <div>
      <PageHeader
        title="Receipts"
        description="Successful fee payments and references"
      />
      <div className="mt-6">
        <ReceiptsClient payments={rows} />
      </div>
    </div>
  )
}
