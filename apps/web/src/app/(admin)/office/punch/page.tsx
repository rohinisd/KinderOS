import { getAuthUser, requireSchoolAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import { PunchCard } from '@/components/staff/punch-card'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const dynamic = 'force-dynamic'

const ALL_STAFF_ATTENDANCE_ROLES = new Set(['OWNER', 'PRINCIPAL', 'ADMIN'])
const STATUS_FILTERS = new Set(['all', 'punched_in', 'punched_out', 'not_marked'] as const)
const PERIOD_FILTERS = new Set(['day', 'week', 'month'] as const)

function todayIsoDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function parseViewDate(raw: string | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return todayIsoDate()
  const t = new Date(`${raw}T12:00:00.000Z`).getTime()
  if (Number.isNaN(t)) return todayIsoDate()
  return raw
}

function parseStatusFilter(raw: string | undefined): 'all' | 'punched_in' | 'punched_out' | 'not_marked' {
  if (!raw) return 'all'
  return STATUS_FILTERS.has(raw as 'all' | 'punched_in' | 'punched_out' | 'not_marked')
    ? (raw as 'all' | 'punched_in' | 'punched_out' | 'not_marked')
    : 'all'
}

function parsePeriodFilter(raw: string | undefined): 'day' | 'week' | 'month' {
  if (!raw) return 'day'
  return PERIOD_FILTERS.has(raw as 'day' | 'week' | 'month')
    ? (raw as 'day' | 'week' | 'month')
    : 'day'
}

function utcRangeForPeriod(isoDate: string, period: 'day' | 'week' | 'month'): { start: Date; end: Date; dayCount: number } {
  const start = new Date(`${isoDate}T00:00:00.000Z`)
  if (period === 'day') {
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 1)
    return { start, end, dayCount: 1 }
  }

  if (period === 'week') {
    const weekStart = new Date(start)
    const mondayOffset = (weekStart.getUTCDay() + 6) % 7
    weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset)
    const weekEnd = new Date(weekStart)
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)
    return { start: weekStart, end: weekEnd, dayCount: 7 }
  }

  const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
  const dayCount = Math.round((monthEnd.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000))
  return { start: monthStart, end: monthEnd, dayCount }
}

function istDayRange(isoDate: string): { start: Date; end: Date } {
  const start = new Date(`${isoDate}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

function displayStatus(checkIn: Date | null, checkOut: Date | null): 'PUNCHED_IN' | 'PUNCHED_OUT' | 'NOT_MARKED' {
  if (checkOut) return 'PUNCHED_OUT'
  if (checkIn) return 'PUNCHED_IN'
  return 'NOT_MARKED'
}

function formatTs(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function weekDays(start: Date): Array<{ key: string; label: string }> {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    const label = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone: 'UTC',
    })
    return { key: dayKey(d), label }
  })
}

type SearchParams = Promise<{ date?: string | string[]; status?: string | string[]; period?: string | string[] }>

export default async function OfficePunchPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const authUser = await getAuthUser()
  if (!authUser) redirect('/no-access')
  const { schoolId, userId } = await requireSchoolAuth()
  const canViewAll = ALL_STAFF_ATTENDANCE_ROLES.has(authUser.role)
  const params = await searchParams
  const rawDate = typeof params.date === 'string' ? params.date : undefined
  const rawStatus = typeof params.status === 'string' ? params.status : undefined
  const rawPeriod = typeof params.period === 'string' ? params.period : undefined
  const selectedDate = parseViewDate(rawDate)
  const selectedStatus = parseStatusFilter(rawStatus)
  const selectedPeriod = parsePeriodFilter(rawPeriod)
  const { start, end, dayCount } = utcRangeForPeriod(selectedDate, selectedPeriod)
  const weekColumns = selectedPeriod === 'week' ? weekDays(start) : []
  const today = istDayRange(todayIsoDate())

  const [staffRows, periodRecords, myTodayRecord] = await Promise.all([
    prisma.staff.findMany({
      where: { schoolId, status: 'ACTIVE', deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.staffAttendance.findMany({
      where: { schoolId, date: { gte: start, lt: end } },
      select: { staffId: true, date: true, checkIn: true, checkOut: true, status: true },
      orderBy: { date: 'desc' },
    }),
    prisma.staffAttendance.findFirst({
      where: {
        schoolId,
        staffId: userId,
        date: { gte: today.start, lt: today.end },
      },
      select: { status: true, checkIn: true, checkOut: true },
    }),
  ])

  const recordsByStaff = new Map<string, typeof periodRecords>()
  for (const rec of periodRecords) {
    const arr = recordsByStaff.get(rec.staffId) ?? []
    arr.push(rec)
    recordsByStaff.set(rec.staffId, arr)
  }

  const serialized = myTodayRecord
    ? {
      status: myTodayRecord.status,
      checkIn: myTodayRecord.checkIn?.toISOString() ?? null,
      checkOut: myTodayRecord.checkOut?.toISOString() ?? null,
    }
    : null

  const allRows = staffRows.map((staff) => {
    const recs = recordsByStaff.get(staff.id) ?? []
    const byDay = new Map(recs.map((r) => [dayKey(r.date), displayStatus(r.checkIn ?? null, r.checkOut ?? null)]))
    const latest = recs[0]
    const punchedInDays = recs.filter((r) => !!r.checkIn).length
    const punchedOutDays = recs.filter((r) => !!r.checkOut).length
    const workedMinutes = recs.reduce((sum, r) => {
      if (!r.checkIn || !r.checkOut) return sum
      return sum + Math.max(0, Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / 60000))
    }, 0)
    const notMarkedDays = Math.max(0, dayCount - punchedInDays)
    const derived = displayStatus(latest?.checkIn ?? null, latest?.checkOut ?? null)
    return {
      id: staff.id,
      name: `${staff.firstName} ${staff.lastName}`.trim(),
      role: staff.role,
      checkIn: latest?.checkIn ?? null,
      checkOut: latest?.checkOut ?? null,
      derived,
      punchedInDays,
      punchedOutDays,
      notMarkedDays,
      workedMinutes,
      weekStatuses: weekColumns.map((d) => byDay.get(d.key) ?? 'NOT_MARKED'),
    }
  })

  const scopeRows = canViewAll ? allRows : allRows.filter((r) => r.id === userId)
  const filteredRows =
    selectedStatus === 'all'
      ? scopeRows
      : scopeRows.filter((r) => {
          if (selectedPeriod === 'day') return r.derived.toLowerCase() === selectedStatus
          if (selectedStatus === 'punched_in') return r.punchedInDays > 0
          if (selectedStatus === 'punched_out') return r.punchedOutDays > 0
          return r.notMarkedDays > 0
        })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Attendance"
        description={
          canViewAll
            ? 'Staff attendance with daily, weekly, and monthly views'
            : 'Mark your attendance time for today'
        }
      />
      <PunchCard record={serialized} />

      <Card>
        <CardHeader>
          <CardTitle>{canViewAll ? 'All Staff Attendance' : 'Attendance History'}</CardTitle>
          <CardDescription>
            {canViewAll ? 'Owner/Admin/Principal can filter by date and status' : 'Your daily attendance view'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canViewAll ? (
            <form className="flex flex-wrap items-end gap-3" method="get">
              <div className="space-y-1">
                <label htmlFor="date" className="text-xs text-muted-foreground">Date</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={selectedDate}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="period" className="text-xs text-muted-foreground">View</label>
                <select
                  id="period"
                  name="period"
                  defaultValue={selectedPeriod}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="status" className="text-xs text-muted-foreground">Status</label>
                <select
                  id="status"
                  name="status"
                  defaultValue={selectedStatus}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All</option>
                  <option value="punched_in">Punched In</option>
                  <option value="punched_out">Punched Out</option>
                  <option value="not_marked">Not Marked</option>
                </select>
              </div>
              <Button type="submit" variant="outline">Apply</Button>
            </form>
          ) : null}

          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Role</TableHead>
                  {selectedPeriod === 'day' ? (
                    <>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                    </>
                  ) : selectedPeriod === 'week' ? (
                    <>
                      {weekColumns.map((d) => (
                        <TableHead key={d.key}>{d.label}</TableHead>
                      ))}
                      <TableHead>Total Hours</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Punched In Days</TableHead>
                      <TableHead>Punched Out Days</TableHead>
                      <TableHead>Not Marked Days</TableHead>
                      <TableHead>Total Hours</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectedPeriod === 'day' ? 5 : selectedPeriod === 'week' ? 10 : 6} className="h-20 text-center text-muted-foreground">
                      No attendance records for selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      {selectedPeriod === 'day' ? (
                        <>
                          <TableCell>
                            <Badge variant={row.derived === 'PUNCHED_OUT' ? 'success' : row.derived === 'PUNCHED_IN' ? 'warning' : 'secondary'}>
                              {row.derived === 'PUNCHED_OUT' ? 'Punched Out' : row.derived === 'PUNCHED_IN' ? 'Punched In' : 'Not Marked'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatTs(row.checkIn)}</TableCell>
                          <TableCell>{formatTs(row.checkOut)}</TableCell>
                        </>
                      ) : selectedPeriod === 'week' ? (
                        <>
                          {row.weekStatuses.map((s: 'PUNCHED_IN' | 'PUNCHED_OUT' | 'NOT_MARKED', idx: number) => (
                            <TableCell key={`${row.id}-${idx}`}>
                              <Badge variant={s === 'PUNCHED_OUT' ? 'success' : s === 'PUNCHED_IN' ? 'warning' : 'secondary'}>
                                {s === 'PUNCHED_OUT' ? 'Out' : s === 'PUNCHED_IN' ? 'In' : '—'}
                              </Badge>
                            </TableCell>
                          ))}
                          <TableCell>{(row.workedMinutes / 60).toFixed(1)}h</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{row.punchedInDays}</TableCell>
                          <TableCell>{row.punchedOutDays}</TableCell>
                          <TableCell>{row.notMarkedDays}</TableCell>
                          <TableCell>{(row.workedMinutes / 60).toFixed(1)}h</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
