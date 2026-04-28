import { PageHeader } from '@/components/layout/page-header'
import { MyPayslipsClient } from '@/components/payroll/my-payslips-client'
import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

export default async function ClassroomPayrollPage() {
  const { schoolId, userId } = await requireTeacher()

  const runs = await prisma.payrollRun.findMany({
    where: { schoolId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: {
      items: {
        where: { staffId: userId },
        take: 1,
      },
    },
    take: 24,
  })

  const rows = runs
    .map((run) => {
      const item = run.items[0]
      if (!item) return null
      return {
        month: run.month,
        year: run.year,
        attendanceDays: item.attendanceDays,
        presentDays: item.presentDays,
        lateCount: item.lateCount,
        lwpDays: item.lwpDays,
        earningBasic: item.earningBasic,
        earningHra: item.earningHra,
        earningDa: item.earningDa,
        earningConveyance: item.earningConveyance,
        earningSpecial: item.earningSpecial,
        earningOvertime: item.earningOvertime,
        earningBonus: item.earningBonus,
        earningIncentive: item.earningIncentive,
        deductionPfEmployee: item.deductionPfEmployee,
        deductionEsiEmployee: item.deductionEsiEmployee,
        deductionProfessionalTax: item.deductionProfessionalTax,
        deductionTds: item.deductionTds,
        deductionLwp: item.deductionLwp,
        deductionLate: item.deductionLate,
        deductionAdvanceRecovery: item.deductionAdvanceRecovery,
        customEarnings: parseComponents(item.customEarnings),
        customDeductions: parseComponents(item.customDeductions),
        grossEarnings: item.grossEarnings,
        totalDeductions: item.totalDeductions,
        netPay: item.netPay,
      }
    })
    .filter((v): v is NonNullable<typeof v> => !!v)

  return (
    <div className="space-y-6">
      <PageHeader title="My Payslips" description="View your salary slips and download PDF copies." />
      <MyPayslipsClient rows={rows} />
    </div>
  )
}

