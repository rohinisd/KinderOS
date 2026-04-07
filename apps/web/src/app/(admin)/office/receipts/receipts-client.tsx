'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, IndianRupee } from 'lucide-react'
import { formatCurrency, toIST } from '@kinderos/utils'

export type ReceiptRow = {
  id: string
  receiptNumber: string | null
  amount: number
  method: string
  referenceNumber: string | null
  paidAt: string | null
  studentName: string
  admissionNumber: string
}

function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    UPI: 'UPI',
    BANK_TRANSFER: 'Bank transfer',
    CHEQUE: 'Cheque',
    RAZORPAY_UPI: 'Razorpay (UPI)',
    RAZORPAY_CARD: 'Razorpay (Card)',
    RAZORPAY_NETBANKING: 'Razorpay (Netbanking)',
  }
  return labels[method] ?? method.replaceAll('_', ' ')
}

function istYmdFromIso(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function ReceiptsClient({ payments }: { payments: ReceiptRow[] }) {
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return payments.filter((p) => {
      const hay = `${p.studentName} ${p.admissionNumber} ${p.receiptNumber ?? ''} ${p.referenceNumber ?? ''}`.toLowerCase()
      const matchesSearch = !q || hay.includes(q)
      const matchesDate =
        !dateFilter ||
        (p.paidAt != null && istYmdFromIso(p.paidAt) === dateFilter)
      return matchesSearch && matchesDate
    })
  }, [payments, search, dateFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          className="w-full sm:w-[200px]"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter by payment date (IST)"
        />
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reference #</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No receipts match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">
                    {p.receiptNumber ?? p.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{p.studentName}</p>
                    <p className="text-xs text-muted-foreground">{p.admissionNumber}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium">
                      <IndianRupee className="h-3 w-3" />
                      {formatCurrency(p.amount)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatPaymentMethod(p.method)}</TableCell>
                  <TableCell className="text-sm">
                    {p.paidAt ? toIST(p.paidAt) : '—'}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                    {p.referenceNumber ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
