import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Clerk Webhook handler — OPTIONAL.
 * Only needed on Clerk paid plans. On free tier, school records
 * are auto-provisioned in lib/auth.ts on first access instead.
 *
 * If you upgrade to Clerk Pro later:
 * 1. Install svix: pnpm add svix
 * 2. Set CLERK_WEBHOOK_SECRET in .env.local
 * 3. Configure webhook in Clerk Dashboard → Webhooks
 *    URL: https://your-app.vercel.app/api/webhooks/clerk
 *    Events: organization.created, organization.updated
 */
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  // If no secret configured, webhook is disabled (using auto-provision instead)
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { message: 'Webhook not configured — using auto-provision mode' },
      { status: 200 }
    )
  }

  // For paid tier: verify signature and process events
  // Uncomment and install svix when ready:
  //
  // import { Webhook } from 'svix'
  // const body = await req.text()
  // const wh = new Webhook(WEBHOOK_SECRET)
  // const event = wh.verify(body, { ...headers }) as { type: string; data: any }
  //
  // switch (event.type) {
  //   case 'organization.created': { ... }
  //   case 'organization.updated': { ... }
  // }

  return NextResponse.json({ received: true })
}
