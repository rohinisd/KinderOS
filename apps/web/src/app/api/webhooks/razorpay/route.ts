import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  if (!signature || !verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const orderId = payment.order_id as string
    const paymentId = payment.id as string

    const invoice = await prisma.feeInvoice.findUnique({
      where: { razorpayOrderId: orderId },
    })

    if (invoice) {
      await prisma.$transaction([
        prisma.payment.create({
          data: {
            schoolId: invoice.schoolId,
            feeInvoiceId: invoice.id,
            amount: payment.amount as number,
            method: 'RAZORPAY_UPI',
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            status: 'SUCCESS',
            paidAt: new Date(),
          },
        }),
        prisma.feeInvoice.update({
          where: { id: invoice.id },
          data: { status: 'PAID', razorpayPaymentId: paymentId },
        }),
      ])
    }
  }

  return NextResponse.json({ received: true })
}
