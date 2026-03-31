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
  parentName: z.string().min(1).max(100),
  parentPhone: z.string().min(10),
  parentRelation: z.enum(['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER']).default('FATHER'),
  parentEmail: z.string().email().optional(),
})

export async function createStudent(
  input: z.infer<typeof CreateStudentSchema>
): Promise<ActionResult<{ studentId: string }>> {
  try {
    const { schoolId, userId } = await requireSchoolAuth()
    const data = CreateStudentSchema.parse(input)

    const lastStudent = await prisma.student.findFirst({
      where: { schoolId },
      orderBy: { admissionNumber: 'desc' },
    })

    const nextNum = lastStudent
      ? parseInt(lastStudent.admissionNumber.replace(/\D/g, '')) + 1
      : 1
    const admissionNumber = `ADM${String(nextNum).padStart(5, '0')}`

    const student = await prisma.student.create({
      data: {
        schoolId,
        firstName: data.firstName,
        lastName: data.lastName,
        classId: data.classId,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        admissionNumber,
        parents: {
          create: {
            firstName: data.parentName.split(' ')[0] ?? data.parentName,
            lastName: data.parentName.split(' ').slice(1).join(' ') || '',
            phone: normalizePhone(data.parentPhone),
            email: data.parentEmail,
            relation: data.parentRelation,
          },
        },
      },
    })

    revalidatePath('/dashboard/students')
    return ok({ studentId: student.id })
  } catch (error) {
    console.error('[createStudent]', error)
    return err('Failed to create student')
  }
}
