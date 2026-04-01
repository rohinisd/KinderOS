import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? 'MISSING'
  const sk = process.env.CLERK_SECRET_KEY ?? 'MISSING'

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      CLERK_PK_PREFIX: pk.substring(0, 15) + '...',
      CLERK_PK_LENGTH: pk.length,
      CLERK_PK_HAS_NEWLINE: pk.includes('\n') || pk.includes('\r'),
      CLERK_SK_PREFIX: sk.substring(0, 15) + '...',
      CLERK_SK_LENGTH: sk.length,
      CLERK_SK_HAS_NEWLINE: sk.includes('\n') || sk.includes('\r'),
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
  })
}
