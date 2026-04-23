import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toIST } from '@kinderos/utils'
import { BookOpen, CalendarDays, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomeworkPage() {
  const { schoolId, userId } = await requireTeacher()

  const teacherClass = await prisma.class.findFirst({
    where: { schoolId, classTeacherId: userId },
  })

  if (!teacherClass) {
    return (
      <div>
        <PageHeader
          title="Homework"
          description="Homework tracker across all subjects and days"
        />
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No class assigned yet. Please contact your school administrator.
          </CardContent>
        </Card>
      </div>
    )
  }

  const [studentCount, homeworkItems] = await Promise.all([
    prisma.student.count({
      where: {
        schoolId,
        classId: teacherClass.id,
        status: 'ACTIVE',
        deletedAt: null,
      },
    }),
    prisma.assignment.findMany({
      where: { schoolId, classId: teacherClass.id },
      include: {
        submissions: { select: { id: true } },
      },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    }),
  ])

  const classLabel = `${teacherClass.name}${teacherClass.section ? ` · ${teacherClass.section}` : ''}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description="Homework tracker across all subjects and days"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Your class</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{classLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {studentCount} active {studentCount === 1 ? 'student' : 'students'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Total homework items</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{homeworkItems.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">All subjects • all days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Homework feed</CardTitle>
          <CardDescription>Latest to oldest homework for your class</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {homeworkItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No homework yet. Once teachers publish homework, it will appear here and in the parent portal.
            </p>
          ) : (
            homeworkItems.map((item) => (
              <div key={item.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-950">{item.title}</h3>
                    <Badge variant="secondary">{item.subject}</Badge>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due {toIST(item.dueDate)}
                  </span>
                </div>
                {item.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.submissions.length} submission{item.submissions.length === 1 ? '' : 's'}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
