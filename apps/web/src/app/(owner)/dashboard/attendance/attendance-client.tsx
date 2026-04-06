'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CalendarCheck, Check, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { markClassAttendance } from '@/actions/attendance'

type StudentItem = {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
}

type ClassOption = { id: string; name: string; students: StudentItem[] }

type AttendanceRecord = {
  studentId: string
  date: string
  status: string
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY'

const statusConfig: Record<AttendanceStatus, { icon: React.ElementType; color: string; label: string }> = {
  PRESENT: { icon: Check, color: 'bg-green-100 text-green-700 border-green-300', label: 'Present' },
  ABSENT: { icon: X, color: 'bg-red-100 text-red-700 border-red-300', label: 'Absent' },
  LATE: { icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Late' },
  HALF_DAY: { icon: Clock, color: 'bg-orange-100 text-orange-700 border-orange-300', label: 'Half Day' },
}

export function AttendanceClient({
  classes,
  todayRecords,
}: {
  classes: ClassOption[]
  todayRecords: AttendanceRecord[]
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id ?? '')
  const [date, setDate] = useState(() => {
    const iso = new Date().toISOString()
    return iso.slice(0, 10)
  })
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {}
    todayRecords.forEach((r) => {
      initial[r.studentId] = r.status as AttendanceStatus
    })
    return initial
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const students = selectedClass?.students ?? []

  function toggleStatus(studentId: string) {
    setRecords((prev) => {
      const current = prev[studentId] ?? 'PRESENT'
      const order: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']
      const nextIdx = (order.indexOf(current) + 1) % order.length
      const next: AttendanceStatus = order[nextIdx] ?? 'PRESENT'
      return { ...prev, [studentId]: next }
    })
    setSaved(false)
  }

  function markAll(status: AttendanceStatus) {
    const updated: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { updated[s.id] = status })
    setRecords(updated)
    setSaved(false)
  }

  function handleSave() {
    if (!selectedClassId || students.length === 0) return

    startTransition(async () => {
      const attendanceRecords = students.map((s) => ({
        studentId: s.id,
        status: records[s.id] ?? 'PRESENT',
      }))

      const result = await markClassAttendance({
        classId: selectedClassId,
        date: new Date(date + 'T00:00:00Z'),
        records: attendanceRecords,
      })

      if (result.success) {
        toast.success(`Attendance saved for ${result.data.count} students`)
        setSaved(true)
      } else {
        toast.error(result.error)
      }
    })
  }

  function shiftDate(days: number) {
    const d = new Date(date + 'T00:00:00Z')
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().slice(0, 10))
    setSaved(false)
  }

  const presentCount = students.filter((s) => (records[s.id] ?? 'PRESENT') === 'PRESENT').length
  const absentCount = students.filter((s) => records[s.id] === 'ABSENT').length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Select value={selectedClassId} onValueChange={(v) => { setSelectedClassId(v); setSaved(false) }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.students.length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-lg border px-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setSaved(false) }}
              className="border-0 bg-transparent px-2 py-1 text-sm outline-none"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => markAll('PRESENT')}>
            All Present
          </Button>
          <Button variant="outline" size="sm" onClick={() => markAll('ABSENT')}>
            All Absent
          </Button>
          <Button onClick={handleSave} disabled={isPending || students.length === 0}>
            <CalendarCheck className="mr-2 h-4 w-4" />
            {isPending ? 'Saving...' : saved ? 'Saved' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      {students.length > 0 && (
        <div className="flex gap-4">
          <Badge variant="success" className="px-3 py-1">
            Present: {presentCount}
          </Badge>
          <Badge variant="destructive" className="px-3 py-1">
            Absent: {absentCount}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            Total: {students.length}
          </Badge>
        </div>
      )}

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarCheck className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No classes found. Create classes in Settings first.
            </p>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No students in this class. Assign students from the Students page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => {
            const status = (records[student.id] ?? 'PRESENT') as AttendanceStatus
            const config = statusConfig[status]
            const Icon = config.icon

            return (
              <button
                key={student.id}
                onClick={() => toggleStatus(student.id)}
                className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all hover:shadow-sm ${config.color}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs opacity-70">{student.admissionNumber}</p>
                </div>
                <span className="text-xs font-semibold">{config.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
