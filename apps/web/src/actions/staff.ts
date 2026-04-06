'use server'

import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'
import { normalizePhone } from '@kinderos/utils'

const StaffSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum([
    'OWNER', 'PRINCIPAL', 'CLASS_TEACHER', 'SUBJECT_TEACHER',
    'ADMIN', 'ACCOUNTANT', 'SUPPORT_STAFF', 'DRIVER',
  ]),
  designation: z.string().optional(),
  department: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('OTHER'),
  classTeacherId: z.string().cuid().optional(),
})

export async function createStaff(
  input: z.infer<typeof StaffSchema>
): Promise<ActionResult<{ staffId: string }>> {
  try {
    const { schoolId } = await requireSchoolAuth()
    const data = StaffSchema.parse(input)

    const staff = await prisma.staff.create({
      data: {
        schoolId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: normalizePhone(data.phone),
        email: data.email || null,
        role: data.role,
        designation: data.designation,
        department: data.department,
        gender: data.gender,
      },
    })

    revalidatePath('/dashboard/teachers')
    return ok({ staffId: staff.id })
  } catch (error) {
    console.error('[createStaff]', error)
    return err('Failed to create staff member')
  }
}

export async function updateStaff(
  id: string,
  input: Partial<z.infer<typeof StaffSchema>>
): Promise<ActionResult<{ staffId: string }>> {
  try {
    const { schoolId } = await requireSchoolAuth()

    const existing = await prisma.staff.findFirst({ where: { id, schoolId } })
    if (!existing) return err('Staff not found')

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.phone && { phone: normalizePhone(input.phone) }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.role && { role: input.role }),
        ...(input.designation !== undefined && { designation: input.designation }),
        ...(input.department !== undefined && { department: input.department }),
        ...(input.gender && { gender: input.gender }),
      },
    })

    revalidatePath('/dashboard/teachers')
    return ok({ staffId: staff.id })
  } catch (error) {
    console.error('[updateStaff]', error)
    return err('Failed to update staff member')
  }
}

export async function deleteStaff(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId } = await requireSchoolAuth()

    const existing = await prisma.staff.findFirst({ where: { id, schoolId } })
    if (!existing) return err('Staff not found')

    await prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    })

    revalidatePath('/dashboard/teachers')
    return ok({ success: true })
  } catch (error) {
    console.error('[deleteStaff]', error)
    return err('Failed to delete staff member')
  }
}
