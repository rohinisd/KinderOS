import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendFeeReminder } from '@/lib/twilio'
import { formatCurrency, toIST } from '@kinderos/utils'

/**
 * Daily cron job for fee reminders.
 * Triggered by Vercel Cron or external scheduler.
 * Protected by CRON_SECRET header.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const overdueInvoices = await prisma.feeInvoice.findMany({
    where: {
      status: { in: ['PENDING', 'OVERDUE'] },
      dueDate: { lte: threeDaysFromNow },
    },
    include: {
      student: { include: { parents: { where: { isPrimary: true } } } },
      school: true,
    },
  })

  let sent = 0
  for (const invoice of overdueInvoices) {
    const parent = invoice.student.parents[0]
    if (!parent) continue

    await sendFeeReminder({
      parentPhone: parent.phone,
      parentName: parent.firstName,
      studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
      amount: formatCurrency(invoice.totalAmount),
      dueDate: toIST(invoice.dueDate),
    })
    sent++

    if (invoice.dueDate < new Date() && invoice.status === 'PENDING') {
      await prisma.feeInvoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      })
    }
  }

  return NextResponse.json({ sent, total: overdueInvoices.length })
}
