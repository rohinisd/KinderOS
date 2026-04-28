'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth, requireSchoolAuth } from '@/lib/auth'
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

function parseLeavePolicy(policy: unknown): { clTotal: number; slTotal: number; elTotal: number } {
  if (!policy || typeof policy !== 'object') return { clTotal: 12, slTotal: 7, elTotal: 15 }
  const obj = policy as Record<string, unknown>
  const clTotal = typeof obj.clTotal === 'number' ? obj.clTotal : 12
  const slTotal = typeof obj.slTotal === 'number' ? obj.slTotal : 7
  const elTotal = typeof obj.elTotal === 'number' ? obj.elTotal : 15
  return { clTotal, slTotal, elTotal }
}

function leaveDaysInclusive(startDate: Date, endDate: Date): number {
  const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
  const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())
  if (end < start) return 0
  return (end - start) / (24 * 60 * 60 * 1000) + 1
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

    const now = new Date()
    const istHour = Number(
      now.toLocaleString('en-IN', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })
    )
    const status: 'PRESENT' | 'LATE' = istHour >= 10 ? 'LATE' : 'PRESENT'

    const saved = todayRecord
      ? await prisma.staffAttendance.update({
          where: { id: todayRecord.id },
          data: {
            checkIn: now,
            status,
          },
        })
      : await prisma.staffAttendance.create({
          data: {
            schoolId,
            staffId: userId,
            date: start,
            status,
            checkIn: now,
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

    const now = new Date()
    const hoursWorked = (now.getTime() - todayRecord.checkIn.getTime()) / 3600000
    const status = hoursWorked < 4 ? 'HALF_DAY' : todayRecord.status

    const saved = await prisma.staffAttendance.update({
      where: { id: todayRecord.id },
      data: { checkOut: now, status },
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

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id: existing.id },
        data: {
          status: data.decision,
          approvedBy: userId,
          approvedAt: new Date(),
          note: data.note?.trim() || null,
        },
      })

      if (data.decision !== 'APPROVED') return
      if (!['CASUAL', 'SICK', 'EARNED'].includes(existing.leaveType)) return

      const year = existing.startDate.getUTCFullYear()
      const totalDays = leaveDaysInclusive(existing.startDate, existing.endDate)
      const school = await tx.school.findUnique({
        where: { id: schoolId },
        select: { leavePolicy: true },
      })
      const lp = parseLeavePolicy(school?.leavePolicy)
      const field =
        existing.leaveType === 'CASUAL'
          ? 'clUsed'
          : existing.leaveType === 'SICK'
            ? 'slUsed'
            : 'elUsed'

      await tx.leaveBalance.upsert({
        where: {
          schoolId_staffId_year: {
            schoolId,
            staffId: existing.staffId,
            year,
          },
        },
        create: {
          schoolId,
          staffId: existing.staffId,
          year,
          clTotal: lp.clTotal,
          slTotal: lp.slTotal,
          elTotal: lp.elTotal,
          clUsed: field === 'clUsed' ? totalDays : 0,
          slUsed: field === 'slUsed' ? totalDays : 0,
          elUsed: field === 'elUsed' ? totalDays : 0,
        },
        update: {
          [field]: { increment: totalDays },
        },
      })
    })

    revalidateStaffTimePaths()
    return ok({ leaveId: existing.id })
  } catch (error) {
    console.error('[decideLeaveRequest]', error)
    return err('Failed to update leave request')
  }
}

const LeaveBalanceSchema = z.object({
  staffId: z.string().cuid(),
  year: z.number().int().min(2000).max(2100),
  clTotal: z.number().min(0).max(366),
  slTotal: z.number().min(0).max(366),
  elTotal: z.number().min(0).max(366),
})

export async function upsertLeaveBalance(
  input: z.infer<typeof LeaveBalanceSchema>
): Promise<ActionResult<{ staffId: string }>> {
  try {
    const user = await requireAuth()
    if (user.role !== 'OWNER') return err('Only owner can set leave balance')
    const data = LeaveBalanceSchema.parse(input)

    const staff = await prisma.staff.findFirst({
      where: {
        id: data.staffId,
        schoolId: user.school.id,
        deletedAt: null,
        role: { not: 'OWNER' },
      },
      select: { id: true },
    })
    if (!staff) return err('Staff not found')

    await prisma.leaveBalance.upsert({
      where: {
        schoolId_staffId_year: {
          schoolId: user.school.id,
          staffId: data.staffId,
          year: data.year,
        },
      },
      create: {
        schoolId: user.school.id,
        staffId: data.staffId,
        year: data.year,
        clTotal: data.clTotal,
        slTotal: data.slTotal,
        elTotal: data.elTotal,
      },
      update: {
        clTotal: data.clTotal,
        slTotal: data.slTotal,
        elTotal: data.elTotal,
      },
    })

    revalidateStaffTimePaths()
    return ok({ staffId: data.staffId })
  } catch (error) {
    console.error('[upsertLeaveBalance]', error)
    return err('Failed to save leave balance')
  }
}

const LeavePolicySchema = z.object({
  clTotal: z.number().min(0).max(366),
  slTotal: z.number().min(0).max(366),
  elTotal: z.number().min(0).max(366),
})

export async function updateLeavePolicy(
  input: z.infer<typeof LeavePolicySchema>
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const user = await requireAuth()
    if (user.role !== 'OWNER') return err('Only owner can update leave policy')
    const data = LeavePolicySchema.parse(input)

    await prisma.school.update({
      where: { id: user.school.id },
      data: {
        leavePolicy: {
          clTotal: data.clTotal,
          slTotal: data.slTotal,
          elTotal: data.elTotal,
        },
      },
    })

    revalidateStaffTimePaths()
    return ok({ success: true })
  } catch (error) {
    console.error('[updateLeavePolicy]', error)
    return err('Failed to save leave policy')
  }
}
