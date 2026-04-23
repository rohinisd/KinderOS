import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EventStoriesClient } from '@/components/events/event-stories-client'

export const dynamic = 'force-dynamic'

export default async function ClassroomEventsPage() {
  const { schoolId, userId } = await requireTeacher()

  const teacherClass = await prisma.class.findFirst({
    where: { schoolId, classTeacherId: userId },
    select: { id: true },
  })

  const albums = teacherClass
    ? await prisma.galleryAlbum.findMany({
        where: {
          schoolId,
          classIds: { has: teacherClass.id },
          isPublic: true,
        },
        include: { _count: { select: { photos: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  const serialized = albums.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    coverUrl: a.coverUrl,
    eventDate: a.eventDate?.toISOString() ?? null,
    photoCount: a._count.photos,
    classIds: a.classIds,
  }))

  return <EventStoriesClient mode="class" albums={serialized} />
}
