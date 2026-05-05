#!/usr/bin/env node
/**
 * End-to-end test of the Razorpay payment-captured webhook
 * against PRODUCTION, using a real PENDING invoice from the DB.
 * No real money is spent.
 *
 * Flow:
 *   1. Pick an open PENDING invoice for a student whose parent uses
 *      the demo WhatsApp phone (+919620010983) — so any side-effects
 *      stay visible to you.
 *   2. Stamp a synthetic Razorpay order_id on it.
 *   3. POST a signed `payment.captured` event to /api/webhooks/razorpay.
 *   4. Re-read the invoice → confirm status flipped to PAID and a
 *      Payment row was created.
 *   5. Print before/after so the proof is obvious.
 *   6. Optionally roll back (--rollback flag) so the invoice goes
 *      back to PENDING for re-testing.
 *
 * Usage:
 *   node scripts/test-razorpay-e2e.mjs              # run + leave the invoice PAID
 *   node scripts/test-razorpay-e2e.mjs --rollback   # run, then revert the invoice
 *
 * Requires:
 *   - RAZORPAY_WEBHOOK_SECRET available (read from scripts/vercel-env.config.json)
 *   - DATABASE_URL in apps/web/.env.local pointing to the same DB as prod
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import crypto from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rollback = process.argv.includes('--rollback')
const targetUrl =
  process.argv.find((a) => a.startsWith('--url='))?.slice(6) ??
  'https://vidya.uttamai.com/api/webhooks/razorpay'

// --- Load env from apps/web/.env.local ---
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local')
const envText = readFileSync(envPath, 'utf8')
for (const line of envText.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq === -1) continue
  const k = t.slice(0, eq).trim()
  let v = t.slice(eq + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[k]) process.env[k] = v
}

// --- Load webhook secret from gitignored config ---
const cfgPath = join(__dirname, 'vercel-env.config.json')
let webhookSecret
try {
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'))
  webhookSecret = cfg.RAZORPAY_WEBHOOK_SECRET
} catch {
  console.error(`Could not read ${cfgPath}. The webhook secret must be there.`)
  process.exit(1)
}
if (!webhookSecret) {
  console.error('RAZORPAY_WEBHOOK_SECRET not set in scripts/vercel-env.config.json')
  process.exit(1)
}

// --- Prisma client ---
const clientPath = join(__dirname, '..', 'packages', 'db', 'generated', 'client', 'index.js')
const { PrismaClient } = await import(pathToFileURL(clientPath).href)
const prisma = new PrismaClient()

const DEMO_PHONE = '+919620010983'

// 1) Pick a PENDING invoice for a student whose primary parent is on the demo phone
const candidate = await prisma.feeInvoice.findFirst({
  where: {
    status: 'PENDING',
    razorpayOrderId: null,
    student: {
      parents: { some: { phone: DEMO_PHONE, isPrimary: true } },
    },
  },
  include: {
    student: {
      include: { parents: { where: { isPrimary: true } } },
    },
    payments: true,
  },
  orderBy: { dueDate: 'desc' },
})

if (!candidate) {
  console.error('No suitable PENDING invoice found for a parent on +919620010983.')
  console.error('Make sure the seed ran (node scripts/seed-demo-data.mjs) and that')
  console.error('Vihaan Kumar / Myra Nair have unpaid invoices.')
  await prisma.$disconnect()
  process.exit(1)
}

const orderId = `order_test_${Date.now()}`
const paymentId = `pay_test_${Date.now()}`
const formatINR = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`

console.log('='.repeat(60))
console.log('Razorpay end-to-end webhook test — PRODUCTION')
console.log('='.repeat(60))
console.log(`Webhook URL:     ${targetUrl}`)
console.log(`Invoice ID:      ${candidate.id}`)
console.log(`Invoice number:  ${candidate.invoiceNumber}`)
console.log(`Student:         ${candidate.student.firstName} ${candidate.student.lastName}`)
console.log(`Parent:          ${candidate.student.parents[0]?.firstName} (${candidate.student.parents[0]?.phone})`)
console.log(`Amount:          ${formatINR(candidate.totalAmount)}`)
console.log(`BEFORE — status: ${candidate.status}, payments: ${candidate.payments.length}`)
console.log('-'.repeat(60))

// 2) Stamp the synthetic order_id
await prisma.feeInvoice.update({
  where: { id: candidate.id },
  data: { razorpayOrderId: orderId },
})
console.log(`Stamped synthetic order_id: ${orderId}`)

// 3) Build + sign the webhook payload (mimics a real Razorpay event)
const payload = JSON.stringify({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: paymentId,
        order_id: orderId,
        amount: candidate.totalAmount,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
      },
    },
  },
})
const sig = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex')

console.log(`Sending payment.captured (sig: ${sig.slice(0, 16)}...)`)
const res = await fetch(targetUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-razorpay-signature': sig,
  },
  body: payload,
})
const text = await res.text()
console.log(`HTTP ${res.status}  →  ${text}`)
console.log('-'.repeat(60))

if (res.status !== 200) {
  console.error('Webhook rejected by production. Aborting.')
  // Revert order_id stamp on failure
  await prisma.feeInvoice.update({
    where: { id: candidate.id },
    data: { razorpayOrderId: null },
  })
  await prisma.$disconnect()
  process.exit(1)
}

// 4) Wait a beat, then re-read
await new Promise((r) => setTimeout(r, 1000))
const after = await prisma.feeInvoice.findUnique({
  where: { id: candidate.id },
  include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
})

console.log(`AFTER  — status: ${after.status}, payments: ${after.payments.length}`)
if (after.payments[0]) {
  const p = after.payments[0]
  console.log(`         latest payment: ${formatINR(p.amount)} via ${p.method} (id ${p.id.slice(0, 8)}...)`)
  console.log(`         razorpayPaymentId: ${p.razorpayPaymentId}`)
  console.log(`         status: ${p.status}, paidAt: ${p.paidAt?.toISOString()}`)
}

const ok = after.status === 'PAID' && after.payments.length > candidate.payments.length
console.log('-'.repeat(60))
console.log(ok ? '✅ END-TO-END VERIFIED — invoice auto-reconciled.' : '❌ Something off — invoice did NOT flip to PAID.')

// 5) Optional rollback
if (rollback) {
  console.log('\nRolling back (--rollback) ...')
  // delete the test payment row(s) and reset invoice
  await prisma.payment.deleteMany({ where: { feeInvoiceId: candidate.id, razorpayPaymentId: paymentId } })
  await prisma.feeInvoice.update({
    where: { id: candidate.id },
    data: { status: 'PENDING', razorpayOrderId: null, razorpayPaymentId: null },
  })
  console.log(`Reverted invoice ${candidate.invoiceNumber} to PENDING and removed the test payment row.`)
}

await prisma.$disconnect()
