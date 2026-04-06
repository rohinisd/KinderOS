import { NextResponse } from 'next/server'
import { PrismaClient } from '@kinderos/db'
import dns from 'dns'

export async function GET() {
  const checks: Record<string, unknown> = { timestamp: new Date().toISOString() }

  // Check if IPv4 is now available after resume
  try {
    const addrs = await new Promise<string[]>((resolve, reject) => {
      dns.resolve4('db.misrvkkrwzbducorbbpa.supabase.co', (err, a) => {
        if (err) reject(err); else resolve(a)
      })
    })
    checks.dns_ipv4 = addrs
  } catch {
    checks.dns_ipv4 = 'none'
  }

  try {
    const addrs = await new Promise<dns.RecordWithTtl[]>((resolve, reject) => {
      dns.resolve6('db.misrvkkrwzbducorbbpa.supabase.co', { ttl: true }, (err, a) => {
        if (err) reject(err); else resolve(a)
      })
    })
    checks.dns_ipv6 = addrs.map(a => a.address)
  } catch {
    checks.dns_ipv6 = 'none'
  }

  // Test direct connection
  const password = 'KinderOSDB123%24'
  const prisma = new PrismaClient({
    datasources: {
      db: { url: `postgresql://postgres:${password}@db.misrvkkrwzbducorbbpa.supabase.co:5432/postgres?connect_timeout=10` },
    },
  })
  try {
    const result = await prisma.$queryRaw`SELECT current_database() as db, version() as v`
    checks.direct_connection = 'SUCCESS'
    checks.db_info = result
  } catch (e) {
    checks.direct_connection = e instanceof Error ? e.message.substring(0, 120) : String(e)
  } finally {
    await prisma.$disconnect()
  }

  // Test pooler (ap-south-1) after resume
  const poolerUrl = `postgresql://postgres.misrvkkrwzbducorbbpa:${password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10`
  const prisma2 = new PrismaClient({ datasources: { db: { url: poolerUrl } } })
  try {
    await prisma2.$queryRaw`SELECT 1 as ok`
    checks.pooler_ap_south_1 = 'SUCCESS'
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    checks.pooler_ap_south_1 = msg.substring(0, 80)
  } finally {
    await prisma2.$disconnect()
  }

  return NextResponse.json(checks)
}
