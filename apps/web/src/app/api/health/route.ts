import { NextResponse } from 'next/server'
import { PrismaClient } from '@kinderos/db'

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  }

  const password = 'KinderOSDB123%24'
  const projectRef = 'misrvkkrwzbducorbbpa'

  const formats = [
    {
      label: 'no_region_pooler_6543',
      url: `postgresql://postgres.${projectRef}:${password}@pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=5`,
    },
    {
      label: 'no_region_pooler_5432',
      url: `postgresql://postgres.${projectRef}:${password}@pooler.supabase.com:5432/postgres?connect_timeout=5`,
    },
    {
      label: 'project_pooler_subdomain',
      url: `postgresql://postgres:${password}@${projectRef}.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=5`,
    },
    {
      label: 'direct_with_sslmode',
      url: `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require&connect_timeout=5`,
    },
    {
      label: 'direct_port_6543',
      url: `postgresql://postgres:${password}@db.${projectRef}.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=5`,
    },
    {
      label: 'pooler_supabase_co_subdomain',
      url: `postgresql://postgres.${projectRef}:${password}@pooler.${projectRef}.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=5`,
    },
    {
      label: 'ap_south_1_plain_user',
      url: `postgresql://postgres:${password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=5&options=--cluster%3D${projectRef}`,
    },
  ]

  for (const { label, url } of formats) {
    const prisma = new PrismaClient({ datasources: { db: { url } } })
    try {
      await prisma.$queryRaw`SELECT 1 as ok`
      checks[label] = 'SUCCESS'
      await prisma.$disconnect()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Tenant')) checks[label] = 'tenant_not_found'
      else if (msg.includes("Can't reach")) checks[label] = 'unreachable'
      else if (msg.includes('password')) checks[label] = 'auth_failed'
      else if (msg.includes('timeout')) checks[label] = 'timeout'
      else checks[label] = msg.substring(0, 80)
      await prisma.$disconnect()
    }
  }

  return NextResponse.json(checks)
}
