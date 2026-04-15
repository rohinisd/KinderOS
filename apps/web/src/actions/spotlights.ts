'use server'

import { prisma } from '@/lib/prisma'
import { requireMarketingEditor, requireOwner } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'
import { SpotlightStatus } from '@kinderos/db'

const MAX_TITLE = 200
const MAX_BODY = 12000

const SpotlightBody = z.object({
  title: z.string().min(1).max(MAX_TITLE),
  body: z.string().min(1).max(MAX_BODY),
  imageUrl: z.string().max(1200).optional().nullable(),
  videoUrl: z.string().max(500).optional().nullable(),
})

function revalidateSchoolSite(slug: string) {
  revalidatePath(`/${slug}`)
  revalidatePath('/office/website')
}

export async function createSchoolSpotlight(
  input: z.infer<typeof SpotlightBody>
): Promise<ActionResult<{ id: string }>> {
  try {
    const { schoolId, staffId, schoolSlug } = await requireMarketingEditor()
    const data = SpotlightBody.parse(input)

    const row = await prisma.schoolSpotlight.create({
      data: {
        schoolId,
        title: data.title.trim(),
        body: data.body.trim(),
        imageUrl: data.imageUrl?.trim() || null,
        videoUrl: data.videoUrl?.trim() || null,
        status: SpotlightStatus.DRAFT,
        sortOrder: 0,
        createdById: staffId,
      },
    })
    revalidateSchoolSite(schoolSlug)
    return ok({ id: row.id })
  } catch (error) {
    if (error instanceof z.ZodError) return err(error.issues.map((e) => e.message).join(', '))
    console.error('[createSchoolSpotlight]', error)
    return err('Failed to create spotlight')
  }
}

export async function updateSchoolSpotlightDraft(
  id: string,
  input: z.infer<typeof SpotlightBody>
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId, schoolSlug } = await requireMarketingEditor()
    const data = SpotlightBody.parse(input)

    const existing = await prisma.schoolSpotlight.findFirst({
      where: { id, schoolId },
    })
    if (!existing) return err('Spotlight not found')
    if (existing.status !== SpotlightStatus.DRAFT && existing.status !== SpotlightStatus.REJECTED) {
      return err('Only drafts or rejected items can be edited here')
    }

    await prisma.schoolSpotlight.update({
      where: { id },
      data: {
        title: data.title.trim(),
        body: data.body.trim(),
        imageUrl: data.imageUrl?.trim() || null,
        videoUrl: data.videoUrl?.trim() || null,
        status: SpotlightStatus.DRAFT,
        rejectNote: null,
      },
    })
    revalidateSchoolSite(schoolSlug)
    return ok({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) return err(error.issues.map((e) => e.message).join(', '))
    console.error('[updateSchoolSpotlightDraft]', error)
    return err('Failed to update spotlight')
  }
}

export async function submitSchoolSpotlightForReview(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId, schoolSlug } = await requireMarketingEditor()

    const existing = await prisma.schoolSpotlight.findFirst({
      where: { id, schoolId },
    })
    if (!existing) return err('Spotlight not found')
    if (existing.status !== SpotlightStatus.DRAFT && existing.status !== SpotlightStatus.REJECTED) {
      return err('Only drafts can be submitted for review')
    }

    await prisma.schoolSpotlight.update({
      where: { id },
      data: { status: SpotlightStatus.PENDING, rejectNote: null },
    })
    revalidateSchoolSite(schoolSlug)
    return ok({ success: true })
  } catch (error) {
    console.error('[submitSchoolSpotlightForReview]', error)
    return err('Failed to submit for review')
  }
}

async function nextLiveSortOrder(schoolId: string): Promise<number> {
  const m = await prisma.schoolSpotlight.aggregate({
    where: { schoolId, status: SpotlightStatus.LIVE },
    _max: { sortOrder: true },
  })
  return (m._max.sortOrder ?? -1) + 1
}

export async function approveSchoolSpotlight(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId, userId, schoolSlug } = await requireOwner()

    const existing = await prisma.schoolSpotlight.findFirst({
      where: { id, schoolId },
    })
    if (!existing) return err('Spotlight not found')
    if (existing.status !== SpotlightStatus.PENDING) {
      return err('Only pending items can be approved')
    }

    const sortOrder = await nextLiveSortOrder(schoolId)
    await prisma.schoolSpotlight.update({
      where: { id },
      data: {
        status: SpotlightStatus.LIVE,
        sortOrder,
        reviewedAt: new Date(),
        reviewedById: userId,
        rejectNote: null,
      },
    })

    revalidateSchoolSite(schoolSlug)
    return ok({ success: true })
  } catch (error) {
    console.error('[approveSchoolSpotlight]', error)
    return err('Failed to approve spotlight')
  }
}

const RejectSchema = z.object({
  id: z.string().cuid(),
  note: z.string().min(1).max(2000),
})

export async function rejectSchoolSpotlight(
  input: z.infer<typeof RejectSchema>
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId, userId, schoolSlug } = await requireOwner()
    const { id, note } = RejectSchema.parse(input)

    const existing = await prisma.schoolSpotlight.findFirst({
      where: { id, schoolId },
    })
    if (!existing) return err('Spotlight not found')
    if (existing.status !== SpotlightStatus.PENDING) {
      return err('Only pending items can be rejected')
    }

    await prisma.schoolSpotlight.update({
      where: { id },
      data: {
        status: SpotlightStatus.REJECTED,
        rejectNote: note.trim(),
        reviewedAt: new Date(),
        reviewedById: userId,
      },
    })
    revalidateSchoolSite(schoolSlug)
    return ok({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) return err(error.issues.map((e) => e.message).join(', '))
    console.error('[rejectSchoolSpotlight]', error)
    return err('Failed to reject spotlight')
  }
}

export async function withdrawSchoolSpotlightFromLive(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId, schoolSlug } = await requireOwner()

    const existing = await prisma.schoolSpotlight.findFirst({
      where: { id, schoolId },
    })
    if (!existing) return err('Spotlight not found')
    if (existing.status !== SpotlightStatus.LIVE) {
      return err('Only live spotlights can be withdrawn')
    }

    await prisma.schoolSpotlight.update({
      where: { id },
      data: { status: SpotlightStatus.DRAFT, sortOrder: 0 },
    })
    revalidateSchoolSite(schoolSlug)
    return ok({ success: true })
  } catch (error) {
    console.error('[withdrawSchoolSpotlightFromLive]', error)
    return err('Failed to withdraw spotlight')
  }
}

export async function deleteSchoolSpotlight(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId, staffId, role, schoolSlug } = await requireMarketingEditor()

    const existing = await prisma.schoolSpotlight.findFirst({
      where: { id, schoolId },
    })
    if (!existing) return err('Spotlight not found')

    const isOwner = role === 'OWNER'
    if (isOwner) {
      await prisma.schoolSpotlight.delete({ where: { id } })
      revalidateSchoolSite(schoolSlug)
      return ok({ success: true })
    }

    if (existing.createdById !== staffId) {
      return err('You can only delete your own drafts')
    }
    if (existing.status === SpotlightStatus.PENDING || existing.status === SpotlightStatus.LIVE) {
      return err('Cannot delete pending or live items')
    }

    await prisma.schoolSpotlight.delete({ where: { id } })
    revalidateSchoolSite(schoolSlug)
    return ok({ success: true })
  } catch (error) {
    console.error('[deleteSchoolSpotlight]', error)
    return err('Failed to delete spotlight')
  }
}
