'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { punchIn, punchOut } from '@/actions/staff-time'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type PunchRecord = {
  status: string
  checkIn: string | null
  checkOut: string | null
} | null

type PunchHistoryRow = {
  date: string
  status: string
  checkIn: string | null
  checkOut: string | null
}

function formatTs(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
}

function statusBadge(status: string | null | undefined) {
  if (status === 'HALF_DAY') return { variant: 'warning' as const, label: 'Half Day' }
  if (status === 'LATE') return { variant: 'warning' as const, label: 'Late' }
  if (status === 'PRESENT') return { variant: 'success' as const, label: 'Present' }
  if (status === 'ABSENT') return { variant: 'destructive' as const, label: 'Absent' }
  return { variant: 'secondary' as const, label: 'Not Marked' }
}

function workedHours(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return '—'
  const start = new Date(checkIn).getTime()
  const end = new Date(checkOut).getTime()
  const hours = Math.max(0, (end - start) / 3600000)
  return `${hours.toFixed(1)}h`
}

export function PunchCard({ record, history = [] }: { record: PunchRecord; history?: PunchHistoryRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const canPunchIn = !record?.checkIn
  const canPunchOut = !!record?.checkIn && !record?.checkOut
  const badge = statusBadge(record?.status)
  const elapsed = useMemo(() => {
    if (!record?.checkIn || record?.checkOut) return ''
    const start = new Date(record.checkIn).getTime()
    const diff = Math.max(0, now.getTime() - start)
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m working`
  }, [record?.checkIn, record?.checkOut, now])

  function onPunchIn() {
    startTransition(async () => {
      const result = await punchIn()
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Punch-in recorded')
      router.refresh()
    })
  }

  function onPunchOut() {
    startTransition(async () => {
      const result = await punchOut()
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Punch-out recorded')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s punch status</CardTitle>
        <CardDescription>Track your check-in and check-out time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/20 p-4 text-center">
          <p className="text-2xl font-semibold tabular-nums">
            {now.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
            })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {record?.checkOut
              ? `${workedHours(record.checkIn, record.checkOut)} worked today`
              : elapsed || 'Not yet punched in'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Check-in:</span> {formatTs(record?.checkIn ?? null)}</p>
          <p><span className="text-muted-foreground">Check-out:</span> {formatTs(record?.checkOut ?? null)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onPunchIn} disabled={!canPunchIn || isPending}>
            {isPending && canPunchIn ? 'Saving...' : 'Punch In'}
          </Button>
          <Button variant="outline" onClick={onPunchOut} disabled={!canPunchOut || isPending}>
            {isPending && canPunchOut ? 'Saving...' : 'Punch Out'}
          </Button>
        </div>

        <div className="rounded-lg border">
          <div className="border-b px-3 py-2 text-sm font-medium">This month</div>
          {history.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">No records yet.</p>
          ) : (
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">In</th>
                    <th className="px-3 py-2 text-left">Out</th>
                    <th className="px-3 py-2 text-left">Hours</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const rowBadge = statusBadge(row.status)
                    return (
                      <tr key={row.date} className="border-t">
                        <td className="px-3 py-2">
                          {new Date(row.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            timeZone: 'Asia/Kolkata',
                          })}
                        </td>
                        <td className="px-3 py-2">{formatTs(row.checkIn)}</td>
                        <td className="px-3 py-2">{formatTs(row.checkOut)}</td>
                        <td className="px-3 py-2">{workedHours(row.checkIn, row.checkOut)}</td>
                        <td className="px-3 py-2">
                          <Badge variant={rowBadge.variant}>{rowBadge.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
