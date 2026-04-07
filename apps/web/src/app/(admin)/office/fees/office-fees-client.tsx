'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { recordPayment } from '@/actions/payments'
import { formatCurrency, toIST } from '@kinderos/utils'

export type OfficeInvoiceRow = {
  id: string
  invoiceNumber: string
  totalAmount: number
  dueDate: string
  status: string
  student: { firstName: string; lastName: string; admissionNumber: string }
  paidSoFar: number
  remaining: number
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
  PENDING: 'warning',
  PARTIAL: 'info',
  PAID: 'success',
  OVERDUE: 'destructive',
  CANCELLED: 'secondary',
  REFUNDED: 'secondary',
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
] as const

type OfficePaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

export function OfficeFeesClient({
  invoices,
  stats,
}: {
  invoices: OfficeInvoiceRow[]
  stats: {
    pendingCount: number
    pendingAmountPaise: number
    paidTodayPaise: number
    overdueCount: number
  }
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL')
  const [payOpen, setPayOpen] = useState(false)
  const [selected, setSelected] = useState<OfficeInvoiceRow | null>(null)
  const [method, setMethod] = useState<OfficePaymentMethod>('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [amountRupees, setAmountRupees] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return invoices.filter((inv) => {
      const hay = `${inv.invoiceNumber} ${inv.student.firstName} ${inv.student.lastName}`.toLowerCase()
      const matchesSearch = !q || hay.includes(q)
      const matchesStatus =
        statusFilter === 'ALL' || inv.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, search, statusFilter])

  function openPay(inv: OfficeInvoiceRow) {
    setSelected(inv)
    setMethod('CASH')
    setReferenceNumber('')
    setAmountRupees((inv.remaining / 100).toFixed(2))
    setPayOpen(true)
  }

  function submitPayment() {
    if (!selected) return
    const rupees = parseFloat(amountRupees)
    if (Number.isNaN(rupees) || rupees <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    const amountPaise = Math.round(rupees * 100)
    startTransition(async () => {
      const result = await recordPayment(selected.id, {
        method,
        referenceNumber: referenceNumber.trim() || undefined,
        amount: amountPaise,
      })
      if (result.success) {
        toast.success('Payment recorded')
        setPayOpen(false)
        setSelected(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const canRecord = (inv: OfficeInvoiceRow) =>
    inv.remaining > 0 && inv.status !== 'CANCELLED' && inv.status !== 'REFUNDED'

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total pending</p>
            <p className="mt-1 text-lg font-semibold">
              {stats.pendingCount} invoice{stats.pendingCount === 1 ? '' : 's'}
            </p>
            <p className="mt-1 text-2xl font-bold text-orange-600">
              {formatCurrency(stats.pendingAmountPaise)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paid today</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(stats.paidTodayPaise)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Overdue (by status)</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student or invoice #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No invoices match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {inv.student.firstName} {inv.student.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{inv.student.admissionNumber}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium">
                      <IndianRupee className="h-3 w-3" />
                      {formatCurrency(inv.totalAmount)}
                    </div>
                    {inv.remaining < inv.totalAmount && inv.remaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Due: {formatCurrency(inv.remaining)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{toIST(inv.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[inv.status] ?? 'secondary'}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canRecord(inv) ? (
                      <Button size="sm" variant="outline" onClick={() => openPay(inv)}>
                        Record payment
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {selected && (
                <>
                  {selected.invoiceNumber} · {selected.student.firstName} {selected.student.lastName}
                  <br />
                  Outstanding {formatCurrency(selected.remaining)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as OfficePaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Reference # (optional)</Label>
              <Input
                id="ref"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Txn ID, cheque no., etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (₹)</Label>
              <Input
                id="amt"
                type="number"
                step="0.01"
                min="0.01"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} type="button">
              Cancel
            </Button>
            <Button onClick={submitPayment} disabled={isPending}>
              {isPending ? 'Saving…' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
