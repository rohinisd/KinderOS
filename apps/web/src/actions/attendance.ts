'use server'

import { prisma } from '@/lib/prisma'
import { requireTeacher } from '@/lib/auth'
import { sendAbsenceAlert } from '@/lib/twilio'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'
import { toIST } from '@kinderos/utils'

const MarkAttendanceSchema = z.object({
  classId: z.string().cuid(),
  date: z.coerce.date(),
  records: z.array(
    z.object({
      studentId: z.string().cuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY']),
      note: z.string().optional(),
    })
  ),
})

export async function markClassAttendance(
  input: z.infer<typeof MarkAttendanceSchema>
): Promise<ActionResult<{ count: number }>> {
  try {
    const { schoolId, userId } = await requireTeacher()
    const data = MarkAttendanceSchema.parse(input)

    const school = await prisma.school.findFirst({ where: { id: schoolId } })

    const results = await prisma.$transaction(
      data.records.map((record) =>
        prisma.studentAttendance.upsert({
          where: {
            studentId_date: {
              studentId: record.studentId,
              date: data.date,
            },
          },
          create: {
            schoolId,
            studentId: record.studentId,
            classId: data.classId,
            date: data.date,
            status: record.status,
            markedBy: userId,
            note: record.note,
          },
          update: {
            status: record.status,
            markedBy: userId,
            note: record.note,
          },
        })
      )
    )

    // Send WhatsApp alerts for absent students
    const absentRecords = data.records.filter((r) => r.status === 'ABSENT')
    for (const record of absentRecords) {
      const student = await prisma.student.findUnique({
        where: { id: record.studentId },
        include: { parents: { where: { isPrimary: true } } },
      })

      const parent = student?.parents[0]
      if (parent && student) {
        await sendAbsenceAlert({
          parentPhone: parent.phone,
          parentName: parent.firstName,
          studentName: `${student.firstName} ${student.lastName}`,
          date: toIST(data.date),
          schoolName: school?.name ?? 'School',
        })
      }
    }

    revalidatePath('/classroom/attendance')
    revalidatePath('/dashboard/attendance')
    return ok({ count: results.length })
  } catch (error) {
    console.error('[markClassAttendance]', error)
    return err('Failed to mark attendance')
  }
}
