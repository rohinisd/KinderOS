'use server'

import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { sendAnnouncementWhatsApp } from '@/lib/twilio'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'

const CreateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  targetAudience: z.enum(['ALL', 'PARENTS', 'TEACHERS', 'SPECIFIC_CLASSES']).default('ALL'),
  classIds: z.array(z.string()).optional(),
  channels: z.array(z.enum(['PUSH', 'WHATSAPP', 'SMS', 'EMAIL', 'IN_APP'])),
  scheduledAt: z.coerce.date().optional(),
  imageUrl: z.string().url().optional(),
})

export async function createAnnouncement(
  input: z.infer<typeof CreateAnnouncementSchema>
): Promise<ActionResult<{ announcementId: string }>> {
  try {
    const { schoolId, userId } = await requireSchoolAuth()
    const data = CreateAnnouncementSchema.parse(input)

    const announcement = await prisma.announcement.create({
      data: {
        schoolId,
        title: data.title,
        body: data.body,
        imageUrl: data.imageUrl,
        targetAudience: data.targetAudience,
        classIds: data.classIds ?? [],
        channels: data.channels,
        status: data.scheduledAt ? 'DRAFT' : 'PUBLISHED',
        publishedAt: data.scheduledAt ? undefined : new Date(),
        scheduledAt: data.scheduledAt,
        createdBy: userId,
      },
    })

    // If publishing now and WhatsApp is a channel, send it
    if (!data.scheduledAt && data.channels.includes('WHATSAPP')) {
      const school = await prisma.school.findFirst({ where: { id: schoolId } })
      const parents = await prisma.parent.findMany({
        where: {
          students: { some: { schoolId, status: 'ACTIVE' } },
        },
      })

      for (const parent of parents) {
        await sendAnnouncementWhatsApp({
          phone: parent.phone,
          title: data.title,
          body: data.body,
          schoolName: school?.name ?? 'School',
        })
      }
    }

    revalidatePath('/dashboard/announcements')
    return ok({ announcementId: announcement.id })
  } catch (error) {
    console.error('[createAnnouncement]', error)
    return err('Failed to create announcement')
  }
}
