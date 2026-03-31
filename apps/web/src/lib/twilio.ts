import twilio from 'twilio'
import { prisma } from './prisma'

const isConfigured = !!(
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
)

const client = isConfigured
  ? twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  : null

const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER ?? 'whatsapp:+14155238886'

type SendResult = { sid: string } | null

async function sendWhatsApp(
  to: string,
  body: string
): Promise<SendResult> {
  const phone = to.startsWith('+') ? to : `+91${to.replace(/\D/g, '')}`

  if (!client) {
    console.warn(`[WhatsApp DEV] → ${phone}: ${body}`)
    return null
  }

  const message = await client.messages.create({
    from: WHATSAPP_FROM,
    to: `whatsapp:${phone}`,
    body,
  })
  return { sid: message.sid }
}

async function sendSMS(to: string, body: string): Promise<SendResult> {
  const phone = to.startsWith('+') ? to : `+91${to.replace(/\D/g, '')}`

  if (!client) {
    console.warn(`[SMS DEV] → ${phone}: ${body}`)
    return null
  }

  const message = await client.messages.create({
    from: process.env.TWILIO_SMS_NUMBER!,
    to: phone,
    body,
  })
  return { sid: message.sid }
}

/** Fee reminder via WhatsApp */
export async function sendFeeReminder(params: {
  parentPhone: string
  parentName: string
  studentName: string
  amount: string
  dueDate: string
  paymentLink?: string
}) {
  const body = [
    `Hi ${params.parentName},`,
    ``,
    `This is a reminder that the fee of ${params.amount} for ${params.studentName} is due on ${params.dueDate}.`,
    params.paymentLink ? `\nPay online: ${params.paymentLink}` : '',
    `\nThank you!`,
  ].join('\n')

  return sendWhatsApp(params.parentPhone, body)
}

/** Absence alert via WhatsApp */
export async function sendAbsenceAlert(params: {
  parentPhone: string
  parentName: string
  studentName: string
  date: string
  schoolName: string
}) {
  const body = [
    `Hi ${params.parentName},`,
    ``,
    `${params.studentName} was marked absent today (${params.date}) at ${params.schoolName}.`,
    `If this is unexpected, please contact the school.`,
  ].join('\n')

  return sendWhatsApp(params.parentPhone, body)
}

/** Generic announcement broadcast */
export async function sendAnnouncementWhatsApp(params: {
  phone: string
  title: string
  body: string
  schoolName: string
}) {
  const message = [
    `📢 *${params.title}*`,
    ``,
    params.body,
    ``,
    `— ${params.schoolName}`,
  ].join('\n')

  return sendWhatsApp(params.phone, message)
}

export { sendWhatsApp, sendSMS }
