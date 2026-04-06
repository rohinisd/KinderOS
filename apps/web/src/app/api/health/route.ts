import { NextResponse } from 'next/server'
import { PrismaClient } from '@kinderos/db'

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  }

  const password = 'KinderOSDB123%24'
  const projectRef = 'misrvkkrwzbducorbbpa'

  const allRegions = [
    'aws-0-ap-south-1',
    'aws-0-ap-southeast-1',
    'aws-0-ap-southeast-2',
    'aws-0-ap-northeast-1',
    'aws-0-ap-northeast-2',
    'aws-0-us-east-1',
    'aws-0-us-east-2',
    'aws-0-us-west-1',
    'aws-0-us-west-2',
    'aws-0-eu-west-1',
    'aws-0-eu-west-2',
    'aws-0-eu-west-3',
    'aws-0-eu-central-1',
    'aws-0-eu-central-2',
    'aws-0-sa-east-1',
    'aws-0-ca-central-1',
    'aws-0-me-south-1',
    'aws-0-af-south-1',
    'fly-0-iad1',
    'fly-0-sin1',
    'fly-0-bom1',
  ]

  for (const region of allRegions) {
    const url = `postgresql://postgres.${projectRef}:${password}@${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=5`
    const prisma = new PrismaClient({ datasources: { db: { url } } })
    try {
      await prisma.$queryRaw`SELECT 1 as ok`
      checks[region] = 'SUCCESS'
      await prisma.$disconnect()
      break
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Tenant')) checks[region] = 'tenant_not_found'
      else if (msg.includes("Can't reach")) checks[region] = 'unreachable'
      else if (msg.includes('password')) checks[region] = 'auth_failed'
      else if (msg.includes('timeout')) checks[region] = 'timeout'
      else checks[region] = msg.substring(0, 60)
      await prisma.$disconnect()
    }
  }

  return NextResponse.json(checks)
}
