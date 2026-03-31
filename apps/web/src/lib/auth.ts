import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { prisma } from './prisma'

/**
 * Auto-provision a School record when a Clerk org is accessed
 * for the first time. This replaces the webhook approach
 * (webhooks require Clerk paid tier).
 *
 * Flow: User creates org in Clerk → first request hits our app →
 * we detect no School row exists → create it automatically.
 */
async function autoProvisionSchool(clerkOrgId: string) {
  const existing = await prisma.school.findUnique({
    where: { clerkOrgId },
  })
  if (existing) return existing

  const client = await clerkClient()
  const org = await client.organizations.getOrganization({ organizationId: clerkOrgId })

  const slug =
    org.slug ||
    org.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    clerkOrgId

  // Ensure slug is unique
  let finalSlug = slug
  let attempt = 0
  while (await prisma.school.findUnique({ where: { slug: finalSlug } })) {
    attempt++
    finalSlug = `${slug}-${attempt}`
  }

  const school = await prisma.school.create({
    data: {
      clerkOrgId,
      name: org.name,
      slug: finalSlug,
      logoUrl: org.imageUrl || null,
    },
  })

  console.log(`[auth] Auto-provisioned school: ${school.name} (${school.slug})`)
  return school
}

/**
 * Auto-provision a Staff record for the current user if they
 * don't have one yet. Links Clerk user → Staff row.
 */
async function autoProvisionStaff(
  schoolId: string,
  clerkUserId: string,
  orgRole: string | null | undefined
) {
  const existing = await prisma.staff.findUnique({
    where: { clerkUserId },
  })
  if (existing) return existing

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkUserId)

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const firstName =
    clerkUser.firstName || email.split('@')[0] || 'User'
  const lastName = clerkUser.lastName || ''

  // Map Clerk org role to our StaffRole enum
  const roleMap: Record<string, string> = {
    'org:admin': 'OWNER',
    'org:teacher': 'CLASS_TEACHER',
    'org:staff': 'ADMIN',
  }
  const role = roleMap[orgRole ?? ''] ?? 'ADMIN'

  // Check if a staff record exists by email (pre-created by owner invite)
  const preCreated = await prisma.staff.findFirst({
    where: { schoolId, email, clerkUserId: null },
  })

  if (preCreated) {
    return prisma.staff.update({
      where: { id: preCreated.id },
      data: {
        clerkUserId,
        photoUrl: clerkUser.imageUrl || null,
      },
    })
  }

  return prisma.staff.create({
    data: {
      schoolId,
      clerkUserId,
      firstName,
      lastName,
      phone: clerkUser.phoneNumbers[0]?.phoneNumber ?? '',
      email,
      role: role as 'OWNER' | 'CLASS_TEACHER' | 'ADMIN',
      photoUrl: clerkUser.imageUrl || null,
    },
  })
}

// ─── Public helpers used by pages and server actions ───────

/**
 * Require authenticated school context.
 * Auto-provisions School + Staff records on first access.
 */
export async function requireSchoolAuth() {
  const { orgId, userId, orgRole } = auth()
  if (!orgId || !userId) throw new Error('Unauthorized')

  const school = await autoProvisionSchool(orgId)
  if (!school.isActive) throw new Error('School is inactive')

  await autoProvisionStaff(school.id, userId, orgRole)

  return { schoolId: school.id, clerkOrgId: orgId, userId, role: orgRole }
}

/** Require owner-level access */
export async function requireOwner() {
  const ctx = await requireSchoolAuth()
  if (ctx.role !== 'org:admin') {
    throw new Error('Owner access required')
  }
  return ctx
}

/** Require teacher or owner access */
export async function requireTeacher() {
  const ctx = await requireSchoolAuth()
  if (ctx.role !== 'org:admin' && ctx.role !== 'org:teacher') {
    throw new Error('Teacher access required')
  }
  return ctx
}

/** Get schoolId from Clerk org. Every tenant-scoped query MUST use this. */
export function getSchoolId(): string {
  const { orgId } = auth()
  if (!orgId) throw new Error('Unauthorized — no school context')
  return orgId
}

/** Get current user's Clerk ID */
export function getUserId(): string {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')
  return userId
}

/** Get the Clerk org role */
export function getUserRole(): string | null {
  const { orgRole } = auth()
  return orgRole ?? null
}

/** Get the current user's staff record in DB */
export async function getStaffRecord() {
  const userId = getUserId()
  return prisma.staff.findUnique({
    where: { clerkUserId: userId },
    include: { school: true },
  })
}

/** Get current Clerk user profile (for display) */
export async function getClerkUser() {
  const user = await currentUser()
  if (!user) return null
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress,
    imageUrl: user.imageUrl,
  }
}
