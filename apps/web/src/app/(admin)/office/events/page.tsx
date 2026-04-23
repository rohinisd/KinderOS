import { getAuthUser, requireSchoolAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { EventStoriesClient } from '@/components/events/event-stories-client'

export const dynamic = 'force-dynamic'

const SCHOOL_EVENT_ROLES = new Set(['OWNER', 'PRINCIPAL', 'ADMIN'])

export default async function OfficeEventsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/no-access')
  if (!SCHOOL_EVENT_ROLES.has(user.role)) redirect('/no-access')

  const { schoolId } = await requireSchoolAuth()

  const albums = await prisma.galleryAlbum.findMany({
    where: {
      schoolId,
      isPublic: true,
      classIds: { isEmpty: true },
    },
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const serialized = albums.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    coverUrl: a.coverUrl,
    eventDate: a.eventDate?.toISOString() ?? null,
    photoCount: a._count.photos,
    classIds: a.classIds,
  }))

  return <EventStoriesClient mode="school" albums={serialized} />
}
