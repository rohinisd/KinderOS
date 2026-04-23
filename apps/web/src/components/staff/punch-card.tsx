'use client'

import { useTransition } from 'react'
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

export function PunchCard({ record }: { record: PunchRecord }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const canPunchIn = !record?.checkIn
  const canPunchOut = !!record?.checkIn && !record?.checkOut

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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={record?.checkOut ? 'success' : record?.checkIn ? 'warning' : 'secondary'}>
            {record?.checkOut ? 'Completed' : record?.checkIn ? 'Punched In' : 'Not started'}
          </Badge>
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
      </CardContent>
    </Card>
  )
}
