'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, IndianRupee, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createFeeInvoice, sendFeeReminderToParent } from '@/actions/fees'
import { formatCurrency } from '@kinderos/utils'

type Invoice = {
  id: string
  invoiceNumber: string
  amount: number
  totalAmount: number
  description: string
  dueDate: string
  status: string
  student: { id: string; firstName: string; lastName: string; admissionNumber: string }
  payments: { id: string; amount: number; status: string }[]
}

type StudentOption = { id: string; firstName: string; lastName: string; admissionNumber: string }

type FeeStats = {
  status: string
  count: number
  total: number
}

const statusColors: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
  PENDING: 'warning',
  PARTIAL: 'info' as 'warning',
  PAID: 'success',
  OVERDUE: 'destructive',
  CANCELLED: 'secondary',
  REFUNDED: 'secondary',
}

export function FeesClient({
  invoices,
  students,
  stats,
}: {
  invoices: Invoice[]
  students: StudentOption[]
  stats: FeeStats[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filtered = invoices.filter((inv) => {
    const matchesSearch = `${inv.invoiceNumber} ${inv.student.firstName} ${inv.student.lastName} ${inv.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPending = stats
    .filter((s) => s.status === 'PENDING' || s.status === 'OVERDUE')
    .reduce((sum, s) => sum + s.total, 0)
  const totalCollected = stats
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + s.total, 0)

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const amountRupees = parseFloat(form.get('amount') as string)

    startTransition(async () => {
      const result = await createFeeInvoice({
        studentId: form.get('studentId') as string,
        amount: Math.round(amountRupees * 100),
        description: form.get('description') as string,
        dueDate: new Date(form.get('dueDate') as string),
      })
      if (result.success) {
        toast.success('Invoice created')
        setSheetOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleSendReminder(invoiceId: string) {
    startTransition(async () => {
      const result = await sendFeeReminderToParent(invoiceId)
      if (result.success) {
        toast.success('Reminder sent via WhatsApp')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="mt-1 text-2xl font-bold">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending / Overdue</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">
              {formatCurrency(totalPending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(totalCollected)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                      <TableCell>
                        <p className="font-medium">{inv.student.firstName} {inv.student.lastName}</p>
                        <p className="text-xs text-muted-foreground">{inv.student.admissionNumber}</p>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{inv.description}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {formatCurrency(inv.totalAmount)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[inv.status] ?? 'secondary'}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(inv.status === 'PENDING' || inv.status === 'OVERDUE') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Send reminder"
                            onClick={() => handleSendReminder(inv.id)}
                            disabled={isPending}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="rounded-lg border bg-white p-6">
            <div className="space-y-3">
              {stats.map((s) => (
                <div key={s.status} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[s.status] ?? 'secondary'}>{s.status}</Badge>
                    <span className="text-sm text-muted-foreground">{s.count} invoices</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(s.total)}</span>
                </div>
              ))}
              {stats.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No invoices yet.</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create Fee Invoice</SheetTitle>
            <SheetDescription>Generate a new fee invoice for a student.</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="studentId">Student *</Label>
              <Select name="studentId" required>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="1" required placeholder="e.g. 12500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Input id="description" name="description" required placeholder="e.g. Term 1 Tuition Fee" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input id="dueDate" name="dueDate" type="date" required />
            </div>
            <SheetFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Creating...' : 'Create Invoice'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
