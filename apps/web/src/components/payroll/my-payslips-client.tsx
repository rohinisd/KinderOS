'use client'

import { useState } from 'react'
import { Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@kinderos/utils'

type CustomComponent = { label: string; amountPaise: number }

type MyPayslipRow = {
  month: number
  year: number
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

function monthLabel(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function downloadUrl(month: number, year: number): string {
  const params = new URLSearchParams({ month: String(month), year: String(year) })
  return `/api/payroll/payslip?${params.toString()}`
}

export function MyPayslipsClient({ rows }: { rows: MyPayslipRow[] }) {
  const [selected, setSelected] = useState<MyPayslipRow | null>(null)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Salary Slips</CardTitle>
          <CardDescription>View and download your monthly payslips in PDF format.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payslips are available yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.year}-${row.month}`}>
                    <TableCell>{monthLabel(row.month, row.year)}</TableCell>
                    <TableCell>{formatCurrency(row.grossEarnings)}</TableCell>
                    <TableCell>{formatCurrency(row.totalDeductions)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(row.netPay)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => setSelected(row)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" asChild>
                          <a href={downloadUrl(row.month, row.year)} aria-label="Download payslip PDF">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip details</DialogTitle>
            <DialogDescription>
              {selected ? monthLabel(selected.month, selected.year) : ''}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={downloadUrl(selected.month, selected.year)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              </div>
              <div className="rounded-lg border p-3">
                <p>Attendance marked: {selected.attendanceDays}</p>
                <p>Present days: {selected.presentDays}</p>
                <p>Late punches: {selected.lateCount}</p>
                <p>LWP days: {selected.lwpDays}</p>
              </div>
              <div className="grid gap-2 rounded-lg border p-3">
                <p><strong>Earnings</strong></p>
                <p>Basic: {formatCurrency(selected.earningBasic)}</p>
                <p>HRA: {formatCurrency(selected.earningHra)}</p>
                <p>DA: {formatCurrency(selected.earningDa)}</p>
                <p>Conveyance: {formatCurrency(selected.earningConveyance)}</p>
                <p>Special allowance: {formatCurrency(selected.earningSpecial)}</p>
                <p>Overtime: {formatCurrency(selected.earningOvertime)}</p>
                <p>Bonus: {formatCurrency(selected.earningBonus)}</p>
                <p>Incentive: {formatCurrency(selected.earningIncentive)}</p>
                {selected.customEarnings.map((c, i) => (
                  <p key={`me-${i}`}>{c.label}: {formatCurrency(c.amountPaise)}</p>
                ))}
              </div>
              <div className="grid gap-2 rounded-lg border p-3">
                <p><strong>Deductions</strong></p>
                <p>PF (employee): {formatCurrency(selected.deductionPfEmployee)}</p>
                <p>ESI (employee): {formatCurrency(selected.deductionEsiEmployee)}</p>
                <p>Professional tax: {formatCurrency(selected.deductionProfessionalTax)}</p>
                <p>TDS: {formatCurrency(selected.deductionTds)}</p>
                <p>LWP deduction: {formatCurrency(selected.deductionLwp)}</p>
                <p>Late deduction: {formatCurrency(selected.deductionLate)}</p>
                <p>Advance recovery: {formatCurrency(selected.deductionAdvanceRecovery)}</p>
                {selected.customDeductions.map((c, i) => (
                  <p key={`md-${i}`}>{c.label}: {formatCurrency(c.amountPaise)}</p>
                ))}
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p><strong>Gross:</strong> {formatCurrency(selected.grossEarnings)}</p>
                <p><strong>Total deductions:</strong> {formatCurrency(selected.totalDeductions)}</p>
                <p className="text-base"><strong>Net pay:</strong> {formatCurrency(selected.netPay)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

