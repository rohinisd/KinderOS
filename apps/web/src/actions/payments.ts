'use server'

import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { FeeStatus, PaymentMethod } from '@kinderos/db'
import { ok, err, generateNumber, type ActionResult } from '@/lib/utils'

const RecordPaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE']),
  referenceNumber: z.string().max(200).optional(),
  amount: z.number().int().positive(),
})

const METHOD_MAP: Record<
  z.infer<typeof RecordPaymentSchema>['method'],
  PaymentMethod
> = {
  CASH: 'CASH',
  UPI: 'UPI',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
}

export async function recordPayment(
  invoiceId: string,
  input: {
    method: z.infer<typeof RecordPaymentSchema>['method']
    referenceNumber?: string
    amount: number
  }
): Promise<ActionResult<{ paymentId: string }>> {
  try {
    const { schoolId, userId } = await requireSchoolAuth()
    const data = RecordPaymentSchema.parse({
      invoiceId,
      method: input.method,
      referenceNumber: input.referenceNumber,
      amount: input.amount,
    })

    const paymentId = await prisma.$transaction(async (tx) => {
      const invoice = await tx.feeInvoice.findFirst({
        where: { id: data.invoiceId, schoolId },
        include: {
          payments: {
            where: { status: 'SUCCESS' },
            select: { amount: true },
          },
        },
      })

      if (!invoice) {
        throw new Error('INVOICE_NOT_FOUND')
      }
      if (invoice.status === 'CANCELLED' || invoice.status === 'REFUNDED') {
        throw new Error('INVOICE_CLOSED')
      }

      const paidSoFar = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
      const remaining = invoice.totalAmount - paidSoFar
      if (remaining <= 0) {
        throw new Error('ALREADY_PAID')
      }
      if (data.amount > remaining) {
        throw new Error('AMOUNT_EXCEEDS_BALANCE')
      }

      const paymentCount = await tx.payment.count({ where: { schoolId } })
      const receiptNumber = generateNumber('RCP', paymentCount + 1)
      const ref = data.referenceNumber?.trim()
      const payment = await tx.payment.create({
        data: {
          schoolId,
          feeInvoiceId: invoice.id,
          amount: data.amount,
          method: METHOD_MAP[data.method],
          status: 'SUCCESS',
          receiptNumber,
          paidAt: new Date(),
          referenceNumber: ref && ref.length > 0 ? ref : null,
          receivedBy: userId,
        },
      })

      const newPaid = paidSoFar + data.amount
      let newStatus: FeeStatus
      if (newPaid >= invoice.totalAmount) {
        newStatus = 'PAID'
      } else {
        newStatus = 'PARTIAL'
      }

      await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      })

      return payment.id
    })

    revalidatePath('/office/fees')
    revalidatePath('/office/receipts')
    return ok({ paymentId })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map((e) => e.message).join(', '))
    }
    if (error instanceof Error) {
      if (error.message === 'INVOICE_NOT_FOUND') return err('Invoice not found')
      if (error.message === 'INVOICE_CLOSED') return err('This invoice cannot accept payments')
      if (error.message === 'ALREADY_PAID') return err('Invoice is already fully paid')
      if (error.message === 'AMOUNT_EXCEEDS_BALANCE') return err('Amount exceeds outstanding balance')
    }
    console.error('[recordPayment]', error)
    return err('Failed to record payment')
  }
}
