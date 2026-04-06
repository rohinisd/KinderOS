import { prisma } from '@/lib/prisma'
import { requireSchoolAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { StaffClient } from './staff-client'

export default async function TeachersPage() {
  const { schoolId } = await requireSchoolAuth()

  const staff = await prisma.staff.findMany({
    where: { schoolId, deletedAt: null },
    include: {
      classesAsTeacher: { select: { id: true, name: true } },
    },
    orderBy: { firstName: 'asc' },
  })

  const serialized = staff.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    phone: s.phone,
    email: s.email,
    role: s.role,
    designation: s.designation,
    department: s.department,
    status: s.status,
    gender: s.gender,
    classesAsTeacher: s.classesAsTeacher,
  }))

  return (
    <div>
      <PageHeader
        title="Staff & Teachers"
        description={`${staff.length} team members`}
      />
      <div className="mt-6">
        <StaffClient staff={serialized} />
      </div>
    </div>
  )
}
