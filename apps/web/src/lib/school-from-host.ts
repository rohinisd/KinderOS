import { prisma } from '@/lib/prisma'
import { hostLookupVariants } from '@/lib/platform-host'
import { SpotlightStatus } from '@kinderos/db'

/** Lightweight lookup for middleware rewrites (custom domain → internal /[slug] routes). */
export async function getSchoolSlugByCustomHost(host: string): Promise<string | null> {
  const variants = hostLookupVariants(host)
  const row = await prisma.school.findFirst({
    where: {
      deletedAt: null,
      isActive: true,
      customDomain: { in: variants },
    },
    select: { slug: true },
  })
  return row?.slug ?? null
}

/**
 * Resolve an active school by the HTTP Host header (custom domain on Vercel),
 * with data needed for the public landing page.
 */
export async function getSchoolLandingByHost(host: string | null) {
  if (!host) return null
  const variants = hostLookupVariants(host)
  return prisma.school.findFirst({
    where: {
      deletedAt: null,
      isActive: true,
      customDomain: { in: variants },
    },
    include: {
      spotlights: {
        where: { status: SpotlightStatus.LIVE },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, title: true, body: true, imageUrl: true, videoUrl: true },
      },
    },
  })
}
