'use server'

import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ok, err, type ActionResult } from '@/lib/utils'

function istDayRange(now = new Date()): { start: Date; end: Date } {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const start = new Date(`${ymd}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

function revalidateStaffTimePaths() {
  revalidatePath('/classroom/punch')
  revalidatePath('/office/punch')
  revalidatePath('/classroom/leaves')
  revalidatePath('/office/leaves')
}

export async function punchIn(): Promise<ActionResult<{ attendanceId: string }>> {
  try {
    const { schoolId, userId } = await requireSchoolAuth()
    const { start, end } = istDayRange()

    const todayRecord = await prisma.staffAttendance.findFirst({
      where: {
        schoolId,
        staffId: userId,
        date: { gte: start, lt: end },
      },
    })

    if (todayRecord?.checkIn) return err('You are already punched in for today')

    const saved = todayRecord
      ? await prisma.staffAttendance.update({
          where: { id: todayRecord.id },
          data: {
            checkIn: new Date(),
            status: 'PRESENT',
          },
        })
      : await prisma.staffAttendance.create({
          data: {
            schoolId,
            staffId: userId,
            date: start,
            status: 'PRESENT',
            checkIn: new Date(),
          },
        })

    revalidateStaffTimePaths()
    return ok({ attendanceId: saved.id })
  } catch (error) {
    console.error('[punchIn]', error)
    return err('Failed to punch in')
  }
}

export async function punchOut(): Promise<ActionResult<{ attendanceId: string }>> {
  try {
    const { schoolId, userId } = await requireSchoolAuth()
    const { start, end } = istDayRange()

    const todayRecord = await prisma.staffAttendance.findFirst({
      where: {
        schoolId,
        staffId: userId,
        date: { gte: start, lt: end },
      },
    })
    if (!todayRecord?.checkIn) return err('Please punch in first')
    if (todayRecord.checkOut) return err('You are already punched out for today')

    const saved = await prisma.staffAttendance.update({
      where: { id: todayRecord.id },
      data: { checkOut: new Date() },
    })

    revalidateStaffTimePaths()
    return ok({ attendanceId: saved.id })
  } catch (error) {
    console.error('[punchOut]', error)
    return err('Failed to punch out')
  }
}

const LeaveRequestSchema = z.object({
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(3).max(1000),
})

export async function requestLeave(
  input: z.infer<typeof LeaveRequestSchema>
): Promise<ActionResult<{ leaveId: string }>> {
  try {
    const { schoolId, userId } = await requireSchoolAuth()
    const data = LeaveRequestSchema.parse(input)
    if (data.endDate < data.startDate) return err('End date cannot be before start date')

    const created = await prisma.leaveRequest.create({
      data: {
        schoolId,
        staffId: userId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason.trim(),
        status: 'PENDING',
      },
    })

    revalidateStaffTimePaths()
    return ok({ leaveId: created.id })
  } catch (error) {
    console.error('[requestLeave]', error)
    return err('Failed to submit leave request')
  }
}

const LeaveDecisionSchema = z.object({
  leaveId: z.string().cuid(),
  decision: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().max(1000).optional(),
})

const APPROVER_ROLES = new Set(['OWNER', 'PRINCIPAL', 'ADMIN'])

export async function decideLeaveRequest(
  input: z.infer<typeof LeaveDecisionSchema>
): Promise<ActionResult<{ leaveId: string }>> {
  try {
    const { schoolId, userId, role } = await requireSchoolAuth()
    if (!APPROVER_ROLES.has(role)) return err('Only owner, principal, or admin can approve leaves')

    const data = LeaveDecisionSchema.parse(input)
    const existing = await prisma.leaveRequest.findFirst({
      where: { id: data.leaveId, schoolId },
    })
    if (!existing) return err('Leave request not found')
    if (existing.status !== 'PENDING') return err('This leave request is already processed')

    await prisma.leaveRequest.update({
      where: { id: existing.id },
      data: {
        status: data.decision,
        approvedBy: userId,
        approvedAt: new Date(),
        note: data.note?.trim() || null,
      },
    })

    revalidateStaffTimePaths()
    return ok({ leaveId: existing.id })
  } catch (error) {
    console.error('[decideLeaveRequest]', error)
    return err('Failed to update leave request')
  }
}
