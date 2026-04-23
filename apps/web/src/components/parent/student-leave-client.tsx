'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { requestStudentLeave } from '@/actions/student-leaves'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type StudentOption = {
  id: string
  label: string
}

type LeaveItem = {
  id: string
  studentName: string
  classLabel: string
  startDate: string
  endDate: string
  reason: string
  status: string
  note: string | null
  createdAt: string
}

function toDateInputValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function statusVariant(status: string): 'warning' | 'success' | 'destructive' | 'secondary' {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'destructive'
  if (status === 'CANCELLED') return 'secondary'
  return 'warning'
}

export function StudentLeaveClient({
  students,
  items,
}: {
  students: StudentOption[]
  items: LeaveItem[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const today = toDateInputValue(new Date())

  const [studentId, setStudentId] = useState(students[0]?.id ?? '')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')

  function submitLeave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!studentId) {
      toast.error('Please select a child')
      return
    }
    startTransition(async () => {
      const result = await requestStudentLeave({
        studentId,
        startDate: new Date(`${startDate}T00:00:00.000Z`),
        endDate: new Date(`${endDate}T00:00:00.000Z`),
        reason,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Leave request submitted to class teacher')
      setReason('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apply student leave</CardTitle>
          <CardDescription>
            Submit leave for your child. Class teacher can review it in classroom portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitLeave}>
            <div className="space-y-1.5">
              <Label htmlFor="studentId">Child</Label>
              <select
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">From</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">To</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                rows={3}
                placeholder="Write a brief reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isPending || students.length === 0}>
              {isPending ? 'Submitting...' : 'Submit leave request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave request history</CardTitle>
          <CardDescription>Status updates from class teacher</CardDescription>
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
                {item.note ? <p className="mt-1 text-xs text-muted-foreground">Teacher note: {item.note}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Requested on {new Date(item.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
