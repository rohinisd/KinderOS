'use server'

import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { createOrder } from '@/lib/razorpay'
import { sendFeeReminder } from '@/lib/twilio'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, generateNumber, type ActionResult } from '@/lib/utils'
import { formatCurrency, toIST } from '@kinderos/utils'

const CreateInvoiceSchema = z.object({
  studentId: z.string().cuid(),
  feePlanId: z.string().cuid().optional(),
  amount: z.number().int().positive(),
  description: z.string().min(1).max(200),
  dueDate: z.coerce.date(),
})

export async function createFeeInvoice(
  input: z.infer<typeof CreateInvoiceSchema>
): Promise<ActionResult<{ invoiceId: string }>> {
  try {
    const { schoolId } = await requireSchoolAuth()
    const data = CreateInvoiceSchema.parse(input)

    const count = await prisma.feeInvoice.count({ where: { schoolId } })
    const invoiceNumber = generateNumber('INV', count + 1)

    const invoice = await prisma.feeInvoice.create({
      data: {
        schoolId,
        studentId: data.studentId,
        feePlanId: data.feePlanId,
        invoiceNumber,
        amount: data.amount,
        totalAmount: data.amount,
        description: data.description,
        dueDate: data.dueDate,
        status: 'PENDING',
      },
    })

    revalidatePath('/dashboard/fees')
    return ok({ invoiceId: invoice.id })
  } catch (error) {
    console.error('[createFeeInvoice]', error)
    return err('Failed to create invoice')
  }
}

export async function generatePaymentLink(
  invoiceId: string
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const { schoolId } = await requireSchoolAuth()

    const invoice = await prisma.feeInvoice.findFirst({
      where: { id: invoiceId, schoolId },
    })
    if (!invoice) return err('Invoice not found')

    const order = await createOrder({
      amountPaise: invoice.totalAmount,
      receipt: invoice.invoiceNumber,
      notes: { schoolId, invoiceId, studentId: invoice.studentId },
    })

    await prisma.feeInvoice.update({
      where: { id: invoiceId },
      data: { razorpayOrderId: order.id },
    })

    return ok({ orderId: order.id })
  } catch (error) {
    console.error('[generatePaymentLink]', error)
    return err('Failed to generate payment link')
  }
}

export async function sendFeeReminderToParent(
  invoiceId: string
): Promise<ActionResult<{ sent: boolean }>> {
  try {
    const { schoolId } = await requireSchoolAuth()

    const invoice = await prisma.feeInvoice.findFirst({
      where: { id: invoiceId, schoolId },
      include: {
        student: { include: { parents: { where: { isPrimary: true } } } },
      },
    })
    if (!invoice) return err('Invoice not found')

    const parent = invoice.student.parents[0]
    if (!parent) return err('No primary parent found')

    await sendFeeReminder({
      parentPhone: parent.phone,
      parentName: parent.firstName,
      studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
      amount: formatCurrency(invoice.totalAmount),
      dueDate: toIST(invoice.dueDate),
    })

    return ok({ sent: true })
  } catch (error) {
    console.error('[sendFeeReminder]', error)
    return err('Failed to send reminder')
  }
}
