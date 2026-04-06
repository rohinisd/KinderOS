import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    node_version: process.version,
  }

  // Check Clerk env
  checks.clerk_pub_key = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  checks.clerk_secret = !!process.env.CLERK_SECRET_KEY

  // Check DB env
  checks.database_url = !!process.env.DATABASE_URL
  checks.direct_url = !!process.env.DIRECT_URL

  // Check Clerk auth
  try {
    const { userId } = await auth()
    checks.clerk_userId = userId ?? 'not signed in'
  } catch (e) {
    checks.clerk_error = e instanceof Error ? e.message : String(e)
  }

  // Check Prisma connection
  try {
    const { prisma } = await import('@/lib/prisma')
    const count = await prisma.school.count()
    checks.db_connected = true
    checks.school_count = count
  } catch (e) {
    checks.db_connected = false
    checks.db_error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(checks)
}
