#!/usr/bin/env node
/**
 * Seed realistic demo data into the existing production school.
 * Idempotent: safe to re-run; checks before inserting.
 *
 * Usage:
 *   node scripts/seed-demo-data.mjs --dry-run    # preview only
 *   node scripts/seed-demo-data.mjs               # actually insert
 *
 * Targets the school owned by SUPER_ADMIN_EMAILS / Rohini Devan.
 * Adds: 5 new classes, 15 students with parents, fee plan,
 * ~30 invoices with mixed statuses, 5 admission leads, 3 announcements,
 * 1 gallery album, 3 events, today's attendance.
 *
 * One special parent uses +919620010983 so WhatsApp fee/absence demos
 * deliver to your phone via the Twilio sandbox.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dryRun = process.argv.includes('--dry-run')

// --- Load env from apps/web/.env.local
const envPath = join(__dirname, '..', 'apps', 'web', '.env.local')
const envText = readFileSync(envPath, 'utf8')
for (const line of envText.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const eq = t.indexOf('=')
  if (eq === -1) continue
  const k = t.slice(0, eq).trim()
  let v = t.slice(eq + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[k]) process.env[k] = v
}

// --- Prisma client (workspace generated)
const clientPath = join(__dirname, '..', 'packages', 'db', 'generated', 'client', 'index.js')
const { PrismaClient } = await import(pathToFileURL(clientPath).href)
const prisma = new PrismaClient()

// ---------------- Demo data definitions ----------------

const DEMO_PARENT_PHONE = '+919620010983' // your phone — receives sandbox WhatsApp

const CLASSES = [
  { name: 'Nursery', section: 'A', capacity: 20 },
  { name: 'LKG', section: 'A', capacity: 25 },
  { name: 'LKG', section: 'B', capacity: 25 },
  { name: 'UKG', section: 'A', capacity: 25 },
  { name: 'Grade 1', section: 'A', capacity: 30 },
]

// 15 students: realistic Indian names; 2 use your phone for WhatsApp demos
const STUDENTS = [
  // Nursery A
  { first: 'Aarav', last: 'Sharma', gender: 'MALE', dob: '2022-04-15', class: 'Nursery-A', parent: { first: 'Anita', last: 'Sharma', phone: '+919876543210', email: 'anita.sharma@example.com' } },
  { first: 'Saanvi', last: 'Reddy', gender: 'FEMALE', dob: '2022-06-22', class: 'Nursery-A', parent: { first: 'Karthik', last: 'Reddy', phone: '+919876543211', email: 'k.reddy@example.com' } },
  { first: 'Vihaan', last: 'Kumar', gender: 'MALE', dob: '2022-08-10', class: 'Nursery-A', parent: { first: 'Priyanka', last: 'Kumar', phone: DEMO_PARENT_PHONE, email: 'priyanka.kumar@example.com' } },
  // LKG A
  { first: 'Diya', last: 'Patel', gender: 'FEMALE', dob: '2021-05-12', class: 'LKG-A', parent: { first: 'Rajesh', last: 'Patel', phone: '+919876543213', email: 'rajesh.patel@example.com' } },
  { first: 'Ishaan', last: 'Iyer', gender: 'MALE', dob: '2021-07-30', class: 'LKG-A', parent: { first: 'Lakshmi', last: 'Iyer', phone: '+919876543214', email: 'lakshmi.iyer@example.com' } },
  { first: 'Aanya', last: 'Joshi', gender: 'FEMALE', dob: '2021-03-05', class: 'LKG-A', parent: { first: 'Manish', last: 'Joshi', phone: '+919876543215', email: 'manish.joshi@example.com' } },
  // LKG B
  { first: 'Reyansh', last: 'Verma', gender: 'MALE', dob: '2021-09-18', class: 'LKG-B', parent: { first: 'Kavita', last: 'Verma', phone: '+919876543216', email: 'kavita.verma@example.com' } },
  { first: 'Myra', last: 'Nair', gender: 'FEMALE', dob: '2021-11-25', class: 'LKG-B', parent: { first: 'Rohit', last: 'Nair', phone: DEMO_PARENT_PHONE, email: 'rohit.nair@example.com' } },
  // UKG A
  { first: 'Arjun', last: 'Rao', gender: 'MALE', dob: '2020-04-08', class: 'UKG-A', parent: { first: 'Meera', last: 'Rao', phone: '+919876543218', email: 'meera.rao@example.com' } },
  { first: 'Ananya', last: 'Gupta', gender: 'FEMALE', dob: '2020-06-14', class: 'UKG-A', parent: { first: 'Suresh', last: 'Gupta', phone: '+919876543219', email: 'suresh.gupta@example.com' } },
  { first: 'Kabir', last: 'Singh', gender: 'MALE', dob: '2020-08-21', class: 'UKG-A', parent: { first: 'Geeta', last: 'Singh', phone: '+919876543220', email: 'geeta.singh@example.com' } },
  { first: 'Avni', last: 'Mehta', gender: 'FEMALE', dob: '2020-10-03', class: 'UKG-A', parent: { first: 'Ashok', last: 'Mehta', phone: '+919876543221', email: 'ashok.mehta@example.com' } },
  // Grade 1
  { first: 'Aditya', last: 'Krishnan', gender: 'MALE', dob: '2019-05-19', class: 'Grade 1-A', parent: { first: 'Sunita', last: 'Krishnan', phone: '+919876543222', email: 'sunita.k@example.com' } },
  { first: 'Kiara', last: 'Bhat', gender: 'FEMALE', dob: '2019-07-26', class: 'Grade 1-A', parent: { first: 'Vivek', last: 'Bhat', phone: '+919876543223', email: 'vivek.bhat@example.com' } },
  { first: 'Vivaan', last: 'Hegde', gender: 'MALE', dob: '2019-09-11', class: 'Grade 1-A', parent: { first: 'Pooja', last: 'Hegde', phone: '+919876543224', email: 'pooja.hegde@example.com' } },
]

const ADMISSION_LEADS = [
  { childName: 'Atharv Naidu', dob: '2022-02-14', grade: 'Nursery', parentName: 'Sneha Naidu', phone: '+919876500001', email: 'sneha.n@example.com', stage: 'NEW_ENQUIRY', source: 'Website', notes: 'Interested in afternoon batch' },
  { childName: 'Riya Shetty', dob: '2021-04-09', grade: 'LKG', parentName: 'Rajiv Shetty', phone: '+919876500002', email: 'rajiv.s@example.com', stage: 'CONTACTED', source: 'WhatsApp', notes: 'Called back, wants to visit campus' },
  { childName: 'Aaradhya Pai', dob: '2021-08-17', grade: 'LKG', parentName: 'Deepa Pai', phone: '+919876500003', email: 'deepa.p@example.com', stage: 'VISIT_SCHEDULED', source: 'Referral', notes: 'Visit scheduled for next Monday at 11am' },
  { childName: 'Krish Kulkarni', dob: '2020-11-30', grade: 'UKG', parentName: 'Amol Kulkarni', phone: '+919876500004', email: 'amol.k@example.com', stage: 'INTERVIEW_DONE', source: 'Walk-in', notes: 'Interview went well, parents impressed' },
  { childName: 'Tara Murthy', dob: '2019-12-08', grade: 'Grade 1', parentName: 'Lavanya Murthy', phone: '+919876500005', email: 'lavanya.m@example.com', stage: 'DOCS_PENDING', source: 'Google Ads', notes: 'Birth certificate and Aadhar pending submission' },
]

const ANNOUNCEMENTS = [
  { title: 'Annual Day Celebration on December 15th',
    body: 'Dear Parents, we are excited to invite you to our Annual Day celebration on Saturday, December 15th from 5:00 PM at the school auditorium. Children will perform dances, songs, and skits. Tea and snacks will be served. Looking forward to seeing all of you!',
    audience: 'PARENTS', channels: ['WHATSAPP', 'IN_APP'] },
  { title: 'School Closed for Diwali (Nov 1-5)',
    body: 'The school will remain closed from November 1st to November 5th for Diwali holidays. Classes resume on November 6th. Wishing all our students and families a very happy Diwali!',
    audience: 'ALL', channels: ['WHATSAPP', 'PUSH', 'IN_APP'] },
  { title: 'Parent-Teacher Meeting — Saturday',
    body: 'PTM is scheduled for Saturday at 10 AM. Please carry your child\'s diary. Slot bookings open in the parent app from Wednesday 5 PM.',
    audience: 'PARENTS', channels: ['WHATSAPP', 'IN_APP'] },
]

const EVENTS = [
  { title: 'Annual Day', daysFromNow: 30, description: 'Annual Day showcase by all classes. Dress code: traditional.' },
  { title: 'Sports Day', daysFromNow: 14, description: 'Inter-house athletics meet. Track events 9 AM, field events 11 AM.' },
  { title: "Children's Day Picnic", daysFromNow: 7, description: 'Picnic to Lalbagh. Pack lunch and water. Departure 9 AM, return by 3 PM.' },
]

// ---------------- Helpers ----------------

function paise(rupees) { return rupees * 100 }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(0, 0, 0, 0); return d }
function pad(n) { return String(n).padStart(5, '0') }

// ---------------- Plan ----------------

const plan = {
  newClasses: [],
  newStudents: [],
  newParents: [],
  feePlan: null,
  newInvoices: [],
  newPayments: [],
  newLeads: [],
  newAnnouncements: [],
  newEvents: [],
  newAlbums: [],
  attendanceCount: 0,
}

const school = await prisma.school.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
if (!school) { console.error('No active school found'); process.exit(1) }
console.log(`Target school: ${school.name} (${school.slug}) [${school.id}]`)

const ay = await prisma.academicYear.findFirst({ where: { schoolId: school.id, isCurrent: true } })
if (!ay) { console.error('No current academic year'); process.exit(1) }
console.log(`Academic year: ${ay.label} [${ay.id}]`)

const owner = await prisma.staff.findFirst({ where: { schoolId: school.id, role: 'OWNER' } })
const teachers = await prisma.staff.findMany({ where: { schoolId: school.id, role: { in: ['CLASS_TEACHER', 'SUBJECT_TEACHER', 'PRINCIPAL'] }, status: 'ACTIVE' } })
const teacher = teachers[0] || owner
console.log(`Owner: ${owner?.firstName}; Default teacher for new classes: ${teacher.firstName}`)

// --- Classes ---
const existingClasses = await prisma.class.findMany({ where: { schoolId: school.id, academicYearId: ay.id } })
const classKey = (name, section) => `${name}-${section}`
const classMap = new Map()
for (const c of existingClasses) classMap.set(classKey(c.name, c.section || ''), c)

for (const c of CLASSES) {
  const key = classKey(c.name, c.section)
  if (classMap.has(key)) continue
  plan.newClasses.push({ ...c, key })
}

// --- Students + parents ---
const existingStudents = await prisma.student.findMany({
  where: { schoolId: school.id, deletedAt: null },
  select: { firstName: true, lastName: true, admissionNumber: true },
})
const existingNames = new Set(existingStudents.map((s) => `${s.firstName.toLowerCase()}|${s.lastName.toLowerCase()}`))

let nextAdmCounter = existingStudents.length + 1
for (const s of STUDENTS) {
  const key = `${s.first.toLowerCase()}|${s.last.toLowerCase()}`
  if (existingNames.has(key)) continue
  plan.newStudents.push({ ...s, admissionNumber: `ADM${pad(nextAdmCounter++)}` })
  plan.newParents.push(s.parent)
}

// --- Fee plan ---
const existingFeePlan = await prisma.feePlan.findFirst({ where: { schoolId: school.id, name: 'Monthly Tuition 2025-26' } })
if (!existingFeePlan) {
  plan.feePlan = { name: 'Monthly Tuition 2025-26', amount: paise(3500), frequency: 'MONTHLY' }
}

// --- Invoices: create 8 months of invoices for ALL students (existing + new). Mix of statuses. ---
// Strategy:
//   - 5 oldest months (Apr-Aug): PAID
//   - Sep: PARTIAL for some, PAID for most
//   - Oct: PENDING
//   - Nov (current): PENDING for most, OVERDUE for some
const MONTHS = [
  { label: 'April 2025', dueDay: -210, status: 'PAID' },
  { label: 'May 2025', dueDay: -180, status: 'PAID' },
  { label: 'June 2025', dueDay: -150, status: 'PAID' },
  { label: 'July 2025', dueDay: -120, status: 'PAID' },
  { label: 'August 2025', dueDay: -90, status: 'PAID' },
  { label: 'September 2025', dueDay: -60, status: 'PAID' },
  { label: 'October 2025', dueDay: -25, status: 'OVERDUE' },
  { label: 'November 2025', dueDay: 5, status: 'PENDING' },
]

// We'll generate invoice plans only — the actual creation needs studentId after insert.
// Defer to execution stage after students are created. Here just count.
const totalStudentsAfter = existingStudents.length + plan.newStudents.length
plan.newInvoices = MONTHS.flatMap((m) => Array.from({ length: totalStudentsAfter }).map(() => ({ month: m })))

// --- Admission leads ---
const existingLeads = await prisma.admissionLead.findMany({ where: { schoolId: school.id }, select: { phone: true, childName: true } })
const leadKey = (l) => `${l.childName.toLowerCase()}|${l.phone}`
const leadSet = new Set(existingLeads.map(leadKey))
for (const l of ADMISSION_LEADS) {
  if (leadSet.has(leadKey(l))) continue
  plan.newLeads.push(l)
}

// --- Announcements ---
const existingAnns = await prisma.announcement.findMany({ where: { schoolId: school.id }, select: { title: true } })
const annTitles = new Set(existingAnns.map((a) => a.title.toLowerCase()))
for (const a of ANNOUNCEMENTS) {
  if (annTitles.has(a.title.toLowerCase())) continue
  plan.newAnnouncements.push(a)
}

// --- Events ---
const existingEvents = await prisma.event.findMany({ where: { schoolId: school.id }, select: { title: true } })
const evtTitles = new Set(existingEvents.map((e) => e.title.toLowerCase()))
for (const e of EVENTS) {
  if (evtTitles.has(e.title.toLowerCase())) continue
  plan.newEvents.push(e)
}

// --- Gallery album ---
const existingAlbums = await prisma.galleryAlbum.findMany({ where: { schoolId: school.id }, select: { title: true } })
const albumTitles = new Set(existingAlbums.map((a) => a.title.toLowerCase()))
if (!albumTitles.has('onam celebrations 2025')) {
  plan.newAlbums.push({
    title: 'Onam Celebrations 2025',
    description: 'Glimpses from our Onam celebrations - pookalam, sadya, and traditional games.',
    photos: [
      { url: 'https://images.unsplash.com/photo-1599661046827-9d1be65d2e2c?w=800', caption: 'Pookalam by UKG students' },
      { url: 'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800', caption: 'Onam Sadya' },
      { url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800', caption: 'Tug of war' },
    ],
  })
}

// --- Today's attendance: mark existing + new students PRESENT for current day, except 1 ABSENT ---
const todayUtc = (() => {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return new Date(`${ymd}T00:00:00Z`)
})()
plan.attendanceCount = existingStudents.length + plan.newStudents.length

// ---------------- Print plan ----------------

console.log('\n=========== Seed Plan ===========')
console.log(`  Classes to create:       ${plan.newClasses.length}`)
console.log(`  Students to create:      ${plan.newStudents.length}`)
console.log(`  Parents to create:       ${plan.newParents.length}`)
console.log(`  Fee plan to create:      ${plan.feePlan ? 1 : 0}`)
console.log(`  Invoices to create:      ${plan.newInvoices.length} (${MONTHS.length} months × ${totalStudentsAfter} students)`)
console.log(`  Admission leads:         ${plan.newLeads.length}`)
console.log(`  Announcements:           ${plan.newAnnouncements.length}`)
console.log(`  Events:                  ${plan.newEvents.length}`)
console.log(`  Gallery albums:          ${plan.newAlbums.length}`)
console.log(`  Today's attendance rows: ${plan.attendanceCount}`)
console.log('==================================\n')

if (dryRun) {
  console.log('Dry run only. Re-run without --dry-run to apply.')
  await prisma.$disconnect()
  process.exit(0)
}

// ---------------- Execute ----------------

console.log('Inserting...')

// Classes
const createdClassMap = new Map(classMap)
for (const c of plan.newClasses) {
  const created = await prisma.class.create({
    data: {
      schoolId: school.id,
      academicYearId: ay.id,
      name: c.name,
      section: c.section,
      capacity: c.capacity,
      classTeacherId: teacher.id,
    },
  })
  createdClassMap.set(c.key, created)
  console.log(`  + class ${c.name} ${c.section}`)
}

// Students + parents
const createdStudents = []
for (const s of plan.newStudents) {
  const cls = createdClassMap.get(s.class)
  if (!cls) { console.warn(`  ! class ${s.class} not found, skipping ${s.first}`); continue }

  const parent = await prisma.parent.create({
    data: {
      firstName: s.parent.first,
      lastName: s.parent.last,
      phone: s.parent.phone,
      email: s.parent.email,
      relation: 'MOTHER',
      isPrimary: true,
    },
  })
  const student = await prisma.student.create({
    data: {
      schoolId: school.id,
      classId: cls.id,
      admissionNumber: s.admissionNumber,
      firstName: s.first,
      lastName: s.last,
      gender: s.gender,
      dateOfBirth: new Date(s.dob),
      status: 'ACTIVE',
      parents: { connect: { id: parent.id } },
    },
  })
  createdStudents.push(student)
  console.log(`  + student ${s.first} ${s.last} → ${cls.name}-${cls.section}`)
}

// Fee plan
let feePlan = existingFeePlan
if (plan.feePlan) {
  feePlan = await prisma.feePlan.create({
    data: {
      schoolId: school.id,
      name: plan.feePlan.name,
      amount: plan.feePlan.amount,
      frequency: plan.feePlan.frequency,
      classIds: [...createdClassMap.values()].map((c) => c.id),
      isActive: true,
    },
  })
  console.log(`  + fee plan ${feePlan.name}`)
}

// Invoices
const allStudents = await prisma.student.findMany({
  where: { schoolId: school.id, deletedAt: null },
  select: { id: true, firstName: true, lastName: true, classId: true, parents: { select: { id: true, phone: true, firstName: true } } },
})
let invCounter = (await prisma.feeInvoice.count({ where: { schoolId: school.id } })) + 1
let invoicesCreated = 0
let paymentsCreated = 0
for (const m of MONTHS) {
  for (const stu of allStudents) {
    const dueDate = m.dueDay >= 0 ? daysFromNow(m.dueDay) : daysAgo(-m.dueDay)
    const status = m.status
    const invoiceNumber = `INV-${pad(invCounter++)}`
    const exists = await prisma.feeInvoice.findFirst({
      where: { schoolId: school.id, studentId: stu.id, description: `Tuition fee — ${m.label}` },
    })
    if (exists) continue
    const inv = await prisma.feeInvoice.create({
      data: {
        schoolId: school.id,
        studentId: stu.id,
        feePlanId: feePlan?.id,
        invoiceNumber,
        amount: paise(3500),
        totalAmount: paise(3500),
        description: `Tuition fee — ${m.label}`,
        dueDate,
        status,
      },
    })
    invoicesCreated++
    if (status === 'PAID') {
      const parent = stu.parents[0]
      const paidAt = new Date(dueDate); paidAt.setDate(paidAt.getDate() - 3)
      await prisma.payment.create({
        data: {
          schoolId: school.id,
          feeInvoiceId: inv.id,
          parentId: parent?.id,
          amount: paise(3500),
          method: 'RAZORPAY_UPI',
          status: 'SUCCESS',
          receiptNumber: `RCP-${pad(paymentsCreated + 1)}`,
          paidAt,
        },
      })
      paymentsCreated++
    }
  }
}
console.log(`  + ${invoicesCreated} invoices, ${paymentsCreated} payments`)

// Admission leads
for (const l of plan.newLeads) {
  await prisma.admissionLead.create({
    data: {
      schoolId: school.id,
      childName: l.childName,
      dateOfBirth: new Date(l.dob),
      gradeApplying: l.grade,
      parentName: l.parentName,
      phone: l.phone,
      email: l.email,
      stage: l.stage,
      source: l.source,
      notes: l.notes,
    },
  })
  console.log(`  + lead ${l.childName} (${l.stage})`)
}

// Announcements
for (const a of plan.newAnnouncements) {
  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      title: a.title,
      body: a.body,
      targetAudience: a.audience,
      channels: a.channels,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdBy: owner.id,
    },
  })
  console.log(`  + announcement "${a.title}"`)
}

// Events
for (const e of plan.newEvents) {
  await prisma.event.create({
    data: {
      schoolId: school.id,
      title: e.title,
      description: e.description,
      eventDate: daysFromNow(e.daysFromNow),
    },
  })
  console.log(`  + event ${e.title}`)
}

// Gallery
for (const a of plan.newAlbums) {
  const album = await prisma.galleryAlbum.create({
    data: {
      schoolId: school.id,
      title: a.title,
      description: a.description,
      isPublic: true,
      eventDate: daysAgo(30),
      coverUrl: a.photos[0]?.url,
    },
  })
  for (let i = 0; i < a.photos.length; i++) {
    await prisma.galleryPhoto.create({
      data: { albumId: album.id, url: a.photos[i].url, caption: a.photos[i].caption, sortOrder: i },
    })
  }
  console.log(`  + album ${a.title} (${a.photos.length} photos)`)
}

// Today's attendance: PRESENT for most, ABSENT for the last student in each class
let attendanceCreated = 0
const fallbackClass = (await prisma.class.findFirst({ where: { schoolId: school.id } }))?.id
for (let i = 0; i < allStudents.length; i++) {
  const stu = allStudents[i]
  const status = i === allStudents.length - 1 ? 'ABSENT' : 'PRESENT'
  const exists = await prisma.studentAttendance
    .findUnique({ where: { studentId_date: { studentId: stu.id, date: todayUtc } } })
    .catch(() => null)
  if (exists) continue
  await prisma.studentAttendance.create({
    data: {
      schoolId: school.id,
      studentId: stu.id,
      classId: stu.classId || fallbackClass,
      date: todayUtc,
      status,
      markedBy: owner.id,
    },
  })
  attendanceCreated++
}
console.log(`  + ${attendanceCreated} attendance rows`)

console.log('\n=== Done ===')

await prisma.$disconnect()
