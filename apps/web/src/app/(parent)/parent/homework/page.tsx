import { getParentPortalUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toIST } from '@kinderos/utils'
import { BookOpen, CalendarDays } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ParentHomeworkPage() {
  const user = await getParentPortalUser()
  if (!user) redirect('/no-access')

  const parentRows = await prisma.parent.findMany({
    where: { email: { equals: user.email, mode: 'insensitive' } },
    include: {
      students: {
        where: { schoolId: user.schoolId, deletedAt: null },
        include: { class: true },
      },
    },
  })

  const classesById = new Map<string, string>()
  for (const parent of parentRows) {
    for (const student of parent.students) {
      if (!student.classId || !student.class) continue
      classesById.set(
        student.classId,
        [student.class.name, student.class.section].filter(Boolean).join(' · ')
      )
    }
  }
  const classIds = [...classesById.keys()]

  const homeworkItems = classIds.length === 0
    ? []
    : await prisma.assignment.findMany({
      where: { schoolId: user.schoolId, classId: { in: classIds } },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    })

  const groupedByDate = new Map<string, typeof homeworkItems>()
  for (const item of homeworkItems) {
    const key = item.dueDate.toISOString().slice(0, 10)
    const arr = groupedByDate.get(key) ?? []
    arr.push(item)
    groupedByDate.set(key, arr)
  }
  const groupedEntries = [...groupedByDate.entries()].sort(([a], [b]) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description="All subjects, all days — for your child&apos;s classes"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Total homework items</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{homeworkItems.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Across all linked classes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homework feed (day + subject wise)</CardTitle>
          <CardDescription>
            Includes previous days too, grouped by day and then by subject
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No homework found yet. Please check back later.
            </p>
          ) : (
            groupedEntries.map(([dateKey, items]) => (
              <div key={dateKey} className="rounded-lg border bg-slate-50/60 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    {new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </h3>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-md border bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-950">{item.title}</span>
                          <Badge variant="secondary">{item.subject}</Badge>
                          <Badge variant="outline">{classesById.get(item.classId) ?? 'Class'}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Due {toIST(item.dueDate)}
                        </span>
                      </div>
                      {item.description ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
