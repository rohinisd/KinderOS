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

/**
 * Try to link a pre-created Staff record (invited by owner/super admin)
 * to this Clerk user. Matches by email where clerkUserId is null.
 */
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

// ─── Public helpers ───────────────────────────────────

const provisioningMap = new Map<string, Promise<AuthUser | null>>()

/**
 * Get the authenticated user with their school context.
 * Returns null if:
 *   - Not signed in
 *   - Signed in but no Staff record exists (not invited)
 *
 * NO auto-provisioning. All users must be pre-created by
 * the Super Admin (for owners) or by the school owner (for staff).
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  const staff = await prisma.staff.findUnique({
    where: { clerkUserId: userId },
    include: { school: true },
  })
  if (staff) return staffToAuthUser(staff, userId)

  if (provisioningMap.has(userId)) {
    return provisioningMap.get(userId)!
  }

  const promise = linkStaffByEmail(userId)
  provisioningMap.set(userId, promise)
  try {
    return await promise
  } finally {
    provisioningMap.delete(userId)
  }
}

/**
 * Require authenticated + authorized user.
 * Redirects to /no-access if signed in but not invited.
 * Redirects to /sign-in if not signed in.
 */
export async function requireAuth(): Promise<AuthUser> {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const user = await getAuthUser()
  if (!user) redirect('/no-access')
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

const MARKETING_EDITOR_ROLES = ['OWNER', 'PRINCIPAL', 'ADMIN'] as const

export function isMarketingEditorRole(role: string): boolean {
  return (MARKETING_EDITOR_ROLES as readonly string[]).includes(role)
}

/** Owner, principal, or school admin — public site copy, USPs, blog (not accountant/driver). */
export async function requireMarketingEditor() {
  const user = await requireAuth()
  if (!isMarketingEditorRole(user.role)) redirect('/no-access')
  return {
    schoolId: user.school.id,
    clerkOrgId: user.clerkUserId,
    staffId: user.id,
    role: user.role,
    schoolSlug: user.school.slug,
  }
}

export async function requireOwner() {
  const user = await requireAuth()
  if (user.role !== 'OWNER') redirect('/no-access')
  return {
    schoolId: user.school.id,
    clerkOrgId: user.clerkUserId,
    userId: user.id,
    role: user.role,
    schoolSlug: user.school.slug,
  }
}

export async function requireTeacher() {
  const user = await requireAuth()
  if (user.role !== 'OWNER' && user.role !== 'CLASS_TEACHER' && user.role !== 'SUBJECT_TEACHER' && user.role !== 'PRINCIPAL') {
    redirect('/no-access')
  }
  return {
    schoolId: user.school.id,
    clerkOrgId: user.clerkUserId,
    userId: user.id,
    role: user.role,
  }
}

// ─── Super Admin ──────────────────────────────────────

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isSuperAdminEmail(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase())
}

/** Collect every email on the Clerk user (primary is not always emailAddresses[0]). */
function collectClerkUserEmails(user: {
  id: string
  emailAddresses: Array<{ emailAddress: string; id?: string }>
  primaryEmailAddressId: string | null
}): string[] {
  const out = new Set<string>()
  for (const a of user.emailAddresses) {
    if (a.emailAddress) out.add(a.emailAddress.toLowerCase())
  }
  return [...out]
}

/**
 * Optional override in Clerk Dashboard → user → Public or Private metadata:
 * `{ "platformAdmin": true }` (or `platform_admin`) so production access works
 * without relying on `SUPER_ADMIN_EMAILS` or DB rows.
 */
function isClerkMetadataPlatformAdmin(user: {
  publicMetadata?: Record<string, unknown> | null
  privateMetadata?: Record<string, unknown> | null
}): boolean {
  const flag = (m: Record<string, unknown> | null | undefined) => {
    if (!m || typeof m !== 'object') return false
    return m.platformAdmin === true || m.platform_admin === true
  }
  return flag(user.publicMetadata as Record<string, unknown>) || flag(user.privateMetadata as Record<string, unknown>)
}

/**
 * Platform admin if SUPER_ADMIN_EMAILS matches any Clerk email, or a row exists in
 * `platform_admins` for this clerkUserId or email.
 */
async function isUserPlatformSuperAdmin(
  clerkUserId: string,
  emailsLower: string[]
): Promise<boolean> {
  for (const e of emailsLower) {
    if (SUPER_ADMIN_EMAILS.includes(e)) return true
  }
  const byClerk = await prisma.platformAdmin.findUnique({ where: { clerkUserId } })
  if (byClerk) return true
  if (emailsLower.length === 0) return false
  const byEmail = await prisma.platformAdmin.findFirst({
    where: {
      OR: emailsLower.map((email) => ({
        email: { equals: email, mode: 'insensitive' as const },
      })),
    },
  })
  return !!byEmail
}

async function loadClerkUserPlatformAdmin(clerkUserId: string): Promise<{
  isAdmin: boolean
  user: Awaited<ReturnType<Awaited<ReturnType<typeof clerkClient>>['users']['getUser']>>
}> {
  const client = await clerkClient()
  const user = await client.users.getUser(clerkUserId)
  if (isClerkMetadataPlatformAdmin(user)) {
    return { isAdmin: true, user }
  }
  const emails = collectClerkUserEmails(user)
  const isAdmin = await isUserPlatformSuperAdmin(user.id, emails)
  return { isAdmin, user }
}

/**
 * True when the signed-in Clerk user is a platform admin (env allowlist and/or DB).
 * Does not require a Staff row.
 *
 * Uses `auth().userId` + Backend API (not `currentUser()`), which is reliable when
 * `currentUser()` is null but the session is valid — a common cause of false "No Access".
 */
export async function isPlatformSuperAdminSession(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const { isAdmin } = await loadClerkUserPlatformAdmin(userId)
  return isAdmin
}

/**
 * Same as session check but for a Clerk user id (e.g. home page with auth() only).
 */
export async function isPlatformSuperAdminByClerkUserId(clerkUserId: string): Promise<boolean> {
  const { isAdmin } = await loadClerkUserPlatformAdmin(clerkUserId)
  return isAdmin
}

/**
 * Require the current Clerk user to be a super admin.
 * Identified by SUPER_ADMIN_EMAILS and/or PlatformAdmin table.
 */
export async function requireSuperAdmin(): Promise<{
  clerkUserId: string
  email: string
  firstName: string
}> {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const { isAdmin, user } = await loadClerkUserPlatformAdmin(userId)
  if (!isAdmin) redirect('/no-access')

  const addrs = user.emailAddresses as Array<{ emailAddress: string; id: string }>
  const primary =
    addrs.find((a) => a.id === user.primaryEmailAddressId)?.emailAddress ??
    addrs[0]?.emailAddress ??
    ''

  return {
    clerkUserId: user.id,
    email: primary,
    firstName: user.firstName ?? primary.split('@')[0] ?? 'Admin',
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
