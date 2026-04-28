'use server'

import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'
import { normalizePhone } from '@kinderos/utils'

const StaffAssignableRole = z.enum([
  'PRINCIPAL', 'CLASS_TEACHER', 'SUBJECT_TEACHER',
  'VICE_PRINCIPAL', 'COORDINATOR',
  'ADMIN', 'ACCOUNTANT', 'COUNSELOR', 'LIBRARIAN', 'NURSE', 'RECEPTIONIST',
  'SUPPORT_STAFF', 'SECURITY_GUARD', 'DRIVER', 'TRANSPORT_MANAGER',
])

const StaffSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  role: StaffAssignableRole,
  designation: z.string().optional(),
  department: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('OTHER'),
  classTeacherId: z.string().cuid().optional(),
  salary: z.number().int().min(0).optional(),
  panNumber: z.string().trim().max(20).optional(),
  uanNumber: z.string().trim().max(30).optional(),
  esiNumber: z.string().trim().max(30).optional(),
  bankAccountHolder: z.string().trim().max(120).optional(),
  bankAccountNumber: z.string().trim().max(40).optional(),
  bankIfsc: z.string().trim().max(20).optional(),
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
        email: data.email ? data.email.trim().toLowerCase() : null,
        role: data.role,
        designation: data.designation,
        department: data.department,
        gender: data.gender,
        salary: data.salary ?? null,
        panNumber: data.panNumber || null,
        uanNumber: data.uanNumber || null,
        esiNumber: data.esiNumber || null,
        bankAccountHolder: data.bankAccountHolder || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankIfsc: data.bankIfsc || null,
      },
    })

    revalidatePath('/dashboard/teachers')
    revalidatePath('/office/staff')
    return ok({ staffId: staff.id })
  } catch (error) {
    console.error('[createStaff]', error)
    return err('Failed to create staff member')
  }
}

const UpdateStaffSchema = StaffSchema.partial().extend({
  role: StaffAssignableRole.optional(),
})

export async function updateStaff(
  id: string,
  input: Partial<z.infer<typeof StaffSchema>>
): Promise<ActionResult<{ staffId: string }>> {
  try {
    const { schoolId } = await requireSchoolAuth()

    const existing = await prisma.staff.findFirst({ where: { id, schoolId } })
    if (!existing) return err('Staff not found')

    const parsed = UpdateStaffSchema.partial().safeParse(input)
    if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(', '))

    if (existing.role === 'OWNER') {
      if (input.role !== undefined) {
        return err('School owner role cannot be changed from staff management')
      }
      if (parsed.data.email !== undefined && parsed.data.email) {
        const email = parsed.data.email.toLowerCase()
        const taken = await prisma.staff.findFirst({
          where: {
            email,
            role: 'OWNER',
            deletedAt: null,
            NOT: { id: existing.id },
          },
        })
        if (taken) return err('This email is already used as owner of another school')
      }
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.phone && { phone: normalizePhone(input.phone) }),
        ...(input.email !== undefined && {
          email: input.email ? input.email.trim().toLowerCase() : null,
        }),
        ...(input.role && existing.role !== 'OWNER' ? { role: input.role } : {}),
        ...(input.designation !== undefined && { designation: input.designation }),
        ...(input.department !== undefined && { department: input.department }),
        ...(input.gender && { gender: input.gender }),
        ...(input.salary !== undefined && { salary: input.salary }),
        ...(input.panNumber !== undefined && { panNumber: input.panNumber || null }),
        ...(input.uanNumber !== undefined && { uanNumber: input.uanNumber || null }),
        ...(input.esiNumber !== undefined && { esiNumber: input.esiNumber || null }),
        ...(input.bankAccountHolder !== undefined && { bankAccountHolder: input.bankAccountHolder || null }),
        ...(input.bankAccountNumber !== undefined && { bankAccountNumber: input.bankAccountNumber || null }),
        ...(input.bankIfsc !== undefined && { bankIfsc: input.bankIfsc || null }),
      },
    })

    revalidatePath('/dashboard/teachers')
    revalidatePath('/office/staff')
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
    if (existing.role === 'OWNER') return err('Cannot remove the school owner')

    await prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    })

    revalidatePath('/dashboard/teachers')
    revalidatePath('/office/staff')
    return ok({ success: true })
  } catch (error) {
    console.error('[deleteStaff]', error)
    return err('Failed to delete staff member')
  }
}
