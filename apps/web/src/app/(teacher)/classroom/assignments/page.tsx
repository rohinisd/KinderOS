import { requireTeacher } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AssignmentsPage() {
  const { schoolId, userId } = await requireTeacher()

  const teacherClass = await prisma.class.findFirst({
    where: { schoolId, classTeacherId: userId },
  })

  if (!teacherClass) {
    return (
      <div>
        <PageHeader
          title="Assignments"
          description="Create assignments and track submissions"
        />
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No class assigned yet. Please contact your school administrator.
          </CardContent>
        </Card>
      </div>
    )
  }

  const studentCount = await prisma.student.count({
    where: {
      schoolId,
      classId: teacherClass.id,
      status: 'ACTIVE',
      deletedAt: null,
    },
  })
  const classLabel = `${teacherClass.name}${teacherClass.section ? ` · ${teacherClass.section}` : ''}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Create assignments and track submissions"
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

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Coming soon</CardTitle>
            </div>
            <CardDescription>
              Assignment tracking will be available soon. You&apos;ll be able to create homework, set due dates,
              and review submissions from this class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">In development</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
