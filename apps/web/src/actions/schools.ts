'use server'

import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'
import { normalizePhone } from '@kinderos/utils'

const CreateSchoolSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  ownerFirstName: z.string().min(1).max(100),
  ownerLastName: z.string().min(1).max(100),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().min(10),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
})

export async function createSchool(
  input: z.infer<typeof CreateSchoolSchema>
): Promise<ActionResult<{ schoolId: string }>> {
  try {
    await requireSuperAdmin()
    const data = CreateSchoolSchema.parse(input)

    const existingSlug = await prisma.school.findUnique({ where: { slug: data.slug } })
    if (existingSlug) return err('A school with this slug already exists')

    const existingOwner = await prisma.staff.findFirst({
      where: { email: data.ownerEmail.toLowerCase(), role: 'OWNER' },
    })
    if (existingOwner) return err('This email is already registered as an owner of another school')

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          clerkOrgId: `school-${Date.now().toString(36)}`,
          name: data.name,
          slug: data.slug,
          city: data.city,
          state: data.state || 'Karnataka',
        },
      })

      await tx.staff.create({
        data: {
          schoolId: school.id,
          firstName: data.ownerFirstName,
          lastName: data.ownerLastName,
          email: data.ownerEmail.toLowerCase(),
          phone: normalizePhone(data.ownerPhone),
          role: 'OWNER',
        },
      })

      return school
    })

    revalidatePath('/admin/tenants')
    return ok({ schoolId: result.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map((e) => e.message).join(', '))
    }
    console.error('[createSchool]', error)
    return err('Failed to create school')
  }
}

export async function toggleSchoolActive(
  schoolId: string,
  isActive: boolean
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await requireSuperAdmin()

    const school = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!school) return err('School not found')

    await prisma.school.update({
      where: { id: schoolId },
      data: { isActive },
    })

    revalidatePath('/admin/tenants')
    return ok({ success: true })
  } catch (error) {
    console.error('[toggleSchoolActive]', error)
    return err('Failed to update school status')
  }
}

export async function deleteSchool(
  schoolId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await requireSuperAdmin()

    const school = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!school) return err('School not found')

    await prisma.school.update({
      where: { id: schoolId },
      data: { isActive: false, deletedAt: new Date() },
    })

    revalidatePath('/admin/tenants')
    return ok({ success: true })
  } catch (error) {
    console.error('[deleteSchool]', error)
    return err('Failed to delete school')
  }
}
