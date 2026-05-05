#!/usr/bin/env node
/**
 * Quick read-only DB inspection.
 * Reads DATABASE_URL from apps/web/.env.local (which mirrors prod Neon).
 *
 * Usage:
 *   node scripts/inspect-db.mjs
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const clientPath = join(__dirname, '..', 'packages', 'db', 'generated', 'client', 'index.js')
const { PrismaClient } = await import(pathToFileURL(clientPath).href)

const envPath = join(__dirname, '..', 'apps', 'web', '.env.local')
const text = readFileSync(envPath, 'utf8')
for (const line of text.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const k = trimmed.slice(0, eq).trim()
  let v = trimmed.slice(eq + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  if (!process.env[k]) process.env[k] = v
}

const prisma = new PrismaClient()

const counts = {
  schools: await prisma.school.count(),
  staff: await prisma.staff.count(),
  students: await prisma.student.count({ where: { deletedAt: null } }),
  parents: await prisma.parent.count(),
  classes: await prisma.class.count(),
  feeInvoices: await prisma.feeInvoice.count(),
  payments: await prisma.payment.count(),
  admissionLeads: await prisma.admissionLead.count(),
  announcements: await prisma.announcement.count(),
  events: await prisma.event.count(),
  galleryAlbums: await prisma.galleryAlbum.count(),
}
console.log('=== Counts ===')
for (const [k, v] of Object.entries(counts)) {
  console.log(`  ${k.padEnd(20)} ${v}`)
}

const schools = await prisma.school.findMany({
  select: {
    id: true,
    name: true,
    slug: true,
    plan: true,
    isActive: true,
    customDomain: true,
    createdAt: true,
    _count: { select: { students: true, staff: true, classes: true, feeInvoices: true } },
  },
})
console.log('\n=== Schools ===')
for (const s of schools) {
  console.log(`  ${s.name} (slug: ${s.slug})`)
  console.log(`    id: ${s.id}`)
  console.log(`    plan: ${s.plan}, active: ${s.isActive}, customDomain: ${s.customDomain || '(none)'}`)
  console.log(`    students: ${s._count.students}, staff: ${s._count.staff}, classes: ${s._count.classes}, invoices: ${s._count.feeInvoices}`)
}

const owners = await prisma.staff.findMany({
  where: { role: 'OWNER' },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    school: { select: { name: true, slug: true } },
  },
})
console.log('\n=== Owners ===')
for (const o of owners) {
  console.log(`  ${o.firstName} ${o.lastName} <${o.email || '(no email)'}> phone:${o.phone}`)
  console.log(`    school: ${o.school.name} (${o.school.slug})`)
}

await prisma.$disconnect()
