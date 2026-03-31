import Razorpay from 'razorpay'
import crypto from 'crypto'

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export async function createOrder(params: {
  amountPaise: number
  currency?: string
  receipt: string
  notes?: Record<string, string>
}) {
  return getRazorpay().orders.create({
    amount: params.amountPaise,
    currency: params.currency ?? 'INR',
    receipt: params.receipt,
    notes: params.notes ?? {},
  })
}

export function verifyPaymentSignature(params: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  const body = `${params.orderId}|${params.paymentId}`
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')
  return expected === params.signature
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  return expected === signature
}
