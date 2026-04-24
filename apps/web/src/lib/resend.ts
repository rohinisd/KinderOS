import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? 'VidyaPrabandha <noreply@kinderos.in>'

export async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  })
}

/** Fee receipt email */
export async function sendFeeReceiptEmail(params: {
  to: string
  parentName: string
  studentName: string
  receiptNumber: string
  amount: string
  paidDate: string
  schoolName: string
  receiptUrl?: string
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3C3489;">Fee Payment Receipt</h2>
      <p>Dear ${params.parentName},</p>
      <p>We have received your fee payment for <strong>${params.studentName}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Receipt No</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${params.receiptNumber}</strong></td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Amount</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${params.amount}</strong></td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.paidDate}</td></tr>
      </table>
      ${params.receiptUrl ? `<p><a href="${params.receiptUrl}" style="color: #534AB7;">Download Receipt PDF</a></p>` : ''}
      <p style="color: #666; font-size: 14px;">Thank you,<br/>${params.schoolName}</p>
    </div>
  `

  return sendEmail({
    to: params.to,
    subject: `Fee Receipt ${params.receiptNumber} — ${params.schoolName}`,
    html,
  })
}
