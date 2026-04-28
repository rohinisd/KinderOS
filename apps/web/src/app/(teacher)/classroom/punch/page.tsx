import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import { PunchCard } from '@/components/staff/punch-card'

export const dynamic = 'force-dynamic'

function istDayRange(now = new Date()): { start: Date; end: Date } {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const start = new Date(`${ymd}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

export default async function ClassroomPunchPage() {
  const { schoolId, userId } = await requireTeacher()
  const { start, end } = istDayRange()
  const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))

  const [todayRecord, monthRecords] = await Promise.all([
    prisma.staffAttendance.findFirst({
      where: {
        schoolId,
        staffId: userId,
        date: { gte: start, lt: end },
      },
      select: {
        status: true,
        checkIn: true,
        checkOut: true,
      },
    }),
    prisma.staffAttendance.findMany({
      where: {
        schoolId,
        staffId: userId,
        date: { gte: monthStart, lt: monthEnd },
      },
      select: { date: true, status: true, checkIn: true, checkOut: true },
      orderBy: { date: 'desc' },
    }),
  ])

  const serialized = todayRecord
    ? {
        status: todayRecord.status,
        checkIn: todayRecord.checkIn?.toISOString() ?? null,
        checkOut: todayRecord.checkOut?.toISOString() ?? null,
      }
    : null

  const history = monthRecords.map((r) => ({
    date: r.date.toISOString(),
    status: r.status,
    checkIn: r.checkIn?.toISOString() ?? null,
    checkOut: r.checkOut?.toISOString() ?? null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Punch In / Punch Out"
        description="Mark your working hours for today"
      />
      <PunchCard record={serialized} history={history} />
    </div>
  )
}
