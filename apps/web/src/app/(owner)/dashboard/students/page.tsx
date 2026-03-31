import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function StudentsPage() {
  const { schoolId } = await requireSchoolAuth()

  const students = await prisma.student.findMany({
    where: { schoolId, deletedAt: null },
    include: { class: true, parents: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${students.length} students enrolled`}
      />
      {/* StudentTable component will go here */}
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Student management table — coming soon
        </p>
      </div>
    </div>
  )
}
