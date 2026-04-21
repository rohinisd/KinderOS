import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { SpotlightStatus } from '@kinderos/db'
import { SchoolPublicLanding } from '@/components/landing/school-public-landing'

export default async function SchoolPublicPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug, isActive: true },
    include: {
      spotlights: {
        where: { status: SpotlightStatus.LIVE },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, title: true, body: true, imageUrl: true, videoUrl: true },
      },
    },
  })

  if (!school) notFound()

  const basePath = `/${schoolSlug}`

  return (
    <SchoolPublicLanding
      basePath={basePath}
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
