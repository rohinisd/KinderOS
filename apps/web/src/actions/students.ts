'use server'

import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'
import { normalizePhone } from '@kinderos/utils'

const CreateStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  classId: z.string().cuid().optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('OTHER'),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  parentName: z.string().min(1).max(100),
  parentPhone: z.string().min(10),
  parentRelation: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER']).default('FATHER'),
  parentEmail: z.string().email().optional().or(z.literal('')),
})

export async function createStudent(
  input: z.infer<typeof CreateStudentSchema>
): Promise<ActionResult<{ studentId: string }>> {
  try {
    const { schoolId } = await requireSchoolAuth()
    const data = CreateStudentSchema.parse(input)

    const lastStudent = await prisma.student.findFirst({
      where: { schoolId },
      orderBy: { admissionNumber: 'desc' },
    })

    const nextNum = lastStudent
      ? parseInt(lastStudent.admissionNumber.replace(/\D/g, '') || '0') + 1
      : 1
    const admissionNumber = `ADM${String(nextNum).padStart(5, '0')}`

    const student = await prisma.student.create({
      data: {
        schoolId,
        firstName: data.firstName,
        lastName: data.lastName,
        classId: data.classId || null,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        allergies: data.allergies,
        medicalNotes: data.medicalNotes,
        admissionNumber,
        parents: {
          create: {
            firstName: data.parentName.split(' ')[0] ?? data.parentName,
            lastName: data.parentName.split(' ').slice(1).join(' ') || '',
            phone: normalizePhone(data.parentPhone),
            email: data.parentEmail || null,
            relation: data.parentRelation,
          },
        },
      },
    })

    revalidatePath('/dashboard/students')
    revalidatePath('/office/students')
    return ok({ studentId: student.id })
  } catch (error) {
    console.error('[createStudent]', error)
    return err('Failed to create student')
  }
}

const UpdateStudentSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  classId: z.string().optional().nullable(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED']).optional(),
})

export async function updateStudent(
  id: string,
  input: z.infer<typeof UpdateStudentSchema>
): Promise<ActionResult<{ studentId: string }>> {
  try {
    const { schoolId } = await requireSchoolAuth()
    const data = UpdateStudentSchema.parse(input)

    const existing = await prisma.student.findFirst({ where: { id, schoolId } })
    if (!existing) return err('Student not found')

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.classId !== undefined && { classId: data.classId || null }),
        ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth }),
        ...(data.gender && { gender: data.gender }),
        ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
        ...(data.allergies !== undefined && { allergies: data.allergies }),
        ...(data.medicalNotes !== undefined && { medicalNotes: data.medicalNotes }),
        ...(data.status && { status: data.status }),
      },
    })

    revalidatePath('/dashboard/students')
    revalidatePath('/office/students')
    return ok({ studentId: student.id })
  } catch (error) {
    console.error('[updateStudent]', error)
    return err('Failed to update student')
  }
}

export async function deleteStudent(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { schoolId } = await requireSchoolAuth()

    const existing = await prisma.student.findFirst({ where: { id, schoolId } })
    if (!existing) return err('Student not found')

    await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    })

    revalidatePath('/dashboard/students')
    revalidatePath('/office/students')
    return ok({ success: true })
  } catch (error) {
    console.error('[deleteStudent]', error)
    return err('Failed to delete student')
  }
}
