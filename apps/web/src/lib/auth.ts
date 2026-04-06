import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

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

function staffToAuthUser(staff: {
  id: string; clerkUserId: string | null; schoolId: string;
  firstName: string; lastName: string; email: string | null;
  phone: string; role: string;
  school: { id: string; name: string; slug: string; logoUrl: string | null; brandColor: string; isActive: boolean }
}, clerkUserId: string): AuthUser {
  return {
    id: staff.id,
    clerkUserId,
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

async function linkStaffByEmail(clerkUserId: string): Promise<AuthUser | null> {
  try {
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
      data: { clerkUserId, photoUrl: clerkUser.imageUrl || null },
      include: { school: true },
    })

    return staffToAuthUser(updated, clerkUserId)
  } catch (e) {
    console.error('[auth] linkStaffByEmail failed:', e)
    return null
  }
}

async function provisionOwner(clerkUserId: string): Promise<AuthUser | null> {
  try {
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
  } catch (e) {
    console.error('[auth] provisionOwner failed:', e)

    // Race condition: another request may have already provisioned.
    // Check if the record now exists.
    const staff = await prisma.staff.findUnique({
      where: { clerkUserId },
      include: { school: true },
    })
    if (staff) return staffToAuthUser(staff, clerkUserId)

    return null
  }
}

// ─── Public helpers ───────────────────────────────────

let provisioningMap = new Map<string, Promise<AuthUser | null>>()

export async function getAuthUser(): Promise<AuthUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  // Fast path: user already has a Staff record
  const staff = await prisma.staff.findUnique({
    where: { clerkUserId: userId },
    include: { school: true },
  })
  if (staff) return staffToAuthUser(staff, userId)

  // Deduplicate concurrent provisioning calls for the same user
  if (provisioningMap.has(userId)) {
    return provisioningMap.get(userId)!
  }

  const promise = (async () => {
    const linked = await linkStaffByEmail(userId)
    if (linked) return linked
    return provisionOwner(userId)
  })()

  provisioningMap.set(userId, promise)
  try {
    return await promise
  } finally {
    provisioningMap.delete(userId)
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) redirect('/sign-in')
  if (!user.school.isActive) throw new Error('School is inactive')
  return user
}

export async function requireSchoolAuth() {
  const user = await requireAuth()
  return {
    schoolId: user.school.id,
    clerkOrgId: user.clerkUserId,
    userId: user.id,
    role: user.role,
  }
}

export async function requireOwner() {
  const user = await requireAuth()
  if (user.role !== 'OWNER') redirect('/dashboard')
  return {
    schoolId: user.school.id,
    clerkOrgId: user.clerkUserId,
    userId: user.id,
    role: user.role,
  }
}

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
