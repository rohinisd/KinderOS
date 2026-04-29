import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

type CustomComponent = { label: string; amountPaise: number }

export type PayslipPdfData = {
  schoolName: string
  month: number
  year: number
  staffName: string
  staffRole: string
  panNumber: string | null
  uanNumber: string | null
  esiNumber: string | null
  bankAccountHolder: string | null
  bankAccountNumber: string | null
  bankIfsc: string | null
  attendanceDays: number
  presentDays: number
  lateCount: number
  lwpDays: number
  earningBasic: number
  earningHra: number
  earningDa: number
  earningConveyance: number
  earningSpecial: number
  earningOvertime: number
  earningBonus: number
  earningIncentive: number
  customEarnings: CustomComponent[]
  deductionPfEmployee: number
  deductionEsiEmployee: number
  deductionProfessionalTax: number
  deductionTds: number
  deductionLwp: number
  deductionLate: number
  deductionAdvanceRecovery: number
  customDeductions: CustomComponent[]
  grossEarnings: number
  totalDeductions: number
  netPay: number
}

function formatCurrency(paise: number): string {
  const amount = paise / 100
  return `INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function monthLabel(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export async function renderPayslipPdf(data: PayslipPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89]) // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const left = 40
  let y = 800
  const lh = 14
  const gray = rgb(0.2, 0.2, 0.2)

  const draw = (label: string, value?: string, useBold = false) => {
    const currentFont = useBold ? bold : font
    page.drawText(label, { x: left, y, size: 10, font: currentFont, color: gray })
    if (value !== undefined) {
      page.drawText(value, { x: 350, y, size: 10, font: currentFont, color: gray })
    }
    y -= lh
  }

  draw('Salary Payslip', undefined, true)
  draw(`${data.schoolName} - ${monthLabel(data.month, data.year)}`)
  y -= 4

  draw('Employee Details', undefined, true)
  draw('Name', data.staffName)
  draw('Role', data.staffRole)
  draw('PAN', data.panNumber ?? '-')
  draw('UAN', data.uanNumber ?? '-')
  draw('ESI Number', data.esiNumber ?? '-')
  draw('Bank Holder', data.bankAccountHolder ?? '-')
  draw('Bank Account', data.bankAccountNumber ?? '-')
  draw('IFSC', data.bankIfsc ?? '-')
  y -= 6

  draw('Attendance Summary', undefined, true)
  draw('Attendance marked', String(data.attendanceDays))
  draw('Present days', String(data.presentDays))
  draw('Late punches', String(data.lateCount))
  draw('LWP days', String(data.lwpDays))
  y -= 6

  draw('Earnings', undefined, true)
  draw('Basic', formatCurrency(data.earningBasic))
  draw('HRA', formatCurrency(data.earningHra))
  draw('DA', formatCurrency(data.earningDa))
  draw('Conveyance', formatCurrency(data.earningConveyance))
  draw('Special allowance', formatCurrency(data.earningSpecial))
  draw('Overtime', formatCurrency(data.earningOvertime))
  draw('Bonus', formatCurrency(data.earningBonus))
  draw('Incentive', formatCurrency(data.earningIncentive))
  for (const c of data.customEarnings) {
    draw(c.label, formatCurrency(c.amountPaise))
  }
  draw('Gross earnings', formatCurrency(data.grossEarnings), true)
  y -= 6

  draw('Deductions', undefined, true)
  draw('PF (employee)', formatCurrency(data.deductionPfEmployee))
  draw('ESI (employee)', formatCurrency(data.deductionEsiEmployee))
  draw('Professional tax', formatCurrency(data.deductionProfessionalTax))
  draw('TDS', formatCurrency(data.deductionTds))
  draw('LWP deduction', formatCurrency(data.deductionLwp))
  draw('Late deduction', formatCurrency(data.deductionLate))
  draw('Advance recovery', formatCurrency(data.deductionAdvanceRecovery))
  for (const c of data.customDeductions) {
    draw(c.label, formatCurrency(c.amountPaise))
  }
  draw('Total deductions', formatCurrency(data.totalDeductions), true)
  y -= 8

  draw('Net pay', formatCurrency(data.netPay), true)

  return pdf.save()
}

