'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { err, ok, type ActionResult } from '@/lib/utils'

const PAYROLL_ROLES = new Set(['OWNER', 'ACCOUNTANT'])

type CustomComponent = { label: string; amountPaise: number }

const ComponentSchema = z.object({
  label: z.string().trim().min(1).max(60),
  amountPaise: z.number().int().min(0).max(5_00_00_000),
})

const SalaryStructureSchema = z.object({
  staffId: z.string().cuid(),
  ctcMonthly: z.number().int().min(0).max(20_00_00_000),
  basicPercent: z.number().int().min(50).max(90).default(50),
  hraPercent: z.number().int().min(0).max(80).default(40),
  daPercent: z.number().int().min(0).max(50).default(0),
  conveyanceAllowance: z.number().int().min(0).max(5_00_00_000).default(160000),
  pfEnabled: z.boolean().default(true),
  esiEnabled: z.boolean().default(true),
  professionalTaxMonthly: z.number().int().min(0).max(100000).default(20000),
  tdsMonthly: z.number().int().min(0).max(20_00_00_000).default(0),
  lateDeductionPerPunch: z.number().int().min(0).max(500000).default(5000),
  customEarnings: z.array(ComponentSchema).default([]),
  customDeductions: z.array(ComponentSchema).default([]),
})

const ProcessPayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  manualAdjustments: z
    .record(
      z.string().cuid(),
      z.object({
        overtimePaise: z.number().int().min(0).default(0),
        bonusPaise: z.number().int().min(0).default(0),
        incentivePaise: z.number().int().min(0).default(0),
        tdsOverridePaise: z.number().int().min(0).optional(),
      })
    )
    .optional()
    .default({}),
})

function monthWindow(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0))
  return { start, end }
}

function overlapDaysInMonth(start: Date, end: Date, monthStart: Date, monthEnd: Date) {
  const from = start > monthStart ? start : monthStart
  const to = end < monthEnd ? end : monthEnd
  if (to < from) return 0
  const millisPerDay = 24 * 60 * 60 * 1000
  const diff = to.getTime() - from.getTime()
  return Math.floor(diff / millisPerDay) + 1
}

function parseComponents(input: unknown): CustomComponent[] {
  if (!Array.isArray(input)) return []
  const out: CustomComponent[] = []
  for (const item of input) {
    const parsed = ComponentSchema.safeParse(item)
    if (parsed.success) out.push(parsed.data)
  }
  return out
}

async function requirePayrollAccess() {
  const user = await requireAuth()
  if (!PAYROLL_ROLES.has(user.role)) throw new Error('Forbidden')
  return { schoolId: user.school.id, staffId: user.id, role: user.role }
}

export async function upsertSalaryStructure(
  input: z.infer<typeof SalaryStructureSchema>
): Promise<ActionResult<{ staffId: string }>> {
  try {
    const { schoolId } = await requirePayrollAccess()
    const data = SalaryStructureSchema.parse(input)
    const exists = await prisma.staff.findFirst({
      where: { id: data.staffId, schoolId, deletedAt: null },
      select: { id: true },
    })
    if (!exists) return err('Staff not found')

    await prisma.salaryStructure.upsert({
      where: { schoolId_staffId: { schoolId, staffId: data.staffId } },
      create: {
        schoolId,
        ...data,
      },
      update: {
        ...data,
      },
    })

    revalidatePath('/dashboard/payroll')
    revalidatePath('/office/payroll')
    revalidatePath('/office/my-payroll')
    revalidatePath('/classroom/payroll')
    return ok({ staffId: data.staffId })
  } catch (error) {
    console.error('[upsertSalaryStructure]', error)
    return err('Failed to save salary structure')
  }
}

export async function processPayroll(
  input: z.infer<typeof ProcessPayrollSchema>
): Promise<ActionResult<{ runId: string; processedStaff: number }>> {
  try {
    const { schoolId, staffId } = await requirePayrollAccess()
    const data = ProcessPayrollSchema.parse(input)
    const { start, end } = monthWindow(data.year, data.month)
    const daysInMonth = new Date(Date.UTC(data.year, data.month, 0)).getUTCDate()

    const staff = await prisma.staff.findMany({
      where: {
        schoolId,
        deletedAt: null,
        status: { in: ['ACTIVE', 'ON_LEAVE'] },
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    })
    if (staff.length === 0) return err('No active staff found for payroll')

    const structures = await prisma.salaryStructure.findMany({
      where: { schoolId, staffId: { in: staff.map((s) => s.id) } },
    })
    const structureByStaff = new Map(structures.map((s) => [s.staffId, s]))

    const attendances = await prisma.staffAttendance.findMany({
      where: { schoolId, staffId: { in: staff.map((s) => s.id) }, date: { gte: start, lt: end } },
      select: { staffId: true, status: true },
    })
    const attendanceMap = new Map<string, { present: number; late: number; marked: number }>()
    for (const a of attendances) {
      const bucket = attendanceMap.get(a.staffId) ?? { present: 0, late: 0, marked: 0 }
      bucket.marked += 1
      if (a.status === 'PRESENT') bucket.present += 1
      if (a.status === 'LATE') {
        bucket.present += 1
        bucket.late += 1
      }
      attendanceMap.set(a.staffId, bucket)
    }

    const unpaidLeaves = await prisma.leaveRequest.findMany({
      where: {
        schoolId,
        staffId: { in: staff.map((s) => s.id) },
        leaveType: 'UNPAID',
        status: 'APPROVED',
        OR: [
          { startDate: { gte: start, lt: end } },
          { endDate: { gte: start, lt: end } },
          { startDate: { lte: start }, endDate: { gte: end } },
        ],
      },
      select: { staffId: true, startDate: true, endDate: true },
    })
    const lwpDaysMap = new Map<string, number>()
    for (const leave of unpaidLeaves) {
      const overlap = overlapDaysInMonth(leave.startDate, leave.endDate, start, new Date(end.getTime() - 1))
      if (overlap <= 0) continue
      lwpDaysMap.set(leave.staffId, (lwpDaysMap.get(leave.staffId) ?? 0) + overlap)
    }

    const advances = await prisma.salaryAdvance.findMany({
      where: { schoolId, staffId: { in: staff.map((s) => s.id) }, isSettled: false },
      select: { id: true, staffId: true, amount: true, recoveredAmount: true },
    })
    const advanceMap = new Map<string, { id: string; outstanding: number }[]>()
    for (const adv of advances) {
      const outstanding = Math.max(0, adv.amount - adv.recoveredAmount)
      if (outstanding <= 0) continue
      const list = advanceMap.get(adv.staffId) ?? []
      list.push({ id: adv.id, outstanding })
      advanceMap.set(adv.staffId, list)
    }

    const run = await prisma.payrollRun.upsert({
      where: { schoolId_month_year: { schoolId, month: data.month, year: data.year } },
      create: {
        schoolId,
        month: data.month,
        year: data.year,
        processedById: staffId,
        processedAt: new Date(),
        status: 'PROCESSED',
      },
      update: {
        processedById: staffId,
        processedAt: new Date(),
        status: 'PROCESSED',
      },
    })

    for (const member of staff) {
      const structure = structureByStaff.get(member.id)
      const ctcMonthly = structure?.ctcMonthly ?? member.salary ?? 0
      const basicPercent = structure?.basicPercent ?? 50
      const hraPercent = structure?.hraPercent ?? 40
      const daPercent = structure?.daPercent ?? 0
      const conveyanceAllowance = structure?.conveyanceAllowance ?? 160000
      const pfEnabled = structure?.pfEnabled ?? true
      const esiEnabled = structure?.esiEnabled ?? true
      const professionalTaxMonthly = structure?.professionalTaxMonthly ?? 20000
      const tdsMonthly = structure?.tdsMonthly ?? 0
      const lateDeductionPerPunch = structure?.lateDeductionPerPunch ?? 5000
      const customEarnings = parseComponents(structure?.customEarnings)
      const customDeductions = parseComponents(structure?.customDeductions)

      const earningBasic = Math.round((ctcMonthly * basicPercent) / 100)
      const earningHra = Math.round((earningBasic * hraPercent) / 100)
      const earningDa = Math.round((earningBasic * daPercent) / 100)
      const earningConveyance = conveyanceAllowance
      const earningSpecial = Math.max(0, ctcMonthly - (earningBasic + earningHra + earningDa + earningConveyance))

      const manual = data.manualAdjustments?.[member.id]
      const earningOvertime = manual?.overtimePaise ?? 0
      const earningBonus = manual?.bonusPaise ?? 0
      const earningIncentive = manual?.incentivePaise ?? 0

      const customEarningsTotal = customEarnings.reduce((sum, c) => sum + c.amountPaise, 0)
      const grossEarnings =
        earningBasic +
        earningHra +
        earningDa +
        earningConveyance +
        earningSpecial +
        earningOvertime +
        earningBonus +
        earningIncentive +
        customEarningsTotal

      const deductionPfEmployee = pfEnabled ? Math.round((earningBasic * 12) / 100) : 0
      const employerPfContribution = pfEnabled ? Math.round((earningBasic * 12) / 100) : 0
      const esiApplicable = esiEnabled && grossEarnings <= 21_00_000
      const deductionEsiEmployee = esiApplicable ? Math.round((grossEarnings * 0.75) / 100) : 0
      const employerEsiContribution = esiApplicable ? Math.round((grossEarnings * 3.25) / 100) : 0
      const deductionProfessionalTax = professionalTaxMonthly
      const deductionTds = manual?.tdsOverridePaise ?? tdsMonthly

      const lwpDays = lwpDaysMap.get(member.id) ?? 0
      const perDayPay = daysInMonth > 0 ? ctcMonthly / daysInMonth : 0
      const deductionLwp = Math.max(0, Math.round(perDayPay * lwpDays))

      const attendance = attendanceMap.get(member.id) ?? { present: 0, late: 0, marked: 0 }
      const deductionLate = attendance.late * lateDeductionPerPunch

      const adv = advanceMap.get(member.id) ?? []
      let deductionAdvanceRecovery = 0
      const updatedAdvances: { id: string; nextRecoveredAmount: number; settled: boolean }[] = []
      for (const row of adv) {
        if (row.outstanding <= 0) continue
        deductionAdvanceRecovery += row.outstanding
        updatedAdvances.push({
          id: row.id,
          nextRecoveredAmount: row.outstanding,
          settled: true,
        })
      }

      const customDeductionsTotal = customDeductions.reduce((sum, c) => sum + c.amountPaise, 0)
      const totalDeductions =
        deductionPfEmployee +
        deductionEsiEmployee +
        deductionProfessionalTax +
        deductionTds +
        deductionLwp +
        deductionLate +
        deductionAdvanceRecovery +
        customDeductionsTotal

      const netPay = Math.max(0, grossEarnings - totalDeductions)

      await prisma.payrollItem.upsert({
        where: { runId_staffId: { runId: run.id, staffId: member.id } },
        create: {
          runId: run.id,
          schoolId,
          staffId: member.id,
          attendanceDays: attendance.marked,
          presentDays: attendance.present,
          lateCount: attendance.late,
          lwpDays,
          ctcMonthly,
          earningBasic,
          earningHra,
          earningDa,
          earningConveyance,
          earningSpecial,
          earningOvertime,
          earningBonus,
          earningIncentive,
          employerPfContribution,
          employerEsiContribution,
          deductionPfEmployee,
          deductionEsiEmployee,
          deductionProfessionalTax,
          deductionTds,
          deductionLwp,
          deductionLate,
          deductionAdvanceRecovery,
          customEarnings,
          customDeductions,
          structureSnapshot: {
            basicPercent,
            hraPercent,
            daPercent,
            conveyanceAllowance,
            pfEnabled,
            esiEnabled,
            professionalTaxMonthly,
            tdsMonthly,
            lateDeductionPerPunch,
          },
          grossEarnings,
          totalDeductions,
          netPay,
        },
        update: {
          attendanceDays: attendance.marked,
          presentDays: attendance.present,
          lateCount: attendance.late,
          lwpDays,
          ctcMonthly,
          earningBasic,
          earningHra,
          earningDa,
          earningConveyance,
          earningSpecial,
          earningOvertime,
          earningBonus,
          earningIncentive,
          employerPfContribution,
          employerEsiContribution,
          deductionPfEmployee,
          deductionEsiEmployee,
          deductionProfessionalTax,
          deductionTds,
          deductionLwp,
          deductionLate,
          deductionAdvanceRecovery,
          customEarnings,
          customDeductions,
          structureSnapshot: {
            basicPercent,
            hraPercent,
            daPercent,
            conveyanceAllowance,
            pfEnabled,
            esiEnabled,
            professionalTaxMonthly,
            tdsMonthly,
            lateDeductionPerPunch,
          },
          grossEarnings,
          totalDeductions,
          netPay,
        },
      })

      for (const update of updatedAdvances) {
        await prisma.salaryAdvance.update({
          where: { id: update.id },
          data: {
            recoveredAmount: { increment: update.nextRecoveredAmount },
            isSettled: update.settled,
          },
        })
      }
    }

    revalidatePath('/dashboard/payroll')
    revalidatePath('/office/payroll')
    revalidatePath('/office/my-payroll')
    revalidatePath('/classroom/payroll')
    return ok({ runId: run.id, processedStaff: staff.length })
  } catch (error) {
    console.error('[processPayroll]', error)
    return err('Failed to process payroll')
  }
}
