import { prisma } from '@/lib/prisma'
import { getAuthUser, isMarketingEditorRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { WebsiteClient } from './website-client'

export const dynamic = 'force-dynamic'

export default async function OfficeWebsitePage() {
  const user = await getAuthUser()
  if (!user || !isMarketingEditorRole(user.role)) {
    redirect('/office/students')
  }

  const school = await prisma.school.findUnique({
    where: { id: user.schoolId },
    include: {
      spotlights: {
        orderBy: [{ updatedAt: 'desc' }],
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
        },
      },
      blogPosts: {
        orderBy: { updatedAt: 'desc' },
        take: 40,
      },
    },
  })

  if (!school) redirect('/no-access')

  const spotlights = school.spotlights.map((s) => ({
    id: s.id,
    title: s.title,
    body: s.body,
    imageUrl: s.imageUrl,
    videoUrl: s.videoUrl,
    status: s.status,
    rejectNote: s.rejectNote,
    sortOrder: s.sortOrder,
    createdByName: `${s.createdBy.firstName} ${s.createdBy.lastName}`,
  }))

  const posts = school.blogPosts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    coverImageUrl: p.coverImageUrl,
    tags: p.tags,
    status: p.status,
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div>
      <PageHeader
        title="School website"
        description="Public landing page, USPs, and blog — visible to families at your school URL."
      />
      <div className="mt-6">
        <WebsiteClient
          school={{
            id: school.id,
            name: school.name,
            slug: school.slug,
            tagline: school.tagline,
            description: school.description,
            phone: school.phone,
            email: school.email,
            address: school.address,
            city: school.city,
            state: school.state,
            pincode: school.pincode,
            brandColor: school.brandColor,
            accentColor: school.accentColor,
            heroImageUrl: school.heroImageUrl,
            logoUrl: school.logoUrl,
            customDomain: school.customDomain,
          }}
          spotlights={spotlights}
          blogPosts={posts}
          isOwner={user.role === 'OWNER'}
        />
      </div>
    </div>
  )
}
