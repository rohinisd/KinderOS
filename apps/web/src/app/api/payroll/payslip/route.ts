import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { renderPayslipPdf } from '@/lib/payroll/payslip-pdf'

export const runtime = 'nodejs'

const QuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  staffId: z.string().cuid().optional(),
  disposition: z.enum(['inline', 'attachment']).optional(),
})

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

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const parsed = QuerySchema.safeParse({
      month: request.nextUrl.searchParams.get('month'),
      year: request.nextUrl.searchParams.get('year'),
      staffId: request.nextUrl.searchParams.get('staffId') ?? undefined,
      disposition: request.nextUrl.searchParams.get('disposition') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
    }

    const { month, year } = parsed.data
    const disposition = parsed.data.disposition ?? 'attachment'
    const canDownloadAny = user.role === 'OWNER' || user.role === 'ACCOUNTANT'
    const targetStaffId = canDownloadAny ? parsed.data.staffId ?? user.id : user.id

    if (!canDownloadAny && parsed.data.staffId && parsed.data.staffId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const staff = await prisma.staff.findFirst({
      where: {
        id: targetStaffId,
        schoolId: user.school.id,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        panNumber: true,
        uanNumber: true,
        esiNumber: true,
        bankAccountHolder: true,
        bankAccountNumber: true,
        bankIfsc: true,
      },
    })
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 })

    const run = await prisma.payrollRun.findUnique({
      where: { schoolId_month_year: { schoolId: user.school.id, month, year } },
      include: {
        items: {
          where: { staffId: staff.id },
          take: 1,
        },
      },
    })
    const item = run?.items[0]
    if (!item) {
      return NextResponse.json({ error: 'Payslip not found for selected month' }, { status: 404 })
    }

    const pdfBuffer = await renderPayslipPdf({
      schoolName: user.school.name,
      month,
      year,
      staffName: `${staff.firstName} ${staff.lastName}`.trim(),
      staffRole: staff.role,
      panNumber: staff.panNumber,
      uanNumber: staff.uanNumber,
      esiNumber: staff.esiNumber,
      bankAccountHolder: staff.bankAccountHolder,
      bankAccountNumber: staff.bankAccountNumber,
      bankIfsc: staff.bankIfsc,
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
      customEarnings: parseComponents(item.customEarnings),
      deductionPfEmployee: item.deductionPfEmployee,
      deductionEsiEmployee: item.deductionEsiEmployee,
      deductionProfessionalTax: item.deductionProfessionalTax,
      deductionTds: item.deductionTds,
      deductionLwp: item.deductionLwp,
      deductionLate: item.deductionLate,
      deductionAdvanceRecovery: item.deductionAdvanceRecovery,
      customDeductions: parseComponents(item.customDeductions),
      grossEarnings: item.grossEarnings,
      totalDeductions: item.totalDeductions,
      netPay: item.netPay,
    })

    const fileName = `payslip-${slugify(`${staff.firstName}-${staff.lastName}`)}-${year}-${String(month).padStart(2, '0')}.pdf`
    const bytes = new Uint8Array(pdfBuffer.length)
    bytes.set(pdfBuffer)
    const body = new Blob([bytes], { type: 'application/pdf' })
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('[api/payroll/payslip]', error)
    return NextResponse.json({ error: 'Failed to generate payslip PDF' }, { status: 500 })
  }
}

