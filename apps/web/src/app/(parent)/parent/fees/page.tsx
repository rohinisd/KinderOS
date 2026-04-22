import { getParentPortalUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { formatCurrency, toIST } from '@kinderos/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { FeeStatus } from '@kinderos/db'

export const dynamic = 'force-dynamic'

const PENDING_FEE_STATUSES: FeeStatus[] = ['PENDING', 'PARTIAL', 'OVERDUE']

const feeStatusBadge: Record<
  FeeStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'info' }
> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  PARTIAL: { label: 'Partial', variant: 'info' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
  REFUNDED: { label: 'Refunded', variant: 'secondary' },
}

export default async function ParentFeesPage() {
  const user = await getParentPortalUser()
  if (!user) redirect('/no-access')

  const parentRows = await prisma.parent.findMany({
    where: { email: { equals: user.email, mode: 'insensitive' } },
    include: {
      students: {
        where: { schoolId: user.schoolId, deletedAt: null },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      },
    },
  })

  const byId = new Map<string, { id: string; firstName: string; lastName: string }>()
  for (const p of parentRows) {
    for (const s of p.students) {
      byId.set(s.id, { id: s.id, firstName: s.firstName, lastName: s.lastName })
    }
  }
  const children = [...byId.values()]
  const childIds = children.map((c) => c.id)

  const noChildrenMessage =
    'No children are linked to your account for this school. Contact the school office if you believe this is a mistake.'

  if (children.length === 0) {
    return (
      <div>
        <PageHeader
          title="Fee Payments"
          description="Invoices and amounts for your children in one place"
        />
        <Card className="mt-6 border-amber-100 bg-amber-50/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-amber-900">Welcome</CardTitle>
            <CardDescription className="text-amber-800/90">No children linked to your account. Please contact your school.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const invoices = await prisma.feeInvoice.findMany({
    where: { schoolId: user.schoolId, studentId: { in: childIds } },
    orderBy: [{ dueDate: 'asc' }, { invoiceNumber: 'asc' }],
    select: {
      id: true,
      invoiceNumber: true,
      description: true,
      totalAmount: true,
      dueDate: true,
      status: true,
      studentId: true,
    },
  })

  const byStudent = new Map<string, typeof invoices>()
  for (const inv of invoices) {
    const list = byStudent.get(inv.studentId) ?? []
    list.push(inv)
    byStudent.set(inv.studentId, list)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fee Payments"
        description="Invoices and amounts for your children in one place"
      />

      <div className="space-y-8">
        {children.map((child) => {
          const rows = byStudent.get(child.id) ?? []
          const pendingSum = rows
            .filter((r) => PENDING_FEE_STATUSES.includes(r.status))
            .reduce((sum, r) => sum + r.totalAmount, 0)

          return (
            <Card
              key={child.id}
              className="border-violet-100 bg-gradient-to-br from-white to-violet-50/30 shadow-sm"
            >
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl text-violet-950">
                    {child.firstName} {child.lastName}
                  </CardTitle>
                  <CardDescription className="text-violet-800/80">All invoices for this child</CardDescription>
                </div>
                <div className="rounded-lg border border-rose-100 bg-rose-50/90 px-4 py-3 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-rose-800/80">Pending total</p>
                  <p className="text-xl font-semibold text-rose-950">{formatCurrency(pendingSum)}</p>
                </div>
              </CardHeader>
              <CardContent>
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No invoices yet — your school will add fee details here when they&apos;re ready.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Due date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((inv) => {
                        const cfg = feeStatusBadge[inv.status]
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                            <TableCell className="max-w-[220px] truncate" title={inv.description}>
                              {inv.description}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(inv.totalAmount)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{toIST(inv.dueDate)}</TableCell>
                            <TableCell>
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
