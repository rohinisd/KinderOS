'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { markClassAttendance } from '@/actions/attendance'

type StudentItem = {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
}

type ClassData = {
  id: string
  name: string
  section: string | null
  students: StudentItem[]
}

type DayRecord = {
  studentId: string
  date: string
  status: string
}

type UiStatus = 'PRESENT' | 'ABSENT' | 'LATE'

function normalizeInitialStatus(status: string | undefined): UiStatus {
  if (status === 'ABSENT' || status === 'LATE') return status
  return 'PRESENT'
}

export function TeacherAttendanceClient({
  classData,
  selectedDate,
  dayRecords,
}: {
  classData: ClassData
  selectedDate: string
  dayRecords: DayRecord[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [date, setDate] = useState(selectedDate)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setDate(selectedDate)
  }, [selectedDate])

  const initialMap = useMemo(() => {
    const m: Record<string, UiStatus> = {}
    dayRecords.forEach((r) => {
      m[r.studentId] = normalizeInitialStatus(r.status)
    })
    return m
  }, [dayRecords])

  const [records, setRecords] = useState<Record<string, UiStatus>>(() => {
    const next: Record<string, UiStatus> = {}
    classData.students.forEach((s) => {
      next[s.id] = initialMap[s.id] ?? 'PRESENT'
    })
    return next
  })

  useEffect(() => {
    const next: Record<string, UiStatus> = {}
    classData.students.forEach((s) => {
      next[s.id] = initialMap[s.id] ?? 'PRESENT'
    })
    setRecords(next)
  }, [classData.students, initialMap])

  const students = classData.students
  const classLabel = `${classData.name}${classData.section ? ` ${classData.section}` : ''}`

  function setStatus(studentId: string, status: UiStatus) {
    setRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  function markAll(status: UiStatus) {
    const next: Record<string, UiStatus> = {}
    students.forEach((s) => {
      next[s.id] = status
    })
    setRecords(next)
  }

  function shiftDate(days: number) {
    const d = new Date(`${date}T12:00:00.000Z`)
    d.setUTCDate(d.getUTCDate() + days)
    const next = d.toISOString().slice(0, 10)
    setDate(next)
    router.push(`${pathname}?date=${next}`)
  }

  function onDateChange(next: string) {
    setDate(next)
    router.push(`${pathname}?date=${next}`)
  }

  function handleSubmit() {
    if (students.length === 0) return

    startTransition(async () => {
      const attendanceRecords = students.map((s) => ({
        studentId: s.id,
        status: records[s.id] ?? 'PRESENT',
      }))

      const result = await markClassAttendance({
        classId: classData.id,
        date: new Date(`${date}T00:00:00.000Z`),
        records: attendanceRecords,
      })

      if (result.success) {
        toast.success(`Attendance saved for ${result.data.count} students`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const presentCount = students.filter((s) => (records[s.id] ?? 'PRESENT') === 'PRESENT').length
  const absentCount = students.filter((s) => records[s.id] === 'ABSENT').length
  const lateCount = students.filter((s) => records[s.id] === 'LATE').length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{classLabel}</p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border px-2">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="border-0 bg-transparent px-2 py-1 text-sm outline-none"
            />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => markAll('PRESENT')}>
            Mark all present
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => markAll('ABSENT')}>
            Mark all absent
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || students.length === 0}>
            <CalendarCheck className="mr-2 h-4 w-4" />
            {isPending ? 'Saving…' : 'Submit attendance'}
          </Button>
        </div>
      </div>

      {students.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="success" className="px-3 py-1">
            Present: {presentCount}
          </Badge>
          <Badge variant="destructive" className="px-3 py-1">
            Absent: {absentCount}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            Late: {lateCount}
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            Total: {students.length}
          </Badge>
        </div>
      )}

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No students in this class. Assign students from the school admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {students.map((student) => {
            const current = records[student.id] ?? 'PRESENT'
            return (
              <div
                key={student.id}
                className="flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{student.admissionNumber}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['PRESENT', 'ABSENT', 'LATE'] as const).map((status) => (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      variant={current === status ? 'default' : 'outline'}
                      className="min-w-[88px]"
                      onClick={() => setStatus(student.id, status)}
                    >
                      {status === 'PRESENT' ? 'Present' : status === 'ABSENT' ? 'Absent' : 'Late'}
                    </Button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
