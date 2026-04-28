'use client'

import { useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Eye, Settings, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { processPayroll, upsertSalaryStructure } from '@/actions/payroll'
import { formatCurrency } from '@kinderos/utils'

type StaffRow = {
  id: string
  firstName: string
  lastName: string
  role: string
  salary: number | null
  panNumber: string | null
  uanNumber: string | null
  esiNumber: string | null
  bankAccountHolder: string | null
  bankAccountNumber: string | null
  bankIfsc: string | null
}

type CustomComponent = { label: string; amountPaise: number }

type SalaryStructureRow = {
  staffId: string
  ctcMonthly: number
  basicPercent: number
  hraPercent: number
  daPercent: number
  conveyanceAllowance: number
  pfEnabled: boolean
  esiEnabled: boolean
  professionalTaxMonthly: number
  tdsMonthly: number
  lateDeductionPerPunch: number
  customEarnings: CustomComponent[]
  customDeductions: CustomComponent[]
}

type PayrollItemRow = {
  staffId: string
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
  employerPfContribution: number
  employerEsiContribution: number
  deductionPfEmployee: number
  deductionEsiEmployee: number
  deductionProfessionalTax: number
  deductionTds: number
  deductionLwp: number
  deductionLate: number
  deductionAdvanceRecovery: number
  customEarnings: CustomComponent[]
  customDeductions: CustomComponent[]
  grossEarnings: number
  totalDeductions: number
  netPay: number
}

type StructureDraft = {
  ctcMonthlyInr: string
  basicPercent: number
  hraPercent: number
  daPercent: number
  conveyanceInr: string
  pfEnabled: boolean
  esiEnabled: boolean
  professionalTaxInr: string
  tdsInr: string
  lateDeductionInr: string
  customEarnings: Array<{ label: string; amountInr: string }>
  customDeductions: Array<{ label: string; amountInr: string }>
}

function parseAmountToPaise(value: string): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}

function amountFromPaise(value: number | null | undefined): string {
  if (!value || value <= 0) return ''
  return (value / 100).toString()
}

function monthLabel(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function payslipPdfUrl(
  staffId: string,
  month: number,
  year: number,
  disposition: 'attachment' | 'inline' = 'attachment'
): string {
  const params = new URLSearchParams({
    staffId,
    month: String(month),
    year: String(year),
    disposition,
  })
  return `/api/payroll/payslip?${params.toString()}`
}

function payLine(label: string, value: number, tone: 'default' | 'deduction' = 'default') {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={tone === 'deduction' ? 'text-red-600' : 'text-slate-600'}>{label}</span>
      <span className="tabular-nums">{formatCurrency(value)}</span>
    </div>
  )
}

function defaultDraft(structure?: SalaryStructureRow, salary?: number | null): StructureDraft {
  return {
    ctcMonthlyInr: amountFromPaise(structure?.ctcMonthly ?? salary ?? 0),
    basicPercent: structure?.basicPercent ?? 50,
    hraPercent: structure?.hraPercent ?? 40,
    daPercent: structure?.daPercent ?? 0,
    conveyanceInr: amountFromPaise(structure?.conveyanceAllowance ?? 160000),
    pfEnabled: structure?.pfEnabled ?? true,
    esiEnabled: structure?.esiEnabled ?? true,
    professionalTaxInr: amountFromPaise(structure?.professionalTaxMonthly ?? 20000),
    tdsInr: amountFromPaise(structure?.tdsMonthly ?? 0),
    lateDeductionInr: amountFromPaise(structure?.lateDeductionPerPunch ?? 5000),
    customEarnings: (structure?.customEarnings ?? []).map((c) => ({ label: c.label, amountInr: amountFromPaise(c.amountPaise) })),
    customDeductions: (structure?.customDeductions ?? []).map((c) => ({ label: c.label, amountInr: amountFromPaise(c.amountPaise) })),
  }
}

function computePreview(draft: StructureDraft) {
  const ctc = parseAmountToPaise(draft.ctcMonthlyInr)
  const basic = Math.round((ctc * draft.basicPercent) / 100)
  const hra = Math.round((basic * draft.hraPercent) / 100)
  const da = Math.round((basic * draft.daPercent) / 100)
  const conveyance = parseAmountToPaise(draft.conveyanceInr)
  const special = Math.max(0, ctc - (basic + hra + da + conveyance))
  const customEarnings = draft.customEarnings.reduce((sum, c) => sum + parseAmountToPaise(c.amountInr), 0)
  const gross = basic + hra + da + conveyance + special + customEarnings
  const pf = draft.pfEnabled ? Math.round((basic * 12) / 100) : 0
  const esi = draft.esiEnabled && gross <= 21_00_000 ? Math.round((gross * 0.75) / 100) : 0
  const pt = parseAmountToPaise(draft.professionalTaxInr)
  const tds = parseAmountToPaise(draft.tdsInr)
  const customDeductions = draft.customDeductions.reduce((sum, c) => sum + parseAmountToPaise(c.amountInr), 0)
  const deductions = pf + esi + pt + tds + customDeductions
  return {
    basic,
    hra,
    da,
    conveyance,
    special,
    gross,
    deductions,
    net: Math.max(0, gross - deductions),
  }
}

export function PayrollClient({
  staff,
  structures,
  items,
  initialMonth,
  initialYear,
}: {
  staff: StaffRow[]
  structures: SalaryStructureRow[]
  items: PayrollItemRow[]
  initialMonth: number
  initialYear: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const month = initialMonth
  const year = initialYear
  const [configOpen, setConfigOpen] = useState(false)
  const [payslipOpen, setPayslipOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffRow | null>(null)
  const [draft, setDraft] = useState<StructureDraft | null>(null)
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollItemRow | null>(null)
  const [selectedPayslipStaffId, setSelectedPayslipStaffId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const structureByStaff = useMemo(() => new Map(structures.map((s) => [s.staffId, s])), [structures])
  const itemByStaff = useMemo(() => new Map(items.map((i) => [i.staffId, i])), [items])

  const summary = useMemo(() => {
    return items.reduce(
      (acc, row) => {
        acc.gross += row.grossEarnings
        acc.deductions += row.totalDeductions
        acc.net += row.netPay
        return acc
      },
      { gross: 0, deductions: 0, net: 0 }
    )
  }, [items])

  function moveMonth(delta: number) {
    let nextMonth = month + delta
    let nextYear = year
    if (nextMonth < 1) {
      nextMonth = 12
      nextYear -= 1
    } else if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }
    router.push(`${pathname}?month=${nextMonth}&year=${nextYear}`)
  }

  function openConfig(member: StaffRow) {
    setSelectedStaff(member)
    setDraft(defaultDraft(structureByStaff.get(member.id), member.salary))
    setConfigOpen(true)
  }

  function saveStructure() {
    if (!selectedStaff || !draft) return
    startTransition(async () => {
      const payload = {
        staffId: selectedStaff.id,
        ctcMonthly: parseAmountToPaise(draft.ctcMonthlyInr),
        basicPercent: draft.basicPercent,
        hraPercent: draft.hraPercent,
        daPercent: draft.daPercent,
        conveyanceAllowance: parseAmountToPaise(draft.conveyanceInr),
        pfEnabled: draft.pfEnabled,
        esiEnabled: draft.esiEnabled,
        professionalTaxMonthly: parseAmountToPaise(draft.professionalTaxInr),
        tdsMonthly: parseAmountToPaise(draft.tdsInr),
        lateDeductionPerPunch: parseAmountToPaise(draft.lateDeductionInr),
        customEarnings: draft.customEarnings
          .filter((c) => c.label.trim().length > 0)
          .map((c) => ({ label: c.label.trim(), amountPaise: parseAmountToPaise(c.amountInr) })),
        customDeductions: draft.customDeductions
          .filter((c) => c.label.trim().length > 0)
          .map((c) => ({ label: c.label.trim(), amountPaise: parseAmountToPaise(c.amountInr) })),
      }
      const res = await upsertSalaryStructure(payload)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success('Salary structure saved')
      setConfigOpen(false)
      router.refresh()
    })
  }

  function runPayroll() {
    startTransition(async () => {
      const res = await processPayroll({ month, year, manualAdjustments: {} })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success(`Payroll processed for ${monthLabel(month, year)}`)
      router.refresh()
    })
  }

  const preview = draft ? computePreview(draft) : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Payroll run</CardTitle>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {monthLabel(month, year)}
            </Badge>
            <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" onClick={runPayroll} disabled={isPending}>
              {isPending ? 'Processing...' : 'Calculate payroll'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Gross earnings</p>
              <p className="text-lg font-semibold">{formatCurrency(summary.gross)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total deductions</p>
              <p className="text-lg font-semibold">{formatCurrency(summary.deductions)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Net payout</p>
              <p className="text-lg font-semibold">{formatCurrency(summary.net)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>CTC / month</TableHead>
                <TableHead>Net pay</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => {
                const structure = structureByStaff.get(member.id)
                const payroll = itemByStaff.get(member.id)
                const ctc = structure?.ctcMonthly ?? member.salary ?? 0
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        PAN: {member.panNumber ?? '—'} | UAN: {member.uanNumber ?? '—'} | ESI: {member.esiNumber ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{ctc > 0 ? formatCurrency(ctc) : 'Not set'}</TableCell>
                    <TableCell>{payroll ? formatCurrency(payroll.netPay) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => openConfig(member)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={!payroll}
                          onClick={() => {
                            if (!payroll) return
                            setSelectedPayslipStaffId(member.id)
                            setSelectedPayslip(payroll)
                            setPayslipOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payroll ? (
                          <Button type="button" variant="outline" size="icon" asChild>
                              <a href={payslipPdfUrl(member.id, month, year, 'attachment')} aria-label="Download payslip PDF">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" size="icon" disabled>
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Salary Structure</DialogTitle>
            <DialogDescription>
              Configure components with live preview for {selectedStaff?.firstName} {selectedStaff?.lastName}.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>CTC / month (INR)</Label>
                  <Input value={draft.ctcMonthlyInr} onChange={(e) => setDraft((d) => d ? { ...d, ctcMonthlyInr: e.target.value } : d)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Conveyance (INR)</Label>
                  <Input value={draft.conveyanceInr} onChange={(e) => setDraft((d) => d ? { ...d, conveyanceInr: e.target.value } : d)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Basic %</Label>
                  <Input type="number" min={50} max={90} value={draft.basicPercent} onChange={(e) => setDraft((d) => d ? { ...d, basicPercent: Number(e.target.value || 50) } : d)} />
                </div>
                <div className="space-y-1.5">
                  <Label>HRA % of Basic</Label>
                  <Input type="number" min={0} max={80} value={draft.hraPercent} onChange={(e) => setDraft((d) => d ? { ...d, hraPercent: Number(e.target.value || 40) } : d)} />
                </div>
                <div className="space-y-1.5">
                  <Label>DA % of Basic</Label>
                  <Input type="number" min={0} max={50} value={draft.daPercent} onChange={(e) => setDraft((d) => d ? { ...d, daPercent: Number(e.target.value || 0) } : d)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Professional Tax (INR)</Label>
                  <Input value={draft.professionalTaxInr} onChange={(e) => setDraft((d) => d ? { ...d, professionalTaxInr: e.target.value } : d)} />
                </div>
                <div className="space-y-1.5">
                  <Label>TDS (INR)</Label>
                  <Input value={draft.tdsInr} onChange={(e) => setDraft((d) => d ? { ...d, tdsInr: e.target.value } : d)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Late deduction / punch (INR)</Label>
                  <Input value={draft.lateDeductionInr} onChange={(e) => setDraft((d) => d ? { ...d, lateDeductionInr: e.target.value } : d)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.pfEnabled}
                    onChange={(e) => setDraft((d) => d ? { ...d, pfEnabled: e.target.checked } : d)}
                  />
                  PF enabled
                </label>
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.esiEnabled}
                    onChange={(e) => setDraft((d) => d ? { ...d, esiEnabled: e.target.checked } : d)}
                  />
                  ESI enabled
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Custom Earnings</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDraft((d) => d ? { ...d, customEarnings: [...d.customEarnings, { label: '', amountInr: '' }] } : d)}
                  >
                    Add
                  </Button>
                </div>
                {draft.customEarnings.map((row, idx) => (
                  <div key={`ce-${idx}`} className="grid grid-cols-[1fr_140px_auto] gap-2">
                    <Input
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                customEarnings: d.customEarnings.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)),
                              }
                            : d
                        )
                      }
                    />
                    <Input
                      placeholder="INR"
                      value={row.amountInr}
                      onChange={(e) =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                customEarnings: d.customEarnings.map((r, i) => (i === idx ? { ...r, amountInr: e.target.value } : r)),
                              }
                            : d
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setDraft((d) => d ? { ...d, customEarnings: d.customEarnings.filter((_, i) => i !== idx) } : d)
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Custom Deductions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDraft((d) => d ? { ...d, customDeductions: [...d.customDeductions, { label: '', amountInr: '' }] } : d)}
                  >
                    Add
                  </Button>
                </div>
                {draft.customDeductions.map((row, idx) => (
                  <div key={`cd-${idx}`} className="grid grid-cols-[1fr_140px_auto] gap-2">
                    <Input
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                customDeductions: d.customDeductions.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)),
                              }
                            : d
                        )
                      }
                    />
                    <Input
                      placeholder="INR"
                      value={row.amountInr}
                      onChange={(e) =>
                        setDraft((d) =>
                          d
                            ? {
                                ...d,
                                customDeductions: d.customDeductions.map((r, i) => (i === idx ? { ...r, amountInr: e.target.value } : r)),
                              }
                            : d
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setDraft((d) => d ? { ...d, customDeductions: d.customDeductions.filter((_, i) => i !== idx) } : d)
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              {preview && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p><strong>Preview gross:</strong> {formatCurrency(preview.gross)}</p>
                  <p><strong>Preview deductions:</strong> {formatCurrency(preview.deductions)}</p>
                  <p><strong>Preview net:</strong> {formatCurrency(preview.net)}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="button" onClick={saveStructure} disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save structure'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={payslipOpen} onOpenChange={setPayslipOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Payslip details
              {selectedStaff ? ` - ${selectedStaff.firstName} ${selectedStaff.lastName}` : ''}
            </DialogTitle>
            <DialogDescription>{monthLabel(month, year)}</DialogDescription>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-4 text-sm">
              {selectedPayslipStaffId ? (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={payslipPdfUrl(selectedPayslipStaffId, month, year, 'inline')} target="_blank" rel="noreferrer">
                      View PDF
                    </a>
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={payslipPdfUrl(selectedPayslipStaffId, month, year, 'attachment')}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border bg-white p-2 text-center">
                  <p className="text-lg font-semibold text-slate-900">{selectedPayslip.attendanceDays}</p>
                  <p className="text-[11px] text-slate-500">Attendance marked</p>
                </div>
                <div className="rounded-lg border bg-white p-2 text-center">
                  <p className="text-lg font-semibold text-slate-900">{selectedPayslip.presentDays}</p>
                  <p className="text-[11px] text-slate-500">Present days</p>
                </div>
                <div className="rounded-lg border bg-white p-2 text-center">
                  <p className="text-lg font-semibold text-slate-900">{selectedPayslip.lwpDays}</p>
                  <p className="text-[11px] text-slate-500">LWP days</p>
                </div>
                <div className="rounded-lg border bg-white p-2 text-center">
                  <p className="text-lg font-semibold text-slate-900">{selectedPayslip.lateCount}</p>
                  <p className="text-[11px] text-slate-500">Late punches</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">Earnings</p>
                  {payLine('Basic', selectedPayslip.earningBasic)}
                  {payLine('HRA', selectedPayslip.earningHra)}
                  {payLine('DA', selectedPayslip.earningDa)}
                  {payLine('Conveyance', selectedPayslip.earningConveyance)}
                  {payLine('Special allowance', selectedPayslip.earningSpecial)}
                  {payLine('Overtime', selectedPayslip.earningOvertime)}
                  {payLine('Bonus', selectedPayslip.earningBonus)}
                  {payLine('Incentive', selectedPayslip.earningIncentive)}
                  {selectedPayslip.customEarnings.map((c, i) => (
                    <div key={`pe-${i}`}>{payLine(c.label, c.amountPaise)}</div>
                  ))}
                  <div className="mt-2 border-t border-emerald-200 pt-2">
                    {payLine('Gross earnings', selectedPayslip.grossEarnings)}
                  </div>
                </div>

                <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-700">Deductions</p>
                  {payLine('PF (employee)', selectedPayslip.deductionPfEmployee, 'deduction')}
                  {payLine('ESI (employee)', selectedPayslip.deductionEsiEmployee, 'deduction')}
                  {payLine('Professional tax', selectedPayslip.deductionProfessionalTax, 'deduction')}
                  {payLine('TDS', selectedPayslip.deductionTds, 'deduction')}
                  {payLine('LWP deduction', selectedPayslip.deductionLwp, 'deduction')}
                  {payLine('Late deduction', selectedPayslip.deductionLate, 'deduction')}
                  {payLine('Advance recovery', selectedPayslip.deductionAdvanceRecovery, 'deduction')}
                  {selectedPayslip.customDeductions.map((c, i) => (
                    <div key={`pd-${i}`}>{payLine(c.label, c.amountPaise, 'deduction')}</div>
                  ))}
                  <div className="mt-2 border-t border-red-200 pt-2">
                    {payLine('Total deductions', selectedPayslip.totalDeductions, 'deduction')}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border-2 border-violet-200 bg-violet-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Net pay (take home)</p>
                <p className="mt-1 text-2xl font-bold text-violet-800">{formatCurrency(selectedPayslip.netPay)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
