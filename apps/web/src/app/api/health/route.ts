import { NextResponse } from 'next/server'
import { PrismaClient } from '@kinderos/db'

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  }

  const urls = [
    {
      label: 'direct_5432',
      url: 'postgresql://postgres:KinderOSDB123%24@db.misrvkkrwzbducorbbpa.supabase.co:5432/postgres',
    },
    {
      label: 'direct_6543_pgbouncer',
      url: 'postgresql://postgres:KinderOSDB123%24@db.misrvkkrwzbducorbbpa.supabase.co:6543/postgres?pgbouncer=true',
    },
    {
      label: 'pooler_ap_south_1_transaction',
      url: 'postgresql://postgres.misrvkkrwzbducorbbpa:KinderOSDB123%24@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    },
    {
      label: 'pooler_ap_south_1_session',
      url: 'postgresql://postgres.misrvkkrwzbducorbbpa:KinderOSDB123%24@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
    },
    {
      label: 'current_env_DATABASE_URL',
      url: process.env.DATABASE_URL ?? 'NOT SET',
    },
    {
      label: 'current_env_DIRECT_URL',
      url: process.env.DIRECT_URL ?? 'NOT SET',
    },
  ]

  // Show env URL (masked)
  const dbUrl = process.env.DATABASE_URL ?? ''
  checks.db_url_host = dbUrl.replace(/\/\/[^@]+@/, '//***@').substring(0, 80)

  for (const { label, url } of urls) {
    if (url === 'NOT SET') {
      checks[label] = 'NOT SET'
      continue
    }
    const prisma = new PrismaClient({ datasources: { db: { url } } })
    try {
      await prisma.$queryRaw`SELECT 1 as ok`
      checks[label] = 'SUCCESS'
      await prisma.$disconnect()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Tenant')) checks[label] = 'Tenant not found'
      else if (msg.includes("Can't reach")) checks[label] = 'Unreachable (IPv6?)'
      else if (msg.includes('password')) checks[label] = 'Auth failed'
      else checks[label] = msg.substring(0, 100)
      await prisma.$disconnect()
    }
  }

  return NextResponse.json(checks)
}
