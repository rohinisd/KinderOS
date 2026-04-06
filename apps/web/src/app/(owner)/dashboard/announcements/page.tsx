import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { AnnouncementsClient } from './announcements-client'

export default async function AnnouncementsPage() {
  const { schoolId } = await requireSchoolAuth()

  const announcements = await prisma.announcement.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const serialized = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    targetAudience: a.targetAudience,
    channels: a.channels,
    status: a.status,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }))

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Communicate with parents and staff"
      />
      <div className="mt-6">
        <AnnouncementsClient announcements={serialized} />
      </div>
    </div>
  )
}
