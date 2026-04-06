import { NextResponse } from 'next/server'
import { PrismaClient } from '@kinderos/db'

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  }

  const password = 'KinderOSDB123%24'
  const projectRef = 'misrvkkrwzbducorbbpa'
  const regions = [
    'aws-0-ap-south-1',
    'aws-0-ap-southeast-1',
    'aws-0-us-east-1',
    'aws-0-eu-west-1',
    'aws-0-us-west-1',
    'aws-0-eu-central-1',
    'aws-0-ap-northeast-1',
    'aws-0-sa-east-1',
  ]

  for (const region of regions) {
    const url = `postgresql://postgres.${projectRef}:${password}@${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`
    const prisma = new PrismaClient({ datasources: { db: { url } } })
    try {
      const count = await prisma.$queryRaw`SELECT 1 as ok`
      checks[region] = 'SUCCESS'
      await prisma.$disconnect()
      break
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      checks[region] = msg.includes('Tenant') ? 'wrong region' : msg.substring(0, 80)
      await prisma.$disconnect()
    }
  }

  // Also test current DATABASE_URL
  try {
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1 as ok`
    checks.current_db_url = 'SUCCESS'
    await prisma.$disconnect()
  } catch (e) {
    checks.current_db_url = e instanceof Error ? e.message.substring(0, 100) : String(e)
  }

  return NextResponse.json(checks)
}
