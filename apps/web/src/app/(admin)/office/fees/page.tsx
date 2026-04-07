import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { OfficeFeesClient } from './office-fees-client'
import { formatCurrency } from '@kinderos/utils'

export const dynamic = 'force-dynamic'

function istTodayBounds(): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const mo = parts.find((p) => p.type === 'month')?.value ?? '01'
  const d = parts.find((p) => p.type === 'day')?.value ?? '01'
  const ymd = `${y}-${mo}-${d}`
  return {
    start: new Date(`${ymd}T00:00:00+05:30`),
    end: new Date(`${ymd}T23:59:59.999+05:30`),
  }
}

export default async function OfficeFeesPage() {
  const { schoolId } = await requireSchoolAuth()
  const { start: paidTodayStart, end: paidTodayEnd } = istTodayBounds()

  const [invoiceRows, paidTodayAgg, overdueCount] = await Promise.all([
    prisma.feeInvoice.findMany({
      where: { schoolId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        payments: {
          where: { status: 'SUCCESS' },
          select: { amount: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 150,
    }),
    prisma.payment.aggregate({
      where: {
        schoolId,
        status: 'SUCCESS',
        paidAt: { gte: paidTodayStart, lte: paidTodayEnd },
      },
      _sum: { amount: true },
    }),
    prisma.feeInvoice.count({
      where: { schoolId, status: 'OVERDUE' },
    }),
  ])

  let pendingCount = 0
  let pendingAmountPaise = 0
  for (const inv of invoiceRows) {
    if (inv.status === 'CANCELLED' || inv.status === 'REFUNDED') continue
    const paidSoFar = inv.payments.reduce((s, p) => s + p.amount, 0)
    const remaining = inv.totalAmount - paidSoFar
    if (remaining > 0) {
      pendingCount += 1
      pendingAmountPaise += remaining
    }
  }

  const invoices = invoiceRows.map((inv) => {
    const paidSoFar = inv.payments.reduce((s, p) => s + p.amount, 0)
    const remaining = inv.totalAmount - paidSoFar
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.totalAmount,
      dueDate: inv.dueDate.toISOString(),
      status: inv.status,
      student: inv.student,
      paidSoFar,
      remaining,
    }
  })

  const stats = {
    pendingCount,
    pendingAmountPaise,
    paidTodayPaise: paidTodayAgg._sum.amount ?? 0,
    overdueCount,
  }

  return (
    <div>
      <PageHeader
        title="Fee Collection"
        description={`Pending outstanding: ${formatCurrency(stats.pendingAmountPaise)} across ${stats.pendingCount} invoice(s)`}
      />
      <div className="mt-6">
        <OfficeFeesClient invoices={invoices} stats={stats} />
      </div>
    </div>
  )
}
