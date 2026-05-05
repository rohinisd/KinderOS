#!/usr/bin/env node
/**
 * Standalone WhatsApp test — uses Twilio REST API directly, no npm deps.
 * Reads creds from apps/web/.env.local.
 *
 * Usage:
 *   node scripts/test-whatsapp.mjs +919876543210
 *   node scripts/test-whatsapp.mjs +919876543210 "Custom message text"
 *
 * The recipient phone MUST have already sent `join <code>` to +14155238886.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local')

function loadEnv(path) {
  const env = {}
  try {
    const text = readFileSync(path, 'utf8')
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  } catch (e) {
    console.error(`Could not read ${path}:`, e.message)
    process.exit(1)
  }
  return env
}

const env = loadEnv(envPath)
const sid = env.TWILIO_ACCOUNT_SID
const token = env.TWILIO_AUTH_TOKEN
const from = env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

if (!sid || !token) {
  console.error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in apps/web/.env.local')
  process.exit(1)
}

const to = process.argv[2]
if (!to) {
  console.error('Usage: node scripts/test-whatsapp.mjs +919876543210 ["custom message"]')
  console.error('Recipient must have sent `join <code>` to +14155238886 first.')
  process.exit(1)
}

const phone = to.startsWith('+') ? to : `+91${to.replace(/\D/g, '')}`
const body =
  process.argv[3] ||
  `Hello from VidyaPrabandha! 🎓\n\nThis is a test WhatsApp from your live Twilio integration. If you can read this, fee reminders, absence alerts, and announcements are all ready to go.\n\nSent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.`

console.log('--------------------------------------')
console.log('  VidyaPrabandha — WhatsApp test')
console.log('--------------------------------------')
console.log(`  From:  ${from}`)
console.log(`  To:    whatsapp:${phone}`)
console.log(`  SID:   ${sid.slice(0, 10)}...${sid.slice(-4)}`)
console.log('  Body:')
for (const line of body.split('\n')) console.log(`    ${line}`)
console.log('--------------------------------------')

const auth = Buffer.from(`${sid}:${token}`).toString('base64')
const params = new URLSearchParams({
  From: from,
  To: `whatsapp:${phone}`,
  Body: body,
})

try {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('Twilio error:')
    console.error(`  HTTP:    ${res.status}`)
    console.error(`  Code:    ${data.code}`)
    console.error(`  Message: ${data.message}`)
    if (data.more_info) console.error(`  Docs:    ${data.more_info}`)
    if (data.code === 20003) {
      console.error('  -> Auth failed. Check TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN.')
    } else if (data.code === 63016 || /not.*sandbox|recipient/i.test(data.message ?? '')) {
      console.error(`  -> ${phone} hasn't joined the sandbox.`)
      console.error('  -> From that phone, WhatsApp +14155238886 with: join police-between')
    } else if (data.code === 21211) {
      console.error('  -> Invalid phone number format. Use +91XXXXXXXXXX.')
    } else if (data.code === 21608) {
      console.error('  -> Trial account: number not verified or not in sandbox.')
    }
    process.exit(1)
  }

  console.log(`Sent! Message SID: ${data.sid}`)
  console.log(`  Status: ${data.status}`)
  console.log('  Check your WhatsApp in the next 5-10 seconds.')
  console.log('  Live status: https://console.twilio.com/us1/monitor/logs/sms')
} catch (e) {
  console.error('Network/Fetch error:', e.message)
  process.exit(1)
}
