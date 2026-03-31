import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'

export default async function TeachersPage() {
  const { schoolId } = await requireSchoolAuth()

  const staff = await prisma.staff.findMany({
    where: { schoolId, deletedAt: null },
    include: { classesAsTeacher: true },
    orderBy: { firstName: 'asc' },
  })

  return (
    <div>
      <PageHeader
        title="Staff & Teachers"
        description={`${staff.length} staff members`}
      />
      <div className="mt-6 rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Staff management table — coming soon
        </p>
      </div>
    </div>
  )
}
