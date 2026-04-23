'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { decideStudentLeaveRequest } from '@/actions/student-leaves'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LeaveItem = {
  id: string
  studentName: string
  parentName: string
  classLabel: string
  startDate: string
  endDate: string
  reason: string
  status: string
  note: string | null
  createdAt: string
}

function statusVariant(status: string): 'warning' | 'success' | 'destructive' | 'secondary' {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'destructive'
  if (status === 'CANCELLED') return 'secondary'
  return 'warning'
}

export function StudentLeaveApprovalsClient({ items }: { items: LeaveItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [noteById, setNoteById] = useState<Record<string, string>>({})

  function decide(requestId: string, decision: 'APPROVED' | 'REJECTED') {
    startTransition(async () => {
      const result = await decideStudentLeaveRequest({
        requestId,
        decision,
        note: noteById[requestId] ?? '',
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`Leave request ${decision.toLowerCase()}`)
      setNoteById((prev) => ({ ...prev, [requestId]: '' }))
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student leave requests</CardTitle>
        <CardDescription>Requests submitted by parents for your class</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leave requests yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{item.studentName}</span>
                  <Badge variant="outline">{item.classLabel}</Badge>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.startDate).toLocaleDateString('en-IN')} to{' '}
                  {new Date(item.endDate).toLocaleDateString('en-IN')}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{item.reason}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Parent: {item.parentName} · Requested: {new Date(item.createdAt).toLocaleString('en-IN')}
              </p>
              {item.note ? <p className="mt-1 text-xs text-muted-foreground">Note: {item.note}</p> : null}

              {item.status === 'PENDING' ? (
                <div className="mt-3 space-y-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`note-${item.id}`}>Teacher note (optional)</Label>
                    <Input
                      id={`note-${item.id}`}
                      placeholder="Optional note for parent"
                      value={noteById[item.id] ?? ''}
                      onChange={(e) => setNoteById((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={isPending} onClick={() => decide(item.id, 'APPROVED')}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => decide(item.id, 'REJECTED')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
