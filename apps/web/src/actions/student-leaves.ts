'use server'

import { prisma } from '@/lib/prisma'
import { getParentPortalUser, requireTeacher } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'

const StudentLeaveSchema = z.object({
  studentId: z.string().cuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(3).max(1000),
})

const StudentLeaveDecisionSchema = z.object({
  requestId: z.string().cuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().max(1000).optional(),
})

function revalidateStudentLeavePaths() {
  revalidatePath('/parent')
  revalidatePath('/parent/leaves')
  revalidatePath('/classroom')
  revalidatePath('/classroom/student-leaves')
}

export async function requestStudentLeave(
  input: z.infer<typeof StudentLeaveSchema>
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const parent = await getParentPortalUser()
    if (!parent) return err('Please sign in as a parent')

    const data = StudentLeaveSchema.parse(input)
    if (data.endDate < data.startDate) return err('End date cannot be before start date')

    const student = await prisma.student.findFirst({
      where: {
        id: data.studentId,
        schoolId: parent.schoolId,
        deletedAt: null,
        parents: { some: { id: parent.parentId } },
      },
      select: { id: true, classId: true },
    })
    if (!student) return err('Student not found for this parent')
    if (!student.classId) return err('Student is not assigned to a class yet')

    const created = await prisma.studentLeaveRequest.create({
      data: {
        schoolId: parent.schoolId,
        classId: student.classId,
        studentId: student.id,
        parentId: parent.parentId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason.trim(),
        status: 'PENDING',
      },
    })

    revalidateStudentLeavePaths()
    return ok({ requestId: created.id })
  } catch (error) {
    console.error('[requestStudentLeave]', error)
    return err('Failed to submit student leave request')
  }
}

export async function decideStudentLeaveRequest(
  input: z.infer<typeof StudentLeaveDecisionSchema>
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const { schoolId, userId } = await requireTeacher()
    const data = StudentLeaveDecisionSchema.parse(input)

    const teacherClass = await prisma.class.findFirst({
      where: { schoolId, classTeacherId: userId },
      select: { id: true },
    })
    if (!teacherClass) return err('No class assigned to review leave requests')

    const request = await prisma.studentLeaveRequest.findFirst({
      where: {
        id: data.requestId,
        schoolId,
        classId: teacherClass.id,
      },
      select: { id: true, status: true },
    })
    if (!request) return err('Leave request not found')
    if (request.status !== 'PENDING') return err('This request is already processed')

    await prisma.studentLeaveRequest.update({
      where: { id: request.id },
      data: {
        status: data.decision,
        reviewedById: userId,
        reviewedAt: new Date(),
        note: data.note?.trim() || null,
      },
    })

    revalidateStudentLeavePaths()
    return ok({ requestId: request.id })
  } catch (error) {
    console.error('[decideStudentLeaveRequest]', error)
    return err('Failed to update student leave request')
  }
}
