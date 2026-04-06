import { NextResponse } from 'next/server'
import { PrismaClient } from '@kinderos/db'

export async function GET() {
  const checks: Record<string, unknown> = { timestamp: new Date().toISOString() }

  const password = 'KinderOSDB123%24'
  const projectRef = 'misrvkkrwzbducorbbpa'

  // Test pooler in ap-south-1 (was previously "tenant not found", now changed after resume)
  const urls = [
    { label: 'pooler_ap_south_1_6543', url: `postgresql://postgres.${projectRef}:${password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10` },
    { label: 'pooler_ap_south_1_5432', url: `postgresql://postgres.${projectRef}:${password}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?connect_timeout=10` },
    { label: 'pooler_ap_southeast_1_6543', url: `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10` },
  ]

  for (const { label, url } of urls) {
    const prisma = new PrismaClient({ datasources: { db: { url } } })
    try {
      await prisma.$queryRaw`SELECT 1 as ok`
      checks[label] = 'SUCCESS'
      await prisma.$disconnect()
      break
    } catch (e) {
      // Show full error - don't truncate
      checks[label] = e instanceof Error ? e.message.replace(/\n/g, ' ').substring(0, 200) : String(e)
      await prisma.$disconnect()
    }
  }

  return NextResponse.json(checks)
}
