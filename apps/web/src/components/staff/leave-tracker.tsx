'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { requestLeave, decideLeaveRequest } from '@/actions/staff-time'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { LeaveBalanceEditor } from '@/components/staff/leave-balance-editor'

type LeaveItem = {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  note: string | null
  staffName: string
}

type BalanceRow = {
  id: string
  staffId: string
  staffName: string
  designation: string | null
  clTotal: number
  clUsed: number
  slTotal: number
  slUsed: number
  elTotal: number
  elUsed: number
}

type MissingStaff = {
  id: string
  name: string
}

type LeaveDefaults = {
  clTotal: number
  slTotal: number
  elTotal: number
}

function toDateInputValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function LeaveTracker({
  canApprove,
  items,
  canManageBalances = false,
  balanceRows = [],
  missingStaff = [],
  balanceYear = new Date().getFullYear(),
  leaveDefaults = { clTotal: 12, slTotal: 7, elTotal: 15 },
}: {
  canApprove: boolean
  items: LeaveItem[]
  canManageBalances?: boolean
  balanceRows?: BalanceRow[]
  missingStaff?: MissingStaff[]
  balanceYear?: number
  leaveDefaults?: LeaveDefaults
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const today = toDateInputValue(new Date())
  const [leaveType, setLeaveType] = useState('CASUAL')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')

  function submitRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const result = await requestLeave({
        leaveType: leaveType as 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'UNPAID',
        startDate: new Date(`${startDate}T00:00:00.000Z`),
        endDate: new Date(`${endDate}T00:00:00.000Z`),
        reason,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Leave request submitted')
      setReason('')
      router.refresh()
    })
  }

  function actOnRequest(leaveId: string, decision: 'APPROVED' | 'REJECTED') {
    startTransition(async () => {
      const result = await decideLeaveRequest({ leaveId, decision })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`Leave ${decision.toLowerCase()}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {canManageBalances ? (
        <Card>
          <CardHeader>
            <CardTitle>Leave Balance Setup</CardTitle>
            <CardDescription>
              Set CL, SL and EL totals for staff and configure default yearly limits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveBalanceEditor
              balances={balanceRows}
              missingStaff={missingStaff}
              year={balanceYear}
              defaults={leaveDefaults}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Request leave</CardTitle>
          <CardDescription>Submit a leave request for approval</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitRequest}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="leaveType">Leave Type</Label>
                <select
                  id="leaveType"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="CASUAL">Casual</option>
                  <option value="SICK">Sick</option>
                  <option value="EARNED">Earned</option>
                  <option value="MATERNITY">Maternity</option>
                  <option value="PATERNITY">Paternity</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                rows={3}
                placeholder="Brief reason for leave"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Leave Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave tracker</CardTitle>
          <CardDescription>{canApprove ? 'All staff leave requests' : 'Your leave requests'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {canApprove && <span className="text-sm font-medium">{item.staffName}</span>}
                    <Badge variant="outline">{item.leaveType}</Badge>
                    <Badge
                      variant={
                        item.status === 'APPROVED'
                          ? 'success'
                          : item.status === 'REJECTED'
                            ? 'destructive'
                            : 'warning'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.startDate).toLocaleDateString('en-IN')} → {new Date(item.endDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{item.reason}</p>
                {item.note ? <p className="mt-1 text-xs text-muted-foreground">Note: {item.note}</p> : null}
                {canApprove && item.status === 'PENDING' ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => actOnRequest(item.id, 'APPROVED')}
                      disabled={isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => actOnRequest(item.id, 'REJECTED')}
                      disabled={isPending}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
