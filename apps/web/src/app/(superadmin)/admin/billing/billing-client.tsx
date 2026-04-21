'use client'

import { useState, useTransition } from 'react'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IndianRupee, Building2, TrendingUp, AlertTriangle, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { updateSchoolSubscription } from '@/actions/platform-admin'
import type { Plan } from '@kinderos/db'
import { formatInr, PLAN_LABEL, PLAN_MONTHLY_INR } from '@/lib/plan-pricing'
import { toIST } from '@kinderos/utils'

const PLANS: Plan[] = ['STARTER', 'GROWTH', 'ACADEMY']

export type BillingSchoolRow = {
  id: string
  name: string
  slug: string
  plan: Plan
  planExpiresAt: string | null
  isActive: boolean
}

type Props = {
  schools: BillingSchoolRow[]
  summary: {
    mrrInr: number
    activeSchools: number
    expiringWithinDays: number
    byPlan: Record<Plan, number>
  }
}

export function BillingClient({ schools, summary }: Props) {
  const [edit, setEdit] = useState<BillingSchoolRow | null>(null)
  const [plan, setPlan] = useState<Plan>('STARTER')
  const [expires, setExpires] = useState('')
  const [isPending, startTransition] = useTransition()

  function openEdit(s: BillingSchoolRow) {
    setEdit(s)
    setPlan(s.plan)
    setExpires(s.planExpiresAt ? s.planExpiresAt.slice(0, 10) : '')
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!edit) return
    startTransition(async () => {
      const result = await updateSchoolSubscription({
        schoolId: edit.id,
        plan,
        planExpiresAt: expires.trim() === '' ? null : expires,
      })
      if (result.success) {
        toast.success('Subscription updated')
        setEdit(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-50 p-2">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. MRR (active)</p>
                <p className="text-2xl font-bold">{formatInr(summary.mrrInr)}</p>
                <p className="text-xs text-muted-foreground">Indicative list prices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paying schools</p>
                <p className="text-2xl font-bold">{summary.activeSchools}</p>
                <p className="text-xs text-muted-foreground">Active tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <IndianRupee className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">By plan</p>
                <p className="text-sm font-medium">
                  S {summary.byPlan.STARTER} · G {summary.byPlan.GROWTH} · A {summary.byPlan.ACADEMY}
                </p>
                <p className="text-xs text-muted-foreground">Starter / Growth / Academy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renewals (30d)</p>
                <p className="text-2xl font-bold">{summary.expiringWithinDays}</p>
                <p className="text-xs text-muted-foreground">Plans ending soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Monthly (list)</TableHead>
              <TableHead>Renews / ends</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No schools yet. Add one from Schools.
                </TableCell>
              </TableRow>
            ) : (
              schools.map((s) => {
                const monthly = PLAN_MONTHLY_INR[s.plan] ?? 0
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">/{s.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PLAN_LABEL[s.plan]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatInr(monthly)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.planExpiresAt ? toIST(s.planExpiresAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? 'success' : 'destructive'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Subscription</SheetTitle>
            <SheetDescription>
              Plan and contract end date for platform billing. Inactive schools are excluded from MRR.
            </SheetDescription>
          </SheetHeader>
          {edit && (
            <form onSubmit={saveEdit} className="mt-6 space-y-4">
              <p className="text-sm font-medium">{edit.name}</p>
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PLAN_LABEL[p]} — {formatInr(PLAN_MONTHLY_INR[p] ?? 0)}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expires">Plan end date</Label>
                <Input
                  id="expires"
                  type="date"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Clear the field to remove an end date.</p>
              </div>
              <SheetFooter className="pt-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Saving…' : 'Save'}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
