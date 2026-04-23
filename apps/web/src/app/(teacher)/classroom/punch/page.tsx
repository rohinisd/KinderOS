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

  const todayRecord = await prisma.staffAttendance.findFirst({
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
  })

  const serialized = todayRecord
    ? {
        status: todayRecord.status,
        checkIn: todayRecord.checkIn?.toISOString() ?? null,
        checkOut: todayRecord.checkOut?.toISOString() ?? null,
      }
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Punch In / Punch Out"
        description="Mark your working hours for today"
      />
      <PunchCard record={serialized} />
    </div>
  )
}
