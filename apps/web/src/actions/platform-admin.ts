'use server'

import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'
import type { Plan } from '@kinderos/db'

const PlanEnum = z.enum(['STARTER', 'GROWTH', 'ACADEMY'])

const UpdateSubscriptionSchema = z.object({
  schoolId: z.string().min(1),
  plan: PlanEnum,
  /** ISO date string (yyyy-mm-dd) or empty for no expiry */
  planExpiresAt: z.string().nullable(),
})

export async function updateSchoolSubscription(
  input: z.infer<typeof UpdateSubscriptionSchema>
): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireSuperAdmin()
    const data = UpdateSubscriptionSchema.parse(input)

    const school = await prisma.school.findUnique({ where: { id: data.schoolId } })
    if (!school || school.deletedAt) return err('School not found')

    let planExpiresAt: Date | null = null
    if (data.planExpiresAt && data.planExpiresAt.trim() !== '') {
      const d = new Date(data.planExpiresAt)
      if (Number.isNaN(d.getTime())) return err('Invalid expiry date')
      planExpiresAt = d
    }

    await prisma.school.update({
      where: { id: data.schoolId },
      data: {
        plan: data.plan as Plan,
        planExpiresAt,
      },
    })

    revalidatePath('/admin/billing')
    revalidatePath('/admin/tenants')
    return ok({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map((e) => e.message).join(', '))
    }
    console.error('[updateSchoolSubscription]', error)
    return err('Failed to update subscription')
  }
}

const UpdateFeatureFlagSchema = z.object({
  id: z.string().min(1),
  isEnabled: z.boolean().optional(),
  /** null = all plans (no minimum tier) */
  planGating: PlanEnum.nullable().optional(),
  /** Non-empty = pilot allowlist: only these schools */
  schoolIds: z.array(z.string()).optional(),
})

export async function updateFeatureFlag(
  input: z.infer<typeof UpdateFeatureFlagSchema>
): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireSuperAdmin()
    const data = UpdateFeatureFlagSchema.parse(input)

    const existing = await prisma.featureFlag.findUnique({ where: { id: data.id } })
    if (!existing) return err('Feature flag not found')

    const patch: {
      isEnabled?: boolean
      planGating?: Plan | null
      schoolIds?: string[]
    } = {}
    if (data.isEnabled !== undefined) patch.isEnabled = data.isEnabled
    if (data.planGating !== undefined) patch.planGating = data.planGating
    if (data.schoolIds !== undefined) patch.schoolIds = data.schoolIds

    await prisma.featureFlag.update({
      where: { id: data.id },
      data: patch,
    })

    revalidatePath('/admin/feature-flags')
    return ok({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map((e) => e.message).join(', '))
    }
    console.error('[updateFeatureFlag]', error)
    return err('Failed to update feature flag')
  }
}

const CreateFeatureFlagSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, 'Use lowercase letters, numbers, underscores; start with a letter'),
})

export async function createFeatureFlag(
  raw: z.infer<typeof CreateFeatureFlagSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin()
    const data = CreateFeatureFlagSchema.parse(raw)

    const created = await prisma.featureFlag.create({
      data: {
        key: data.key,
        isEnabled: false,
        schoolIds: [],
      },
    })

    revalidatePath('/admin/feature-flags')
    return ok({ id: created.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map((e) => e.message).join(', '))
    }
    console.error('[createFeatureFlag]', error)
    return err('Failed to create flag (key may already exist)')
  }
}

export async function deleteFeatureFlag(id: string): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireSuperAdmin()
    if (!id) return err('Invalid id')

    await prisma.featureFlag.delete({ where: { id } })

    revalidatePath('/admin/feature-flags')
    return ok({ ok: true })
  } catch (error) {
    console.error('[deleteFeatureFlag]', error)
    return err('Failed to delete feature flag')
  }
}
