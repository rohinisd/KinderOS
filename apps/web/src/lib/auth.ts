import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

/**
 * KinderOS Auth — GarageManage pattern
 *
 * Clerk is used ONLY for user identity (sign-in / sign-up).
 * Multi-tenancy (which school a user belongs to) is managed
 * entirely through our Prisma DB: Staff.clerkUserId → Staff.schoolId → School.
 *
 * NO Clerk Organizations needed — works on free tier.
 *
 * Flow:
 * 1. User signs in via Clerk (gets a userId)
 * 2. getAuthUser() looks up their Staff record by clerkUserId
 * 3. If no Staff record: try linking by email (pre-invited staff)
 * 4. If still no record: auto-provision a new School + Staff(OWNER)
 */

type AuthUser = {
  id: string
  clerkUserId: string
  schoolId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string
  role: string
  school: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    brandColor: string
    isActive: boolean
  }
}

/** Try to link a pre-created Staff record (invited by owner) to this Clerk user */
async function linkStaffByEmail(clerkUserId: string): Promise<AuthUser | null> {
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkUserId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) return null

  const staff = await prisma.staff.findFirst({
    where: { email, clerkUserId: null, status: 'ACTIVE' },
    include: { school: true },
  })
  if (!staff) return null

  const updated = await prisma.staff.update({
    where: { id: staff.id },
    data: {
      clerkUserId,
      photoUrl: clerkUser.imageUrl || null,
    },
    include: { school: true },
  })

  console.log(`[auth] Linked staff ${updated.firstName} to Clerk user ${clerkUserId}`)

  return {
    id: updated.id,
    clerkUserId,
    schoolId: updated.schoolId,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
    phone: updated.phone,
    role: updated.role,
    school: {
      id: updated.school.id,
      name: updated.school.name,
      slug: updated.school.slug,
      logoUrl: updated.school.logoUrl,
      brandColor: updated.school.brandColor,
      isActive: updated.school.isActive,
    },
  }
}

/** Auto-provision a new School + Owner Staff for a first-time user */
async function provisionOwner(clerkUserId: string): Promise<AuthUser> {
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkUserId)

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
  const firstName = clerkUser.firstName || email.split('@')[0] || 'Owner'
  const lastName = clerkUser.lastName || ''

  const slug = `school-${Date.now().toString(36)}`

  const result = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        clerkOrgId: clerkUserId,
        name: `${firstName}'s School`,
        slug,
        logoUrl: clerkUser.imageUrl || null,
      },
    })

    const staff = await tx.staff.create({
      data: {
        schoolId: school.id,
        clerkUserId,
        firstName,
        lastName,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber ?? '',
        email,
        role: 'OWNER',
        photoUrl: clerkUser.imageUrl || null,
      },
    })

    return { school, staff }
  })

  console.log(`[auth] Provisioned school "${result.school.name}" for ${firstName}`)

  return {
    id: result.staff.id,
    clerkUserId,
    schoolId: result.school.id,
    firstName,
    lastName,
    email,
    phone: result.staff.phone,
    role: 'OWNER',
    school: {
      id: result.school.id,
      name: result.school.name,
      slug: result.school.slug,
      logoUrl: result.school.logoUrl,
      brandColor: result.school.brandColor,
      isActive: result.school.isActive,
    },
  }
}

// ─── Public helpers used by pages and server actions ───────

/**
 * Get the authenticated user with their school context.
 * Returns null if not signed in.
 * Auto-provisions School + Staff on first access (like GarageManage).
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  const staff = await prisma.staff.findUnique({
    where: { clerkUserId: userId },
    include: { school: true },
  })

  if (staff) {
    return {
      id: staff.id,
      clerkUserId: userId,
      schoolId: staff.schoolId,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      school: {
        id: staff.school.id,
        name: staff.school.name,
        slug: staff.school.slug,
        logoUrl: staff.school.logoUrl,
        brandColor: staff.school.brandColor,
        isActive: staff.school.isActive,
      },
    }
  }

  const linked = await linkStaffByEmail(userId)
  if (linked) return linked

  return provisionOwner(userId)
}

/**
 * Require authenticated user. Redirects to /sign-in if not logged in.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) redirect('/sign-in')
  if (!user.school.isActive) throw new Error('School is inactive')
  return user
}

/**
 * Require school context. Used by all tenant-scoped pages/actions.
 * Returns { schoolId, userId, role } matching the existing API.
 */
export async function requireSchoolAuth() {
  const user = await requireAuth()
  return {
    schoolId: user.school.id,
    clerkOrgId: user.clerkUserId,
    userId: user.id,
    role: user.role,
  }
}

/** Require owner-level access */
export async function requireOwner() {
  const user = await requireAuth()
  if (user.role !== 'OWNER') {
    redirect('/dashboard')
  }
  return {
    schoolId: user.school.id,
    clerkOrgId: user.clerkUserId,
    userId: user.id,
    role: user.role,
  }
}

/** Require teacher or owner access */
export async function requireTeacher() {
  const user = await requireAuth()
  if (user.role !== 'OWNER' && user.role !== 'CLASS_TEACHER' && user.role !== 'SUBJECT_TEACHER' && user.role !== 'PRINCIPAL') {
    redirect('/dashboard')
  }
  return {
    schoolId: user.school.id,
    clerkOrgId: user.clerkUserId,
    userId: user.id,
    role: user.role,
  }
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
