'use server'

import { prisma } from '@/lib/prisma'
import { requireMarketingEditor } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'

const UpdateSchoolMarketingSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tagline: z.string().max(300).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  phone: z.string().min(10).max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  brandColor: z.string().max(32).optional(),
  accentColor: z.string().max(32).optional(),
  heroImageUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
  logoUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
})

export async function updateSchoolMarketing(
  input: z.infer<typeof UpdateSchoolMarketingSchema>
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId, schoolSlug } = await requireMarketingEditor()
    const data = UpdateSchoolMarketingSchema.parse(input)

    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.tagline !== undefined) payload.tagline = data.tagline
    if (data.description !== undefined) payload.description = data.description
    if (data.phone !== undefined) payload.phone = data.phone
    if (data.email !== undefined) payload.email = data.email
    if (data.address !== undefined) payload.address = data.address
    if (data.city !== undefined) payload.city = data.city
    if (data.state !== undefined) payload.state = data.state
    if (data.pincode !== undefined) payload.pincode = data.pincode
    if (data.brandColor !== undefined) payload.brandColor = data.brandColor
    if (data.accentColor !== undefined) payload.accentColor = data.accentColor
    if (data.heroImageUrl !== undefined) {
      payload.heroImageUrl = data.heroImageUrl === '' ? null : data.heroImageUrl
    }
    if (data.logoUrl !== undefined) {
      payload.logoUrl = data.logoUrl === '' ? null : data.logoUrl
    }

    await prisma.school.update({
      where: { id: schoolId },
      data: payload,
    })

    revalidatePath(`/${schoolSlug}`)
    revalidatePath(`/${schoolSlug}/admissions`)
    revalidatePath(`/${schoolSlug}/blog`)
    revalidatePath('/office/website')
    revalidatePath('/dashboard/customize')
    revalidatePath('/dashboard/settings')
    return ok({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map((e) => e.message).join(', '))
    }
    console.error('[updateSchoolMarketing]', error)
    return err('Failed to update public site details')
  }
}
