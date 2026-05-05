#!/usr/bin/env node
/**
 * Send a signed test webhook to the production Razorpay handler
 * to verify RAZORPAY_WEBHOOK_SECRET is correctly loaded.
 *
 * Uses event = "payment.authorized" (not "payment.captured"),
 * so it does NOT mutate any DB rows — just exercises the signature
 * check and returns { received: true } on success.
 *
 * Usage:
 *   node scripts/test-razorpay-webhook.mjs <secret> [<url>]
 */

import crypto from 'node:crypto'

const secret = process.argv[2]
const url = process.argv[3] ?? 'https://vidya.uttamai.com/api/webhooks/razorpay'
if (!secret) {
  console.error('Usage: node scripts/test-razorpay-webhook.mjs <RAZORPAY_WEBHOOK_SECRET> [url]')
  process.exit(1)
}

const payload = JSON.stringify({
  event: 'payment.authorized',
  payload: {
    payment: {
      entity: {
        id: 'pay_test_' + Date.now(),
        order_id: 'order_test_does_not_exist',
        amount: 350000,
      },
    },
  },
})

const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-razorpay-signature': signature,
  },
  body: payload,
})
const text = await res.text()
console.log(`POST ${url}`)
console.log(`Status: ${res.status}`)
console.log(`Body:   ${text}`)
console.log(res.status === 200 ? 'OK — signature verified, secret is correctly loaded.' : 'FAILED — secret mismatch or other error.')
