import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { PayrollClient } from '@/components/payroll/payroll-client'

export const dynamic = 'force-dynamic'

function parseComponents(input: unknown): Array<{ label: string; amountPaise: number }> {
  if (!Array.isArray(input)) return []
  return input
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const r = row as { label?: unknown; amountPaise?: unknown }
      return {
        label: typeof r.label === 'string' ? r.label : '',
        amountPaise: typeof r.amountPaise === 'number' ? Math.round(r.amountPaise) : 0,
      }
    })
    .filter((v): v is { label: string; amountPaise: number } => !!v && v.label.length > 0)
}

export default async function OfficePayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const user = await requireAuth()
  if (user.role !== 'OWNER' && user.role !== 'ACCOUNTANT') redirect('/no-access')
  const schoolId = user.school.id

  const qp = await searchParams
  const now = new Date()
  const monthRaw = Number(qp.month)
  const yearRaw = Number(qp.year)
  const month = Number.isInteger(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : now.getMonth() + 1
  const year = Number.isInteger(yearRaw) && yearRaw >= 2000 && yearRaw <= 2100 ? yearRaw : now.getFullYear()

  const [staff, structures, run] = await Promise.all([
    prisma.staff.findMany({
      where: {
        schoolId,
        deletedAt: null,
        status: { in: ['ACTIVE', 'ON_LEAVE'] },
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.salaryStructure.findMany({ where: { schoolId } }),
    prisma.payrollRun.findUnique({
      where: { schoolId_month_year: { schoolId, month, year } },
      include: { items: true },
    }),
  ])

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Owner and accountant payroll workspace for structures, calculations, and payslips."
      />
      <div className="mt-6">
        <PayrollClient
          staff={staff.map((s) => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            role: s.role,
            salary: s.salary,
            panNumber: s.panNumber,
            uanNumber: s.uanNumber,
            esiNumber: s.esiNumber,
            bankAccountHolder: s.bankAccountHolder,
            bankAccountNumber: s.bankAccountNumber,
            bankIfsc: s.bankIfsc,
          }))}
          structures={structures.map((s) => ({
            staffId: s.staffId,
            ctcMonthly: s.ctcMonthly,
            basicPercent: s.basicPercent,
            hraPercent: s.hraPercent,
            daPercent: s.daPercent,
            conveyanceAllowance: s.conveyanceAllowance,
            pfEnabled: s.pfEnabled,
            esiEnabled: s.esiEnabled,
            professionalTaxMonthly: s.professionalTaxMonthly,
            tdsMonthly: s.tdsMonthly,
            lateDeductionPerPunch: s.lateDeductionPerPunch,
            customEarnings: parseComponents(s.customEarnings),
            customDeductions: parseComponents(s.customDeductions),
          }))}
          items={(run?.items ?? []).map((i) => ({
            staffId: i.staffId,
            attendanceDays: i.attendanceDays,
            presentDays: i.presentDays,
            lateCount: i.lateCount,
            lwpDays: i.lwpDays,
            earningBasic: i.earningBasic,
            earningHra: i.earningHra,
            earningDa: i.earningDa,
            earningConveyance: i.earningConveyance,
            earningSpecial: i.earningSpecial,
            earningOvertime: i.earningOvertime,
            earningBonus: i.earningBonus,
            earningIncentive: i.earningIncentive,
            employerPfContribution: i.employerPfContribution,
            employerEsiContribution: i.employerEsiContribution,
            deductionPfEmployee: i.deductionPfEmployee,
            deductionEsiEmployee: i.deductionEsiEmployee,
            deductionProfessionalTax: i.deductionProfessionalTax,
            deductionTds: i.deductionTds,
            deductionLwp: i.deductionLwp,
            deductionLate: i.deductionLate,
            deductionAdvanceRecovery: i.deductionAdvanceRecovery,
            customEarnings: parseComponents(i.customEarnings),
            customDeductions: parseComponents(i.customDeductions),
            grossEarnings: i.grossEarnings,
            totalDeductions: i.totalDeductions,
            netPay: i.netPay,
          }))}
          initialMonth={month}
          initialYear={year}
        />
      </div>
    </div>
  )
}
