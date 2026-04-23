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
          <CardTitle>Homework feed</CardTitle>
          <CardDescription>Latest to oldest homework updates from school</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {homeworkItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No homework found yet. Please check back later.
            </p>
          ) : (
            homeworkItems.map((item) => (
              <div key={item.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-950">{item.title}</h3>
                    <Badge variant="secondary">{item.subject}</Badge>
                    <Badge variant="outline">{classesById.get(item.classId) ?? 'Class'}</Badge>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due {toIST(item.dueDate)}
                  </span>
                </div>
                {item.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.description}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
