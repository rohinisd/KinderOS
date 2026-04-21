import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { isPlatformSuperAdminByClerkUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeHost, isPlatformHost } from '@/lib/platform-host'
import { getSchoolLandingByHost } from '@/lib/school-from-host'
import { SchoolPublicLanding } from '@/components/landing/school-public-landing'
import { PlatformMarketing } from '@/components/landing/platform-marketing'
import { HomeAuthBanner } from '@/components/landing/home-auth-banner'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const headersList = await headers()
  const host = normalizeHost(headersList.get('x-forwarded-host') ?? headersList.get('host') ?? '')

  // Custom domain → same branded landing as /[slug], links use /admissions not /slug/admissions
  if (!isPlatformHost(host)) {
    const school = await getSchoolLandingByHost(host)
    if (school) {
      return (
        <SchoolPublicLanding
          basePath=""
          school={{
            name: school.name,
            tagline: school.tagline,
            description: school.description,
            logoUrl: school.logoUrl,
            brandColor: school.brandColor,
            accentColor: school.accentColor,
            address: school.address,
            phone: school.phone,
            email: school.email,
            spotlights: school.spotlights,
          }}
        />
      )
    }
  }

  const { userId } = await auth()

  let staffFirstName: string | null = null
  let schoolName: string | null = null
  let role: string | null = null
  let isSuperAdmin = false

  if (userId) {
    const staff = await prisma.staff.findUnique({
      where: { clerkUserId: userId },
      include: { school: { select: { name: true } } },
    })
    if (staff) {
      staffFirstName = staff.firstName
      schoolName = staff.school.name
      role = staff.role
    }

    isSuperAdmin = await isPlatformSuperAdminByClerkUserId(userId)
  }

  return (
    <div className="min-h-screen">
      {userId && (
        <HomeAuthBanner
          staffFirstName={staffFirstName}
          schoolName={schoolName}
          role={role}
          isSuperAdmin={isSuperAdmin}
        />
      )}
      <PlatformMarketing />
    </div>
  )
}
