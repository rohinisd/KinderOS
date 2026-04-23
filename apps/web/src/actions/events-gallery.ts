'use server'

import { prisma } from '@/lib/prisma'
import { getAuthUser, requireSchoolAuth, requireTeacher } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'

const EventStorySchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  eventDate: z.coerce.date().optional().nullable(),
  coverUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
  photoUrls: z.array(z.string().url()).max(50).default([]),
})

function normalizeUrls(urls: string[]): string[] {
  const out = new Set<string>()
  for (const raw of urls) {
    const clean = raw.trim()
    if (!clean) continue
    out.add(clean)
  }
  return [...out]
}

async function createAlbumWithPhotos(input: z.infer<typeof EventStorySchema>, schoolId: string, classIds: string[]) {
  const coverUrl = input.coverUrl && input.coverUrl.trim().length > 0 ? input.coverUrl.trim() : null
  const urls = normalizeUrls(input.photoUrls)

  const album = await prisma.galleryAlbum.create({
    data: {
      schoolId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      coverUrl: coverUrl ?? urls[0] ?? null,
      isPublic: true,
      classIds,
      eventDate: input.eventDate ?? null,
      photos: urls.length > 0
        ? {
            createMany: {
              data: urls.map((url, i) => ({
                url,
                sortOrder: i,
              })),
            },
          }
        : undefined,
    },
  })
  return album.id
}

export async function createClassEventStory(
  input: z.infer<typeof EventStorySchema>
): Promise<ActionResult<{ albumId: string }>> {
  try {
    const { schoolId, userId } = await requireTeacher()
    const data = EventStorySchema.parse(input)

    const teacherClass = await prisma.class.findFirst({
      where: { schoolId, classTeacherId: userId },
      select: { id: true },
    })
    if (!teacherClass) return err('You are not assigned as class teacher to any class')

    const albumId = await createAlbumWithPhotos(data, schoolId, [teacherClass.id])
    revalidatePath('/classroom/events')
    revalidatePath('/parent/gallery')
    return ok({ albumId })
  } catch (error) {
    console.error('[createClassEventStory]', error)
    return err('Failed to create class event story')
  }
}

const SCHOOL_EVENT_ROLES = new Set(['OWNER', 'PRINCIPAL', 'ADMIN'])

export async function createSchoolEventStory(
  input: z.infer<typeof EventStorySchema>
): Promise<ActionResult<{ albumId: string }>> {
  try {
    const user = await getAuthUser()
    if (!user) return err('Unauthorized')
    if (!SCHOOL_EVENT_ROLES.has(user.role)) return err('Only owner/admin/principal can create school event stories')

    const { schoolId } = await requireSchoolAuth()
    const data = EventStorySchema.parse(input)
    const albumId = await createAlbumWithPhotos(data, schoolId, [])

    revalidatePath('/office/events')
    revalidatePath('/parent/gallery')
    return ok({ albumId })
  } catch (error) {
    console.error('[createSchoolEventStory]', error)
    return err('Failed to create school event story')
  }
}
