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

type SearchParams = Promise<{ date?: string | string[]; status?: string | string[] }>

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
  const selectedDate = parseViewDate(rawDate)
  const selectedStatus = parseStatusFilter(rawStatus)
  const { start, end } = istDayRange(selectedDate)

  const [staffRows, dayRecords] = await Promise.all([
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
      select: { staffId: true, checkIn: true, checkOut: true, status: true },
    }),
  ])

  const recordMap = new Map(dayRecords.map((r) => [r.staffId, r]))

  const myRecord = recordMap.get(userId)
  const serialized = myRecord
    ? {
      status: myRecord.status,
      checkIn: myRecord.checkIn?.toISOString() ?? null,
      checkOut: myRecord.checkOut?.toISOString() ?? null,
    }
    : null

  const allRows = staffRows.map((staff) => {
    const rec = recordMap.get(staff.id)
    const derived = displayStatus(rec?.checkIn ?? null, rec?.checkOut ?? null)
    return {
      id: staff.id,
      name: `${staff.firstName} ${staff.lastName}`.trim(),
      role: staff.role,
      checkIn: rec?.checkIn ?? null,
      checkOut: rec?.checkOut ?? null,
      derived,
    }
  })

  const scopeRows = canViewAll ? allRows : allRows.filter((r) => r.id === userId)
  const filteredRows = selectedStatus === 'all'
    ? scopeRows
    : scopeRows.filter((r) => r.derived.toLowerCase() === selectedStatus)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Attendance"
        description={
          canViewAll
            ? 'Daily staff attendance with date and status filters'
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
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                      No attendance records for selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>
                        <Badge variant={row.derived === 'PUNCHED_OUT' ? 'success' : row.derived === 'PUNCHED_IN' ? 'warning' : 'secondary'}>
                          {row.derived === 'PUNCHED_OUT' ? 'Punched Out' : row.derived === 'PUNCHED_IN' ? 'Punched In' : 'Not Marked'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTs(row.checkIn)}</TableCell>
                      <TableCell>{formatTs(row.checkOut)}</TableCell>
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
