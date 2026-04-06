import { NextResponse } from 'next/server'
import { PrismaClient } from '@kinderos/db'
import dns from 'dns'

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  }

  // Check Supabase REST API reachability + headers for region hints
  try {
    const resp = await fetch('https://misrvkkrwzbducorbbpa.supabase.co/rest/v1/', {
      headers: { 'apikey': 'sb_publishable_wmjVPHZBTq95PJ8uyNsE6Q_uUCTxCK1' },
    })
    const hdrs: Record<string, string> = {}
    resp.headers.forEach((v, k) => { hdrs[k] = v })
    checks.rest_status = resp.status
    checks.rest_headers = hdrs
  } catch (e) {
    checks.rest_error = e instanceof Error ? e.message : String(e)
  }

  // DNS lookup for the direct host
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

  // Test direct connection from Vercel (might work if Vercel supports IPv6 on this region)
  const password = 'KinderOSDB123%24'
  const directUrl = `postgresql://postgres:${password}@db.misrvkkrwzbducorbbpa.supabase.co:5432/postgres?connect_timeout=10`
  const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } })
  try {
    await prisma.$queryRaw`SELECT 1 as ok`
    checks.direct_connection = 'SUCCESS'
  } catch (e) {
    checks.direct_connection = e instanceof Error ? e.message.substring(0, 120) : String(e)
  } finally {
    await prisma.$disconnect()
  }

  return NextResponse.json(checks)
}
